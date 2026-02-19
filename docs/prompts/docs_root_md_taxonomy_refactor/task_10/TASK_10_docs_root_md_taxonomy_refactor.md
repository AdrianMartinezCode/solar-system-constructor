# Task title

Move + refactor implementation docs (batch C) into `docs/implementation/`

## Objective

Move the remaining implementation docs into `docs/implementation/` and refactor them to match `docs/implementation/TEMPLATE.md`, preserving diagrams.

## Context to read first

- `docs/plans/PLAN_docs_root_md_taxonomy_refactor.md`
- `docs/TAXONOMY.md`
- `docs/implementation/TEMPLATE.md`
- Source docs:
  - `docs/LAGRANGE_POINTS_IMPLEMENTATION.md`
  - `docs/NEBULAE_IMPLEMENTATION.md`
  - `docs/PROTOPLANETARY_DISK_IMPLEMENTATION.md`
  - `docs/ROGUE_PLANETS.md`

## Constraints

- Only touch the files listed below.
- Use `git mv` for moves.
- Preserve diagrams/code fences.

## Steps

1. Move the files:
   - `git mv docs/LAGRANGE_POINTS_IMPLEMENTATION.md docs/implementation/LAGRANGE_POINTS_IMPLEMENTATION.md`
   - `git mv docs/NEBULAE_IMPLEMENTATION.md docs/implementation/NEBULAE_IMPLEMENTATION.md`
   - `git mv docs/PROTOPLANETARY_DISK_IMPLEMENTATION.md docs/implementation/PROTOPLANETARY_DISK_IMPLEMENTATION.md`
   - `git mv docs/ROGUE_PLANETS.md docs/implementation/ROGUE_PLANETS.md`
2. Refactor each moved doc to match the implementation template sections.
3. Preserve embedded diagrams/code fences; relocate them into the most appropriate template section.
4. Fix obvious local doc links inside these docs to the new taxonomy paths.

## Files to create/update

- Move + update:
  - `docs/LAGRANGE_POINTS_IMPLEMENTATION.md` → `docs/implementation/LAGRANGE_POINTS_IMPLEMENTATION.md`
  - `docs/NEBULAE_IMPLEMENTATION.md` → `docs/implementation/NEBULAE_IMPLEMENTATION.md`
  - `docs/PROTOPLANETARY_DISK_IMPLEMENTATION.md` → `docs/implementation/PROTOPLANETARY_DISK_IMPLEMENTATION.md`
  - `docs/ROGUE_PLANETS.md` → `docs/implementation/ROGUE_PLANETS.md`

## Acceptance criteria

- [ ] All 4 docs are moved into `docs/implementation/` via history-preserving moves.
- [ ] Each doc follows the implementation template section structure.
- [ ] Diagrams/code fences remain embedded and intact.
- [ ] No files outside the list are changed.

## Verification

```bash
npm run typecheck
npm run build
```

