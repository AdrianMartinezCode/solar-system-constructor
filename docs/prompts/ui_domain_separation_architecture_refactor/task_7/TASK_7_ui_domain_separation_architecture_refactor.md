# Task 7: Migrate nesting level + group isolation to `uiStore`

## Objective

Move viewport display controls—`nestingLevel` and `isolatedGroupId`—out of universe/domain state into `uiStore`, preserving existing group isolation behavior in the scene.

## Context to read first

- `src/state/systemStore.ts` (nesting + isolation fields/actions today)
- `src/components/Scene.tsx` (visibility logic and isolation behavior)
- `src/ui/NestingLevelControl.tsx`
- `src/ui/GroupEditorPanel.tsx` (if it controls isolation toggle)

## Constraints

- This is UI state only and must not be persisted in the universe snapshot.
- Keep behavior identical:
  - isolation shows only isolated group and its contents as today
  - nesting level changes visible items as today

## Steps

- Extend `src/state/uiStore.ts` with:
  - `nestingLevel`
  - `isolatedGroupId`
  - actions to set/toggle isolation and set nesting level
- Update `Scene` to read nesting/isolation from `uiStore` rather than `systemStore`.
- Update `NestingLevelControl` and any isolation UI to write to `uiStore`.
- Remove/deprecate nesting/isolation state from `systemStore`.

## Files to create/update

- Update:
  - `src/state/uiStore.ts`
  - `src/components/Scene.tsx`
  - `src/ui/NestingLevelControl.tsx`
  - `src/ui/GroupEditorPanel.tsx` (if needed)
  - `src/state/systemStore.ts` (remove/deprecate nesting/isolation API)

## Acceptance criteria

- Nesting level control works as before.
- Isolation toggle works as before; scene visibility matches previous behavior.
- Nesting/isolation are not part of persisted universe data.

## Verification

```bash
npm run typecheck
npm run build
```

