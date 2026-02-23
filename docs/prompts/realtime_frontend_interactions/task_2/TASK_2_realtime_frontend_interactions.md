# Task 2 — SSE Connection Lifecycle State Management

## Objective

Create a Zustand store that tracks the SSE connection lifecycle and extend the `CommandStream` port/adapter to report status changes. After this task, any UI component can subscribe to `realtimeStore.connectionStatus` to know whether the SSE connection is idle, connecting, connected, or in an error state.

## Context to Read First

- `apps/web/src/app/ports/commandStream.ts` — the `CommandStream` port interface (currently has `connect` only).
- `apps/web/src/infra/realtime/sseCommandStream.ts` — the SSE adapter (has `open` and `error` event listeners that only `console.log`).
- `apps/web/src/hooks/useRemoteCommandStream.ts` — the React hook that manages the SSE connection lifecycle.
- `apps/web/src/state/onlineSessionStore.ts` — example of a small Zustand store pattern used in this project.
- `apps/web/src/state/appModeStore.ts` — another small Zustand store example.

## Constraints

- **Do not** modify `packages/domain/` — no domain changes.
- **Do not** add new npm dependencies.
- **Do not** create UI components — this is pure state management + port/adapter.
- The `CommandStream` port must remain transport-agnostic: status callbacks are optional options, not SSE-specific.
- The existing `connect(universeId, onCommand)` signature must remain backwards-compatible (options are additive).
- The `realtimeStore` must be separate from `systemStore` and `uiStore` to avoid unrelated re-renders.

## Steps

1. **Create `apps/web/src/state/realtimeStore.ts`**:

   A small Zustand store with the following shape:

   ```ts
   type ConnectionStatus = 'idle' | 'connecting' | 'connected' | 'error';

   interface RealtimeStore {
     connectionStatus: ConnectionStatus;
     setConnectionStatus: (status: ConnectionStatus) => void;
   }
   ```

   Initialize `connectionStatus` as `'idle'`.

2. **Extend the `CommandStream` port** in `apps/web/src/app/ports/commandStream.ts`:

   Add an optional `options` parameter to `connect`:

   ```ts
   interface CommandStreamOptions {
     onStatusChange?: (status: 'connecting' | 'connected' | 'error') => void;
   }

   interface CommandStream {
     connect(
       universeId: string,
       onCommand: CommandStreamListener,
       options?: CommandStreamOptions,
     ): DisconnectFn;
   }
   ```

   Export the `CommandStreamOptions` type.

3. **Update the SSE adapter** in `apps/web/src/infra/realtime/sseCommandStream.ts`:

   - Accept the `options` parameter in `connect`.
   - In the `open` event listener, call `options?.onStatusChange?.('connected')`.
   - In the `error` event listener, call `options?.onStatusChange?.('error')`.
   - Immediately after creating the `EventSource`, call `options?.onStatusChange?.('connecting')` (before the connection is established).

4. **Update `useRemoteCommandStream`** in `apps/web/src/hooks/useRemoteCommandStream.ts`:

   - Import `useRealtimeStore` from the new store.
   - On connect, pass an `onStatusChange` callback that sets the store status.
   - On disconnect (cleanup), set the store status to `'idle'`.
   - The hook should call `useRealtimeStore.getState().setConnectionStatus(...)` (outside React render, using `getState()`).

## Files to Create/Update

| Action | Path |
|--------|------|
| Create | `apps/web/src/state/realtimeStore.ts` |
| Update | `apps/web/src/app/ports/commandStream.ts` |
| Update | `apps/web/src/infra/realtime/sseCommandStream.ts` |
| Update | `apps/web/src/hooks/useRemoteCommandStream.ts` |

## Acceptance Criteria

- [ ] `realtimeStore` exposes `connectionStatus` with type `'idle' | 'connecting' | 'connected' | 'error'`.
- [ ] `CommandStream.connect()` accepts an optional `options` parameter with `onStatusChange` callback.
- [ ] The SSE adapter calls `onStatusChange('connecting')` immediately, `onStatusChange('connected')` on EventSource `open`, and `onStatusChange('error')` on EventSource `error`.
- [ ] `useRemoteCommandStream` sets the store to `'connecting'` on connect, `'connected'`/`'error'` via SSE events, and `'idle'` on disconnect.
- [ ] The port interface remains transport-agnostic (no SSE-specific types leak).
- [ ] `npm run build` passes.

## Verification

```bash
cd /home/adr/front-portfolio-interactive/solar-system-constructor
npm run build:domain && npm run build:web
```

## Notes

- **Why a separate store**: The `realtimeStore` is intentionally separate from `systemStore` (universe domain data) and `uiStore` (selection/camera). Connection status is infrastructure-level state. Keeping it separate prevents 3D scene re-renders when the connection status changes.
- **Backwards compatibility**: The `options` parameter is optional, so existing code that calls `connect(id, callback)` without options will continue to work unchanged.
- **EventSource reconnection**: When EventSource auto-reconnects (after an error), it fires `open` again. The adapter's `onStatusChange('connected')` will fire again, correctly updating the status from `'error'` back to `'connected'`.
