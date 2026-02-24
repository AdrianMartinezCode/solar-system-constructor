# Verify Report: mcp-endpoints

**Verdict**: PASS_WITH_WARNINGS
**Date**: 2026-02-24

## Summary

- Build / Typecheck: **pass** (`tsc --noEmit -p apps/api/tsconfig.json` exits 0)
- Tests: **N/A** (no automated tests exist for this change)
- Tasks complete: **No** (11/14 — three Phase 4 manual-verification tasks remain unchecked)

---

## Completeness

- [x] Phase 1 tasks (1.1–1.3) all marked done
- [x] Phase 2 tasks (2.1–2.4) all marked done
- [x] Phase 3 tasks (3.1–3.3) all marked done
- [x] Phase 4 task 4.1 (build verification) marked done
- [ ] Phase 4 task 4.2 (smoke-test REST endpoints) **not done**
- [ ] Phase 4 task 4.3 (MCP Inspector connectivity test) **not done**
- [ ] Phase 4 task 4.4 (verify coexistence) **not done**

Uncompleted tasks: 4.2, 4.3, 4.4 — all are manual verification / smoke-test tasks.

---

## Correctness

### Command Service Spec (REQ-CS-*)

| Req | Status | Notes |
|---|---|---|
| REQ-CS-1 | ✅ Pass | `createCommandService({ universeRepo, commandGateway })` accepts both ports |
| REQ-CS-2 | ✅ Pass | `processCommand(universeId, command): Promise<CommandResult>` exposed; `CommandResult = { nextState, events }` |
| REQ-CS-3 | ✅ Pass | Imports only `@solar/domain` types, domain reducer, and port interfaces — no HTTP/Express references |
| REQ-CS-4 | ✅ Pass | `deps.universeRepo.getById(universeId)` called before apply |
| REQ-CS-5 | ✅ Pass | `applyUniverseCommand(universe.state, command)` called with state and command |
| REQ-CS-6 | ✅ Pass | `deps.universeRepo.update(universeId, { state: result.nextState })` called after apply |
| REQ-CS-7 | ✅ Pass | `deps.commandGateway.broadcast(universeId, command)` called after persist |
| REQ-CS-8 | ✅ Pass | Returns `result` (`{ nextState, events }`) after all steps |
| REQ-CS-9 | ✅ Pass | Sequential flow: getById → applyUniverseCommand → update → broadcast. Each step only reached if the prior succeeds |
| REQ-CS-10 | ✅ Pass | `if (!universe) throw new UniverseNotFoundError(universeId)` — before apply/persist/broadcast |
| REQ-CS-11 | ✅ Pass | No try/catch around `applyUniverseCommand`, so reducer errors propagate naturally; persist/broadcast unreachable |
| REQ-CS-12 | ✅ Pass | `await` on `update()` means persistence errors propagate; broadcast unreachable after failure |
| REQ-CS-13 | ✅ Pass | Type-field validation at top of `processCommand` — rejects before querying persistence |

### MCP Server Spec (REQ-MCP-*)

| Req | Status | Notes |
|---|---|---|
| REQ-MCP-1 | ✅ Pass | Exactly 3 tools registered via `server.registerTool()` |
| REQ-MCP-2 | ✅ Pass | Each tool has name, description, and Zod inputSchema |
| REQ-MCP-3 | ✅ Pass | `universeId: z.string()` required |
| REQ-MCP-4 | ✅ Pass | `universeId: z.string()` required; `category` optional |
| REQ-MCP-5 | ✅ Pass | `universeId: z.string()` + `command: z.object({ type: z.string() }).passthrough()` both required |
| REQ-MCP-6 | ✅ Pass | Fetches from repo, returns `JSON.stringify(universe.state)` |
| REQ-MCP-7 | ✅ Pass | Returns `COMMAND_CATEGORIES` (10 categories, all accounted for) |
| REQ-MCP-8 | ✅ Pass | Delegates to `deps.commandService.processCommand()` |
| REQ-MCP-9 | ✅ Pass | Returns `JSON.stringify({ nextState, events })` |
| REQ-MCP-10 | ✅ Pass | All responses use `{ content: [{ type: 'text', text: '...' }] }` |
| REQ-MCP-11 | ✅ Pass | Successful responses omit `isError` |
| REQ-MCP-12 | ✅ Pass | All text content is `JSON.stringify(...)` — valid JSON |
| REQ-MCP-13 | ✅ Pass | All 10 categories present in `COMMAND_CATEGORIES` constant |
| REQ-MCP-14 | ✅ Pass | `get_universe_state` and `send_universe_command` return `isError: true` with descriptive message when universe not found |
| REQ-MCP-15 | ⚠️ Warn | See WARNING W-1 below |
| REQ-MCP-16 | ✅ Pass | Error results include `universeId` in the JSON text content |
| REQ-MCP-17 | ✅ Pass | Mounted at `/mcp` via `StreamableHTTPServerTransport` |
| REQ-MCP-18 | ✅ Pass | POST, GET, DELETE handlers present on the router |
| REQ-MCP-19 | ✅ Pass | `sessionIdGenerator: () => randomUUID()` |
| REQ-MCP-20 | ✅ Pass | SDK handles `mcp-session-id` header automatically via transport |
| REQ-MCP-21 | ✅ Pass | POST without session + `isInitializeRequest` → creates new transport/session |
| REQ-MCP-22 | ✅ Pass | DELETE: `transport.close()` + `sessions.delete(sessionId)` + 200 |
| REQ-MCP-23 | ✅ Pass | GET/DELETE with unknown session → 400 |
| REQ-MCP-24 | ✅ Pass | `/mcp` path does not collide with existing `/health`, `/universes/*` routes |
| REQ-MCP-25 | ✅ Pass | MCP SSE (`GET /mcp`) and universe SSE (`GET /universes/:id/events`) are on separate paths |

