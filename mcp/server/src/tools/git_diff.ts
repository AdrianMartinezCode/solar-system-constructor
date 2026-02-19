import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getRepoRoot, runCommand, okResponse, errorResponse } from "./shared.js";

export function registerGitDiff(server: McpServer): void {
  server.tool(
    "git_diff",
    "Run `git diff` in the repo root. Optionally scope to specific files or compare staged changes.",
    {
      staged: z
        .boolean()
        .optional()
        .default(false)
        .describe("If true, show staged (cached) changes instead of unstaged"),
      paths: z
        .array(z.string())
        .optional()
        .describe("Optional list of file paths to scope the diff to"),
    },
    async ({ staged, paths }) => {
      const repoRoot = getRepoRoot();

      try {
        const args = ["diff"];
        if (staged) {
          args.push("--cached");
        }
        if (paths && paths.length > 0) {
          args.push("--");
          args.push(...paths);
        }

        const result = await runCommand("git", args, repoRoot, 15_000);

        if (result.exitCode !== 0) {
          return errorResponse(`git diff failed (exit ${result.exitCode}): ${result.stderr}`);
        }

        // Count changed files from the diff output
        const fileHeaders = result.stdout
          .split("\n")
          .filter((line) => line.startsWith("diff --git"));

        return okResponse({
          staged: staged ?? false,
          filesChanged: fileHeaders.length,
          diff: result.stdout,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return errorResponse(message);
      }
    }
  );
}
