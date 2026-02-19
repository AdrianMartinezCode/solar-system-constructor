# MCP — Repo Tooling

This repo includes a local MCP server under `mcp/server/` that provides:

- **Repo inspection**: read/list/search/context snapshot
- **Verification**: build/typecheck
- **Git helpers**: status/diff
- **Gated writes**: patch application via `repo_write_patch` (requires explicit `allowWrite=true`)

## Server Location

- Source: `mcp/server/src/`
- Tool implementations: `mcp/server/src/tools/`

## How to Extend (Add a Tool)

1. Create a new tool file under `mcp/server/src/tools/` (follow existing patterns).
2. Register it in `mcp/server/src/index.ts`.
3. Document the tool briefly in `mcp/server/src/tools/README.md`.

