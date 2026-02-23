# Task 4: Integrate mode selection gate into App entry flow

## Objective

Wire the `ModeSelectionScreen` into the application's entry point so it serves as a gate before the main 3D experience loads. When no mode is selected (`mode === null`), the mode selection screen is shown. Once the user picks a mode, the existing `App` content renders normally.

## Context to Read First

- `apps/web/src/App.tsx` — current app entry: renders `AppHeader`, `Scene`, `WindowManager`, `Taskbar`.
- `apps/web/src/main.tsx` — React root mount point.
- `apps/web/src/state/appModeStore.ts` — the mode store (created in Task 1).
- `apps/web/src/components/ModeSelectionScreen.tsx` — the mode selection UI (created in Task 2).
- `apps/web/src/App.css` — current layout styles.

## Constraints

- Modify **only** `apps/web/src/App.tsx`. Do not change `main.tsx` or any other existing file unless absolutely necessary.
- The existing app behavior after mode selection must be **identical** to the current behavior (no visual changes, no broken functionality).
- Keyboard shortcuts (`useKeyboardShortcuts`), system loading (`useSystemStore.load`), and workspace loading (`useWindowStore.loadWorkspace`) should only activate **after** a mode is selected (not while the selection screen is displayed).
- Both "Online" and "Offline" modes should lead to the same app experience for now. The differentiation will come in a future CR when the real API adapter is wired.

## Steps

1. **Update `apps/web/src/App.tsx`**:
   - Import `useAppModeStore` from `../state/appModeStore`.
   - Import `ModeSelectionScreen` from `./ModeSelectionScreen` (or `../components/ModeSelectionScreen`).
   - Import `AppMode` type from `../types/appMode`.
   - At the top of the `App` function, read `mode` and `setMode` from `useAppModeStore`.
   - **Conditional rendering**:
     - If `mode === null`, render `<ModeSelectionScreen onSelect={setMode} />`.
     - Otherwise, render the existing JSX (AppHeader + Scene + WindowManager + Taskbar).
   - Move the `useEffect` for `load()` and `loadWorkspace('exploration')` so they only run when `mode` is not `null`. This can be done by:
     - Adding `mode` to the dependency array and guarding with `if (!mode) return;` inside the effect, OR
     - Extracting the main app content into a separate inner component (e.g., `AppContent`) that only mounts after mode selection — its `useEffect` then naturally runs on mount.
   - The `useKeyboardShortcuts()` hook should also only activate after mode selection.

2. **(Optional) Minor polish**: If the transition from mode screen to app content causes a visible flash (e.g., dark screen → brief white → dark app), add a smooth fade or ensure the background colors match.

## Files to Create/Update

- `apps/web/src/App.tsx` (update)

## Acceptance Criteria

- [ ] When the app loads, the `ModeSelectionScreen` is displayed (not the 3D scene).
- [ ] Clicking "Offline" sets the mode and renders the full existing app.
- [ ] Clicking "Online" sets the mode and renders the full existing app (same as offline for now).
- [ ] System data (`load()`) and workspace (`loadWorkspace`) are not loaded while the mode screen is displayed.
- [ ] Keyboard shortcuts are not active while the mode screen is displayed.
- [ ] After selecting a mode, the app behaves exactly as it did before this change.
- [ ] No layout flash or visual glitch during the transition.
- [ ] `npm run build` passes.

## Verification

```bash
cd apps/web && npx tsc --noEmit
cd ../.. && npm run build
```

Manual verification:
1. Open the app in a browser.
2. Verify the mode selection screen appears first (no 3D scene visible behind it).
3. Click "Offline" → verify the full app loads and works as before (scene, panels, keyboard shortcuts).
4. Refresh the page → verify the mode selection screen appears again (mode is not persisted).
5. Click "Online" → verify the full app loads identically.

## Notes

- A clean pattern is to extract the main app body into a `function AppContent()` component and render it conditionally. This avoids polluting the `App` function with guard clauses and ensures hooks like `useEffect` and `useKeyboardShortcuts` only run when `AppContent` is mounted.
- The `ModeSelectionScreen` should fill the full viewport. Since the existing layout uses `position: fixed` for the scene container, the mode screen's full-screen positioning should not conflict.
- Future tasks will differentiate online/offline behavior inside `AppContent` or at the store level.
