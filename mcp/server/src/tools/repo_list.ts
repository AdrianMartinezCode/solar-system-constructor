import * as fs from "node:fs/promises";
import * as path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  getRepoRoot,
  safePath,
  IGNORE_DIRS,
  okResponse,
  errorResponse,
} from "./shared.js";

export function registerRepoList(server: McpServer): void {
  server.tool(
    "repo_list",
    "List directory entries (non-recursive, repo-root restricted). Returns name, type, and size for each entry.",
    {
      path: z
        .string()
        .optional()
        .describe(
          "Directory path relative to repo root (defaults to repo root)"
        ),
    },
    async ({ path: dirPath }) => {
      const repoRoot = getRepoRoot();

      try {
        const resolved = safePath(repoRoot, dirPath ?? ".");
        const stat = await fs.stat(resolved);

        if (!stat.isDirectory()) {
          return errorResponse(`Not a directory: ${dirPath}`);
        }

        const entries = await fs.readdir(resolved, { withFileTypes: true });

        const items = entries
          .filter((entry) => {
            // Skip hidden files/dirs and ignored directories
            if (entry.name.startsWith(".")) return false;
            if (entry.isDirectory() && IGNORE_DIRS.has(entry.name))
              return false;
            return true;
          })
          .map((entry) => ({
            name: entry.name,
            type: entry.isDirectory()
              ? "directory"
              : entry.isFile()
                ? "file"
                : entry.isSymbolicLink()
                  ? "symlink"
                  : "other",
          }))
          .sort((a, b) => {
            // Directories first, then alphabetical
            if (a.type === "directory" && b.type !== "directory") return -1;
            if (a.type !== "directory" && b.type === "directory") return 1;
            return a.name.localeCompare(b.name);
          });

        return okResponse({
          directory: dirPath ?? ".",
          entries: items,
          count: items.length,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return errorResponse(message);
      }
    }
  );
}
