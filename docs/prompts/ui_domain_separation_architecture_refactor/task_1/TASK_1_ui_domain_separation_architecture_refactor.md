# Task 1: Architecture decision + boundaries doc (docs-only)

## Objective

Create the minimum set of documentation artifacts that lock in the refactor’s **layer boundaries**, **dependency rule**, and the initial **command/protocol** concept so subsequent code tasks stay consistent.

## Context to read first

- `docs/requests/CR_ui_domain_separation_architecture_refactor.md`
- `docs/plans/PLAN_ui_domain_separation_architecture_refactor.md`
- `docs/ai_prompts/PROMPT_UI_DOMAIN_SEPARATION_REFACTOR.md`
- Key coupling hotspots (for accurate boundaries):
  - `src/state/systemStore.ts`
  - `src/components/UniverseGeneratorPanel.tsx`
  - `src/utils/persistence.ts`

## Constraints

- Docs-only task: **do not modify any files under `src/`**.
- Keep it short and concrete; focus on boundaries and decisions.
- ADR number: next available after `ADR_0001_...` should be `ADR_0002_...`.

## Steps

- Create an ADR describing:
  - target layers (UI / state wiring / application / domain / infra)
  - what is explicitly UI-only state (selection/camera/nesting/window layout)
  - ports/adapters: repository, generator, logger/event sink
  - command/protocol requirement: JSON-serializable DTOs, optionally versioned
  - incremental migration strategy (no big bang)
- Create a design note that:
  - defines “what lives where” (folder map)
  - lists the initial command surface (names only)
  - explains how the generator panel “replace universe” flow will work post-refactor

## Files to create/update

- Create:
  - `docs/decisions/ADR_0002_ui_domain_separation_architecture_refactor.md`
  - `docs/design/LAYERED_ARCHITECTURE_UI_DOMAIN_INFRA.md`
- Optional update (only if needed for cross-links):
  - `docs/README.md`

## Acceptance criteria

- ADR clearly states:
  - dependency direction (inward)
  - what is domain vs UI vs infra in this repo
  - how persistence/generator are accessed (ports)
- Design note provides:
  - folder map and boundaries
  - command/protocol concept with JSON-serializable requirement
  - migration stages aligned with `PLAN_ui_domain_separation_architecture_refactor.md`

## Verification

- N/A (docs-only)

## Notes

- Keep names consistent with the plan slug: `ui_domain_separation_architecture_refactor`.

