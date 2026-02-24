# Proposal: mcp-endpoints

## Intent

The solar-system-constructor API currently lacks server-side command application — the `POST /universes/:id/commands` endpoint broadcasts commands over SSE but never applies them via the domain reducer or persists resulting state. The server holds no authoritative universe state after mutations.

This change introduces a shared `CommandService` that encapsulates the full command lifecycle (validate → fetch state → apply via domain reducer → persist → broadcast), wires it into the existing command endpoint to close the apply/persist gap, and stands up a **standards-compliant MCP server** using the official `@modelcontextprotocol/sdk` so that LLM-based agents can discover and invoke universe operations through the native Model Context Protocol.

The MCP server exposes three tools (`get_universe_state`, `list_universe_commands`, `send_universe_command`) via Streamable HTTP transport mounted alongside the existing Express app. Existing REST endpoints remain unchanged (except the command POST refactor). The `CommandService` is the shared bridge — both REST and MCP tool handlers call the same service method, eliminating duplication.

---

## Scope

### In scope

- Add `@modelcontextprotocol/sdk` (v1.x) and `zod` (v3) as dependencies to `apps/api/package.json`.
- Create a `CommandService` (`apps/api/src/app/services/commandService.ts`) that orchestrates: validate command → fetch universe state from repository → apply command via `applyUniverseCommand` reducer → persist updated state → broadcast command → return result.
- Refactor the existing `POST /universes/:id/commands` handler to delegate to `CommandService`, changing semantics from fire-and-forget (202) to apply-and-persist (200 with result).
- Create an MCP server module (`apps/api/src/mcp/server.ts`) that instantiates `McpServer` from `@modelcontextprotocol/sdk`, registers the three tools with Zod input schemas, and wires tool handlers to `CommandService` and `UniverseRepository`.
- Create an MCP transport handler (`apps/api/src/mcp/transport.ts`) that provides Express route handlers for `POST /mcp`, `GET /mcp`, and `DELETE /mcp` using `StreamableHTTPServerTransport` with stateful session management (`mcp-session-id` header).
- Wire MCP routes into `apps/api/src/app.ts`; instantiate `CommandService` inside `createApp` from the existing two ports.
- Keep all existing REST endpoints unchanged (except the command POST refactor).
- Tool responses use MCP SDK's native `CallToolResult` format: `{ content: [{ type: 'text', text: '...' }] }`.
- `list_universe_commands` returns the static command category listing already authored in the tool definitions content.
- Use stateful MCP transport mode (`sessionIdGenerator: () => randomUUID()`) since `send_universe_command` has side effects.

### Out of scope

- Authentication or API keys on any endpoint.
- Deep command payload validation beyond `type` field presence (Zod schemas validate MCP tool inputs, but the inner command object is not deeply validated beyond what the domain reducer enforces).
- Concurrency control (optimistic locking or serialized processing per universe).
- Frontend changes to accommodate the new 200 response on the command endpoint.
- CORS configuration changes for MCP clients (MCP SDK handles its own transport; non-browser MCP clients are unaffected).
- MCP resources or prompts (only tools are registered initially).
- MCP authentication/authorization at the protocol level.

---

## Approach

The exploration evaluated four approaches. The user has chosen **Approach D — Full MCP SDK Integration** for its standards compliance and alignment with the broader MCP ecosystem. This replaces the previously proposed Approach B (custom REST endpoints mimicking MCP protocol).

**Shared CommandService** remains the foundation. A new service module receives the two existing ports (`UniverseRepository` and `CommandGateway`) and the domain reducer, composing them into one cohesive workflow: fetch the universe, apply the command via the pure `applyUniverseCommand` reducer, persist the resulting state, broadcast the original command, and return the outcome. Both the refactored REST endpoint and the MCP tool handler delegate to this service, eliminating duplication.

