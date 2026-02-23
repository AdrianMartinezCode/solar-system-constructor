# Task 1 — Wire `useRemoteCommandStream` into the Online-Mode Editor

## Objective

Activate the existing SSE command stream by calling `useRemoteCommandStream` in the correct place in the component tree. After this task, opening a universe in online mode will establish a live SSE connection and remote commands will be applied to the 3D scene in real-time.

## Context to Read First

- `apps/web/src/hooks/useRemoteCommandStream.ts` — the hook that manages the SSE connection lifecycle and applies commands to the Zustand store.
- `apps/web/src/App.tsx` — the main app component tree. Pay attention to:
  - `AppContent` (rendered for both online editing and offline mode).
  - `App` (routing logic: `mode === null` → ModeSelectionScreen, `mode === 'online' && phase === 'browsing'` → OnlineBrowser, else → AppContent).
- `apps/web/src/state/appModeStore.ts` — tracks `mode: 'online' | 'offline' | null`.
- `apps/web/src/state/onlineSessionStore.ts` — tracks `currentUniverseId` when editing a universe in online mode.

## Constraints

- **Do not** modify `packages/domain/` — no domain changes.
- **Do not** add new npm dependencies.
- **Do not** create new components or stores in this task — only wire the existing hook.
- **Do not** modify the hook itself — it is already fully functional.
- The SSE connection must only be active when the user is in online mode **and** editing a specific universe (not while browsing the universe list).
- In offline mode, the hook must receive `null` (no connection).

## Steps

1. **Determine the wiring point in `App.tsx`**:

   `AppContent` is rendered both in online editing mode and offline mode. The hook needs access to both `appModeStore.mode` and `onlineSessionStore.currentUniverseId`.

   The cleanest approach is to call the hook inside `AppContent`, computing the universe ID to pass:
   - If `mode === 'online'`, pass `currentUniverseId` (which is non-null when editing).
   - If `mode === 'offline'` (or anything else), pass `null`.

2. **Add imports in `App.tsx`**:

   Import `useRemoteCommandStream` from `../hooks/useRemoteCommandStream`.

3. **Call the hook inside `AppContent`**:

   ```ts
   const mode = useAppModeStore((state) => state.mode);
   const currentUniverseId = useOnlineSessionStore((state) => state.currentUniverseId);
   useRemoteCommandStream(mode === 'online' ? currentUniverseId : null);
   ```

   Place this near the top of `AppContent`, alongside the existing `useKeyboardShortcuts()` call.

4. **Verify lifecycle correctness**:

   - When `mode === 'online'` and `currentUniverseId` transitions from `null` to a string (user opens a universe), the hook's `useEffect` fires and opens an SSE connection.
   - When the user navigates back to the browser (`exitEditor()` sets `currentUniverseId` to `null`), the effect's cleanup runs and closes the connection.
   - When the user switches to offline mode, the computed value becomes `null`, triggering disconnect.
   - When the component unmounts, the effect cleanup disconnects.

## Files to Create/Update

| Action | Path |
|--------|------|
| Update | `apps/web/src/App.tsx` — import hook, call it inside `AppContent` |

## Acceptance Criteria

- [ ] `useRemoteCommandStream` is called inside `AppContent` with the current universe ID when in online editing mode.
- [ ] In offline mode, the hook receives `null` and no SSE connection is opened.
- [ ] Navigating back to the universe browser closes the SSE connection (hook receives `null`).
- [ ] No duplicate connections: only one SSE connection per universe is active at a time.
- [ ] `npm run build` passes.

## Verification

```bash
cd /home/adr/front-portfolio-interactive/solar-system-constructor
npm run build:domain && npm run build:web
```

End-to-end manual test:

```bash
# Terminal 1: start the API
npm run dev:api

# Terminal 2: start the web app
npm run dev:web

# Step 1: Open the app, select "Online" mode, load/create a universe.
# Step 2: Open browser dev tools → Network tab → filter "EventStream".
# Step 3: Confirm an SSE connection to /universes/<id>/events is active.

# Terminal 3: send a command
curl -X POST http://localhost:3001/universes/<universe-id>/commands \
  -H 'Content-Type: application/json' \
  -d '{"type":"replaceSnapshot","snapshot":{"stars":{"star-1":{"id":"star-1","name":"Remote Sol","mass":100,"radius":5,"color":"#FF6600","children":[],"parentId":null,"orbitalDistance":0,"orbitalSpeed":0,"orbitalPhase":0}},"rootIds":["star-1"],"groups":{},"rootGroupIds":[],"belts":{},"smallBodyFields":{},"protoplanetaryDisks":{},"nebulae":{}}}'

# Step 4: A new orange star "Remote Sol" should appear in the 3D viewport.
# Step 5: Navigate back to the universe browser → SSE connection should close.
```

## Notes

- `AppContent` already imports `useAppModeStore` and `useOnlineSessionStore` is available. The wiring is straightforward.
- The hook already filters out `tick` commands and uses `applyRemoteCommand` (no `save()` side effect). No changes to the hook are needed.
- This task intentionally keeps the change minimal (< 10 lines). Connection status tracking and UI indicators are deferred to Tasks 2–3.
