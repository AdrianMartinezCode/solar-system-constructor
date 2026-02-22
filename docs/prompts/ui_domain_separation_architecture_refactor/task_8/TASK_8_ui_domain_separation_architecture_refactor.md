# Task 8: Migrate star CRUD + hierarchy ops + tick to domain commands (first real slice)

## Objective

Make the first “real” use of the domain reducer by routing **star CRUD + hierarchy** operations and **simulation tick** through `UniverseCommand` + `applyUniverseCommand`, keeping the reducer pure and letting the store/app layer handle persistence policy.

## Context to read first

- `docs/prompts/ui_domain_separation_architecture_refactor/task_2/TASK_2_ui_domain_separation_architecture_refactor.md`
- `src/state/systemStore.ts` (star actions + tick)
- `src/components/Scene.tsx` (tick wiring via R3F `useFrame`)
- `src/ui/BodyEditorPanel.tsx` (star CRUD usage)

## Constraints

- Domain reducer must remain side-effect-free.
- UI state must already be separated (selection/camera/nesting/isolation should be in `uiStore` from prior tasks).
- Keep save/load format unchanged.

## Steps

- Extend domain command set (if needed) to cover:
  - `tick(dt, timeScalePolicy?)` (or keep timeScale outside domain and pass scaled dt)
  - `addStar`, `updateStar`, `removeStar` (recursive delete), `attachStar`, `detachStar`
- Update store wiring so these operations:
  - build a `UniverseCommand`
  - call `applyUniverseCommand(currentUniverseState, command)`
  - set next universe state in the store
  - persist via repository policy (outside the reducer)
- Keep `systemStore` API stable initially if needed, but implement it by delegating to domain commands.

## Files to create/update

- Update:
  - `src/domain/universe/commands.ts`
  - `src/domain/universe/applyCommand.ts`
  - `src/domain/universe/validate.ts` (if invariants are needed for star ops)
  - `src/state/systemStore.ts` (or introduce `src/state/universeStore.ts` if chosen)
- Optional update (only if needed due to tick wiring move):
  - `src/components/Scene.tsx`

## Acceptance criteria

- Star operations are applied via domain commands/reducer (not inline mutation logic).
- The domain reducer has no persistence calls and no browser/UI dependencies.
- App still builds and typechecks.

## Verification

```bash
npm run typecheck
npm run build
```

## Notes

- If `timeScale` remains UI-controlled, prefer passing scaled dt into the domain tick command so the domain doesn’t own “simulation speed UI”.

