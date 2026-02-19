# Task title

Move + refactor summary docs (batch A) into `docs/summaries/`

## Objective

Move a first batch of summary/delivery/refactor notes into `docs/summaries/` and refactor them to follow `docs/summaries/TEMPLATE.md`, preserving any diagrams.

## Context to read first

- `docs/plans/PLAN_docs_root_md_taxonomy_refactor.md`
- `docs/TAXONOMY.md`
- `docs/summaries/TEMPLATE.md`
- Source docs:
  - `docs/BELT_PARTICLE_FIELD_REFACTORING.md`
  - `docs/BODY_EDITOR_REFACTOR_SUMMARY.md`
  - `docs/COMETS_DOCUMENTATION_UPDATES.md`
  - `docs/GENERATOR_DELIVERY.md`

## Constraints

- Only touch the files listed below.
- Use `git mv` for moves.
- Preserve diagrams/code fences.
- Keep the content mostly the same; restructure for scannability and template compliance.

## Steps

1. Move the files:
   - `git mv docs/BELT_PARTICLE_FIELD_REFACTORING.md docs/summaries/BELT_PARTICLE_FIELD_REFACTORING.md`
   - `git mv docs/BODY_EDITOR_REFACTOR_SUMMARY.md docs/summaries/BODY_EDITOR_REFACTOR_SUMMARY.md`
   - `git mv docs/COMETS_DOCUMENTATION_UPDATES.md docs/summaries/COMETS_DOCUMENTATION_UPDATES.md`
   - `git mv docs/GENERATOR_DELIVERY.md docs/summaries/GENERATOR_DELIVERY.md`
2. Refactor each moved doc to match `docs/summaries/TEMPLATE.md` sections.
3. Ensure “Files touched”, “Risk / rollback notes”, and “Verification” are present (even if minimal).
4. Preserve embedded diagrams/code fences.

## Files to create/update

- Move + update:
  - `docs/BELT_PARTICLE_FIELD_REFACTORING.md` → `docs/summaries/BELT_PARTICLE_FIELD_REFACTORING.md`
  - `docs/BODY_EDITOR_REFACTOR_SUMMARY.md` → `docs/summaries/BODY_EDITOR_REFACTOR_SUMMARY.md`
  - `docs/COMETS_DOCUMENTATION_UPDATES.md` → `docs/summaries/COMETS_DOCUMENTATION_UPDATES.md`
  - `docs/GENERATOR_DELIVERY.md` → `docs/summaries/GENERATOR_DELIVERY.md`

## Acceptance criteria

- [ ] All 4 docs are moved into `docs/summaries/` via history-preserving moves.
- [ ] Each doc follows the summary template section structure.
- [ ] Diagrams/code fences remain embedded and intact.
- [ ] No files outside the list are changed.

## Verification

```bash
npm run typecheck
npm run build
```

