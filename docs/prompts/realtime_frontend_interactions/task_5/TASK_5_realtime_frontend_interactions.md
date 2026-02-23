# Task 5 — Edge-Case Handling for Remote Mutations (Selection + UI Reset)

## Objective

Handle UI edge cases that arise when remote commands modify or remove entities the user is currently interacting with. After this task, the UI will gracefully clear stale selections, reset camera mode, and clear group isolation when remote commands invalidate the user's current context.

## Context to Read First

- `apps/web/src/state/systemStore.ts` — focus on:
  - `applyRemoteCommand` (line ~584) — currently just calls `dispatchDomainCommand`.
  - `replaceUniverseSnapshot` (line ~561) — example of how selection/camera is reset after a full replace.
- `apps/web/src/state/uiStore.ts` — the canonical selection and camera state. Key actions: `clearSelection()`, `resetCamera()`, `setIsolatedGroupId(null)`.
- `apps/web/src/hooks/useRemoteCommandStream.ts` — the hook where post-command logic can be added.
- `apps/web/src/domain/universe/commands.ts` — the `UniverseCommand` type union (re-exported from `@solar/domain`).
- `apps/web/src/state/onlineSessionStore.ts` — not modified, but useful context for understanding the session lifecycle.

## Constraints

- **Do not** modify `packages/domain/` — no domain changes. The pure reducer stays pure.
- **Do not** add new npm dependencies.
- **Do not** create UI components — this is logic-only (store + hook changes).
- Edge-case handling must be **synchronous** and happen **after** the command is applied to the domain state (so the store is already updated when selections are cleared).
- The `applyRemoteCommand` action in `systemStore` should remain focused on domain state. Selection/UI logic should be handled in the hook (or a helper called from the hook) to maintain separation of concerns.

## Steps

1. **Create a helper function** for post-command UI adjustments:

   In `apps/web/src/hooks/useRemoteCommandStream.ts` (or a new utility file if preferred), create a function that inspects the command and the current UI state, then clears stale references:

   ```ts
   function handleRemoteCommandUiSideEffects(command: UniverseCommand): void {
     const uiState = useUiStore.getState();

     switch (command.type) {
       case 'removeStar': {
         if (uiState.selectedStarId === command.id) {
           useUiStore.getState().clearSelection();
         }
         break;
       }
       case 'removeGroup': {
         if (uiState.selectedGroupId === command.id) {
           useUiStore.getState().clearSelection();
         }
         if (uiState.isolatedGroupId === command.id) {
           useUiStore.getState().setIsolatedGroupId(null);
         }
         break;
       }
       case 'removeSmallBodyField': {
         if (uiState.selectedSmallBodyFieldId === command.id) {
           useUiStore.getState().clearSelection();
         }
         break;
       }
       case 'removeProtoplanetaryDisk': {
         if (uiState.selectedProtoplanetaryDiskId === command.id) {
           useUiStore.getState().clearSelection();
         }
         break;
       }
       case 'removeNebula': {
         if (uiState.selectedNebulaId === command.id) {
           useUiStore.getState().clearSelection();
         }
         break;
       }
       case 'replaceSnapshot': {
         // Full snapshot replacement: reset all UI state
         useUiStore.getState().clearSelection();
         useUiStore.getState().resetCamera();
         useUiStore.getState().setIsolatedGroupId(null);
         break;
       }
       // No action needed for addStar, updateStar, etc. — those don't invalidate selections.
     }
   }
   ```

2. **Call the helper from `useRemoteCommandStream`**:

   In the `onCommand` callback, **after** `applyRemoteCommand(command)`, call:
   ```ts
   handleRemoteCommandUiSideEffects(command);
   ```

   This ensures the domain state is updated first, then the UI state is reconciled.

3. **Handle `removeStar` when the star is the camera target**:

   If `uiState.cameraMode === 'body'` and `uiState.cameraTargetBodyId === command.id` (for `removeStar`), also reset the camera:
   ```ts
   if (uiState.cameraMode === 'body' && uiState.cameraTargetBodyId === command.id) {
     useUiStore.getState().resetCamera();
   }
   ```

4. **Handle `removeFromGroup` / `moveToGroup`**:

   These commands move entities between groups but don't delete them, so they generally don't invalidate selections. However, if a `moveToGroup` moves an entity into a group that is **not** the currently isolated group, the entity might visually disappear from the viewport. This is an existing behavior and does not need special handling in this task (the user can change isolation to see it). No action needed.

5. **Verify backwards compatibility**:

   - `applyRemoteCommand` in `systemStore` is NOT modified — it still only calls the domain reducer.
   - The UI side-effects are handled externally in the hook, preserving the store's domain-only focus.
   - Local commands (triggered by the user in the UI) already handle selection changes in their own store actions — this task only adds handling for **remote** commands.

## Files to Create/Update

| Action | Path |
|--------|------|
| Update | `apps/web/src/hooks/useRemoteCommandStream.ts` |

## Acceptance Criteria

- [ ] If a remote `removeStar` command removes the currently-selected star, the selection is cleared.
- [ ] If a remote `removeStar` command removes the current camera-target body, the camera resets to overview mode.
- [ ] If a remote `removeGroup` command removes the currently-selected group, the selection is cleared.
- [ ] If a remote `removeGroup` command removes the currently-isolated group, the isolation is cleared.
- [ ] If a remote `removeSmallBodyField`, `removeProtoplanetaryDisk`, or `removeNebula` removes the selected entity, the selection is cleared.
- [ ] If a remote `replaceSnapshot` arrives, selection is cleared, camera resets to overview, and group isolation is cleared.
- [ ] Local (user-initiated) commands are NOT affected by this logic.
- [ ] `npm run build` passes.

## Verification

```bash
cd /home/adr/front-portfolio-interactive/solar-system-constructor
npm run build:domain && npm run build:web
```

Manual edge-case test:

```bash
# 1. Open the app in online mode, load a universe with at least one star.
# 2. Select the star in the 3D viewport.
# 3. From another terminal, POST a removeStar command for that star's ID:
curl -X POST http://localhost:3001/universes/<universe-id>/commands \
  -H 'Content-Type: application/json' \
  -d '{"type":"removeStar","id":"<selected-star-id>"}'
# 4. The star should disappear AND the selection should be cleared (no stale editor panel).

# 5. POST a replaceSnapshot command:
curl -X POST http://localhost:3001/universes/<universe-id>/commands \
  -H 'Content-Type: application/json' \
  -d '{"type":"replaceSnapshot","snapshot":{"stars":{},"rootIds":[],"groups":{},"rootGroupIds":[],"belts":{},"smallBodyFields":{},"protoplanetaryDisks":{},"nebulae":{}}}'
# 6. The viewport should show an empty universe, selection cleared, camera in overview mode.
```

## Notes

- **Why handle in the hook, not in `applyRemoteCommand`**: The `systemStore.applyRemoteCommand` action currently calls the pure domain reducer. Mixing UI concerns (selection, camera) into it would violate the domain/UI separation that the architecture refactor established. The hook is the correct integration point because it already bridges the infrastructure layer (SSE) and the state layer (stores).
- **Synchronous execution**: Both `applyRemoteCommand` and the UI side-effects are synchronous. React will batch the Zustand store updates and re-render once, so the user never sees a frame with a stale selection.
- **`removeRing` command**: Removing a ring doesn't remove the entity itself (the parent planet/star remains), so no selection clearing is needed.
