# CR: Real-Time Frontend Interactions (SSE Command Stream)

## Summary

Wire the existing SSE command stream plumbing into the live frontend application so that commands received from the backend are visibly applied in real-time. This includes activating the `useRemoteCommandStream` hook in the online-mode editor, tracking the SSE connection lifecycle, showing connection status to the user, providing activity feedback when remote commands arrive, and handling edge cases such as remotely-deleted selected entities.

## Context

The **realtime_command_stream** initiative (Tasks 1–4) delivered the complete infrastructure:

| Layer | Artifact | Status |
|-------|----------|--------|
| Backend port | `apps/api/src/app/ports/commandGateway.ts` | Done |
| Backend adapter | `apps/api/src/infra/realtime/inMemoryCommandGateway.ts` | Done |
| Backend routes | `apps/api/src/routes/commands.ts` (POST + SSE) | Done |
| Frontend port | `apps/web/src/app/ports/commandStream.ts` | Done |
| Frontend adapter | `apps/web/src/infra/realtime/sseCommandStream.ts` | Done |
| Frontend hook | `apps/web/src/hooks/useRemoteCommandStream.ts` | Done |
| Store action | `systemStore.applyRemoteCommand()` | Done |

However, the hook is **never called** from any component — Task 4's prompt explicitly deferred wiring: _"No wiring into components yet."_ The 3D scene therefore never receives remote commands.

This CR covers the **remaining work** to make the SSE stream operational end-to-end with proper UX:

1. **Activate** the SSE connection in the online-mode editor.
2. **Track** the SSE connection lifecycle (connected / reconnecting / disconnected).
3. **Show** connection status visually in the UI.
4. **Notify** the user when remote commands are applied (toast/activity feed).
5. **Handle** edge cases (e.g., remotely-deleted selected entity, full snapshot replacement).

## Requirements

### Functional

| # | Requirement |
|---|-------------|
| F1 | When the user is in online mode and editing a universe, the SSE connection is active and remote commands are applied to the 3D scene in real-time. |
| F2 | The SSE connection is closed when leaving the editor (back to browser) or switching to offline mode. |
| F3 | Connection status (idle / connecting / connected / error) is tracked in a Zustand store and exposed to UI components. |
| F4 | A connection status indicator is visible in the AppHeader when in online mode (color-coded: green=connected, yellow=reconnecting, red=disconnected). |
| F5 | A brief toast/notification appears when a remote command is applied, describing the change (e.g., "Star added remotely", "Universe snapshot replaced"). |
| F6 | If a remote command removes the currently-selected entity, the selection is cleared automatically. |
| F7 | If a remote `replaceSnapshot` command arrives, the UI state (selection, camera) is reset. |

### Non-Functional

| # | Requirement |
|---|-------------|
| NF1 | **Zero new runtime dependencies** — use only existing packages (React, Zustand). |
| NF2 | All new code follows the existing hexagonal architecture (ports in `app/ports/`, adapters in `infra/`, state in `state/`). |
| NF3 | Toast/notification component uses only CSS and React — no external toast library. |
| NF4 | Connection status tracking is decoupled from the SSE adapter (works with any future transport). |

### Out of Scope

- Backend changes (the API is already complete).
- Domain package changes (`packages/domain/`).
- Bidirectional command sending (client → server via SSE).
- Authentication / authorization on the SSE connection.
- Persisting remote commands to localStorage.
- Connection retry configuration (native EventSource auto-reconnect suffices).

## Affected Areas

| Area | Impact |
|------|--------|
| `apps/web/src/App.tsx` | Wire `useRemoteCommandStream` in online mode |
| `apps/web/src/hooks/useRemoteCommandStream.ts` | Extend to report connection status and command activity |
| `apps/web/src/app/ports/commandStream.ts` | Add optional lifecycle callbacks |
| `apps/web/src/infra/realtime/sseCommandStream.ts` | Implement lifecycle callbacks |
| `apps/web/src/state/` | New `realtimeStore.ts` for connection status + activity log |
| `apps/web/src/state/systemStore.ts` | Update `applyRemoteCommand` for edge-case handling |
| `apps/web/src/components/AppHeader.tsx` | Render connection status indicator |
| `apps/web/src/components/` | New `ConnectionStatusIndicator` component |
| `apps/web/src/components/` | New `RemoteCommandToast` component |

## Risks / Open Questions

1. **Zustand re-render granularity**: The toast/activity log store must use fine-grained selectors to avoid re-rendering the entire 3D scene on every toast update.
2. **Toast spam**: If many commands arrive in a burst (e.g., during a `replaceSnapshot` preceded by many `addStar`), the toast system should debounce or batch notifications.
3. **Selection edge case timing**: A `removeStar` command might arrive between render frames; the selection-clearing logic must be synchronous within `applyRemoteCommand` to avoid a flash of stale UI.
