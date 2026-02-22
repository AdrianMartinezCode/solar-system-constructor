# Task 4: Replace generator panel imperative “setState + save” with explicit API

## Objective

Refactor the generator UI so it no longer mutates Zustand state imperatively via `useSystemStore.setState(...)`. Instead, it must use an explicit store/facade action that replaces the universe snapshot and persists it according to policy.

## Context to read first

- `docs/guides/GENERATOR_UI_INTEGRATION.md`
- `src/components/UniverseGeneratorPanel.tsx`
- `src/state/systemStore.ts`
- `src/utils/generatorBridge.ts`

## Constraints

- Preserve behavior and saved-data compatibility.
- This task should not introduce broader store splits yet; focus on the generator seam only.
- Do not change the generator algorithm; only change the integration surface.

## Steps

- Add an explicit action to the store/facade (name suggestion: `replaceUniverseSnapshot` or `importGeneratedUniverse`) that:
  - accepts a universe snapshot (generated output)
  - resets relevant derived/ephemeral UI state (selection) via an explicit policy (or leaves it to later tasks if selection will move to `uiStore`)
  - triggers persistence through the repository adapter (if available from Task 3)
- Update `UniverseGeneratorPanel` so it:
  - calls the explicit action
  - does not call `useSystemStore.setState(...)`
  - does not call `useSystemStore.getState().save()` directly
- Update generator integration doc to match the new contract.

## Files to create/update

- Update:
  - `src/state/systemStore.ts`
  - `src/components/UniverseGeneratorPanel.tsx`
  - `docs/guides/GENERATOR_UI_INTEGRATION.md`

## Acceptance criteria

- No `useSystemStore.setState(...)` calls remain in `src/components/UniverseGeneratorPanel.tsx`.
- Generator panel replaces the universe via a single explicit API call.
- The new universe is persisted (same key/format) after generation.

## Verification

```bash
npm run typecheck
npm run build
```

## Notes

- If selection is still in `systemStore` at this stage, clearing selection as part of “replace universe” is acceptable. Later tasks will move selection into `uiStore`.

