# PLAN: Real-Time Command Stream (Backend → Frontend)

**Change Request**: `docs/requests/CR_realtime_command_stream.md`

## Summary

Implement the real-time command streaming pipeline: an external source POSTs a `UniverseCommand` to the backend → the backend broadcasts it via SSE to connected clients → the frontend applies it to the local universe state using the existing pure reducer.

## Assumptions

- The shared `@solar/domain` package already exports all needed types (`UniverseCommand`, `UniverseState`, `applyUniverseCommand`). **No domain package changes.**
- The backend runs as a single process (no Redis/multi-instance scaling needed yet).
- No authentication or authorization is required.
- The frontend web app already has a Zustand `systemStore` that dispatches commands via `applyUniverseCommand`. The store has an internal `dispatchDomainCommand` helper.
- SSE is the transport (zero new deps on both sides).

## Risks / Unknowns

| Risk | Mitigation |
|------|------------|
| SSE connection limits in HTTP/1.1 | Acceptable for single-user dev tool; HTTP/2 removes the limit |
| Large `replaceSnapshot` commands | SSE handles arbitrary-length `data:` lines; chunk if needed later |
| Command validation on ingestion | Task 2 will validate that the command has a known `type` field; full schema validation can be added incrementally |

## Out of Scope

- MCP server.
- Command persistence in the database.
- Client-to-server command sending via WebSocket (REST POST is sufficient).
- Authentication / authorization.
- Horizontal scaling (Redis pub/sub adapter).
- Frontend UI for "watching mode" or connection status indicator.

## Task List (ordered)

---

### Task 1 — Backend CommandGateway Port + In-Memory Adapter

**Goal**: Create the source-agnostic abstraction layer for broadcasting commands.

**Scope**: Pure backend, no routes, no wiring.

**Files**:
- Create `apps/api/src/app/ports/commandGateway.ts` (port interface)
- Create `apps/api/src/infra/realtime/inMemoryCommandGateway.ts` (EventEmitter adapter)

**Dependencies**: None.

**Acceptance criteria**:
- `CommandGateway` interface defines `broadcast(universeId, command)` and `subscribe(universeId, listener) → unsubscribe`.
- In-memory adapter uses Node.js `EventEmitter` for pub/sub.
- `npm run build` passes (both `packages/domain` and `apps/api`).

**Verification**: `npm run build`

---

### Task 2 — Backend SSE + Command Ingestion Routes + Wiring

**Goal**: Expose HTTP endpoints for (a) posting commands and (b) streaming commands via SSE, wired through the CommandGateway.

**Scope**: Backend routes + app/server wiring.

**Files**:
- Create `apps/api/src/routes/commands.ts` (POST `/universes/:id/commands` + GET `/universes/:id/events` SSE)
- Update `apps/api/src/app.ts` (accept + inject `CommandGateway`, mount new route)
- Update `apps/api/src/server.ts` (instantiate `InMemoryCommandGateway`, pass to `createApp`)

**Dependencies**: Task 1.

**Acceptance criteria**:
- `POST /universes/:id/commands` with a JSON body containing a `UniverseCommand` returns 202 Accepted and broadcasts via the gateway.
- `GET /universes/:id/events` returns `Content-Type: text/event-stream` and streams commands as `event: command\ndata: <json>\n\n`.
- CORS allows SSE connections from `http://localhost:5173`.
- `npm run build` passes.

**Verification**: `npm run build`, manual curl test:
```bash
# Terminal 1: listen
curl -N http://localhost:3001/universes/test-123/events

# Terminal 2: send command
curl -X POST http://localhost:3001/universes/test-123/commands \
  -H 'Content-Type: application/json' \
  -d '{"type":"addStar","id":"star-1","payload":{"name":"Sol","mass":1,"radius":1,"color":"#FFD700","parentId":null,"orbitalDistance":0,"orbitalSpeed":0,"orbitalPhase":0}}'
```

---

### Task 3 — Frontend CommandStream Port + SSE Adapter

**Goal**: Create the frontend abstraction for receiving remote commands, and an SSE adapter implementation.

**Scope**: Frontend ports + infra, no store integration yet.

**Files**:
- Create `apps/web/src/app/ports/commandStream.ts` (port interface)
- Create `apps/web/src/infra/realtime/sseCommandStream.ts` (native EventSource adapter)

**Dependencies**: Task 2 (needs the backend SSE endpoint to exist, but this task is purely type-level and can be built in parallel).

**Acceptance criteria**:
- `CommandStream` port defines `connect(universeId, onCommand) → disconnect` function.
- SSE adapter uses native `EventSource` API, reads base URL from `VITE_API_BASE_URL`.
- Handles `event: command` messages, parses JSON data as `UniverseCommand`.
- `npm run build` passes (web app).

**Verification**: `npm run build`

---

### Task 4 — Frontend Real-Time Store Integration

**Goal**: Wire the SSE command stream into the Zustand store so remote commands are applied to the local universe state in real-time.

**Scope**: Frontend hook/state + minor wiring.

**Files**:
- Create `apps/web/src/hooks/useRemoteCommandStream.ts` (React hook that manages the SSE connection lifecycle)
- Update `apps/web/src/state/systemStore.ts` (expose a `dispatchRemoteCommand` or make `dispatchDomainCommand` accessible for external callers)

**Dependencies**: Tasks 1–3.

**Acceptance criteria**:
- A React hook `useRemoteCommandStream(universeId)` connects to the SSE endpoint when called with a universe ID, and disconnects on cleanup.
- Each received `UniverseCommand` is applied to the Zustand `systemStore` via `applyUniverseCommand`, updating the 3D scene in real-time.
- The hook correctly handles connect/disconnect lifecycle (no leaked connections on unmount).
- `npm run build` passes.

**Verification**: `npm run build`, end-to-end manual test:
1. Start backend (`npm run dev:api`).
2. Start frontend (`npm run dev:web`).
3. Open the web app in online mode, load/create a universe.
4. POST a command to the backend via curl.
5. Observe the universe state update in the 3D viewport in real-time.
