import * as fs from "node:fs/promises";
import * as path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getRepoRoot,
  safePath,
  IGNORE_DIRS,
  IGNORE_EXTENSIONS,
  MAX_SEARCH_RESULTS,
  okResponse,
  errorResponse,
} from "./shared.js";

interface SearchMatch {
  file: string;
  line: number;
  content: string;
}

/**
 * Recursively walk a directory, yielding file paths that pass filters.
 */
async function* walkFiles(
  dir: string,
  globFilter?: string
): AsyncGenerator<string> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name.startsWith(".") || IGNORE_DIRS.has(entry.name)) continue;
      yield* walkFiles(fullPath, globFilter);
    } else if (entry.isFile()) {
      if (entry.name.startsWith(".")) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (IGNORE_EXTENSIONS.has(ext)) continue;

      // Simple glob filter: match file extension
      if (globFilter) {
        const globExt = globFilter.startsWith("*")
          ? globFilter.slice(1)
          : globFilter;
        if (!entry.name.endsWith(globExt)) continue;
      }

      yield fullPath;
    }
  }
}

export function registerRepoSearch(server: McpServer): void {
  server.tool(
    "repo_search",
    "Search file contents for a text pattern (repo-root restricted, max 100 results). Supports plain text or regex.",
    {
      pattern: z.string().min(1).describe("Search pattern (plain text or regex)"),
      path: z
        .string()
        .optional()
        .describe(
          "Directory to search within (relative to repo root, defaults to root)"
        ),
      glob: z
        .string()
        .optional()
        .describe("File extension filter (e.g. '*.ts', '*.md')"),
    },
    async ({ pattern, path: searchPath, glob }) => {
      const repoRoot = getRepoRoot();

      try {
        const searchDir = safePath(repoRoot, searchPath ?? ".");
        const stat = await fs.stat(searchDir);

        if (!stat.isDirectory()) {
          return errorResponse(`Not a directory: ${searchPath}`);
        }

        let regex: RegExp;
        try {
          regex = new RegExp(pattern, "gi");
        } catch {
          // Fall back to literal string search
          regex = new RegExp(escapeRegex(pattern), "gi");
        }

        const matches: SearchMatch[] = [];
        let filesSearched = 0;

        for await (const filePath of walkFiles(searchDir, glob)) {
          if (matches.length >= MAX_SEARCH_RESULTS) break;

          try {
            const content = await fs.readFile(filePath, "utf-8");
            filesSearched++;

            const lines = content.split("\n");
            for (let i = 0; i < lines.length; i++) {
              if (regex.test(lines[i])) {
                matches.push({
                  file: path.relative(repoRoot, filePath),
                  line: i + 1,
                  content: lines[i].trim().slice(0, 200),
                });

                if (matches.length >= MAX_SEARCH_RESULTS) break;
              }
              // Reset regex lastIndex for global flag
              regex.lastIndex = 0;
            }
          } catch {
            // Skip files that can't be read (binary, permission, etc.)
          }
        }

        return okResponse({
          pattern,
          matches,
          matchCount: matches.length,
          filesSearched,
          truncated: matches.length >= MAX_SEARCH_RESULTS,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return errorResponse(message);
      }
    }
  );
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
