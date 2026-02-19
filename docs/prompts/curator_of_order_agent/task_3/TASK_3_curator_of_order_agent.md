# Task title

Add docs/decisions/MCP entry points (indexes + templates)

## Objective

Create durable “maps” and templates so contributors and agents can quickly find where to put requests/plans/prompts/decisions, and so MCP tooling has a documented extension surface.

## Context to read first

- `docs/requests/README.md`
- `docs/requests/CR_TEMPLATE.md`
- `mcp/server/src/index.ts`
- `mcp/server/src/tools/` tool list

## Constraints

- Keep changes minimal: indexes/templates only (no doc moves in this task).
- Naming conventions must be explicit and consistent.

## Steps

1. Add `docs/README.md` as the docs map and workflow entry point.
2. Add `docs/decisions/ADR_TEMPLATE.md` + `docs/decisions/README.md` (naming + index).
3. Update `docs/requests/README.md` to reference ADR conventions/template.
4. Add `mcp/README.md` and `mcp/server/src/tools/README.md` describing the tool surface and how to extend it.

## Files to create/update

- Create: `docs/README.md`
- Create: `docs/decisions/README.md`
- Create: `docs/decisions/ADR_TEMPLATE.md`
- Update: `docs/requests/README.md`
- Create: `mcp/README.md`
- Create: `mcp/server/src/tools/README.md`

## Acceptance criteria

- [ ] There is a single “docs map” entry point.
- [ ] ADR template and naming are defined and easy to follow.
- [ ] MCP tool list docs match the actual tools registered in `mcp/server/src/index.ts`.

## Verification

```bash
npm run typecheck
npm run build
```

