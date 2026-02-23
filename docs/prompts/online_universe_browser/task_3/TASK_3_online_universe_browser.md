# Task 3: Integrate Universe Browser into the App online-mode flow

## Objective

Wire the `UniverseBrowser` component into `App.tsx` so that selecting "Online" mode shows the universe browser first. User actions (load, delete, create) are handled here using the mock API client, and successful load/create transitions the user into the editor.

## Context to Read First

- `apps/web/src/App.tsx` — current entry point with mode gating logic. This is the file being modified.
- `apps/web/src/state/onlineSessionStore.ts` — the online session store created in Task 1 (phase, enterEditor, exitEditor).
- `apps/web/src/state/appModeStore.ts` — mode store (clearMode to go back to mode selection).
- `apps/web/src/state/systemStore.ts` — `replaceUniverseSnapshot()` for loading universe state.
- `apps/web/src/components/UniverseBrowser.tsx` — the presentational component created in Task 2.
- `apps/web/src/infra/api/mockUniverseApiClient.ts` — mock API client singleton (`mockUniverseApiClient`).
- `apps/web/src/app/ports/universeApiClient.ts` — `ApiUniverse`, `CreateUniverseInput` types.
- `apps/web/src/domain/universe/state.ts` — `emptyUniverseState` for creating new empty universes.

## Constraints

- Only modify `apps/web/src/App.tsx`.
- Use the `mockUniverseApiClient` singleton for all API calls.
- Use `systemStore.replaceUniverseSnapshot()` to load universe state into the editor.
- Keep the existing offline mode flow completely unchanged.
- The "Create" flow should use `window.prompt()` for the universe name (simple, no modal component needed for now).

## Steps

1. Import `useOnlineSessionStore`, `UniverseBrowser`, `mockUniverseApiClient`, and `emptyUniverseState` in `App.tsx`.

2. Create a new `OnlineBrowser` wrapper component inside `App.tsx` (or inline in `App`):
   - Use `useState` to hold the universe list (`ApiUniverse[]`) and loading state.
   - On mount, call `mockUniverseApiClient.list()` to fetch universes.
   - Implement `handleLoad(id)`:
     - Call `mockUniverseApiClient.getById(id)`.
     - Cast the universe's `state` to the expected snapshot shape.
     - Call `systemStore.replaceUniverseSnapshot(state)`.
     - Call `onlineSessionStore.enterEditor(id, name)`.
   - Implement `handleDelete(id)`:
     - Call `mockUniverseApiClient.delete(id)`.
     - Refresh the universe list.
   - Implement `handleCreate()`:
     - Prompt for a name using `window.prompt('Universe name:', 'New Universe')`.
     - If cancelled, do nothing.
     - Call `mockUniverseApiClient.create({ name, state: emptyUniverseState() })`.
     - Call `systemStore.replaceUniverseSnapshot(emptyUniverseState())`.
     - Call `onlineSessionStore.enterEditor(created.id, created.name)`.
   - Implement `handleBack()`:
     - Call `appModeStore.clearMode()` to return to mode selection.
     - Call `onlineSessionStore.resetSession()`.
   - Render `<UniverseBrowser>` with all props wired.

3. Update the `App` function's render logic:
   - If `mode === null` → `<ModeSelectionScreen>` (unchanged).
   - If `mode === 'offline'` → `<AppContent>` (unchanged).
   - If `mode === 'online'` and `onlineSession.phase === 'browsing'` → `<OnlineBrowser>`.
   - If `mode === 'online'` and `onlineSession.phase === 'editing'` → `<AppContent>`.

## Files to Create/Update

- `apps/web/src/App.tsx` **(update)**

## Acceptance Criteria

- [ ] Selecting "Online" mode shows the Universe Browser (not the editor directly).
- [ ] The browser displays the 3 mock universes from the seed data.
- [ ] Clicking "Load" on a universe loads its state into `systemStore` and enters the editor.
- [ ] Clicking "Delete" removes the universe from the list (after confirmation in the browser component).
- [ ] Clicking "Create New Universe" prompts for a name, creates via mock API, and enters the editor.
- [ ] Clicking "Back" from the browser returns to the mode selection screen.
- [ ] Selecting "Offline" mode bypasses the browser and enters the editor directly (unchanged behavior).
- [ ] `npm run build` passes without errors.

## Verification

```bash
cd /home/adr/front-portfolio-interactive/solar-system-constructor
npm run build
```

Manual testing:
1. Open app → select Online → verify Universe Browser appears.
2. Click Load on "Alpha Centauri System" → verify editor loads.
3. Return to browser → click Delete on "Trappist-1 Cluster" → confirm → verify removed from list.
4. Click "Create New Universe" → enter name → verify editor loads with empty universe.
5. Click Back → verify mode selection screen appears.
6. Select Offline → verify editor loads directly (no browser).

## Notes

- The mock API's `state` blob is `Record<string, unknown>`. You'll need to cast it to the shape expected by `replaceUniverseSnapshot`. Since mock data uses the correct shape, a simple `as` cast is acceptable for now. When the real API is wired, proper validation should be added.
- The `emptyUniverseState()` function from `@solar/domain` provides a properly typed empty state for new universes.
- Error handling: for the mock, a simple `try/catch` with `console.error` is sufficient. No toast/notification system is needed yet.
