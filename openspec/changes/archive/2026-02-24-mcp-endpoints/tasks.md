# Tasks: mcp-endpoints

_Generated from proposal, specs (command-service, mcp-server, command-endpoint), and design._

---

## Phase 1: Foundation (no behavioral change)

- [x] 1.1 **Install dependencies** — Add `@modelcontextprotocol/sdk` (^1.0.0) and `zod` (^3) to `apps/api/package.json` as production dependencies. Run `npm install` from the workspace root. Verify: `npm ls @modelcontextprotocol/sdk zod` resolves without errors.
  - Files: `apps/api/package.json`, `package-lock.json`

- [x] 1.2 **Create `UniverseNotFoundError` custom error class** — Add the error class to `apps/api/src/app/services/commandService.ts` (or a shared errors file). The class extends `Error`, sets `this.name = 'UniverseNotFoundError'`, and stores `universeId` as a public readonly property. Verify: the file compiles (`npx tsc --noEmit`).
  - Files: `apps/api/src/app/services/commandService.ts` (create)
  - Refs: Design § Interfaces/Contracts → Error type

- [x] 1.3 **Create `CommandService` with `processCommand` method** — Implement `createCommandService({ universeRepo, commandGateway }): CommandService` as a factory function returning `{ processCommand }`. The `processCommand(universeId, command)` method follows the pipeline: validate `type` field → fetch via `repo.getById()` → throw `UniverseNotFoundError` if null → apply via `applyUniverseCommand(state, command)` → persist via `repo.update()` → broadcast via `gateway.broadcast()` → return `{ nextState, events }`. Export the `CommandService` interface, `CommandServiceDeps` interface, and `createCommandService` factory.
  - Files: `apps/api/src/app/services/commandService.ts` (continue from 1.2)
  - Refs: REQ-CS-1 through REQ-CS-13; Design § CommandService interface
  - Verify: `npx tsc --noEmit` passes; the module imports only domain types, the reducer, and port interfaces (REQ-CS-3)

---

## Phase 2: MCP Server (additive — no existing behavior changed)

- [x] 2.1 **Create command listing data structure** — Define a `COMMAND_CATEGORIES` constant (or `getCommandListing(category?)` helper) inside `apps/api/src/mcp/server.ts` (or a small helper alongside it) that returns the 10 command categories and their associated command types. This is a static listing used by the `list_universe_commands` tool. Optionally accepts a `category` filter parameter.
  - Files: `apps/api/src/mcp/server.ts` (create — partial, continued in 2.2)
  - Refs: REQ-MCP-7, REQ-MCP-13; Design § `list_universe_commands` tool; Scenario MCP-13
  - Verify: data structure covers all 10 categories (Simulation, Star CRUD, Star hierarchy, Group CRUD, Group hierarchy, Small body fields, Protoplanetary disks, Nebulae, Rings, Snapshot)

- [x] 2.2 **Create MCP server module with 3 tool registrations** — Implement `createMcpServer({ universeRepo, commandService }): McpServer` in `apps/api/src/mcp/server.ts`. Instantiate `McpServer` from `@modelcontextprotocol/sdk/server/mcp.js`. Register three tools via `server.tool()` with Zod input schemas:
  - `get_universe_state` — input: `{ universeId: z.string() }`. Handler: fetch from `universeRepo.getById()`, return state as `CallToolResult`; return `isError: true` if not found (REQ-MCP-6, REQ-MCP-14).
  - `list_universe_commands` — input: `{ universeId: z.string(), category?: z.string() }`. Handler: verify universe exists, return `getCommandListing(category)` (REQ-MCP-7).
  - `send_universe_command` — input: `{ universeId: z.string(), command: z.object({ type: z.string() }).passthrough() }`. Handler: delegate to `commandService.processCommand()`, catch `UniverseNotFoundError` → `isError: true`, catch other errors → `isError: true` (REQ-MCP-8, REQ-MCP-9, REQ-MCP-14, REQ-MCP-15).
  - All responses use `CallToolResult` format (REQ-MCP-10, REQ-MCP-11, REQ-MCP-12).
  - Files: `apps/api/src/mcp/server.ts`
  - Verify: `npx tsc --noEmit` passes

- [x] 2.3 **Create MCP transport handler with session management** — Implement `createMcpTransportHandler(server: McpServer): Router` in `apps/api/src/mcp/transport.ts`. Internal state: `sessions = new Map<string, StreamableHTTPServerTransport>()`. Three route handlers on the returned `Router`:
  - `POST /` — If valid session header → route to existing transport. If initialize request without session → create `StreamableHTTPServerTransport` with `sessionIdGenerator: () => randomUUID()`, `onsessioninitialized` callback to store in map, `onclose` to remove. Connect server, then handle request. Otherwise → 400 (REQ-MCP-17 through REQ-MCP-21).
  - `GET /` — Lookup session → handle SSE stream. If missing/invalid → 400 (REQ-MCP-18, REQ-MCP-23).
  - `DELETE /` — Lookup session → `transport.close()`, remove from map → 200. If missing/invalid → 400 (REQ-MCP-22, REQ-MCP-23).
  - Import helper: `isInitializeRequest` from SDK or implement inline check for `method: "initialize"` in JSON-RPC body.
  - Files: `apps/api/src/mcp/transport.ts` (create)
  - Refs: Design § MCP Transport Handler; REQ-MCP-17 through REQ-MCP-25
  - Verify: `npx tsc --noEmit` passes

