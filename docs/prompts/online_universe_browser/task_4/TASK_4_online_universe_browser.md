# Task 4: Add online-mode "Save" and "Back to Universes" buttons in AppHeader

## Objective

Add two buttons to the editor's header bar that are only visible in online mode: a "Save" button that updates the current universe via the mock API, and a "Back to Universes" button that returns the user to the Universe Browser.

## Context to Read First

- `apps/web/src/components/AppHeader.tsx` — the editor header bar to be modified.
- `apps/web/src/components/AppHeader.css` — existing header styles.
- `apps/web/src/state/appModeStore.ts` — to check if mode is `'online'`.
- `apps/web/src/state/onlineSessionStore.ts` — to get `currentUniverseId`, `currentUniverseName`, and `exitEditor()`.
- `apps/web/src/state/systemStore.ts` — to read the current universe state for saving.
- `apps/web/src/infra/api/mockUniverseApiClient.ts` — mock API client for `update()`.
- `apps/web/src/app/ports/universeApiClient.ts` — `UpdateUniverseInput` type.

## Constraints

- Only modify `apps/web/src/components/AppHeader.tsx` and `apps/web/src/components/AppHeader.css`.
- Buttons must only be visible when `appModeStore.mode === 'online'`.
- Offline mode must remain completely unchanged.
- No new npm dependencies.

## Steps

1. In `AppHeader.tsx`:
   - Import `useAppModeStore`, `useOnlineSessionStore`, `mockUniverseApiClient`.
   - Read `mode` from `useAppModeStore`.
   - Read `currentUniverseId`, `currentUniverseName`, `exitEditor` from `useOnlineSessionStore`.
   - Add a local `saveStatus` state: `'idle' | 'saving' | 'saved'`.

2. Implement the Save handler:
   - Set `saveStatus` to `'saving'`.
   - Get the current universe state from `systemStore` (stars, rootIds, groups, rootGroupIds, belts, smallBodyFields, protoplanetaryDisks, nebulae).
   - Call `mockUniverseApiClient.update(currentUniverseId, { state: universeState })`.
   - Set `saveStatus` to `'saved'`.
   - After 2 seconds, reset `saveStatus` to `'idle'`.
   - Wrap in try/catch; on error, reset to `'idle'` and `console.error`.

3. Implement the Back to Universes handler:
   - Call `onlineSessionStore.exitEditor()`.

4. In the JSX, conditionally render (only when `mode === 'online'`):
   - In `header-left` area (or a new section):
     - "📋 Universes" button → calls Back handler.
     - Display current universe name as a label (e.g., "Editing: Alpha Centauri System").
   - In `header-right` area:
     - "💾 Save" button → calls Save handler.
     - Button text changes based on `saveStatus`: "💾 Save" / "⏳ Saving…" / "✅ Saved".
     - Button is disabled while `saveStatus === 'saving'`.

5. In `AppHeader.css`:
   - Add styles for the new buttons matching the existing `.header-btn` pattern.
   - Add a subtle success style for the "Saved" state.
   - Add a style for the universe name label.

## Files to Create/Update

- `apps/web/src/components/AppHeader.tsx` **(update)**
- `apps/web/src/components/AppHeader.css` **(update)**

## Acceptance Criteria

- [ ] When `mode === 'online'`, the header shows a "📋 Universes" button and a "💾 Save" button.
- [ ] When `mode === 'offline'`, neither button is visible; header looks identical to before.
- [ ] The current universe name is displayed in the header when in online mode.
- [ ] Clicking "Save" calls the mock API `update()` with the current system state.
- [ ] Save button shows "Saving…" while the API call is in progress.
- [ ] Save button shows "Saved ✅" for ~2 seconds after a successful save.
- [ ] Save button is disabled during the saving process.
- [ ] Clicking "Universes" calls `exitEditor()` and returns to the Universe Browser.
- [ ] `npm run build` passes without errors.

## Verification

```bash
cd /home/adr/front-portfolio-interactive/solar-system-constructor
npm run build
```

Manual testing:
1. Select Online → load a universe → verify "Universes" and "Save" buttons appear in header.
2. Verify universe name is displayed in the header.
3. Click "Save" → verify button shows "Saving…" then "Saved ✅".
4. Click "Universes" → verify return to Universe Browser.
5. Select Offline → verify no new buttons appear.

## Notes

- The `systemStore` does not expose a single getter for the full universe state snapshot. You'll need to read individual fields: `stars`, `rootIds`, `groups`, `rootGroupIds`, `belts`, `smallBodyFields`, `protoplanetaryDisks`, `nebulae`.
- The save status feedback is ephemeral (local component state) — no need for a global notification system.
- Consider using `useCallback` for the save handler to avoid unnecessary re-renders.
