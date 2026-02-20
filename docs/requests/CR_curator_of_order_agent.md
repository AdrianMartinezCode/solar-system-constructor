# Change Request: Add “Curator of Order” Agent Role + Scale-Up Structure

## Summary

Introduce a new agent role: **Curator of Order** — a repository librarian and refactoring scalpel that keeps `.agents`/docs/decisions/MCP tooling organized. Also add minimal repo structure (indexes + templates) to scale to more agents and capabilities while preserving compatibility with the current agent contract and skills.

## Context

This repo already has:

- An agent contract: `.agents/agents.md`
- Skills playbooks: `.agents/skills/*` (triage, PO decomposition, prompt writer, workflow)
- A docs workflow structure: `docs/requests/` and empty-but-intended `docs/plans/`, `docs/prompts/`, `docs/decisions/`
- An in-repo MCP server: `mcp/server/` with read/list/search/context snapshot + gated writes + verification tools

However, there is no explicit “role/agent registry” and the decisions area lacks ADR templates/indexing, so structural decisions can be lost.

## Goals

- Add a first-class **Curator of Order** agent role definition.
- Keep compatibility with the current contract (`.agents/agents.md`) and existing skills.
- Add scalable structure for:
  - More agent roles
  - More skills (including curator skills)
  - Decisions/ADRs (templates + index)
  - A docs “map” entry point
  - MCP extension documentation

## Non-goals

- No product feature work in `src/`.
- No large-scale doc reorganization/moves yet (only structure/index/templates unless explicitly required).
- No changes to MCP server behavior/tooling code in this request (docs only).

## Constraints

- Additive, low-risk changes; preserve existing file paths where possible.
- Small, reviewable diffs; one concern per task.
- Verification commands must be non-interactive.

## Out of Scope

- Migrating existing docs into a new taxonomy (can be a follow-up CR).
- Adding new MCP tools (can be a follow-up CR).

## Acceptance Criteria

- [ ] `.agents/roles/curator_of_order.md` exists and describes purpose, responsibilities, outputs, and guardrails.
- [ ] `.agents/roles/README.md` exists as an index of roles.
- [ ] Curator-oriented skills exist under `.agents/skills/` and are listed in `.agents/skills/README.md`.
- [ ] `docs/README.md` exists and explains the workflow + doc map.
- [ ] `docs/decisions/ADR_TEMPLATE.md` + `docs/decisions/README.md` exist with ADR naming conventions.
- [ ] `mcp/README.md` and `mcp/server/src/tools/README.md` exist and describe tool surface + extension approach.

## Verification

```bash
npm run typecheck
npm run build
```

