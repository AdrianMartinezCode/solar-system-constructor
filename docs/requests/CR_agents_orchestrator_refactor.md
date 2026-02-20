# Change Request: Refactor Agents into an Orchestrator + Add Product Owner & Task Roles

## Summary

Introduce an **Orchestrator agent** that routes incoming requests to the correct role (PO, Developer, Task Developer, Curator, Task Curator). Add a new **Product Owner** role and split “small direct changes” vs “execute PO-generated tasks” into separate roles for both implementation and curation.

## Context

This repo currently has:

- A global agent contract in `agents/agents.md`
- Two roles: `agents/roles/curator_of_order.md` and `agents/roles/developer.md`
- A planning-first workflow (CR → PLAN → TASK prompts) documented in `agents/skills/WORKFLOW.md` and `docs/ai_prompts/PROMPT_MINIMAL_AGENT_RUNBOOK.md`

We want an explicit **routing layer** (“orchestrator”) so the system can consistently choose between:

- **Planning** (PO generates artifacts; no implementation)
- **Small direct implementation** (Developer)
- **Small direct curation** (Curator of Order)
- **Task execution** of PO-generated tasks (Task Developer / Task Curator)

## Goals

- Add an **Orchestrator routing specification** to `agents/agents.md` (this file becomes the orchestrator entry point).
- Add a new role: **Product Owner** (`agents/roles/product_owner.md`).
- Add two new task-execution roles:
  - **Task Developer** (`agents/roles/task_developer.md`)
  - **Task Curator of Order** (`agents/roles/task_curator_of_order.md`)
- Refactor the existing **Developer** role to represent **small, direct implementation** requests (not PO task execution).
- Update indexes/runbooks to reflect the new role catalog and orchestrator usage.

## Non-goals

- No changes to the app code under `src/`.
- No changes to MCP tooling implementation.
- No new skills unless clearly necessary for the orchestrator routing (prefer documenting routing in `agents/agents.md`).

## Constraints

- Keep diffs small and reviewable; one concern per task.
- Preserve compatibility with existing workflow artifacts and paths.
- Product Owner role must **not implement** or **verify** changes; it only produces CR/PLAN/TASK artifacts.

## Out of Scope

- Adding new verification tooling (lint/tests) beyond the existing `typecheck` and `build`.
- Rewriting existing historical plans/prompts in `docs/` unless required to avoid broken references.

## Acceptance Criteria

- [ ] `agents/agents.md` includes an **Orchestrator / Role Routing** section with clear, deterministic routing rules for:
  - Product Owner (big tasks)
  - Developer (small direct implementation)
  - Curator of Order (small direct curation)
  - Task Developer (implement PO-generated tasks)
  - Task Curator of Order (curate PO-generated tasks)
- [ ] `agents/roles/product_owner.md` exists and states it **only generates** CR/PLAN/TASK prompts (no implementation/verification).
- [ ] `agents/roles/task_developer.md` exists and is explicitly scoped to executing `docs/prompts/<slug>/task_<n>/...`.
- [ ] `agents/roles/task_curator_of_order.md` exists and is explicitly scoped to executing curation tasks from `docs/prompts/<slug>/task_<n>/...`.
- [ ] `agents/roles/developer.md` is updated to cover **small direct implementation** requests (and defers to Task Developer for PO task execution).
- [ ] `agents/roles/README.md`, `agents/README.md`, and `docs/ai_prompts/PROMPT_MINIMAL_AGENT_RUNBOOK.md` reflect the new orchestrator and expanded role catalog.

## Verification

```bash
npm run typecheck
npm run build
```

