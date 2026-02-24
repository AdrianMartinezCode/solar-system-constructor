# Tasks: mcp-docs-and-tools

**Change**: `mcp-docs-and-tools`
**Date**: 2026-02-24
**Status**: Complete — all tasks implemented and verified

> **Builder note**: Load conditional skill `.agents/skills/mcp-builder/SKILL.md` for tasks 2.2–2.4 (MCP tool definitions).

---

## Phase 1: Foundation

- [x] 1.1 **Create content type definitions** — Create `apps/api/src/content/types.ts` with four interfaces: `DocsSection`, `DocsContent`, `McpToolAnnotations`, `McpToolDefinition`. Follow the exact shapes from `design.md` → Interfaces / Contracts section. `McpToolDefinition.inputSchema` must type `$defs` as `Record<string, unknown>` to accommodate JSON Schema `$ref` usage. No framework imports — types only.
  - **Files**: `apps/api/src/content/types.ts` (new)
  - **Verify**: `npm run typecheck` passes

---

## Phase 2: Core Implementation

- [x] 2.1 **Populate documentation content** — Populate `apps/api/src/content/docs.ts` with a `docsContent: DocsContent` named export. Import `DocsContent` from `./types.js`. Set `title` to `"Solar System Constructor — MCP Server Documentation"` and `version` to `"0.1.0"`. Include all 5 required sections with unique `id` values:
  1. `system-overview` — What the Solar System Constructor is; how the MCP server enables AI-driven universe construction; high-level architecture (domain → API → MCP).
  2. `universe-structure` — `UniverseState` 9 fields (from `packages/domain/src/universe/state.ts`); entity types: Star (with `bodyType` variants), Group, SmallBodyField, ProtoplanetaryDisk, NebulaRegion, AsteroidBelt; hierarchy model (`parentId`, `children`, `rootIds`).
  3. `commands-reference` — All 25 command types organized by 10 categories (from `packages/domain/src/universe/commands.ts`). For each command: name, purpose, required fields.
  4. `validation-rules` — Cycle detection for star hierarchy and group hierarchy; entity existence checks; error events returned for invalid operations. Reference `packages/domain/src/universe/validate.ts`.
  5. `realtime-streaming` — SSE endpoint `GET /universes/:id/events`; event format; connection lifecycle; how commands flow from POST to SSE broadcast.
  - **Files**: `apps/api/src/content/docs.ts` (populate empty)
  - **Reference** (read-only): `packages/domain/src/universe/state.ts`, `packages/domain/src/universe/commands.ts`, `packages/domain/src/types.ts`, `packages/domain/src/universe/validate.ts`
  - **Verify**: `npm run typecheck` passes; `docsContent.sections.length >= 5`; all `id` values are unique; commands-reference section mentions all 25 command names

- [x] 2.2 **Scaffold MCP tools file with read-only tools** — Populate `apps/api/src/content/mcp-tools.ts` with: `import type { McpToolDefinition } from './types.js'`, the `MCP_TOOLS_VERSION = '0.1.0'` string constant, and the `mcpTools: McpToolDefinition[]` array containing the first two tool definitions:
  - `get_universe_state` — `inputSchema` requires `universeId` (string). `annotations`: `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: false`.
  - `list_universe_commands` — `inputSchema` requires `universeId` (string), optional `category` (enum of 10 category slugs). `annotations`: `readOnlyHint: true`, `destructiveHint: false`, `idempotentHint: true`, `openWorldHint: false`.
  - Leave a `// send_universe_command tool added in task 2.3` placeholder comment in the array.
  - **Files**: `apps/api/src/content/mcp-tools.ts` (populate empty)
  - **Verify**: `npm run typecheck` passes; `mcpTools.length === 2`

