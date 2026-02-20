# MCP Tools — Notes

This directory contains the MCP tool registrations used by `.agents/skills/*`.

## Safety Principles

- **Repo-root restriction** for all file paths (see `shared.ts`).
- **Write operations are gated** (e.g. `repo_write_patch` requires `allowWrite=true`).
- **Ignore heavy directories** (`node_modules`, `dist`, etc.) to keep tools fast/deterministic.

## Tool Surface (Current)

- `repo_read`
- `repo_list`
- `repo_search`
- `repo_context_snapshot`
- `repo_write_patch` (gated)
- `run_build`
- `run_typecheck`
- `git_status`
- `git_diff`

