# Exploration: mcp-endpoints

## Current State

### Affected Areas

| Area | Files | Role |
|---|---|---|
| Route layer | `apps/api/src/routes/commands.ts`, `universes.ts`, `health.ts` | Express routers, one per concern |
| App wiring | `apps/api/src/app.ts` | Assembles Express app, injects ports into routers |
| Server bootstrap | `apps/api/src/server.ts` | Builds infrastructure adapters, passes them to `createApp` |
| Port interfaces | `apps/api/src/app/ports/commandGateway.ts`, `universeRepository.ts` | Hexagonal ports for realtime broadcast & persistence |
| Domain reducer | `packages/domain/src/universe/applyCommand.ts` | Pure `(state, command) → { nextState, events }` reducer |
| Domain types | `packages/domain/src/universe/commands.ts`, `state.ts` | `UniverseCommand` union (25 types), `UniverseState` |
| MCP content | `apps/api/src/content/mcp-tools.ts`, `types.ts`, `index.ts` | Static tool definitions (3 tools) — pure data, no I/O |
| Infra adapters | `apps/api/src/infra/persistence/inMemoryUniverseRepository.ts`, `postgresUniverseRepository.ts`, `apps/api/src/infra/realtime/inMemoryCommandGateway.ts` | Adapter implementations |

### Existing Patterns and Conventions

1. **Factory-function routers**: Each route file exports a `create*Router(deps): Router` function. Dependencies (ports) are injected at construction, not imported globally.

2. **No service layer**: Routes call ports directly. `commands.ts` calls `gateway.broadcast()`; `universes.ts` calls `repo.create/getById/list/update/delete`. There is no intermediate service or use-case layer.

3. **Command flow gap**: The current `POST /universes/:id/commands` endpoint only validates that the body has a `type` string, then calls `gateway.broadcast()`. It does **not**:
   - Look up the universe from the repository
   - Apply the command via `applyUniverseCommand(state, command)`
   - Persist the resulting state via `repo.update()`
   - This means commands are fire-and-forget broadcast-only — they mutate the frontend's in-memory state (via SSE), but the server has no authoritative state.

4. **Domain reducer is pure and ready**: `applyUniverseCommand(state, command)` returns `{ nextState, events }` with full exhaustiveness checking across all 25 command types. It's importable from `@solar/domain`.

5. **Repository has `update` method**: Both in-memory and Postgres implementations support `repo.update(id, { state })` to persist new state — this is the write path needed for command application.

6. **MCP tools are static content**: The 3 tool definitions in `apps/api/src/content/mcp-tools.ts` are JSON Schema objects describing what tools are available. They need to be served via endpoints, and their `send_universe_command` tool needs a handler that actually executes the logic.

7. **`createApp` signature**: Currently `createApp(universeRepo, commandGateway)` — any new route that needs both ports (plus the domain reducer) must receive them here.

### Dependencies and Constraints

- `@solar/domain` exports `applyUniverseCommand`, `UniverseCommand`, `UniverseState`, and all command types.
- Express JSON body parsing is configured with a 10 MB limit (sufficient for large universe snapshots).
- CORS allows only `http://localhost:5173` — MCP clients (typically LLM tool-calling agents) may need broader or configurable CORS.
- No authentication or rate limiting exists on any endpoint.

---

## Approach Comparison

### Approach A — New Route File + Inline Logic

Add `apps/api/src/routes/mcp.ts` with 3 endpoints that inline the fetch/apply/persist logic directly in handlers.

| Dimension | Assessment |
|---|---|
| **Pros** | Simple, self-contained, minimal file changes (1 new file + wire in `app.ts`) |
| **Cons** | Duplicates command-processing logic between `commands.ts` POST handler and MCP `send_universe_command`; existing command route remains broadcast-only (no persistence) |
| **Complexity** | Low |
| **Conflict risk** | Low (additive) but creates divergent code paths for the same operation |

### Approach B — Shared CommandService + New Route File

1. Introduce `apps/api/src/app/services/commandService.ts` with a `processCommand(universeId, command)` function that: fetches state → applies via reducer → persists → broadcasts → returns result.
2. Refactor existing `POST /universes/:id/commands` to use this service instead of raw `gateway.broadcast()`.
3. Add `apps/api/src/routes/mcp.ts` with 3 endpoints that also use the shared service.

| Dimension | Assessment |
|---|---|
| **Pros** | Single source of truth for command processing; both REST and MCP share identical logic; existing endpoint gains apply+persist behavior; aligns with config.yaml's "routes → controllers → services → repositories" convention |
| **Cons** | Requires refactoring the existing command route (minor breaking change if clients depend on 202 fire-and-forget semantics); more files touched |
| **Complexity** | Medium |
| **Conflict risk** | Medium (modifies `commands.ts`, `app.ts`, `server.ts`) |

### Approach C — Middleware/Handler Composition (no service file)

Extract the apply/persist logic as a shared higher-order function or middleware that wraps the command processing. Routes compose it inline.

| Dimension | Assessment |
|---|---|
| **Pros** | Avoids a formal service layer; stays closer to current "routes call ports" pattern |
| **Cons** | Higher-order functions for this purpose are less readable than a plain service function; harder to test in isolation; doesn't clearly match the layered architecture convention |
| **Complexity** | Medium |
| **Conflict risk** | Medium |

