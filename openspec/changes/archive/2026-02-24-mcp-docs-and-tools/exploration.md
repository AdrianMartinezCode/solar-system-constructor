# Exploration: mcp-docs-and-tools

## Current State

### Affected Areas

| Path | Role | Current State |
|------|------|---------------|
| `apps/api/src/content/index.ts` | Content module barrel | Empty file |
| `apps/api/src/content/docs.ts` | Natural-language docs content | Empty file |
| `apps/api/src/content/mcp-tools.ts` | MCP tool specifications | Empty file |
| `apps/api/src/mcp/` | Future MCP server directory | Empty directory |
| `apps/api/src/app.ts` | Express app factory | Routes wired; no content routes yet |
| `apps/api/src/routes/` | Route modules | `health`, `universes`, `commands` (factory pattern with DI) |
| `packages/domain/src/types.ts` | Entity types | 12 exported types (`Star`, `Group`, `SmallBodyField`, `ProtoplanetaryDisk`, `NebulaRegion`, etc.) |
| `packages/domain/src/universe/commands.ts` | Command union | 25 command types across 10 categories |
| `packages/domain/src/universe/state.ts` | `UniverseState` | 9-field snapshot type |
| `packages/domain/src/universe/validate.ts` | Invariants | Cycle detection for stars and groups; existence checks |
| `packages/domain/src/universe/applyCommand.ts` | Pure reducer | Exhaustive `switch` over all 25 command types |

### Existing Patterns and Conventions

1. **Route factory pattern**: Routes are created via `createXxxRouter(dependency)` functions that accept injected ports. The app factory in `app.ts` wires them together. Content routes would follow the same pattern.

2. **No controller layer yet**: The current API uses inline route handlers (no `BaseController` pattern from the backend guidelines). Content endpoints are read-only, so adding controllers would be premature.

3. **Domain types are the single source of truth**: All entity types and commands are defined in `@solar/domain` and shared across apps. The tool specification content must be derived from (or aligned with) these types.

4. **Content module placeholder**: The `src/content/` directory with three empty files signals an intended pattern where content is authored as TypeScript modules exporting typed data structures, then served by route handlers.

5. **Hexagonal architecture**: Ports in `src/app/ports/` define abstractions; adapters live in `src/infra/`. Content is read-only static data, so it doesn't need a port/adapter split — a direct content module is appropriate.

### Domain Model Summary

**UniverseState** fields: `stars`, `rootIds`, `groups`, `rootGroupIds`, `belts`, `smallBodyFields`, `protoplanetaryDisks`, `nebulae`, `time`.

**Command categories (25 types)**:

| Category | Commands | Count |
|----------|----------|-------|
| Simulation | `tick` | 1 |
| Star CRUD | `addStar`, `updateStar`, `removeStar` | 3 |
| Star hierarchy | `attachStar`, `detachStar` | 2 |
| Group CRUD | `addGroup`, `updateGroup`, `removeGroup` | 3 |
| Group hierarchy | `addToGroup`, `removeFromGroup`, `moveToGroup` | 3 |
| Small body fields | `setSmallBodyFields`, `updateSmallBodyField`, `removeSmallBodyField` | 3 |
| Protoplanetary disks | `setProtoplanetaryDisks`, `addProtoplanetaryDisk`, `updateProtoplanetaryDisk`, `removeProtoplanetaryDisk` | 4 |
| Nebulae | `setNebulae`, `updateNebula`, `removeNebula` | 3 |
| Rings | `updateRing`, `removeRing` | 2 |
| Snapshot | `replaceSnapshot` | 1 |

**Entity types** with notable complexity: `Star` (57 fields including optional orbital, comet, lagrange, black hole, and rogue planet metadata), `ProtoplanetaryDisk` (30+ fields including shader parameters), `SmallBodyField` (25+ fields), `NebulaRegion` (15+ fields), `BlackHoleProperties` (25+ fields).

### Dependencies and Constraints

- Content modules must not import Express or any framework code (they export pure data).
- Tool specs must stay aligned with `@solar/domain` command types — if a command is added/removed, the tool spec must update.
- The `/docs` endpoint serves human-readable content; the `/mcp/tools` endpoint serves machine-readable specifications.
- No database or external service dependency — content is compiled into the app.

---

## Approach Comparison

### Question 1: What format for `/mcp/tools` tool specifications?

| Approach | Description | Pros | Cons | Complexity |
|----------|-------------|------|------|------------|
| **A. MCP Protocol `tools/list` format** | Use the standard MCP tool listing shape: `{ name, description, inputSchema (JSON Schema), annotations }` as defined by the MCP specification. | Directly consumable by MCP clients; aligns with MCP SDK `registerTool` pattern; future-proof for actual MCP server integration; the MCP builder skill documents this exact shape. | Requires converting domain types to JSON Schema by hand (or via `zod-to-json-schema`); not an industry-wide standard outside MCP. | Medium |
| **B. OpenAPI 3.1 operations** | Model each tool as an OpenAPI `operation` object with `requestBody` JSON Schema and `responses`. | Industry standard; broad tooling support (Swagger UI, codegen); familiar to most developers. | Heavier than needed for an MCP tool catalog; conflates HTTP semantics with tool semantics; the server doesn't actually serve OpenAPI. | Medium-High |
| **C. Custom JSON Schema catalog** | Define a bespoke `{ tools: [{ name, description, parameters: JSONSchema, returns: JSONSchema, annotations }] }` array. | Full control; lightweight; easy to extend. | Non-standard; consumers need custom parsing; may drift from MCP format later. | Low |
| **D. Zod schemas exported as TypeScript + runtime JSON Schema generation** | Export Zod schemas for each tool in TypeScript; at startup, convert them to JSON Schema via `zod-to-json-schema` and serve the result. | Single source of truth (Zod); runtime validation reusable by the future MCP server; type-safe. | Adds `zod-to-json-schema` dependency; tightly couples content to Zod; slightly more build complexity. | Medium |

