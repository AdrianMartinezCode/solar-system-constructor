# Task title

Move + refactor summary docs (batch B) into `docs/summaries/`

## Objective

Move the remaining summary docs into `docs/summaries/` and refactor them to follow `docs/summaries/TEMPLATE.md`.

## Context to read first

- `docs/plans/PLAN_docs_root_md_taxonomy_refactor.md`
- `docs/TAXONOMY.md`
- `docs/summaries/TEMPLATE.md`
- Source docs:
  - `docs/PRNG_SUMMARY.md`
  - `docs/STATS_REFACTOR_SUMMARY.md`
  - `docs/UI_IMPLEMENTATION_SUMMARY.md`

## Constraints

- Only touch the files listed below.
- Use `git mv` for moves.
- Preserve diagrams/code fences.

## Steps

1. Move the files:
   - `git mv docs/PRNG_SUMMARY.md docs/summaries/PRNG_SUMMARY.md`
   - `git mv docs/STATS_REFACTOR_SUMMARY.md docs/summaries/STATS_REFACTOR_SUMMARY.md`
   - `git mv docs/UI_IMPLEMENTATION_SUMMARY.md docs/summaries/UI_IMPLEMENTATION_SUMMARY.md`
2. Refactor each moved doc to match `docs/summaries/TEMPLATE.md` sections.
3. Ensure “Verification” is present and includes at least one concrete step (script or manual check).
4. Preserve embedded diagrams/code fences.

## Files to create/update

- Move + update:
  - `docs/PRNG_SUMMARY.md` → `docs/summaries/PRNG_SUMMARY.md`
  - `docs/STATS_REFACTOR_SUMMARY.md` → `docs/summaries/STATS_REFACTOR_SUMMARY.md`
  - `docs/UI_IMPLEMENTATION_SUMMARY.md` → `docs/summaries/UI_IMPLEMENTATION_SUMMARY.md`

## Acceptance criteria

- [ ] All 3 docs are moved into `docs/summaries/` via history-preserving moves.
- [ ] Each doc follows the summary template section structure.
- [ ] Diagrams/code fences remain embedded and intact.
- [ ] No files outside the list are changed.

## Verification

```bash
npm run typecheck
npm run build
```

