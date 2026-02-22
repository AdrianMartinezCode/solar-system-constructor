# Task 2: Create domain protocol + pure reducer skeleton (new files only)

## Objective

Introduce a minimal `src/domain/` core that is **headless** and **side-effect-free**, establishing the foundational types and reducer shape needed for later migration.

## Context to read first

- `docs/plans/PLAN_ui_domain_separation_architecture_refactor.md` (Task 2 section)
- `src/state/systemStore.ts` (current state shape + operations)
- `src/types.ts` (current data model types)

## Constraints

- Only create new files under `src/domain/**` (and optionally a single `src/domain/index.ts`).
- **No imports** from React, `@react-three/fiber`, `three`, Zustand, or browser globals in `src/domain/**`.
- Commands and state must be **JSON-serializable** (plain objects, arrays, numbers/strings/booleans/null).

## Steps

- Define a `UniverseState` type that represents the persisted universe snapshot (align with current persisted fields).
- Define a `UniverseCommand` union type for the first slice of operations:
  - simulation time tick
  - star CRUD + hierarchy (add/update/remove/attach/detach)
  - (optional) “replace snapshot” command for importing a full universe snapshot
- Implement a pure reducer/engine:
  - `applyUniverseCommand(state, command) -> { nextState, events }`
  - events are optional but must be JSON-serializable if present
- Add minimal validation helpers (e.g., cycle prevention / parent existence checks) used by the reducer.

## Files to create/update

- Create:
  - `src/domain/universe/state.ts`
  - `src/domain/universe/commands.ts`
  - `src/domain/universe/applyCommand.ts`
  - `src/domain/universe/validate.ts`
  - `src/domain/index.ts`

## Acceptance criteria

- `src/domain/**` compiles and contains no UI/framework/browser dependencies.
- The reducer is deterministic and side-effect-free (no randomness, no Date, no localStorage, no console).
- The initial command set matches the planned migration slice (stars + tick).

## Verification

```bash
npm run typecheck
npm run build
```

## Notes

- Keep the initial state/command shape small; later tasks will expand it to groups/fields/disks/nebulae.