- [x] 2.3 **Add `send_universe_command` — `$defs` sub-schemas** — In `apps/api/src/content/mcp-tools.ts`, replace the placeholder comment with the `send_universe_command` tool definition. Set `annotations`: `readOnlyHint: false`, `destructiveHint: true`, `idempotentHint: false`, `openWorldHint: false`. The `inputSchema` requires `universeId` (string) and `command` (the discriminated union). Populate the `$defs` section with all 16 reusable sub-schemas, each derived faithfully from the corresponding domain type in `packages/domain/src/types.ts`:

  | `$defs` key | Source domain type |
  |---|---|
  | `Position` | `Position` |
  | `PlanetaryRing` | `PlanetaryRing` |
  | `CometMeta` | `CometMeta` |
  | `LagrangePointMeta` | `LagrangePointMeta` |
  | `BlackHoleProperties` | `BlackHoleProperties` |
  | `RoguePlanetMeta` | `RoguePlanetMeta` |
  | `GroupChild` | `GroupChild` |
  | `StarPayload` | `Omit<Star, 'id' \| 'children'>` |
  | `PartialStar` | `Partial<Star>` (empty `required`) |
  | `GroupPayload` | `Omit<Group, 'id'>` |
  | `PartialGroup` | `Partial<Group>` (empty `required`) |
  | `SmallBodyField` | `SmallBodyField` |
  | `ProtoplanetaryDisk` | `ProtoplanetaryDisk` |
  | `NebulaRegion` | `NebulaRegion` |
  | `AsteroidBelt` | `AsteroidBelt` |
  | `UniverseSnapshot` | `ReplaceSnapshotCommand.snapshot` |

  Each `$defs` entry must include a `description` referencing the source type and file. Use correct `required` vs optional classification. Model `Record<string, T>` as `{ type: "object", additionalProperties: { $ref } }`. Model `Partial<T>` with empty `required` array. Model `string | null` as `{ type: ["string", "null"] }`.

  The `command` property should have `oneOf: []` (empty array — populated in task 2.4) and `discriminator: { propertyName: "type" }`.

  - **Files**: `apps/api/src/content/mcp-tools.ts`
  - **Reference** (read-only): `packages/domain/src/types.ts`, `packages/domain/src/universe/commands.ts`
  - **Verify**: `npm run typecheck` passes; `$defs` has exactly 16 keys; `mcpTools.length === 3`
  - **Note**: This is the most complex task — carefully verify each schema against the source domain type.

- [x] 2.4 **Add `send_universe_command` — `oneOf` command variants** — In `apps/api/src/content/mcp-tools.ts`, populate the `send_universe_command` tool's `command.oneOf` array with all 25 command variant schemas. Each variant follows the pattern: `{ type: "object", properties: { type: { const: "<name>" }, ... }, required: ["type", ...], additionalProperties: false }`. Use `{ $ref: "#/$defs/<Type>" }` for complex fields. Commands by category:

  | Category | Commands (count) |
  |---|---|
  | Simulation | `tick` (1) |
  | Star CRUD | `addStar`, `updateStar`, `removeStar` (3) |
  | Star hierarchy | `attachStar`, `detachStar` (2) |
  | Group CRUD | `addGroup`, `updateGroup`, `removeGroup` (3) |
  | Group hierarchy | `addToGroup`, `removeFromGroup`, `moveToGroup` (3) |
  | Small body fields | `setSmallBodyFields`, `updateSmallBodyField`, `removeSmallBodyField` (3) |
  | Protoplanetary disks | `setProtoplanetaryDisks`, `addProtoplanetaryDisk`, `updateProtoplanetaryDisk`, `removeProtoplanetaryDisk` (4) |
  | Nebulae | `setNebulae`, `updateNebula`, `removeNebula` (3) |
  | Rings | `updateRing`, `removeRing` (2) |
  | Snapshot | `replaceSnapshot` (1) |

  Derive required fields from each command interface in `packages/domain/src/universe/commands.ts`.

  - **Files**: `apps/api/src/content/mcp-tools.ts`
  - **Reference** (read-only): `packages/domain/src/universe/commands.ts`, `packages/domain/src/types.ts`
  - **Verify**: `npm run typecheck` passes; `command.oneOf.length === 25`; each entry has a unique `type.const` value matching the 25 command names from the domain

---

## Phase 3: Integration

- [x] 3.1 **Populate barrel re-exports** — Populate `apps/api/src/content/index.ts` with re-exports per design.md:
  ```
  export { docsContent } from './docs.js';
  export { mcpTools, MCP_TOOLS_VERSION } from './mcp-tools.js';
  export type { DocsContent, DocsSection, McpToolDefinition, McpToolAnnotations } from './types.js';
  ```
  - **Files**: `apps/api/src/content/index.ts` (populate empty)
  - **Verify**: `npm run typecheck` passes; all 6 named exports are accessible from the barrel

---

## Phase 4: Testing

- [x] 4.1 **Verify type compilation and build** — Run `npm run typecheck` and `npm run build` against the full project. Confirm zero new errors.
  - **Covers**: Scenario MOD-4 (REQ-MOD-4); Success Criteria: "`npm run build` passes with no new errors" and "`npm run typecheck` passes with no new errors"