### Command Endpoint Spec (REQ-CMD-*)

| Req | Status | Notes |
|---|---|---|
| REQ-CMD-1 | ✅ Pass | POST handler delegates to `commandService.processCommand()` — no direct repo/gateway calls |
| REQ-CMD-2 | ✅ Pass | Passes `req.params.id` and `req.body` to service |
| REQ-CMD-3 | ✅ Pass | Returns 200 with `{ nextState, events }` |
| REQ-CMD-4 | ✅ Pass | Response includes `nextState` |
| REQ-CMD-5 | ✅ Pass | Status is 200, not 202 |
| REQ-CMD-6 | ✅ Pass | Validates `type` field presence and non-empty string; returns 400 if missing |
| REQ-CMD-7 | ⚠️ Warn | See WARNING W-2 below |
| REQ-CMD-8 | ⚠️ Warn | See WARNING W-3 below |
| REQ-CMD-9 | ✅ Pass | `next(err)` → global handler returns `500 { error: 'Internal server error' }` — no internal details exposed |
| REQ-CMD-R1 | ✅ Pass | 202 is no longer returned |
| REQ-CMD-R2 | ✅ Pass | Commands are applied and persisted before broadcast (via `CommandService` pipeline) |

---

## Coherence

### Design Decisions

| Decision | Status | Notes |
|---|---|---|
| D1: Service layer (`CommandService`) | ✅ Followed | Factory function `createCommandService` with `processCommand` method |
| D2: Official MCP SDK + Streamable HTTP | ✅ Followed | Uses `@modelcontextprotocol/sdk`, `StreamableHTTPServerTransport` |
| D3: Stateful sessions | ✅ Followed | `sessionIdGenerator: () => randomUUID()`, session map in transport |
| D4: Mount at `/mcp` | ✅ Followed | `app.use('/mcp', createMcpTransportHandler(mcpServer))` |
| D5: Zod schemas (not reusing content JSON Schema) | ✅ Followed | Zod schemas defined inline in `registerTool` calls |
| D6: Factory function pattern (not class) | ✅ Followed | `createCommandService(deps)` returns object literal |
| D7: Commands router accepts CommandService + CommandGateway | ✅ Followed | `createCommandsRouter(commandService, gateway)` |

### Design vs Implementation API

| Design specifies | Implementation | Match? |
|---|---|---|
| `server.tool()` (in code examples) | `server.registerTool()` | ✅ Correct — `registerTool` is the non-deprecated API as required |
| `createApp(universeRepo, commandGateway)` signature unchanged | Signature is `(universeRepo: UniverseRepository, commandGateway: CommandGateway)` | ✅ |
| `createMcpServer({ universeRepo, commandService })` | Matches implementation | ✅ |
| `createMcpTransportHandler(mcpServer)` | Matches implementation | ✅ |
| App wiring order | Matches design diagram | ✅ |

Deviations: None blocking. The design examples used `server.tool()` but the implementation correctly uses `server.registerTool()` per the instructions.

---

## CRITICAL Issues

None.

---

## WARNING Issues

**W-1** (REQ-MCP-15) — **`get_universe_state` and `list_universe_commands` handlers lack try/catch for unexpected errors.**

The `send_universe_command` handler correctly wraps its logic in try/catch and returns `CallToolResult` with `isError: true` on any unexpected error. However, `get_universe_state` and `list_universe_commands` do not have try/catch blocks. If `deps.universeRepo.getById()` throws an unexpected error (e.g., persistence layer failure), the promise rejection propagates unhandled from the handler.

