# CR: Real-Time Command Stream (Backend → Frontend)

## Summary

Introduce real-time, server-push communication so the backend can stream `UniverseCommand`s to connected frontend clients. The frontend applies each command to its local universe state via the existing pure reducer, enabling live visualization of changes made by external sources.

## Motivation

The project already has a rich, JSON-serializable command model (`UniverseCommand` union in `@solar/domain`) and a pure reducer (`applyUniverseCommand`). Currently, commands only originate from the user's browser. The next step is to allow **external producers** (a future MCP server, scripts, other services) to send commands through the backend, which then pushes them in real-time to every connected client.

This CR covers only the **communication plumbing** — not the MCP server, not command persistence in the database, and not the frontend rendering pipeline. The scope is:

1. A backend **abstraction layer** (CommandGateway) that decouples command sources from consumers.
2. A backend **REST endpoint** for ingesting commands (any external source can POST).
3. A backend **SSE endpoint** that streams commands to clients in real-time.
4. A frontend **port + adapter** for receiving the command stream.
5. Frontend **store integration** that applies remote commands to the Zustand universe state.

## Requirements

### Functional

| # | Requirement |
|---|-------------|
| F1 | An external HTTP client can POST a `UniverseCommand` to the backend, scoped to a universe ID. |
| F2 | All frontend clients connected to the same universe receive the command in real-time (< 1 s latency). |
| F3 | The frontend applies the received command to the local `UniverseState` using the existing `applyUniverseCommand` reducer. |
| F4 | Multiple clients can connect simultaneously (fan-out). |
| F5 | The client automatically reconnects on connection drop (leveraging native EventSource behavior). |
| F6 | No authentication is required for this iteration. |

### Non-Functional

| # | Requirement |
|---|-------------|
| NF1 | **Zero new runtime dependencies** — use native SSE (EventSource API in the browser, plain HTTP streaming in Express). |
| NF2 | The command gateway abstraction must be source-agnostic: a future MCP server, REST POST, or any other adapter can push commands through the same interface. |
| NF3 | The SSE transport must be replaceable (WebSocket or other) without changing the domain or application layers. |
| NF4 | All new code follows the existing hexagonal architecture (ports in `app/ports/`, adapters in `infra/`). |

### Out of Scope

- MCP server implementation.
- Persisting commands in the database.
- Client → server command sending via WebSocket (the existing REST endpoint suffices).
- Authentication / authorization.
- Horizontal scaling (Redis pub/sub for multi-instance).
- Frontend UI changes for "watching mode".

## Technical Design Notes

### Why SSE over WebSocket

Server-Sent Events (SSE) are chosen because:

- **Unidirectional** — the current need is strictly server → client push. Commands enter via REST POST.
- **Zero dependencies** — native `EventSource` in the browser, plain `res.write()` in Express.
- **Auto-reconnect** — the EventSource spec includes automatic reconnection with `Last-Event-ID`.
- **HTTP/2 compatible** — multiplexes cleanly.
- When bidirectional communication is needed later, a WebSocket transport can be introduced as an alternative adapter behind the same port interface.

### CommandGateway abstraction

A `CommandGateway` port defines two capabilities:

1. **`broadcast(universeId, command)`** — push a command to all subscribers of that universe.
2. **`subscribe(universeId, listener) → unsubscribe`** — listen for commands on a universe channel.

The initial adapter is an in-memory `EventEmitter`-based implementation (sufficient for single-process). A future Redis-backed adapter would enable horizontal scaling.

### Wire format (SSE)

Each SSE message:

```
event: command
data: {"type":"addStar","id":"...","payload":{...}}

```

The `data` field is a JSON-serialized `UniverseCommand`. The client parses it and feeds it to `applyUniverseCommand`.

## Affected Areas

| Area | Impact |
|------|--------|
| `apps/api/src/app/ports/` | New `commandGateway.ts` port |
| `apps/api/src/infra/realtime/` | New in-memory adapter |
| `apps/api/src/routes/` | New `commands.ts` route (POST + SSE) |
| `apps/api/src/app.ts` | Inject CommandGateway |
| `apps/api/src/server.ts` | Instantiate CommandGateway |
| `apps/web/src/app/ports/` | New `commandStream.ts` port |
| `apps/web/src/infra/realtime/` | New SSE adapter |
| `apps/web/src/hooks/` or `src/state/` | New hook or store wiring for remote commands |
| `packages/domain/` | **No changes** — existing `UniverseCommand` is reused as-is |

## Risks / Open Questions

1. **SSE connection limits**: HTTP/1.1 limits ~6 connections per domain. For a single-user dev tool this is fine. In production with HTTP/2 this is not a concern.
2. **Command ordering**: In-memory EventEmitter preserves insertion order. This is sufficient for single-process. Multi-instance ordering would need a sequenced log (out of scope).
3. **Large snapshots via SSE**: A `replaceSnapshot` command could be large. SSE handles this fine (it's just a large `data:` line). If needed, chunking can be added later.
