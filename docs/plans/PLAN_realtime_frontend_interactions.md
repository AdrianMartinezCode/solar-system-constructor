# PLAN: Real-Time Frontend Interactions (SSE Command Stream)

**Change Request**: `docs/requests/CR_realtime_frontend_interactions.md`

## Summary

Activate the existing SSE command stream in the online-mode frontend editor and build the user-facing interactions around it: connection status tracking, a visual connection indicator, toast notifications for incoming remote commands, and edge-case handling (selected entity removal, snapshot replacement).

## Assumptions

- The full SSE plumbing is already in place (backend + frontend port/adapter/hook/store action) from the `realtime_command_stream` initiative (Tasks 1–4).
- The `useRemoteCommandStream` hook is functional but never called from a component.
- `systemStore.applyRemoteCommand(command)` correctly applies commands via the pure domain reducer and does **not** call `save()`.
- The `onlineSessionStore` tracks `currentUniverseId` when the user is editing a universe in online mode.
- `AppContent` is rendered for both online (editing phase) and offline modes.
- No backend or domain package changes are needed.

## Risks / Unknowns

| Risk | Mitigation |
|------|------------|
| Toast spam on burst commands (e.g., many `addStar` in rapid succession) | Task 4 will implement a max-visible limit and auto-dismiss timer; oldest toasts are evicted. |
| Re-render overhead from activity log store | Use fine-grained Zustand selectors; keep the toast store separate from `systemStore`. |
| Selection race condition on remote `removeStar` | Task 5 handles clearing synchronously inside `applyRemoteCommand`, before React re-renders. |
| `replaceSnapshot` may arrive while user is mid-edit | Task 5 resets selection + camera; an explicit user notification is shown via the toast system. |

## Out of Scope

- Backend changes (API is complete).
- Domain package changes (`packages/domain/`).
- Client-to-server command sending.
- Authentication / authorization.
- Persistent command history (log-to-database).
- Advanced conflict resolution between local and remote edits.

## Task List (ordered)

---

### Task 1 — Wire `useRemoteCommandStream` into the Online-Mode Editor

**Goal**: Activate the SSE connection when the user is editing a universe in online mode.

**Scope**: Minimal wiring — call the existing hook from the right place in the component tree. No new components, no new stores.

**Files**:
- Update `apps/web/src/App.tsx`

**Dependencies**: None (hook already exists from `realtime_command_stream` Task 4).

**Acceptance criteria**:
- When `mode === 'online'` and `currentUniverseId` is non-null, `useRemoteCommandStream(currentUniverseId)` is called.
- When the user navigates back to the universe browser or switches modes, the SSE connection is closed.
- In offline mode, no SSE connection is opened (hook receives `null`).
- `npm run build` passes.

**Verification**: `npm run build`

---

### Task 2 — SSE Connection Lifecycle State Management

**Goal**: Track the SSE connection lifecycle (idle / connecting / connected / error) in a Zustand store and make it available to UI components.

**Scope**: State management + port/adapter extension. No UI yet.

**Files**:
- Create `apps/web/src/state/realtimeStore.ts`
- Update `apps/web/src/app/ports/commandStream.ts` (add optional lifecycle callbacks)
- Update `apps/web/src/infra/realtime/sseCommandStream.ts` (implement lifecycle callbacks)
- Update `apps/web/src/hooks/useRemoteCommandStream.ts` (report status to store)

**Dependencies**: Task 1.

**Acceptance criteria**:
- `realtimeStore` exposes `connectionStatus: 'idle' | 'connecting' | 'connected' | 'error'`.
- `CommandStream.connect()` accepts optional `onStatusChange` callback (or the port is extended with lifecycle hooks).
- The SSE adapter fires status changes on EventSource `open` and `error` events.
- `useRemoteCommandStream` sets the store status to `'connecting'` on connect, `'connected'` on open, `'error'` on error, and `'idle'` on disconnect.
- `npm run build` passes.

**Verification**: `npm run build`

---

### Task 3 — Connection Status Indicator Component

**Goal**: Show a visual indicator in the AppHeader when in online mode, reflecting the SSE connection status.

**Scope**: Pure UI component + minimal AppHeader integration.

**Files**:
- Create `apps/web/src/components/ConnectionStatusIndicator.tsx`
- Create `apps/web/src/components/ConnectionStatusIndicator.css`
- Update `apps/web/src/components/AppHeader.tsx`

**Dependencies**: Task 2.

**Acceptance criteria**:
- A small color-coded pill/badge is visible in the AppHeader when `mode === 'online'`.
- Green = connected, yellow/amber = connecting/reconnecting, red = error/disconnected, gray = idle.
- The indicator reads from `realtimeStore.connectionStatus` via a Zustand selector.
- Hidden when in offline mode.
- `npm run build` passes.

**Verification**: `npm run build`

---

### Task 4 — Remote Command Toast Notifications

**Goal**: Display brief, auto-dismissing toast notifications when remote commands are applied, so the user knows when external changes arrive.

**Scope**: New toast component + store integration.

**Files**:
- Update `apps/web/src/state/realtimeStore.ts` (add toast queue / activity log)
- Create `apps/web/src/components/RemoteCommandToast.tsx`
- Create `apps/web/src/components/RemoteCommandToast.css`
- Update `apps/web/src/hooks/useRemoteCommandStream.ts` (push toasts on command receipt)

**Dependencies**: Task 2.

**Acceptance criteria**:
- When a remote command is applied, a toast appears with a brief description (e.g., "Star added", "Universe replaced").
- Toasts auto-dismiss after ~4 seconds.
- At most 3 toasts visible at a time; oldest are evicted.
- `replaceSnapshot` commands produce a prominent notification.
- `tick` commands (already filtered) do not produce toasts.
- `npm run build` passes.

**Verification**: `npm run build`

---

### Task 5 — Edge-Case Handling for Remote Mutations (Selection + UI Reset)

**Goal**: Handle UI edge cases when remote commands modify or remove entities the user is currently interacting with.

**Scope**: Store logic + hook adjustments. No new components.

**Files**:
- Update `apps/web/src/state/systemStore.ts` (enhance `applyRemoteCommand`)
- Update `apps/web/src/state/uiStore.ts` (if needed for clearing selection programmatically)
- Update `apps/web/src/hooks/useRemoteCommandStream.ts` (post-command UI adjustments)

**Dependencies**: Tasks 1–2.

**Acceptance criteria**:
- If a remote `removeStar` command removes the currently-selected star (in `uiStore`), the selection is cleared.
- If a remote `removeGroup` command removes the currently-selected or isolated group, the selection/isolation is cleared.
- If a remote `replaceSnapshot` command arrives, selection is cleared and camera resets to overview.
- Similar handling for `removeSmallBodyField`, `removeProtoplanetaryDisk`, `removeNebula` affecting the selected entity.
- No stale-reference errors in the UI after remote deletions.
- `npm run build` passes.

**Verification**: `npm run build`
