# Proposal: mcp-docs-and-tools

## Intent

Populate the three empty content module files in `apps/api/src/content/` with two categories of static, developer-authored content that downstream route handlers and the future MCP server can consume:

1. **Natural-language documentation** (`docs.ts`) — a structured JSON object whose Markdown-body sections explain how a generative AI model uses the MCP server to build universes, the structure of universes, how to send commands, validation rules, and real-time streaming.

2. **MCP tool specifications** (`mcp-tools.ts`) — an array of three tool definitions in the standard MCP Protocol `tools/list` format (`name`, `description`, `inputSchema` as JSON Schema, `annotations`), covering `get_universe_state`, `list_universe_commands`, and `send_universe_command`.

The content barrel (`index.ts`) re-exports both modules so that future route handlers or MCP server integration can import everything from a single entry point.

This change establishes the **content layer only** — no HTTP routes, no MCP server wiring, no runtime I/O.

---

## Scope

### In scope

- Author the docs content export in `apps/api/src/content/docs.ts` as a typed structured JSON object with Markdown section bodies (title, version, sections with id/heading/body).
- Author the MCP tool specifications export in `apps/api/src/content/mcp-tools.ts` as a typed array of MCP `tools/list` entries, each with `name`, `description`, `inputSchema` (hand-written JSON Schema derived from `@solar/domain` types), and `annotations`.
- Wire the barrel re-export in `apps/api/src/content/index.ts`.
- Define TypeScript types/interfaces for the content structures (either inline or in a local types file within `src/content/`).
- Include a `version` field in both content exports for freshness tracking.
- Ensure `npm run build` and `npm run typecheck` pass after the change.

### Out of scope

- Creating Express route handlers for `/docs` or `/mcp/tools`.
- MCP server implementation or `src/mcp/` directory changes.
- WebSocket or SSE changes.
- Database changes.
- Automated JSON Schema generation from Zod or domain types (schemas are hand-authored at this stage).
- `Accept` header content negotiation logic (that belongs to the route handler change).

---

## Approach

The exploration identified the **content module pattern** (TypeScript exports of pure data) as the recommended loading strategy, aligning with the existing empty placeholder files. The approach is straightforward: populate three files with typed, static content and ensure they compile cleanly.

**Documentation content** (`docs.ts`) exports a single object conforming to a `DocsContent` interface: `{ title: string; version: string; sections: Array<{ id: string; heading: string; body: string }> }`. Each `body` value is a Markdown string. Sections cover: system overview, universe structure (stars, groups, nebulae, small body fields, protoplanetary disks, etc.), commands reference (all 25 command types across 10 categories), validation rules (cycle detection, existence checks), and real-time streaming.

**MCP tool specifications** (`mcp-tools.ts`) exports an array of objects conforming to the MCP Protocol `tools/list` response shape. Each tool entry has `name`, `description`, `inputSchema` (a JSON Schema object), and `annotations` (readOnlyHint, destructiveHint, idempotentHint, openWorldHint). The three tools are:

- `get_universe_state` — retrieves the current universe snapshot; input requires `universeId`.
- `list_universe_commands` — lists commands sent to a universe; input requires `universeId` with optional pagination/filter parameters.
- `send_universe_command` — sends a command to modify a universe; input requires `universeId` and a `command` object whose schema is a discriminated union (`type` field) covering all 25 command types from `@solar/domain`.

The `send_universe_command` input schema is the most complex artifact: it must faithfully represent the discriminated union of 25 command types. Each command variant's properties are derived from the domain types in `packages/domain/src/universe/commands.ts` and `packages/domain/src/types.ts`. The JSON Schema uses `oneOf` with a `type` discriminator to model the union.

**Barrel file** (`index.ts`) simply re-exports `docs` and `mcpTools` (or similar named exports) from the two modules.

---

## Affected Areas

### Backend

| Path | Change |
|------|--------|
| `apps/api/src/content/docs.ts` | Populate with `DocsContent` typed export |
| `apps/api/src/content/mcp-tools.ts` | Populate with MCP tool spec array export |
| `apps/api/src/content/index.ts` | Add barrel re-exports |

### Shared (read-only reference)

| Path | Role |
|------|------|
| `packages/domain/src/types.ts` | Source of truth for entity types (Star, Group, SmallBodyField, etc.) |
| `packages/domain/src/universe/commands.ts` | Source of truth for 25 command types |
| `packages/domain/src/universe/state.ts` | Source of truth for `UniverseState` (9 fields) |
| `packages/domain/src/universe/validate.ts` | Reference for validation rules documented in docs |
| `packages/domain/src/universe/applyCommand.ts` | Reference for command behavior documented in docs |

### Config

No configuration files are modified.

### Frontend

No frontend files are modified.

---

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| **Schema drift** — Hand-authored JSON Schemas diverge from `@solar/domain` types over time | Medium | Medium | Document the source domain types each schema maps to; add inline comments referencing the domain file and type name; consider automated schema-from-Zod generation in a future change |
| **Content staleness** — New domain commands added without updating tool specs or docs | Medium | Medium | Add a header comment in each content file listing the domain types it depends on; the future verify phase can check for drift |
| **Over-specified input schemas** — JSON Schema for `send_universe_command` is large and complex; errors in the schema could confuse MCP clients | Medium | Low | Validate the schema structure manually during implementation; keep each command variant's properties minimal (required fields only, optional fields documented) |
| **Scope creep** — Temptation to add route handlers or MCP wiring alongside content | Low | Medium | The proposal and task list explicitly exclude route handlers; the verify phase should flag any out-of-scope additions |

---

## Rollback Plan

All changes are confined to three files that are currently empty. Rolling back is a single operation:

1. Revert `apps/api/src/content/docs.ts`, `apps/api/src/content/mcp-tools.ts`, and `apps/api/src/content/index.ts` to empty files (or `git checkout` the originals).
2. Run `npm run build` to confirm the revert compiles cleanly.

No database migrations, no external service changes, no configuration changes — rollback is trivial and zero-risk.

---

## Dependencies

| Dependency | Type | Status |
|------------|------|--------|
| `@solar/domain` package types | Internal | Available — types exist in `packages/domain/src/` |
| Empty content placeholder files | Internal | Available — `apps/api/src/content/` directory and three empty files exist |
| MCP Protocol `tools/list` specification | External reference | Documented in MCP builder skill (`.agents/skills/mcp-builder/SKILL.md`) |

No new npm dependencies are required. No external services need to be provisioned.

---

## Success Criteria

- `apps/api/src/content/docs.ts` exports a typed `DocsContent` object with at least 5 sections covering: system overview, universe structure, commands reference, validation rules, and real-time streaming.
- `apps/api/src/content/mcp-tools.ts` exports a typed array of exactly 3 MCP tool definitions (`get_universe_state`, `list_universe_commands`, `send_universe_command`) in MCP Protocol `tools/list` format.
- The `send_universe_command` tool's `inputSchema` includes a discriminated union covering all 25 command types from `@solar/domain`.
- `apps/api/src/content/index.ts` re-exports both content modules.
- Both content exports include a `version` field.
- Content modules import no Express or framework code (pure data exports only).
- `npm run build` passes with no new errors.
- `npm run typecheck` passes with no new errors.
- No files outside `apps/api/src/content/` are modified.
