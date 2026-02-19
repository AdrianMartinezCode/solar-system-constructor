import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getRepoRoot, runCommand, okResponse, errorResponse } from "./shared.js";

export function registerRunBuild(server: McpServer): void {
  server.tool(
    "run_build",
    "Run `npm run build` in the repo root. Returns exit code + trimmed stdout/stderr. Non-interactive.",
    async () => {
      const repoRoot = getRepoRoot();

      try {
        const result = await runCommand("npm", ["run", "build"], repoRoot, 120_000);

        return okResponse({
          command: "npm run build",
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
