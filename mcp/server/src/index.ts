#!/usr/bin/env node

/**
 * Solar System Constructor — MCP Server
 *
 * A local MCP server that exposes repo inspection and safe write/verification tools.
 * Communicates via stdio transport (standard MCP pattern).
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Milestone A — read-only tools
import { registerRepoRead } from "./tools/repo_read.js";
import { registerRepoList } from "./tools/repo_list.js";
import { registerRepoSearch } from "./tools/repo_search.js";
import { registerRepoContextSnapshot } from "./tools/repo_context_snapshot.js";

// Milestone B — write + verification tools
import { registerRepoWritePatch } from "./tools/repo_write_patch.js";
import { registerRunBuild } from "./tools/run_build.js";
import { registerRunTypecheck } from "./tools/run_typecheck.js";
import { registerGitStatus } from "./tools/git_status.js";
import { registerGitDiff } from "./tools/git_diff.js";

// ---------------------------------------------------------------------------
// Server setup
// ---------------------------------------------------------------------------

const server = new McpServer({
  name: "solar-system-mcp",
  version: "0.2.0",
});

// ---------------------------------------------------------------------------
// Register tools
// ---------------------------------------------------------------------------

// Read-only (Milestone A)
registerRepoRead(server);
registerRepoList(server);
registerRepoSearch(server);
registerRepoContextSnapshot(server);

// Write + verification (Milestone B)
registerRepoWritePatch(server);
registerRunBuild(server);
registerRunTypecheck(server);
registerGitStatus(server);
registerGitDiff(server);

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Solar System MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error starting MCP server:", error);
  process.exit(1);
});