**Recommendation**: **Approach A (MCP Protocol `tools/list` format)** is the strongest choice. The project already has a `src/mcp/` directory signaling future MCP server plans, and the MCP builder skill documents exactly this format. Using the MCP standard shape means the content module can later be imported directly by the actual MCP server's `registerTool` calls. The input schemas can be authored as plain JSON Schema objects (no runtime dependency needed at this stage).

If runtime validation is later needed, the schemas can be converted to Zod via `zod-to-json-schema` at that point. For now, hand-authored JSON Schema aligned with the domain types keeps the dependency footprint zero.

### Question 2: What format for `/docs` natural-language documentation?

| Approach | Description | Pros | Cons | Complexity |
|----------|-------------|------|------|------------|
| **A. Markdown string in TypeScript** | Export a single template-literal Markdown string from `docs.ts`; serve as `text/markdown`. | Simplest; easy to author; clients can render Markdown natively; great for AI consumption. | Hard to dynamically compose sections; no structured metadata. | Low |
| **B. Structured JSON with sections** | Export a JSON object `{ title, sections: [{ heading, body }] }` where `body` is Markdown; serve as `application/json`. | Structured; allows clients to render selectively; supports TOC generation; can include metadata per section. | More complex authoring; clients must parse and render; mixed format. | Low-Medium |
| **C. Static `.md` file served by Express** | Write a `docs/mcp-guide.md` file; serve it with `express.static` or `res.sendFile`. | Editable outside TypeScript; standard Markdown workflow. | Separate from the TypeScript module system; harder to template or version; no type safety on structure. | Low |
| **D. HTML template** | Pre-render Markdown to HTML; serve as `text/html`. | Browser-viewable directly. | Extra build step; most consumers (AI models, devtools) prefer Markdown or JSON. | Medium |

**Recommendation**: **Approach B (Structured JSON with Markdown bodies)** provides the best balance. It lets the `/docs` endpoint return a structured document that clients can navigate section-by-section (useful for AI models that may want to retrieve specific sections), while preserving Markdown for human readability. The route handler can also offer `Accept` header negotiation to return raw Markdown if requested.

### Question 3: How should the server load/serve this content?

| Approach | Description | Pros | Cons | Complexity |
|----------|-------------|------|------|------------|
| **A. Content module pattern (TypeScript exports)** | `src/content/docs.ts` and `src/content/mcp-tools.ts` export typed constants; `src/content/index.ts` re-exports them; route handlers import and serve. | Type-safe; co-located with API code; tree-shakeable; no I/O at runtime; follows the existing placeholder pattern. | Content changes require recompile; not editable by non-developers. | Low |
| **B. File-based with runtime loading** | Store content as `.json` or `.md` files in `src/content/`; read them at startup with `fs.readFile`. | Editable without recompile; separates data from code. | Loses type safety; needs file path resolution; async startup. | Low-Medium |
| **C. Database-backed** | Store content in the DB; load via repository pattern. | Editable at runtime; versioned. | Massive overkill for static content; couples docs to DB availability. | High |

**Recommendation**: **Approach A (Content module pattern)**. The empty placeholder files already signal this intent. TypeScript exports give type safety, IDE support, and zero runtime I/O. The content is inherently static and developer-authored, so recompile-on-change is a non-issue.

---

## Recommended Approach (Summary)

1. **`/mcp/tools`**: Author tool specifications in `src/content/mcp-tools.ts` using the **MCP Protocol `tools/list` format** — an exported array of objects with `{ name, description, inputSchema (JSON Schema), annotations }` for each of the 3 high-level tools (get universe state, list commands, send command). Input schemas are hand-written JSON Schema objects derived from `@solar/domain` types.

2. **`/docs`**: Author documentation in `src/content/docs.ts` as a **structured JSON object with Markdown section bodies** — `{ title, version, sections: [{ id, heading, body }] }`. Sections cover: system overview, universe structure, commands reference, validation rules, real-time streaming.

3. **Loading**: Use the **content module pattern** — TypeScript exports from `src/content/`, re-exported via `index.ts`. Route handlers (to be created in a later change) will import these and serve them.

---

## Risks

- **Schema drift**: Hand-authored JSON Schemas for tool input may drift from the actual `@solar/domain` types. Mitigation: document the mapping clearly; consider automated validation in CI later.
- **Content staleness**: If new commands are added to the domain, the tool specs and docs must be updated manually. Mitigation: add a note in the content files listing the domain types they depend on.
- **Scope creep**: This change prepares content only — route handlers, MCP server integration, and actual serving are out of scope and should be separate changes.

---

## Open Questions

1. **Tool granularity**: Should the `/mcp/tools` listing expose 3 high-level tools (get state, list commands, send command) or expose each of the 25 command types as individual tools? The MCP best practices suggest action-oriented, composable tools — 3 high-level tools with a discriminated `type` field on the command payload aligns better with MCP conventions.

2. **Versioning**: Should the content include a version number or date to track freshness? Recommended: yes, include a `version` field in both content exports.

3. **MCP server integration path**: The `src/mcp/` directory is empty. Should the tool specs be authored in a way that the future MCP server can directly import them for `registerTool` calls? Recommended: yes — use a shape that maps 1:1 to the MCP SDK's `registerTool` config parameter.
