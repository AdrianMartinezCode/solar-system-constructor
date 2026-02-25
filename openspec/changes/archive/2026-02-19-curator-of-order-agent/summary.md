# Curator of Order Agent — Archive Summary

**Date**: 2026-02-19
**Status**: Archived (legacy docs migration)

## What

Introduced the "Curator of Order" agent role as a repository librarian/refactoring scalpel, plus minimal scaffolding (indexes, templates, ADR structure, MCP docs) to scale the `.agents/` system to more roles and capabilities.

## Key Decisions

- Agent system remains markdown-first; roles and skills are documented, not enforced by code
- Curator operates using existing MCP tooling — no new tools added
- Additive changes only; all existing file paths preserved
- ADR template and index added under `docs/decisions/` for structured decision records
- MCP extension documentation added without changing tool implementations

## Tasks Completed

- Task 1: Added `.agents/roles/` directory with index (`README.md`) and role template; updated `.agents/agents.md` with compatibility note
- Task 2: Created `curator_of_order.md` role spec and 3 curator skills (`curator-entropy-audit`, `curator-docs-librarian`, `curator-decision-steward`)
- Task 3: Added `docs/README.md` map, `docs/decisions/` with ADR template/index, and `mcp/README.md` + `mcp/server/src/tools/README.md`

## Related Artifacts (removed)

- docs/requests/CR_curator_of_order_agent.md
- docs/plans/PLAN_curator_of_order_agent.md
- docs/prompts/curator_of_order_agent/ (3 tasks)