- [x] 4.2 **Verify structural correctness against spec scenarios** — Write a lightweight test file `apps/api/src/content/__tests__/content.test.ts` (or manually inspect) confirming ALL of the following:
  - `mcpTools` array has exactly 3 entries → Scenario TOOL-1 (REQ-TOOL-1)
  - Each tool has `name` (string), `description` (string), `inputSchema` (object), `annotations` (object) → Scenario TOOL-2 (REQ-TOOL-2)
  - Each `annotations` has `readOnlyHint`, `destructiveHint`, `idempotentHint`, `openWorldHint` (boolean) → Scenario TOOL-3 (REQ-TOOL-3)
  - `get_universe_state` requires `universeId`; `readOnlyHint: true`, `destructiveHint: false` → Scenarios TOOL-4a/b/c (REQ-TOOL-4)
  - `list_universe_commands` requires `universeId`; `readOnlyHint: true`, `destructiveHint: false` → Scenarios TOOL-5a/b/c (REQ-TOOL-5)
  - `send_universe_command` requires `universeId` + `command`; `readOnlyHint: false`, `destructiveHint: true` → Scenarios TOOL-6a/b/c (REQ-TOOL-6)
  - `command.oneOf` has exactly 25 entries, each with unique `type.const` matching domain command names → Scenario TOOL-7 (REQ-TOOL-7)
  - Each variant has `type` property with `const` + correct required fields → Scenario TOOL-8 (REQ-TOOL-8)
  - All `inputSchema` roots are `{ type: "object" }` with non-empty `required` → Scenario TOOL-9 (REQ-TOOL-9)
  - `docsContent` has `title` (string), `version` (string), `sections` (array) → Scenario DOC-1 (REQ-DOC-1)
  - Each section has `id`, `heading`, `body` (strings) → Scenario DOC-2 (REQ-DOC-2)
  - Section `id` values are unique → Scenario DOC-3 (REQ-DOC-3)
  - Sections cover: system overview, universe structure, commands, validation, streaming → Scenarios DOC-4a–4e (REQ-DOC-4)
  - Commands reference names all 25 commands across 10 categories → Scenario DOC-5 (REQ-DOC-5)
  - Validation rules mention cycle detection and existence checks → Scenario DOC-6 (REQ-DOC-6)
  - Both exports include version fields → Scenarios MOD-2a/b (REQ-MOD-2)
  - No framework/IO imports → Scenario MOD-3a (REQ-MOD-3)
  - Barrel re-exports both modules + types → Scenario MOD-1 (REQ-MOD-1)
  - **Files**: `apps/api/src/content/__tests__/content.test.ts` (new, optional — manual verification acceptable)
  - **Verify**: All assertions pass (or manual checklist completed)

---

## Phase 5: Cleanup

- [x] 5.1 **Add traceability comments to `$defs` and command variants** — Review `apps/api/src/content/mcp-tools.ts` and ensure every `$defs` entry has a `description` field referencing the source domain type and file path (e.g., `"Star creation payload. Maps to Omit<Star, 'id' | 'children'> from packages/domain/src/types.ts"`). Add a header comment in `mcp-tools.ts` and `docs.ts` listing the domain files each content module depends on, per the schema-drift risk mitigation in the proposal.
  - **Files**: `apps/api/src/content/mcp-tools.ts`, `apps/api/src/content/docs.ts`
  - **Verify**: Every `$defs` entry has a `description`; header comment lists dependencies

- [x] 5.2 **Final build verification** — Run `npm run build` and `npm run typecheck` one final time to confirm no regressions from cleanup edits. Verify no files outside `apps/api/src/content/` were modified (per Success Criteria).
  - **Verify**: `npm run build` clean; `npm run typecheck` clean; `git diff --name-only` shows only files in `apps/api/src/content/`

---

## Task Dependency Graph

```
1.1 ──┬── 2.1 ──────────────────────────┐
      ├── 2.2 ── 2.3 ── 2.4 ──────────┤
      │                                  ├── 3.1 ── 4.1 ── 4.2 ── 5.1 ── 5.2
      └─────────────────────────────────┘
```

- **1.1** blocks all Phase 2 tasks (types must exist first)
- **2.2** blocks **2.3** (file scaffold must exist); **2.3** blocks **2.4** (`$defs` must exist for `$ref`)
- **2.1** and **2.2** can run in parallel (independent files)
- **3.1** blocks on all Phase 2 tasks (all exports must exist for barrel)
- Phase 4 and 5 are sequential

---

## Summary

| Phase | Tasks | Files touched |
|---|---|---|
| 1. Foundation | 1 | 1 (new) |
| 2. Core Implementation | 4 | 2 (populate empty) |
| 3. Integration | 1 | 1 (populate empty) |
| 4. Testing | 2 | 0–1 (optional test file) |
| 5. Cleanup | 2 | 2 (comment additions) |
| **Total** | **10** | **4 content files + 0–1 test file** |