**MCP server via official SDK.** Instead of hand-rolled REST endpoints, this approach uses `@modelcontextprotocol/sdk` v1.x to create a proper `McpServer` instance. Tools are registered using the SDK's `server.tool()` API with Zod schemas for input validation. The SDK handles all MCP protocol details — JSON-RPC framing, `tools/list` responses, `tools/call` dispatch, error formatting — so the codebase only needs to define tool names, schemas, and handler functions.

**Streamable HTTP transport.** The SDK's `StreamableHTTPServerTransport` is mounted at a single Express path (`/mcp`) and handles three HTTP methods: `POST` for client-to-server JSON-RPC messages (initialize, tool calls), `GET` for server-to-client SSE notification streams, and `DELETE` for session termination. Each MCP session gets its own transport instance, tracked by the `mcp-session-id` header. This coexists cleanly with the existing Express routes — no conflict with the existing SSE command streaming endpoint.

**Stateful sessions.** The transport uses `sessionIdGenerator: () => randomUUID()` to maintain session state, enabling resumable SSE streams and proper session lifecycle. This is appropriate because `send_universe_command` has side effects and clients benefit from a persistent session context.

The existing `POST /universes/:id/commands` endpoint changes from fire-and-forget broadcast (202 Accepted) to synchronous apply-and-persist (200 OK with command result). This is an intentional semantic change — all command paths share the same apply+persist pipeline.

`createApp` continues to receive `(universeRepo, commandGateway)` and constructs the `CommandService` internally, keeping infrastructure wiring contained and avoiding a signature change.

---

## Affected Areas

### Backend

| File | Change type | Description |
|---|---|---|
| `apps/api/src/app/services/commandService.ts` | **Create** | Shared command processing: validate → fetch → apply → persist → broadcast |
| `apps/api/src/mcp/server.ts` | **Create** | MCP server setup: instantiate `McpServer`, register 3 tools with Zod schemas |
| `apps/api/src/mcp/transport.ts` | **Create** | Streamable HTTP transport: Express handlers for `POST/GET/DELETE /mcp`, session management |
| `apps/api/src/routes/commands.ts` | **Modify** | Refactor POST handler to delegate to `CommandService` |
| `apps/api/src/app.ts` | **Modify** | Instantiate `CommandService`, create MCP server, mount MCP transport routes |
| `apps/api/package.json` | **Modify** | Add `@modelcontextprotocol/sdk` and `zod` dependencies |

### Shared / Domain

| File | Role |
|---|---|
| `packages/domain/src/universe/applyCommand.ts` | Consumed by `CommandService` (no changes) |
| `packages/domain/src/universe/commands.ts` | Type definitions consumed (no changes) |
| `packages/domain/src/universe/state.ts` | Type definitions consumed (no changes) |

### Content

| File | Role |
|---|---|
| `apps/api/src/content/mcp-tools.ts` | Static tool defs — informational reference; MCP SDK tool registration uses Zod schemas directly (no changes) |
| `apps/api/src/content/index.ts` | Barrel re-export (no changes) |

### Infrastructure

| File | Role |
|---|---|
| `apps/api/src/app/ports/commandGateway.ts` | Port interface consumed by `CommandService` (no changes) |
| `apps/api/src/app/ports/universeRepository.ts` | Port interface consumed by `CommandService` (no changes) |
| `apps/api/src/server.ts` | No changes expected — ports already built here and passed to `createApp` |

---

## Risks

