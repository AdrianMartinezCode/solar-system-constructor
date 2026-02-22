# Task 6: Migrate camera state (Body POV) to `uiStore`

## Objective

Move camera mode/target/offset out of universe/domain state into `uiStore`, so “how the universe is viewed” is separated from “what exists in the universe”.

## Context to read first

- `src/state/systemStore.ts` (camera fields/actions today)
- `src/components/BodyCameraController.tsx` (camera updates)
- `src/ui/BodyEditorPanel.tsx` (view-from-here / reset controls)

## Constraints

- Camera state is UI-only and must not be persisted as part of the universe snapshot.
- Keep the behavior identical: smooth transitions and POV follow must still work.
- Avoid broad refactors beyond camera wiring.

## Steps

- Extend `src/state/uiStore.ts` to include:
  - `cameraMode`, `cameraTargetBodyId`, `cameraOffset`
  - actions to enter/exit POV mode, set target, and reset
- Update `BodyCameraController` to read camera state from `uiStore`.
- Update `BodyEditorPanel` (and any other camera controls) to call `uiStore` camera actions.
- Remove or deprecate camera state/actions from `systemStore`.

## Files to create/update

- Update:
  - `src/state/uiStore.ts`
  - `src/components/BodyCameraController.tsx`
  - `src/ui/BodyEditorPanel.tsx`
  - `src/state/systemStore.ts` (remove/deprecate camera API)

## Acceptance criteria

- Body POV mode works as before (enter, follow, exit).
- Camera state is not persisted with universe data.
- No UI code needs to call camera actions on `systemStore`.

## Verification

```bash
npm run typecheck
npm run build
```

## Notes

- If some camera UI is in other panels (e.g., `StarEditorPanel.tsx`), include it only if necessary to keep behavior correct.

