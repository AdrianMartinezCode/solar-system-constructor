import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getRepoRoot, runCommand, okResponse, errorResponse } from "./shared.js";

export function registerRunTypecheck(server: McpServer): void {
  server.tool(
    "run_typecheck",
    "Run `npm run typecheck` (tsc --noEmit) in the repo root. Returns exit code + trimmed stdout/stderr. Non-interactive.",
    async () => {
      const repoRoot = getRepoRoot();

      try {
        const result = await runCommand("npm", ["run", "typecheck"], repoRoot, 120_000);

        return okResponse({
          command: "npm run typecheck",
          exitCode: result.exitCode,
          passed: result.exitCode === 0,
          stdout: result.stdout,
          stderr: result.stderr,
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        return errorResponse(message);
      }
    }
  );
}
