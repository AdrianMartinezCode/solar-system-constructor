# Task title

Update docs indexes + post-migration sanity checks (`docs/README.md`, `docs/TAXONOMY.md`)

## Objective

Once all docs have been moved/refactored into taxonomy folders, update the docs map (`docs/README.md`) and taxonomy reference (`docs/TAXONOMY.md`) to reflect the new locations and confirm `docs/` root markdown is “clean”.

## Context to read first

- `docs/plans/PLAN_docs_root_md_taxonomy_refactor.md`
- `docs/README.md`
- `docs/TAXONOMY.md`
- `docs/TAXONOMY.md` migration checklist (added in Task 1)

## Constraints

- Only touch the files listed below.
- Do not do another round of template refactors here; this is an index/link update + sanity check task.

## Steps

1. Update `docs/README.md` so any references to moved docs point at their new paths:
   - Entry points list (e.g. UI/windowing, generator, orbits) should link to `docs/design/...`, `docs/implementation/...`, `docs/guides/...`, etc.
   - Ensure any references to AI prompts use `docs/ai_prompts/...` (not `docs/` root).
2. Update `docs/TAXONOMY.md`:
   - Change the mapping section to reflect the **current** locations (under taxonomy subfolders), not `docs/` root paths.
   - Remove or revise any “no moves yet” language so it matches reality post-migration.
   - If any doc was reclassified during implementation, update the mapping accordingly and add a brief note explaining why.
3. Run sanity checks:
   - Confirm there are no leftover technical markdown docs at `docs/` root besides `docs/README.md` and `docs/TAXONOMY.md`.
   - Do a quick grep for old root paths like `docs/GENERATOR_QUICKREF.md` and replace references in these index docs as needed.

## Files to create/update

- Update:
  - `docs/README.md`
  - `docs/TAXONOMY.md`

## Acceptance criteria

- [ ] `docs/README.md` links point to the new taxonomy paths.
- [ ] `docs/TAXONOMY.md` mapping reflects the new taxonomy paths and no longer claims “no moves yet”.
- [ ] `find docs -maxdepth 1 -type f -name "*.md" | sort` returns only:
  - `docs/README.md`
  - `docs/TAXONOMY.md`
- [ ] No files outside the list are changed.

## Verification

```bash
npm run typecheck
npm run build

find docs -maxdepth 1 -type f -name "*.md" | sort

# Optional: look for stale links to old root locations
rg "docs/[A-Z0-9_]+\\.md" docs/README.md docs/TAXONOMY.md
```

## Notes

- If you discover a large number of stale links *outside* `docs/README.md`/`docs/TAXONOMY.md`, stop and propose a dedicated follow-up task/CR rather than widening this task’s scope.

