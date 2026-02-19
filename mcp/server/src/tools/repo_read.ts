import * as fs from "node:fs/promises";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getRepoRoot,
  safePath,
  MAX_FILE_SIZE,
  okResponse,
  errorResponse,
} from "./shared.js";

export function registerRepoRead(server: McpServer): void {
  server.tool(
    "repo_read",
    "Read one or more files by path (repo-root restricted, size-limited to 256 KB per file)",
    {
      paths: z
        .array(z.string())
        .min(1)
        .max(10)
        .describe("File paths relative to repo root (max 10)"),
    },
    async ({ paths }) => {
      const repoRoot = getRepoRoot();
      const results: Array<{
        path: string;
        content?: string;
        error?: string;
        size?: number;
      }> = [];

      for (const filePath of paths) {
        try {
          const resolved = safePath(repoRoot, filePath);
          const stat = await fs.stat(resolved);

          if (!stat.isFile()) {
            results.push({ path: filePath, error: "Not a file" });
            continue;
          }

          if (stat.size > MAX_FILE_SIZE) {
            results.push({
              path: filePath,
              error: `File too large (${stat.size} bytes, max ${MAX_FILE_SIZE})`,
              size: stat.size,
            });
            continue;
          }

          const content = await fs.readFile(resolved, "utf-8");
          results.push({ path: filePath, content, size: stat.size });
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Unknown error";
          results.push({ path: filePath, error: message });
        }
      }

      return okResponse(results);
    }
  );
}
