# Task 2 — Backend SSE + Command Ingestion Routes + Wiring

## Objective

Expose two HTTP endpoints on the backend and wire the `CommandGateway` into the application lifecycle:

1. **`POST /universes/:id/commands`** — accepts a `UniverseCommand` JSON body, validates it minimally, and broadcasts it through the `CommandGateway`.
2. **`GET /universes/:id/events`** — an SSE (Server-Sent Events) endpoint that streams `UniverseCommand`s in real-time to connected clients.

Also update `app.ts` and `server.ts` to instantiate and inject the `CommandGateway`.

## Context to Read First

- `apps/api/src/app/ports/commandGateway.ts` — the port created in Task 1.
- `apps/api/src/infra/realtime/inMemoryCommandGateway.ts` — the adapter created in Task 1.
- `apps/api/src/app.ts` — current Express app factory; you will modify its signature.
- `apps/api/src/server.ts` — current server entry point; you will instantiate the gateway here.
- `apps/api/src/routes/universes.ts` — existing route pattern to follow (factory function receiving dependencies).
- `packages/domain/src/universe/commands.ts` — the `UniverseCommand` type union (for understanding valid `type` values).

## Constraints

- **Do not** modify `packages/domain/` — no domain changes.
- **Do not** add new npm dependencies.
- Follow the existing route-factory pattern: export a `createCommandsRouter(gateway)` function.
- SSE responses must set appropriate headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`.
- CORS must allow SSE from `http://localhost:5173` (already configured in `app.ts`).
- Command validation: check that the request body has a `type` property that is a non-empty string. Do not perform full schema validation of each command variant (that would couple this route to every command type).
- The POST endpoint should return **202 Accepted** (the command is broadcast, not necessarily persisted or applied yet — fire-and-forget semantics).

## Steps

1. **Create the commands route** at `apps/api/src/routes/commands.ts`:

   a. Export a factory: `createCommandsRouter(gateway: CommandGateway): Router`.

   b. **`POST /universes/:id/commands`**:
      - Parse the JSON body as a `UniverseCommand`.
      - Validate: body must be an object with a `type` string property.
      - Call `gateway.broadcast(req.params.id, command)`.
      - Respond with `202 Accepted` and `{ ok: true }`.

   c. **`GET /universes/:id/events`**:
      - Set SSE headers (`Content-Type: text/event-stream`, `Cache-Control: no-cache`, `Connection: keep-alive`).
      - Optionally send an initial comment line (`:connected\n\n`) as a heartbeat / connection confirmation.
      - Subscribe to the gateway for `req.params.id`.
      - On each command, write: `event: command\ndata: ${JSON.stringify(command)}\n\n`.
      - On client disconnect (`req.on('close', ...)`), unsubscribe and end the response.

2. **Update `apps/api/src/app.ts`**:
   - Import `CommandGateway` type from the port.
   - Change `createApp` signature to `createApp(universeRepo, commandGateway)`.
   - Import and mount `createCommandsRouter(commandGateway)`.

3. **Update `apps/api/src/server.ts`**:
   - Import `createInMemoryCommandGateway` from the adapter.
   - Instantiate: `const commandGateway = createInMemoryCommandGateway()`.
   - Pass it to `createApp(universeRepo, commandGateway)`.
   - Log: `[api] command gateway: in-memory`.

## Files to Create/Update

| Action | Path |
|--------|------|
| Create | `apps/api/src/routes/commands.ts` |
| Update | `apps/api/src/app.ts` |
| Update | `apps/api/src/server.ts` |

## Acceptance Criteria

- [ ] `POST /universes/:id/commands` with a valid `UniverseCommand` body returns `202 Accepted`.
- [ ] `POST /universes/:id/commands` with an invalid body (missing `type`) returns `400 Bad Request`.
- [ ] `GET /universes/:id/events` returns `Content-Type: text/event-stream` and keeps the connection open.
- [ ] A command POSTed to universe `"X"` is received as an SSE `event: command` by a client connected to `GET /universes/X/events`.
- [ ] A command POSTed to universe `"X"` is **not** received by a client connected to universe `"Y"`.
- [ ] When the SSE client disconnects, the gateway subscription is cleaned up (no memory leak).
- [ ] Existing routes (`/health`, `/universes` CRUD) continue to work unchanged.
- [ ] `npm run build` passes.

## Verification

```bash
cd /home/adr/front-portfolio-interactive/solar-system-constructor
npm run build:domain && npm run build:api
```

Manual smoke test (after starting the API with `npm run dev:api`):

```bash
# Terminal 1: listen for SSE events
curl -N http://localhost:3001/universes/test-123/events

# Terminal 2: send a command
curl -X POST http://localhost:3001/universes/test-123/commands \
  -H 'Content-Type: application/json' \
  -d '{"type":"addStar","id":"star-1","payload":{"name":"Sol","mass":1,"radius":1,"color":"#FFD700","parentId":null,"orbitalDistance":0,"orbitalSpeed":0,"orbitalPhase":0}}'

# Expected: Terminal 1 shows:
# event: command
# data: {"type":"addStar","id":"star-1","payload":{...}}
```

## Notes

- The SSE endpoint does **not** require the universe to exist in the repository. It is a pure pub/sub channel scoped by ID string. This decouples real-time streaming from CRUD persistence.
- The `:connected\n\n` comment at the start of the SSE stream is optional but helpful for debugging and for clients to confirm the connection is established.
- Express's `res.flush()` may be needed if compression middleware is active. Currently no compression is configured, so `res.write()` should work directly.
