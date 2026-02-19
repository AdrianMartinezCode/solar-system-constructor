import * as fs from "node:fs/promises";
import * as path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getRepoRoot,
  safePath,
  BINARY_EXTENSIONS,
  okResponse,
  errorResponse,
} from "./shared.js";

// ---------------------------------------------------------------------------
// Minimal unified-diff parser + applier
// ---------------------------------------------------------------------------

interface Hunk {
  oldStart: number;
  oldCount: number;
  newStart: number;
  newCount: number;
  lines: string[];
}

interface FilePatch {
  oldFile: string;
  newFile: string;
  hunks: Hunk[];
}

/**
 * Parse a unified diff string into structured file patches.
 */
function parseUnifiedDiff(diff: string): FilePatch[] {
  const patches: FilePatch[] = [];
  const lines = diff.split("\n");
  let i = 0;

  while (i < lines.length) {
    // Look for --- / +++ header pair
    if (lines[i].startsWith("--- ") && i + 1 < lines.length && lines[i + 1].startsWith("+++ ")) {
      const oldFile = lines[i].slice(4).replace(/^a\//, "").trim();
      const newFile = lines[i + 1].slice(4).replace(/^b\//, "").trim();
      i += 2;

      const hunks: Hunk[] = [];

      // Parse hunks
      while (i < lines.length && lines[i].startsWith("@@")) {
        const hunkHeader = lines[i];
        const match = hunkHeader.match(
          /^@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/
        );
        if (!match) {
          throw new Error(`Invalid hunk header: ${hunkHeader}`);
        }

        const hunk: Hunk = {
          oldStart: parseInt(match[1], 10),
          oldCount: match[2] !== undefined ? parseInt(match[2], 10) : 1,
          newStart: parseInt(match[3], 10),
          newCount: match[4] !== undefined ? parseInt(match[4], 10) : 1,
          lines: [],
        };

        i++;

        // Collect hunk lines (context, additions, deletions)
        while (
          i < lines.length &&
          !lines[i].startsWith("@@") &&
          !lines[i].startsWith("--- ") &&
          !(lines[i].startsWith("diff "))
        ) {
          // Accept lines starting with ' ', '+', '-', or empty (context)
          if (
            lines[i].startsWith(" ") ||
            lines[i].startsWith("+") ||
            lines[i].startsWith("-") ||
            lines[i] === ""
          ) {
            hunk.lines.push(lines[i]);
          } else if (lines[i].startsWith("\\")) {
            // "\ No newline at end of file" — skip
          } else {
            break;
          }
          i++;
        }

        hunks.push(hunk);
      }

      patches.push({ oldFile, newFile, hunks });
    } else {
      i++;
    }
  }

  return patches;
}

/**
 * Apply hunks to file content. Returns the patched content.
 */
function applyHunks(original: string, hunks: Hunk[]): string {
  const originalLines = original.split("\n");
  // Remove trailing empty line from split if file ends with newline
  if (originalLines.length > 0 && originalLines[originalLines.length - 1] === "") {
    originalLines.pop();
  }

  const result = [...originalLines];
  let offset = 0; // Track line shifts from previous hunks

  for (const hunk of hunks) {
    const startIdx = hunk.oldStart - 1 + offset;
    const newLines: string[] = [];
    let oldConsumed = 0;

    for (const line of hunk.lines) {
      if (line.startsWith("-")) {
        // Deletion: skip this old line
        oldConsumed++;
      } else if (line.startsWith("+")) {
        // Addition
        newLines.push(line.slice(1));
      } else {
        // Context line (starts with ' ' or is empty)
        newLines.push(line.startsWith(" ") ? line.slice(1) : line);
        oldConsumed++;
      }
    }

    // Replace the old lines with new lines
    result.splice(startIdx, oldConsumed, ...newLines);
    offset += newLines.length - oldConsumed;
  }

  return result.join("\n") + "\n";
}

// ---------------------------------------------------------------------------
// Tool registration
// ---------------------------------------------------------------------------

export function registerRepoWritePatch(server: McpServer): void {
  server.tool(
    "repo_write_patch",
    "Apply a unified diff patch to repo files. Gated: requires allowWrite=true. Repo-root restricted, blocks binary files.",
    {
      patch: z.string().min(1).describe("Unified diff string to apply"),
      allowWrite: z
        .boolean()
        .describe("Safety gate — must be explicitly set to true to apply changes"),
      dryRun: z
        .boolean()
        .optional()
        .default(false)
        .describe("If true, parse and validate the patch without writing (default: false)"),
    },
    async ({ patch, allowWrite, dryRun }) => {
      if (!allowWrite) {
        return errorResponse(
          "Write not allowed. Set allowWrite=true to apply the patch."
        );
      }

      const repoRoot = getRepoRoot();

      try {
        const filePatchList = parseUnifiedDiff(patch);

        if (filePatchList.length === 0) {
          return errorResponse("No file patches found in the diff.");
        }

        const touchedFiles: string[] = [];
        const results: Array<{
          file: string;
          status: string;
          error?: string;
        }> = [];

        for (const fp of filePatchList) {
          const targetFile = fp.newFile === "/dev/null" ? fp.oldFile : fp.newFile;

          try {
            // Safety: block binary files
            const ext = path.extname(targetFile).toLowerCase();
            if (BINARY_EXTENSIONS.has(ext)) {
              results.push({
                file: targetFile,
                status: "skipped",
                error: `Binary file extension blocked: ${ext}`,
              });
              continue;
            }

            // Safety: path must stay within repo root
            const resolvedPath = safePath(repoRoot, targetFile);

            if (dryRun) {
              results.push({ file: targetFile, status: "dry-run-ok" });
              touchedFiles.push(targetFile);
              continue;
            }

            // Handle file deletion (new file is /dev/null)
            if (fp.newFile === "/dev/null") {
              await fs.unlink(resolvedPath);
              results.push({ file: targetFile, status: "deleted" });
              touchedFiles.push(targetFile);
              continue;
            }

            // Handle new file creation (old file is /dev/null)
            if (fp.oldFile === "/dev/null") {
              const newContent = fp.hunks
                .flatMap((h) =>
                  h.lines
                    .filter((l) => l.startsWith("+"))
                    .map((l) => l.slice(1))
                )
                .join("\n") + "\n";

              // Ensure parent directory exists
              await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
              await fs.writeFile(resolvedPath, newContent, "utf-8");
              results.push({ file: targetFile, status: "created" });
              touchedFiles.push(targetFile);
              continue;
            }

            // Normal patch: read → apply hunks → write
            const original = await fs.readFile(resolvedPath, "utf-8");
            const patched = applyHunks(original, fp.hunks);
            await fs.writeFile(resolvedPath, patched, "utf-8");
            results.push({ file: targetFile, status: "patched" });
            touchedFiles.push(targetFile);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Unknown error";
            results.push({ file: targetFile, status: "error", error: message });
          }
        }

        return okResponse({
          dryRun: dryRun ?? false,
          touchedFiles,
          results,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return errorResponse(`Patch parsing failed: ${message}`);
      }
    }
  );
}
