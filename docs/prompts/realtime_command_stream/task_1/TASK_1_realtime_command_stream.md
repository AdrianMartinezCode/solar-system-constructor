# Task 1 — Backend CommandGateway Port + In-Memory Adapter

## Objective

Create the source-agnostic **CommandGateway** abstraction layer on the backend. This is the central hub through which any command producer (REST endpoint, MCP server, script, etc.) can broadcast `UniverseCommand`s to all interested consumers (SSE connections, future persistence layer, etc.).

## Context to Read First

- `packages/domain/src/universe/commands.ts` — the `UniverseCommand` union type that the gateway will broadcast.
- `packages/domain/src/index.ts` — barrel exports confirming `UniverseCommand` is available from `@solar/domain`.
- `apps/api/src/app/ports/universeRepository.ts` — example of the existing port pattern in the backend.
- `apps/api/src/infra/persistence/inMemoryUniverseRepository.ts` — example of an in-memory adapter in the backend.

## Constraints

- **Do not** create any routes or modify `app.ts` / `server.ts` — that is Task 2.
- **Do not** add new dependencies to `apps/api/package.json` — use Node.js built-in `events` module.
- Follow the existing hexagonal architecture: port in `src/app/ports/`, adapter in `src/infra/`.
- All types must be imported from `@solar/domain`.
- The gateway must be universe-scoped (different universe IDs have independent channels).

## Steps

1. **Create the port interface** at `apps/api/src/app/ports/commandGateway.ts`:
   - Define a `CommandListener` callback type: `(command: UniverseCommand) => void`.
   - Define an `UnsubscribeFn` type: `() => void`.
   - Define the `CommandGateway` interface with:
     - `broadcast(universeId: string, command: UniverseCommand): void` — push a command to all subscribers of that universe.
     - `subscribe(universeId: string, listener: CommandListener): UnsubscribeFn` — register a listener for a universe channel; returns an unsubscribe function.

2. **Create the in-memory adapter** at `apps/api/src/infra/realtime/inMemoryCommandGateway.ts`:
   - Import `EventEmitter` from `node:events`.
   - Import `CommandGateway`, `CommandListener` from the port.
   - Import `UniverseCommand` from `@solar/domain`.
   - Implement a factory function `createInMemoryCommandGateway(): CommandGateway`:
     - Internally, use a single `EventEmitter` instance.
     - Use the `universeId` as the event name for scoping.
     - `broadcast` emits on the `universeId` channel with the command as payload.
     - `subscribe` adds a listener on the `universeId` channel and returns a function that removes it.
     - Set `emitter.setMaxListeners(0)` to avoid warnings with many concurrent SSE connections.

## Files to Create/Update

| Action | Path |
|--------|------|
| Create | `apps/api/src/app/ports/commandGateway.ts` |
| Create | `apps/api/src/infra/realtime/inMemoryCommandGateway.ts` |

## Acceptance Criteria

- [ ] `CommandGateway` interface is exported from `apps/api/src/app/ports/commandGateway.ts`.
- [ ] `CommandListener` and `UnsubscribeFn` types are exported from the same file.
- [ ] `createInMemoryCommandGateway()` factory is exported from `apps/api/src/infra/realtime/inMemoryCommandGateway.ts`.
- [ ] The adapter correctly fans out: broadcasting to universe `"A"` does not notify subscribers of universe `"B"`.
- [ ] Calling the unsubscribe function prevents future notifications.
- [ ] No new npm dependencies are added.
- [ ] `npm run build` passes (`packages/domain` + `apps/api`).

## Verification

```bash
cd /home/adr/front-portfolio-interactive/solar-system-constructor
npm run build:domain && npm run build:api
```

## Notes

- The `EventEmitter` approach is intentionally simple — it works for a single-process backend. A future adapter (e.g., `redisCommandGateway.ts`) could implement the same `CommandGateway` interface using Redis pub/sub for horizontal scaling.
- Keep the port minimal. Avoid adding methods for listing subscribers, getting connection counts, etc. Those can be added when needed.
