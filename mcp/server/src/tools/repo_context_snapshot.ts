import * as fs from "node:fs/promises";
import * as path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getRepoRoot, IGNORE_DIRS, okResponse, errorResponse } from "./shared.js";

interface ContextSnapshot {
  packageManager: string;
  scripts: Record<string, string>;
  configFiles: Record<string, boolean>;
  topLevelTree: Array<{ name: string; type: string }>;
}

/** Config files to check for */
const CONFIG_FILES = [
  "tsconfig.json",
  "tsconfig.node.json",
  "vite.config.ts",
  "vite.config.js",
  ".eslintrc",
  ".eslintrc.js",
  ".eslintrc.json",
  ".eslintrc.yml",
  "eslint.config.js",
  "eslint.config.mjs",
  ".prettierrc",
  ".prettierrc.json",
  "prettier.config.js",
  "vitest.config.ts",
  "vitest.config.js",
  "jest.config.ts",
  "jest.config.js",
  "jest.config.json",
  ".env",
  ".env.local",
  ".gitignore",
  "Dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
];

export function registerRepoContextSnapshot(server: McpServer): void {
  server.tool(
    "repo_context_snapshot",
    "Return a lightweight snapshot of the repo: package manager, scripts, config files, top-level directory tree",
    async () => {
      const repoRoot = getRepoRoot();

      try {
        // ----- Package manager detection -----
        const packageManager = await detectPackageManager(repoRoot);

        // ----- Scripts from root package.json -----
        let scripts: Record<string, string> = {};
        try {
          const pkgRaw = await fs.readFile(
            path.join(repoRoot, "package.json"),
            "utf-8"
          );
          const pkg = JSON.parse(pkgRaw);
          scripts = pkg.scripts ?? {};
        } catch {
          // package.json read failed — leave scripts empty
        }

        // ----- Config file presence -----
        const configFiles: Record<string, boolean> = {};
        for (const file of CONFIG_FILES) {
          try {
            await fs.access(path.join(repoRoot, file));
            configFiles[file] = true;
          } catch {
            configFiles[file] = false;
          }
        }

        // ----- Top-level directory tree -----
        const entries = await fs.readdir(repoRoot, { withFileTypes: true });
        const topLevelTree = entries
          .filter((e) => {
            if (e.name.startsWith(".")) return false;
            if (e.isDirectory() && IGNORE_DIRS.has(e.name)) return false;
            return true;
          })
          .map((e) => ({
            name: e.name,
            type: e.isDirectory()
              ? "directory"
              : e.isFile()
                ? "file"
                : "other",
          }))
          .sort((a, b) => {
            if (a.type === "directory" && b.type !== "directory") return -1;
            if (a.type !== "directory" && b.type === "directory") return 1;
            return a.name.localeCompare(b.name);
          });

        const snapshot: ContextSnapshot = {
          packageManager,
          scripts,
          configFiles,
          topLevelTree,
        };

        return okResponse(snapshot);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return errorResponse(message);
      }
    }
  );
}

async function detectPackageManager(repoRoot: string): Promise<string> {
  const checks: Array<[string, string]> = [
    ["pnpm-lock.yaml", "pnpm"],
    ["yarn.lock", "yarn"],
    ["bun.lockb", "bun"],
    ["package-lock.json", "npm"],
  ];

  for (const [lockFile, manager] of checks) {
    try {
      await fs.access(path.join(repoRoot, lockFile));
      return manager;
    } catch {
      // not found, try next
    }
  }

  return "unknown";
}
