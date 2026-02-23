# Task 3 — Frontend CommandStream Port + SSE Adapter

## Objective

Create the frontend abstraction for receiving real-time commands from the backend, and implement an SSE (Server-Sent Events) adapter using the native `EventSource` API. This follows the same hexagonal port/adapter pattern used by the existing `UniverseApiClient`.

## Context to Read First

- `apps/web/src/app/ports/universeApiClient.ts` — existing frontend port pattern to follow.
- `apps/web/src/infra/api/httpUniverseApiClient.ts` — existing adapter pattern (how it reads `VITE_API_BASE_URL`, factory + singleton).
- `packages/domain/src/universe/commands.ts` — the `UniverseCommand` type that will be received via SSE.
- `apps/web/src/domain/index.ts` — barrel re-exports from `@solar/domain` (import types from here or directly from `@solar/domain`).
- `apps/api/src/routes/commands.ts` (from Task 2) — the SSE endpoint format: `event: command\ndata: <json>\n\n`.

## Constraints

- **Do not** add new npm dependencies — use the native browser `EventSource` API.
- **Do not** modify any existing files — this task only creates new files.
- **Do not** integrate with the Zustand store yet — that is Task 4.
- Follow existing naming conventions: port in `src/app/ports/`, adapter in `src/infra/realtime/`.
- Import `UniverseCommand` type from `@solar/domain` (or from the domain barrel `../../domain`).

## Steps

1. **Create the port interface** at `apps/web/src/app/ports/commandStream.ts`:

   - Define a `CommandStreamListener` type: `(command: UniverseCommand) => void`.
   - Define a `DisconnectFn` type: `() => void`.
   - Define the `CommandStream` interface with a single method:
     - `connect(universeId: string, onCommand: CommandStreamListener): DisconnectFn`
     - Connects to the backend's SSE endpoint for the given universe. Calls `onCommand` for each command received. Returns a function to cleanly disconnect.

2. **Create the SSE adapter** at `apps/web/src/infra/realtime/sseCommandStream.ts`:

   - Import the `CommandStream` and `CommandStreamListener` types from the port.
   - Import `UniverseCommand` from `@solar/domain`.
   - Read `VITE_API_BASE_URL` from `import.meta.env` (same approach as `httpUniverseApiClient.ts`).
   - Implement a factory function `createSseCommandStream(): CommandStream`:
     - `connect(universeId, onCommand)`:
       - Build the SSE URL: `${baseUrl}/universes/${universeId}/events`.
       - Create a new `EventSource(url)`.
       - Add an event listener for `"command"` events (not the default `"message"` event):
         ```ts
         source.addEventListener('command', (e) => {
           const command = JSON.parse(e.data) as UniverseCommand;
           onCommand(command);
         });
         ```
       - Optionally log connection open/error for debugging.
       - Return a disconnect function that calls `source.close()`.
   - Export a singleton instance: `export const sseCommandStream = createSseCommandStream()`.

## Files to Create/Update

| Action | Path |
|--------|------|
| Create | `apps/web/src/app/ports/commandStream.ts` |
| Create | `apps/web/src/infra/realtime/sseCommandStream.ts` |

## Acceptance Criteria

- [ ] `CommandStream` interface is exported from `apps/web/src/app/ports/commandStream.ts`.
- [ ] `CommandStreamListener` and `DisconnectFn` types are exported from the same file.
- [ ] `createSseCommandStream()` factory and `sseCommandStream` singleton are exported from `apps/web/src/infra/realtime/sseCommandStream.ts`.
- [ ] The adapter uses `addEventListener('command', ...)` (not `onmessage`) to match the backend's `event: command` format.
- [ ] The disconnect function calls `EventSource.close()`.
- [ ] No new npm dependencies are added.
- [ ] `npm run build` passes (web app).

## Verification

```bash
cd /home/adr/front-portfolio-interactive/solar-system-constructor
npm run build:domain && npm run build:web
```

## Notes

- The native `EventSource` API automatically reconnects on connection drop with exponential backoff — no manual reconnection logic is needed.
- The port is intentionally minimal (one method). This makes it trivial to swap SSE for WebSocket later by creating an alternative adapter (e.g., `wsCommandStream.ts`) that implements the same `CommandStream` interface.
- The adapter does not need to track connection state (connecting/connected/disconnected). If needed for UI indicators later, that can be added as an enhancement to the port.
- Be mindful that `EventSource` only supports GET requests and does not support custom headers. This is fine since there is no authentication.
