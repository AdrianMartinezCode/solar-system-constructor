# Task 9: Migrate group operations to domain commands

## Objective

Move group CRUD and group hierarchy operations into the domain reducer as commands, enforcing invariants (notably cycle prevention) in a pure, testable place.

## Context to read first

- `src/state/systemStore.ts` (group operations today)
- `src/utils/groupUtils.ts` (pure helpers used by UI)
- `src/components/Scene.tsx` (visibility computation by nesting/isolation)
- `docs/prompts/ui_domain_separation_architecture_refactor/task_8/TASK_8_ui_domain_separation_architecture_refactor.md`

## Constraints

- Domain reducer must remain side-effect-free.
- UI-only concerns remain in `uiStore`:
  - nesting level
  - isolated group id
  - selection
- Persistence policy remains outside the reducer.

## Steps

- Extend `UniverseCommand` to include:
  - `addGroup`, `updateGroup`, `removeGroup`
  - `addToGroup`, `removeFromGroup`, `moveToGroup`
- Implement group invariants in the domain layer:
  - prevent cycles
  - keep parent relationships consistent
- Update store wiring (`systemStore` or `universeStore`) to delegate group ops to the reducer and persist via repository policy.

## Files to create/update

- Update:
  - `src/domain/universe/commands.ts`
  - `src/domain/universe/applyCommand.ts`
  - `src/domain/universe/validate.ts`
  - `src/state/systemStore.ts` (or `src/state/universeStore.ts`)
- Optional:
  - `src/utils/groupUtils.ts` (only if a helper must be moved or shared)

## Acceptance criteria

- Group operations are implemented as domain commands.
- Cycle prevention is enforced in domain, not ad-hoc in the store.
- App builds/typechecks.

## Verification

```bash
npm run typecheck
npm run build
```