### Approach D — Full MCP SDK Integration (SSE/Streamable transport)

Instead of REST endpoints, integrate the official `@modelcontextprotocol/sdk` and expose a proper MCP server via SSE or Streamable HTTP transport alongside the existing Express app.

| Dimension | Assessment |
|---|---|
| **Pros** | Native MCP protocol compliance; automatic tool discovery; supports all MCP features (resources, prompts, sampling) |
| **Cons** | Adds a new dependency; significantly more complex; requires understanding MCP transport layer; may conflict with existing SSE endpoint; overkill if only 3 tools are needed initially |
| **Complexity** | High |
| **Conflict risk** | High (new transport, new dependency, new server lifecycle) |

---

## Recommended Approach

**Approach B — Shared CommandService + New Route File** is the strongest option.

**Rationale**: The current architecture has a clear gap — commands are broadcast but never applied or persisted server-side. Introducing a `CommandService` fills this gap for *all* command producers (REST, MCP, future WebSocket) while aligning with the project's stated `routes → services → repositories` convention. The refactoring of the existing command route is a net positive, not just a cost.

Approach D (full MCP SDK) could be pursued later as an enhancement once the REST-based MCP endpoints prove out the tool definitions and command flow.

---

## MCP Endpoint Design

Three REST endpoints mapping 1:1 to the MCP tool definitions:

| Tool | Method | Path | Notes |
|---|---|---|---|
| `get_universe_state` | `POST` | `/mcp/tools/call` | MCP protocol uses POST with `{ name, arguments }` body |
| `list_universe_commands` | `POST` | `/mcp/tools/call` | Same endpoint, dispatched by `name` field |
| `send_universe_command` | `POST` | `/mcp/tools/call` | Same endpoint, dispatched by `name` field |
| Tool discovery | `GET` | `/mcp/tools/list` | Returns the static tool definitions array |

Alternatively, individual REST-style endpoints:

| Tool | Method | Path |
|---|---|---|
| Tool listing | `GET` | `/mcp/tools` |
| `get_universe_state` | `GET` | `/mcp/universes/:id/state` |
| `list_universe_commands` | `GET` | `/mcp/universes/:id/commands` |
| `send_universe_command` | `POST` | `/mcp/universes/:id/commands` |

The MCP-protocol-style single `POST /mcp/tools/call` endpoint is recommended because it matches MCP client expectations and simplifies integration. The `GET /mcp/tools/list` (or `GET /mcp/tools`) endpoint serves tool discovery.

---

## Impact on Existing Code

### Files to Create

| File | Purpose |
|---|---|
| `apps/api/src/app/services/commandService.ts` | Shared command processing: validate → fetch → apply → persist → broadcast |
| `apps/api/src/routes/mcp.ts` | MCP tool endpoints: `tools/list` and `tools/call` |

### Files to Modify

| File | Change |
|---|---|
| `apps/api/src/routes/commands.ts` | Refactor POST handler to use `CommandService` instead of raw `gateway.broadcast()` |
| `apps/api/src/app.ts` | Wire new MCP router; pass both ports to `CommandService`; inject service into both command router and MCP router |
| `apps/api/src/server.ts` | No changes expected (ports are already built here and passed to `createApp`) |

### Signature Change

`createApp` currently takes `(universeRepo, commandGateway)`. Two options:
- **Option 1**: Build the `CommandService` inside `createApp` from the two ports. No signature change.
- **Option 2**: Build the `CommandService` in `server.ts` and pass it. Signature becomes `(universeRepo, commandGateway, commandService)` or just `(commandService, universeRepo)`.

Option 1 is simpler and keeps infrastructure wiring contained.

---

## Risks

1. **Semantic change to POST /commands**: Currently returns `202 Accepted` (fire-and-forget). With apply+persist, it becomes synchronous — potential latency increase and different error modes (universe not found, reducer errors). Clients may need to handle new error responses.

2. **No command validation beyond `type` field**: The current POST handler only checks for a non-empty `type` string. The domain reducer handles unknown shapes via exhaustiveness, but malformed payloads could cause runtime errors before reaching the reducer. Schema validation (using the JSON Schema from MCP tool defs or Zod) would be valuable but is additional scope.

3. **Concurrency**: Two simultaneous commands for the same universe could cause a lost-update race condition (both read state, both apply, last write wins). Not a concern for single-user development but relevant at scale. Mitigation would require optimistic locking or serialized command processing per universe.

4. **MCP CORS**: MCP clients may not be browser-based, but if they are (e.g., a web-based AI agent UI), the current CORS whitelist (`localhost:5173` only) would block them.

---

## Open Questions

1. Should the existing `POST /universes/:id/commands` endpoint's semantics change from fire-and-forget (202) to apply-and-persist (200 with result), or should both behaviors coexist (e.g., via a query parameter or separate endpoints)?

2. Should the MCP endpoints require any authentication or API key, even a simple bearer token, to prevent unauthorized universe mutations?

3. Should the `list_universe_commands` tool response be dynamically generated from domain type metadata, or is a static/hardcoded category listing sufficient?

4. What response format should MCP tool call results use — plain JSON objects, or MCP-protocol-compliant `content` arrays with `type: "text"` entries?
