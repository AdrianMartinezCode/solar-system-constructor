# Task title

Move + refactor implementation docs (batch A) into `docs/implementation/`

## Objective

Move the first batch of feature implementation docs into `docs/implementation/` and refactor them to follow `docs/implementation/TEMPLATE.md`, preserving diagrams and ensuring verification notes exist.

## Context to read first

- `docs/plans/PLAN_docs_root_md_taxonomy_refactor.md`
- `docs/TAXONOMY.md`
- `docs/implementation/TEMPLATE.md`
- Source docs:
  - `docs/GENERATOR_IMPLEMENTATION.md`
  - `docs/ELLIPTICAL_ORBITS.md`
  - `docs/GROUP_ISOLATION_FEATURE.md`
  - `docs/TIME_SCALE_FEATURE.md`
  - `docs/WINDOWED_UI_IMPLEMENTATION.md`

## Constraints

- Only touch the files listed below.
- Use `git mv` for moves.
- Preserve diagrams/code fences.
- Prefer reorganizing content into template headings; avoid rewriting the technical substance unless needed for clarity.

## Steps

1. Move the files:
   - `git mv docs/GENERATOR_IMPLEMENTATION.md docs/implementation/GENERATOR_IMPLEMENTATION.md`
   - `git mv docs/ELLIPTICAL_ORBITS.md docs/implementation/ELLIPTICAL_ORBITS.md`
   - `git mv docs/GROUP_ISOLATION_FEATURE.md docs/implementation/GROUP_ISOLATION_FEATURE.md`
   - `git mv docs/TIME_SCALE_FEATURE.md docs/implementation/TIME_SCALE_FEATURE.md`
   - `git mv docs/WINDOWED_UI_IMPLEMENTATION.md docs/implementation/WINDOWED_UI_IMPLEMENTATION.md`
2. Refactor each moved doc to match `docs/implementation/TEMPLATE.md` sections:
   - Ensure “Overview (user-facing outcome)”, “Behavior / UX notes”, “Algorithms / approach”, “Files touched”, and “Verification” are present.
3. Preserve embedded diagrams/code fences (place them under “Algorithms / approach” or “Behavior / UX notes” as appropriate).
4. Fix obvious local doc links inside these docs to the new taxonomy paths.

## Files to create/update

- Move + update:
  - `docs/GENERATOR_IMPLEMENTATION.md` → `docs/implementation/GENERATOR_IMPLEMENTATION.md`
  - `docs/ELLIPTICAL_ORBITS.md` → `docs/implementation/ELLIPTICAL_ORBITS.md`
  - `docs/GROUP_ISOLATION_FEATURE.md` → `docs/implementation/GROUP_ISOLATION_FEATURE.md`
  - `docs/TIME_SCALE_FEATURE.md` → `docs/implementation/TIME_SCALE_FEATURE.md`
  - `docs/WINDOWED_UI_IMPLEMENTATION.md` → `docs/implementation/WINDOWED_UI_IMPLEMENTATION.md`

## Acceptance criteria

- [ ] All 5 docs are moved into `docs/implementation/` via history-preserving moves.
- [ ] Each doc follows the implementation template section structure.
- [ ] Each doc contains a “Verification” section with at least one concrete manual check (and scripts if applicable).
- [ ] Diagrams/code fences remain embedded and intact.
- [ ] No files outside the list are changed.

## Verification

```bash
npm run typecheck
npm run build
```

