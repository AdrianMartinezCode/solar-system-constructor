# Task title

Move + refactor implementation docs (batch B) into `docs/implementation/`

## Objective

Move the second batch of implementation docs into `docs/implementation/` and refactor them to match `docs/implementation/TEMPLATE.md`, preserving diagrams.

## Context to read first

- `docs/plans/PLAN_docs_root_md_taxonomy_refactor.md`
- `docs/TAXONOMY.md`
- `docs/implementation/TEMPLATE.md`
- Source docs:
  - `docs/ASTEROID_BELT_IMPLEMENTATION.md`
  - `docs/KUIPER_BELT_IMPLEMENTATION.md`
  - `docs/RING_SYSTEMS_IMPLEMENTATION.md`
  - `docs/COMETS_IMPLEMENTATION.md`
  - `docs/BLACK_HOLES_IMPLEMENTATION.md`

## Constraints

- Only touch the files listed below.
- Use `git mv` for moves.
- Preserve diagrams/code fences.

## Steps

1. Move the files:
   - `git mv docs/ASTEROID_BELT_IMPLEMENTATION.md docs/implementation/ASTEROID_BELT_IMPLEMENTATION.md`
   - `git mv docs/KUIPER_BELT_IMPLEMENTATION.md docs/implementation/KUIPER_BELT_IMPLEMENTATION.md`
   - `git mv docs/RING_SYSTEMS_IMPLEMENTATION.md docs/implementation/RING_SYSTEMS_IMPLEMENTATION.md`
   - `git mv docs/COMETS_IMPLEMENTATION.md docs/implementation/COMETS_IMPLEMENTATION.md`
   - `git mv docs/BLACK_HOLES_IMPLEMENTATION.md docs/implementation/BLACK_HOLES_IMPLEMENTATION.md`
2. Refactor each moved doc to match the implementation template sections.
3. Preserve embedded diagrams/code fences; relocate them into the most appropriate template section.
4. Fix obvious local doc links inside these docs to the new taxonomy paths.

## Files to create/update

- Move + update:
  - `docs/ASTEROID_BELT_IMPLEMENTATION.md` → `docs/implementation/ASTEROID_BELT_IMPLEMENTATION.md`
  - `docs/KUIPER_BELT_IMPLEMENTATION.md` → `docs/implementation/KUIPER_BELT_IMPLEMENTATION.md`
  - `docs/RING_SYSTEMS_IMPLEMENTATION.md` → `docs/implementation/RING_SYSTEMS_IMPLEMENTATION.md`
  - `docs/COMETS_IMPLEMENTATION.md` → `docs/implementation/COMETS_IMPLEMENTATION.md`
  - `docs/BLACK_HOLES_IMPLEMENTATION.md` → `docs/implementation/BLACK_HOLES_IMPLEMENTATION.md`

## Acceptance criteria

- [ ] All 5 docs are moved into `docs/implementation/` via history-preserving moves.
- [ ] Each doc follows the implementation template section structure.
- [ ] Diagrams/code fences remain embedded and intact.
- [ ] No files outside the list are changed.

## Verification

```bash
npm run typecheck
npm run build
```

