# Task 1: Define AppMode type and create the mode store

## Objective

Create the foundational type and Zustand store that the online/offline mode feature depends on. This establishes the application-level concept of "mode" as a first-class state, following the same Zustand patterns used by `systemStore` and `uiStore`.

## Context to Read First

- `apps/web/src/state/uiStore.ts` — reference for Zustand store patterns used in this project.
- `apps/web/src/state/systemStore.ts` — reference for store conventions (import style, interface definition, create call).
- `apps/web/src/types.ts` — existing shared types (understand naming/placement conventions).
- `apps/web/package.json` — confirm Zustand version (4.x).

## Constraints

- Do **not** create any UI components.
- Do **not** modify any existing files.
- Follow existing Zustand patterns (interface-first, then `create<Interface>`).
- The mode type file should be under `apps/web/src/types/` to follow the existing `types/generationConfig.ts` convention.

## Steps

1. Create `apps/web/src/types/appMode.ts`:
   - Export a `AppMode` type alias: `'online' | 'offline'`.

2. Create `apps/web/src/state/appModeStore.ts`:
   - Import `AppMode` from the new types file.
   - Define an `AppModeStore` interface with:
     - `mode: AppMode | null` — starts as `null` (no choice made yet).
     - `setMode(mode: AppMode): void` — sets the mode.
     - `clearMode(): void` — resets mode to `null`.
   - Export `useAppModeStore` using `create<AppModeStore>`.

## Files to Create/Update

- `apps/web/src/types/appMode.ts` (new)
- `apps/web/src/state/appModeStore.ts` (new)

## Acceptance Criteria

- [ ] `AppMode` type is exported from `apps/web/src/types/appMode.ts` and equals `'online' | 'offline'`.
- [ ] `useAppModeStore` is exported from `apps/web/src/state/appModeStore.ts`.
- [ ] Store's initial `mode` is `null`.
- [ ] `setMode('online')` sets `mode` to `'online'`; `setMode('offline')` sets `mode` to `'offline'`.
- [ ] `clearMode()` resets `mode` to `null`.
- [ ] No existing files are modified.
- [ ] `npm run build` passes.

## Verification

```bash
cd apps/web && npx tsc --noEmit
cd ../.. && npm run build
```

## Notes

- The store intentionally does not persist the mode choice to localStorage. This is a session-level decision. Persistence may be added in a follow-up CR if desired.
- The `null` initial state is key — it signals "no choice made yet" and is used by Task 4 to decide whether to show the mode selection screen.
