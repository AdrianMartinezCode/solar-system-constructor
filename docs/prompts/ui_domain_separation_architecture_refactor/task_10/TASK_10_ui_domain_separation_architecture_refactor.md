# Task 10: Migrate fields/disks/nebula operations to domain commands; tighten boundaries

## Objective

Complete the migration of “what exists in the universe” mutations by moving remaining operations into domain commands:

- small body fields
- protoplanetary disks
- nebula regions

After this task, universe mutations should consistently flow through the domain command surface, with persistence/generator behind ports/adapters and UI state remaining in `uiStore`.

## Context to read first

- `src/state/systemStore.ts` (operations for fields/disks/nebulae)
- `src/ui/NebulaEditorPanel.tsx`
- `src/components/SmallBodyFieldObject.tsx`
- `src/components/ProtoplanetaryDiskObject.tsx`
- `docs/prompts/ui_domain_separation_architecture_refactor/task_9/TASK_9_ui_domain_separation_architecture_refactor.md`

## Constraints

- Domain remains side-effect-free (no `Math.random`, `Date`, `localStorage`, `console` in reducer).
- Persistence and generator remain behind ports/adapters.
- UI state is not persisted with universe snapshots.

## Steps

- Extend `UniverseCommand` with commands for:
  - set/select/update/remove fields/disks/nebulae (selection likely stays in `uiStore`)
  - any additional CRUD needed by current panels
- Implement the commands in `applyUniverseCommand`, enforcing basic invariants (existence checks, safe removal behavior).
- Update store wiring so UI panels call store actions that dispatch commands (no direct mutation + save side effects spread across UI).
- Tighten boundaries where cheap:
  - ensure new infra adapters live under `src/infra/**`
  - reduce remaining direct imports of infra helpers from state/UI where feasible

## Files to create/update

- Update:
  - `src/domain/universe/commands.ts`
  - `src/domain/universe/applyCommand.ts`
  - `src/domain/universe/validate.ts`
  - `src/state/systemStore.ts` (or `src/state/universeStore.ts`)
- As needed to adapt to new APIs (keep minimal set):
  - `src/ui/NebulaEditorPanel.tsx`
  - `src/components/SmallBodyFieldObject.tsx`
  - `src/components/ProtoplanetaryDiskObject.tsx`

## Acceptance criteria

- Field/disk/nebula mutations are applied via domain commands.
- No infra/UI side effects are introduced into the domain reducer.
- App builds/typechecks.

## Verification

```bash
npm run typecheck
npm run build
```

