# Task title

Scan/analyze docs root: add migration checklist + definitive destinations to `docs/TAXONOMY.md`

## Objective

Before moving anything, make the migration **mechanical** by adding an explicit execution checklist to `docs/TAXONOMY.md`: every `docs/*.md` root file is listed with its intended destination (or explicitly kept in root as an index doc).

## Context to read first

- `docs/requests/CR_docs_root_md_taxonomy_refactor.md`
- `docs/decisions/TRIAGE_docs_root_md_taxonomy_refactor.md`
- `docs/plans/PLAN_docs_root_md_taxonomy_refactor.md`
- `docs/TAXONOMY.md`
- Root inventory command output:
  - `find docs -maxdepth 1 -type f -name "*.md" | sort`

## Constraints

- Do not move/rename any files in this task.
- Do not change the taxonomy categories (use the existing ones).
- Keep the checklist concise and easy to copy into later task prompts.

## Steps

1. In `docs/TAXONOMY.md`, add a new section near the mapping called something like:
   - “Migration checklist (docs root → taxonomy folders)” or similar.
2. Add a table (or bullet list) that covers **every** markdown file in `docs/` root:
   - For technical docs, specify the destination path, e.g. `docs/GENERATOR_QUICKREF.md` → `docs/guides/GENERATOR_QUICKREF.md`.
   - For index/taxonomy docs, explicitly call out “stay in root”, e.g. `docs/README.md` → stays.
3. Confirm the checklist aligns with the existing mapping section and `docs/README.md` guidance.

## Files to create/update

- Update: `docs/TAXONOMY.md`

## Acceptance criteria

- [ ] `docs/TAXONOMY.md` includes a migration checklist/table covering every `docs/*.md` root file.
- [ ] The checklist explicitly states that `docs/README.md` and `docs/TAXONOMY.md` remain in `docs/` root.
- [ ] No files are moved in this task.

## Verification

```bash
npm run typecheck
npm run build
```

## Notes

- The goal is to reduce “thinking” in later tasks: once this checklist exists, later tasks should be able to execute `git mv` + template refactors without re-deriving destinations.

