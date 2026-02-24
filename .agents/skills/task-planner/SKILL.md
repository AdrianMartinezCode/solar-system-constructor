---
name: task-planner
description: Break down proposal, specs, and design into phased, actionable tasks. Produces tasks.md with hierarchical checkboxes.
metadata:
  owner: Strategist
  version: "0.1.0"
---
# Task Planner

## Purpose

Transform the Advocate's proposal, Scribe's specs, and Architect's design into a phased, ordered task checklist. Each task is specific, actionable, verifiable, and small enough to complete in one session. Tasks use markdown checkboxes so the Builder can mark them complete. Supports TDD (RED → GREEN → REFACTOR) when applicable.

## When to Use This Skill

- When the Strategist is invoked for the Tasks phase.
- When `proposal.md`, `specs/`, and `design.md` all exist for a named change.
- When `/flow:continue` or `/flow:ff` triggers the Tasks phase.

## Inputs

- `openspec/changes/<change-name>/proposal.md`
- `openspec/changes/<change-name>/specs/<domain>/spec.md` — all domains.
- `openspec/changes/<change-name>/design.md`
- `openspec/config.yaml` — project context and `rules.tasks`.

## Outputs

- `openspec/changes/<change-name>/tasks.md`
- Structured JSON envelope returned to the orchestrator.

## Algorithm / Steps

1. **Verify inputs**: Ensure proposal.md, specs/ (at least one domain), and design.md all exist. If any are missing, return status "blocked" with a clear message.
2. **Load all inputs**: Read proposal, all spec files, and design.
3. **Apply rules.tasks**: Load and apply each rule from `config.yaml` under `rules.tasks`.
4. **Map to phases**: Organize work into phases:
   - **Foundation**: Setup, scaffolding, shared types, config.
   - **Core Implementation**: Main feature logic, new components, API handlers.
   - **Integration**: Wiring, state management, API integration.
   - **Testing**: Unit, integration, E2E; reference spec scenarios.
   - **Cleanup**: Refactors, docs, dead code removal.
5. **Create tasks**: For each phase, break work into tasks. Use hierarchical numbering (1.1, 1.2, 2.1, 2.2, …).
6. **Per-task requirements**:
   - **Specific**: Clear goal, no ambiguity.
   - **Actionable**: Builder knows exactly what to do.
   - **Verifiable**: Clear acceptance criteria or verification command.
   - **Small**: Completable in one session (≤ 5 files unless justified).
   - **Concrete paths**: Reference actual file paths from design.
7. **Testing tasks**: Map to spec scenarios (Given/When/Then); e.g., "Verify Scenario 1 (REQ-1) from specs/universe/spec.md".
8. **TDD pattern**: When applicable, order as: RED (failing test) → GREEN (passing implementation) → REFACTOR.
9. **Write tasks.md** with checkbox format: `- [ ] 1.1 Task description`.
10. **Return envelope**: Populate status, executive_summary, artifacts, next_recommended (["apply"]), risks.

## Task Sizing Rules

- Each task: **≤ 5 files** unless explicitly justified in the task description.
- Each task: **one session** — a Builder should complete it in a single focused pass.
- Prefer many small tasks over few large ones.
- Phase N does not depend on Phase N+1; within a phase, order by dependency.
- Do not mix refactoring with feature work in the same task.
- Testing tasks may span multiple scenarios but should be grouped logically.

## Example Output Headings

### tasks.md

- **Phase 1: Foundation**
  - [ ] 1.1 Add shared type `UniverseId` in `packages/domain/src/universe/types.ts`
  - [ ] 1.2 Add validation schema in `packages/domain/src/universe/validate.ts`
- **Phase 2: Core Implementation**
  - [ ] 2.1 Implement `createUniverse` command in `packages/domain/src/universe/commands.ts`
  - [ ] 2.2 Add POST /universes handler in `apps/api/src/routes/universes.ts`
- **Phase 3: Integration**
  - [ ] 3.1 Wire universe store to API in `apps/web/src/state/universeStore.ts`
- **Phase 4: Testing**
  - [ ] 4.1 Verify Scenario 1 (REQ-1) from specs/universe/spec.md
  - [ ] 4.2 Verify Scenario 2 (REQ-2) from specs/universe/spec.md
- **Phase 5: Cleanup**
  - [ ] 5.1 Remove deprecated `legacyUniverse` from `apps/web/src/domain/`