| # | Risk | Severity | Mitigation |
|---|---|---|---|
| 1 | **New dependencies** — `@modelcontextprotocol/sdk` (v1.x) and `zod` (v3) added to the API package. Increases bundle size and introduces external library coupling. | Low | Both are well-maintained, widely adopted packages. `zod` is a peer dependency of the MCP SDK. v1.x is the current stable release. |
| 2 | **Semantic change to POST /commands** — response changes from 202 (fire-and-forget) to 200 (synchronous with result). Clients relying on 202 behavior may break. | Medium | Accepted by design decision. The only known client is the frontend SSE-connected UI. Document the change in the delta spec. |
| 3 | **No deep command payload validation** — only the `type` field is checked within the command object. Malformed payloads could cause runtime errors in the domain reducer. | Low | The domain reducer has exhaustiveness checking on `type`. Zod validates MCP tool input structure (universeId, command presence). Deeper validation is explicitly out of scope. |
| 4 | **Concurrency (lost-update)** — two simultaneous commands for the same universe may race: both read state, both apply, last write wins. | Low | Acceptable for current single-user development context. Explicitly out of scope; can be addressed later with optimistic locking. |
| 5 | **SDK version stability** — Using v1.x (current stable). v2 is pre-alpha with split packages. | Low | v1.x is stable and actively maintained. Migration path to v2 exists when it ships. Pin to `^1.0.0` to receive patch updates. |
| 6 | **Session management overhead** — Stateful transport requires tracking `StreamableHTTPServerTransport` instances in memory, one per MCP session. | Low | For single-process deployment this is negligible. Sessions are cleaned up on `DELETE /mcp`. No persistence needed for transport state. |

---

## Rollback Plan

All changes are additive except the command endpoint refactor:

1. **Remove MCP modules**: Delete `apps/api/src/mcp/server.ts` and `apps/api/src/mcp/transport.ts`; remove MCP route mounting from `app.ts`. MCP endpoints disappear cleanly.
2. **Remove dependencies**: Uninstall `@modelcontextprotocol/sdk` and `zod` from `apps/api/package.json`.
3. **Remove CommandService**: Delete `apps/api/src/app/services/commandService.ts` and its instantiation in `app.ts`.
4. **Restore fire-and-forget commands**: Revert `apps/api/src/routes/commands.ts` to its prior broadcast-only implementation.
5. **No database migration**: State persistence uses the existing `repo.update()` path — no schema changes to revert.

If partial rollback is needed (keep `CommandService` but remove MCP), only steps 1–2 apply.

---

## Dependencies

| Dependency | Type | Status |
|---|---|---|
| `@modelcontextprotocol/sdk` v1.x | External npm package | To be installed |
| `zod` v3 | External npm package (peer dep of MCP SDK) | To be installed |
| `@solar/domain` — `applyUniverseCommand`, `UniverseCommand`, `UniverseState` | Internal package | Available |
| `apps/api/src/content/mcp-tools.ts` — static tool definitions (reference) | Internal module | Available (authored in prior change) |
| `apps/api/src/app/ports/universeRepository.ts` — `getById`, `update` methods | Port interface | Available |
| `apps/api/src/app/ports/commandGateway.ts` — `broadcast` method | Port interface | Available |
| Existing `api-content` spec (REQ-TOOL-1 through REQ-TOOL-9) | Specification | Merged |

---

## Success Criteria

- MCP server responds to `tools/list` JSON-RPC call (via `POST /mcp`) with the 3 tool definitions including names, descriptions, and input schemas.
- `get_universe_state` tool returns universe state for a valid `universeId` in `CallToolResult` format.
- `list_universe_commands` tool returns the static command category listing in `CallToolResult` format.
- `send_universe_command` tool applies the command via the domain reducer, persists the resulting state, broadcasts the command, and returns the result in `CallToolResult` format.
- Tool calls with invalid `universeId` return an error result (`isError: true`) with a descriptive message.
- MCP session lifecycle works: `POST /mcp` initializes sessions, `GET /mcp` opens SSE streams, `DELETE /mcp` terminates sessions, all keyed by `mcp-session-id` header.
- Existing REST endpoints (`GET/POST /universes`, `GET/PUT/DELETE /universes/:id`, `GET /health`) continue working unchanged.
- The existing `POST /universes/:id/commands` endpoint now applies the command via the domain reducer, persists the result, broadcasts the command, and returns 200 with the result (no longer 202 fire-and-forget).
- Both the MCP `send_universe_command` tool handler and the refactored `POST /commands` handler share the same `CommandService` — no duplicated apply/persist logic.
- MCP Inspector (`npx @modelcontextprotocol/inspector`) can connect to `http://localhost:<port>/mcp` and invoke all 3 tools successfully.
- `npm run build` passes with no new type errors.
- No changes to `createApp` function signature.
