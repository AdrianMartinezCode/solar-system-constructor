# Task 5: Create `uiStore` for selection state and migrate core selection flows

## Objective

Move selection out of universe/domain state by introducing a dedicated UI store (`uiStore`) that owns selected IDs and selection actions. Migrate a small, critical set of components so selection works end-to-end without `systemStore` selection side effects.

## Context to read first

- `src/state/systemStore.ts` (current selection fields and selection-clearing behavior)
- `src/components/StarObject.tsx` (selection on click)
- `src/ui/BodyEditorPanel.tsx` (reads selection and drives mutations)

## Constraints

- This task is about **selection only** (do not move camera/nesting/isolation yet).
- Keep persistence format unchanged; selection should not be persisted as part of universe snapshot.
- Keep file scope tight (aim ≤ 4 updated files + 1 new file).

## Steps

- Create `src/state/uiStore.ts` with:
  - selected IDs (star/group/belt/smallBodyField/protoplanetaryDisk/nebula)
  - selection actions (`selectStar`, `selectGroup`, etc.) that enforce mutual exclusion
  - optional helper `clearSelection()`
- Update `StarObject` to use `uiStore` selection when clicking.
- Update `BodyEditorPanel` to read selection from `uiStore` (still calling universe mutations from `systemStore` for now).
- Update `systemStore`:
  - stop owning selection fields OR mark them deprecated and stop “selection clearing” inside domain mutations
  - ensure universe mutations no longer implicitly set selection

## Files to create/update

- Create:
  - `src/state/uiStore.ts`
- Update:
  - `src/components/StarObject.tsx`
  - `src/ui/BodyEditorPanel.tsx`
  - `src/state/systemStore.ts`

## Acceptance criteria

- Selection state is owned by `uiStore`.
- Clicking a star/body selects it and the Body Inspector reflects the selection.
- Universe/domain mutations do not implicitly clear or change selection.

## Verification

```bash
npm run typecheck
npm run build
```

## Notes

- If other panels still read selection from `systemStore`, keep a temporary compatibility bridge only if necessary (explicitly documented in code comments).