The MCP SDK catches unhandled tool-handler errors at the protocol layer and converts them to error responses, so the server will not crash. But the spec requires the handler itself to return a `CallToolResult` with `isError: true`. This is a defense-in-depth gap.

- **Files**: `apps/api/src/mcp/server.ts` (lines 70–82 and 94–106)
- **Fix**: Wrap the handler bodies in try/catch, returning `{ content: [{ type: 'text', text: JSON.stringify({ error: '...', universeId }) }], isError: true }` on unexpected errors.

---

**W-2** (REQ-CMD-7) — **404 response does not include the universe identifier.**

The spec and scenario CMD-7 require that the 404 error message identifies which universe was not found (e.g., mentions "u-missing"). The current implementation returns:
```json
{ "error": "Universe not found" }
```
It should include the universe ID, e.g.:
```json
{ "error": "Universe not found", "universeId": "u-missing" }
```
Or: `{ "error": "Universe not found: u-missing" }`.

- **File**: `apps/api/src/routes/commands.ts` (line 42)
- **Fix**: Include `req.params.id` in the 404 response JSON.

---

**W-3** (REQ-CMD-8) — **No HTTP error status for domain reducer soft rejections.**

The spec requires that domain invariant violations (e.g., removing a non-existent star) return 400 or 422. However, the domain reducer (`applyUniverseCommand`) never throws for these cases — it returns `{ nextState: state, events: [{ type: 'starNotFound', ... }] }` (unchanged state with error events). The route handler treats all successful `processCommand` returns as 200.

This means a command like `{ type: "removeStar", id: "nonexistent" }` returns 200 with the unchanged state and a `starNotFound` event, rather than 400/422.

This is a design-level mismatch: the spec assumes the reducer can signal errors via exceptions, but the reducer uses a return-value pattern. Addressing this would require either: (a) the service inspecting result events for error patterns and throwing, or (b) the route handler inspecting the events array.

- **Files**: `apps/api/src/routes/commands.ts`, `apps/api/src/app/services/commandService.ts`
- **Impact**: Low — callers receive the unchanged state and error events, which is informative. No data corruption occurs.

---

**W-4** — **Three manual verification tasks not completed (4.2, 4.3, 4.4).**

Tasks 4.2 (smoke-test REST endpoints), 4.3 (MCP Inspector test), and 4.4 (coexistence test) remain unchecked. These are manual verification steps that confirm runtime behavior. The typecheck passes and the code structure is correct, but runtime behavior has not been confirmed.

- **Impact**: Functional issues (e.g., runtime import errors, SDK version incompatibilities) would only be caught by these tests.

---

## SUGGESTION Issues

**S-1** (REQ-MCP-16) — **`send_universe_command` catch-all error omits `universeId` from JSON.**

The catch-all error for `send_universe_command` returns:
```json
{ "error": "Command processing failed", "message": "..." }
```
The `universeId` is not explicitly included in the JSON object (it may appear in the stringified error message). The spec says error messages SHOULD include the universe identifier. Adding `universeId` to the catch-all error JSON would improve diagnostics.

- **File**: `apps/api/src/mcp/server.ts` (line 136)

---

**S-2** — **Zod version deviates from proposal specification.**

The proposal specifies `zod (v3)` as a dependency. The installed version is `"zod": "^4.3.6"` (Zod v4). The typecheck passes and the MCP SDK appears compatible, but this is a deviation from the proposal's stated dependency version. If the MCP SDK internally depends on Zod v3 APIs, runtime incompatibilities could occur (unlikely given the passing typecheck).

- **File**: `apps/api/package.json` (line 18)

---

**S-3** — **Empty-string `type` in MCP command path is not validated.**

The REST endpoint validates that `command.type.trim().length > 0` (rejects empty strings). The MCP `send_universe_command` path validates via Zod `z.string()` which allows empty strings. An empty `type` string would pass the MCP tool handler, pass the `CommandService` type validation (which checks `typeof type === 'string'` but not emptiness), and reach the reducer's exhaustiveness check default case. This is a minor edge case with no harmful effects, but the validation is inconsistent between the two entry points.

- **Files**: `apps/api/src/mcp/server.ts` (line 116), `apps/api/src/app/services/commandService.ts` (lines 25–34)

---

## Verification Commands Output

```
$ tsc --noEmit -p apps/api/tsconfig.json
(exit code 0, no output — clean typecheck)
```

No automated tests exist for the implementation files. Manual verification (tasks 4.2–4.4) was not performed during this verification pass.