- [x] 2.4 **Mount MCP routes in `app.ts`** — Update `createApp` in `apps/api/src/app.ts` to:
  1. Import `createCommandService`, `createMcpServer`, `createMcpTransportHandler`.
  2. Build `commandService = createCommandService({ universeRepo, commandGateway })`.
  3. Build `mcpServer = createMcpServer({ universeRepo, commandService })`.
  4. Mount: `app.use('/mcp', createMcpTransportHandler(mcpServer))`.
  5. Keep `createApp` signature unchanged: `(universeRepo, commandGateway)` (no new params).
  - Do NOT update the commands router wiring yet (that is Phase 3).
  - Files: `apps/api/src/app.ts` (modify)
  - Refs: Design § Updated App Wiring; REQ-MCP-24
  - Verify: `npx tsc --noEmit` passes; existing endpoints still respond correctly

---

## Phase 3: Command Route Refactor + Integration (behavioral change)

- [x] 3.1 **Refactor `createCommandsRouter` to accept `CommandService`** — Change the function signature in `apps/api/src/routes/commands.ts` from `createCommandsRouter(gateway)` to `createCommandsRouter(commandService, gateway)`. Import `CommandService` type and `UniverseNotFoundError`. The SSE stream handler continues to use `gateway` directly — no change to SSE subscription logic.
  - Files: `apps/api/src/routes/commands.ts` (modify)
  - Refs: Design § Decision 7; REQ-CMD-1

- [x] 3.2 **Refactor POST handler to use `commandService.processCommand()`** — Replace the existing `gateway.broadcast()` call in the POST handler with:
  ```
  try {
    const result = await commandService.processCommand(req.params.id, command);
    res.status(200).json({ nextState: result.nextState, events: result.events });
  } catch (err) {
    if (err instanceof UniverseNotFoundError) {
      res.status(404).json({ error: 'Universe not found' });
      return;
    }
    next(err);
  }
  ```
  Keep the existing `type` field validation (400 if missing). Response changes from `202 { status: "sent" }` to `200 { nextState, events }` (REQ-CMD-5, REQ-CMD-R1, REQ-CMD-R2). Handle domain errors from the reducer as 400/422. Handle unexpected errors as 500 via Express error handler or explicit catch (REQ-CMD-7, REQ-CMD-8, REQ-CMD-9).
  - Files: `apps/api/src/routes/commands.ts` (modify, same file as 3.1)
  - Refs: REQ-CMD-1 through REQ-CMD-9, REQ-CMD-R1, REQ-CMD-R2; Design § Refactored Commands Router

- [x] 3.3 **Update `createApp` wiring for commands router** — Change the `createCommandsRouter` call in `apps/api/src/app.ts` from `createCommandsRouter(commandGateway)` to `createCommandsRouter(commandService, commandGateway)`, using the `commandService` instance already created in task 2.4.
  - Files: `apps/api/src/app.ts` (modify)
  - Verify: `npx tsc --noEmit` passes; `npm run build` passes

---

## Phase 4: Verification

- [x] 4.1 **Build verification** — Run `npm run build` from the workspace root. Confirm zero type errors and a clean build. Fix any compilation issues introduced.
  - Verify: `npm run build` exits 0

- [ ] 4.2 **Smoke-test existing REST endpoints** — Start the API server (`npm run dev` or equivalent). Confirm the following respond correctly:
  - `GET /health` → 200
  - `POST /universes` → 201 (create a test universe)
  - `GET /universes` → 200 with list
  - `GET /universes/:id` → 200 with universe detail
  - `POST /universes/:id/commands` with `{ "type": "tick" }` → 200 with `{ nextState, events }`
  - Verify: all endpoints return expected status codes; the command endpoint now returns 200 (not 202)

- [ ] 4.3 **MCP Inspector connectivity test** — Run `npx @modelcontextprotocol/inspector` and connect to `http://localhost:<port>/mcp`. Verify:
  - `tools/list` returns 3 tools (`get_universe_state`, `list_universe_commands`, `send_universe_command`)
  - `get_universe_state` with a valid `universeId` returns the universe state
  - `list_universe_commands` returns command categories
  - `send_universe_command` with `{ universeId, command: { type: "tick" } }` returns `{ nextState, events }`
  - Tool call with invalid `universeId` returns `isError: true`
  - Refs: Success Criteria from proposal; Scenarios MCP-1 through MCP-25

- [ ] 4.4 **Verify coexistence** — With the MCP server running, confirm:
  - Existing SSE endpoint (`GET /universes/:id/events`) still streams commands
  - MCP SSE stream (`GET /mcp` with session header) operates independently
  - No interference between the two SSE paths (REQ-MCP-24, REQ-MCP-25; Scenario MCP-24, MCP-25)
