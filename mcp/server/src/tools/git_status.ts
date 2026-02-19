import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getRepoRoot, runCommand, okResponse, errorResponse } from "./shared.js";

export function registerGitStatus(server: McpServer): void {
  server.tool(
    "git_status",
    "Run `git status --porcelain` in the repo root. Returns a structured list of changed files.",
    async () => {
      const repoRoot = getRepoRoot();

      try {
        const result = await runCommand("git", ["status", "--porcelain"], repoRoot, 15_000);

        if (result.exitCode !== 0) {
          return errorResponse(`git status failed (exit ${result.exitCode}): ${result.stderr}`);
        }

        // Parse porcelain output into structured entries
        const entries = result.stdout
          .split("\n")
          .filter((line) => line.length > 0)
          .map((line) => {
            const status = line.slice(0, 2);
            const file = line.slice(3);
            return { status: status.trim(), file };
          });

        return okResponse({
          clean: entries.length === 0,
          entries,
          count: entries.length,
          raw: result.stdout,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return errorResponse(message);
      }
    }
  );
}
