# Task title

Move + refactor guide docs into `docs/guides/`

## Objective

Move the guide/quick-reference docs from `docs/` root into `docs/guides/` and refactor them to follow `docs/guides/TEMPLATE.md`, preserving any diagrams and improving local navigation.

## Context to read first

- `docs/plans/PLAN_docs_root_md_taxonomy_refactor.md`
- `docs/TAXONOMY.md` (mapping + migration checklist)
- `docs/guides/TEMPLATE.md`
- Source docs:
  - `docs/GENERATOR_QUICKREF.md`
  - `docs/GENERATOR_UI_INTEGRATION.md`
  - `docs/KEYBOARD_SHORTCUTS.md`
  - `docs/PRNG_README.md`
  - `docs/STATS_USAGE_GUIDE.md`

## Constraints

- Only touch the files listed below.
- Use `git mv` for moves.
- Preserve embedded diagrams/code fences.
- Do not update `docs/README.md` yet (final task).

## Steps

1. Move the files:
   - `git mv docs/GENERATOR_QUICKREF.md docs/guides/GENERATOR_QUICKREF.md`
   - `git mv docs/GENERATOR_UI_INTEGRATION.md docs/guides/GENERATOR_UI_INTEGRATION.md`
   - `git mv docs/KEYBOARD_SHORTCUTS.md docs/guides/KEYBOARD_SHORTCUTS.md`
   - `git mv docs/PRNG_README.md docs/guides/PRNG_README.md`
   - `git mv docs/STATS_USAGE_GUIDE.md docs/guides/STATS_USAGE_GUIDE.md`
2. Refactor each moved guide to match `docs/guides/TEMPLATE.md`:
   - `# <Title>`
   - `## Audience`, `## Prerequisites`, `## Quick start`, `## How-to`, `## Troubleshooting / FAQ`, `## Reference`
3. Fix obvious broken relative links **inside these files** (e.g. if they referenced `docs/FOO.md`, update to `docs/<category>/FOO.md` based on the taxonomy mapping).

## Files to create/update

- Move + update:
  - `docs/GENERATOR_QUICKREF.md` → `docs/guides/GENERATOR_QUICKREF.md`
  - `docs/GENERATOR_UI_INTEGRATION.md` → `docs/guides/GENERATOR_UI_INTEGRATION.md`
  - `docs/KEYBOARD_SHORTCUTS.md` → `docs/guides/KEYBOARD_SHORTCUTS.md`
  - `docs/PRNG_README.md` → `docs/guides/PRNG_README.md`
  - `docs/STATS_USAGE_GUIDE.md` → `docs/guides/STATS_USAGE_GUIDE.md`

## Acceptance criteria

- [ ] All 5 docs are moved into `docs/guides/` via history-preserving moves.
- [ ] Each doc matches the guide template sections.
- [ ] Diagrams/code fences remain embedded and intact.
- [ ] No files outside the list are changed.

## Verification

```bash
npm run typecheck
npm run build
```

## Notes

- Don’t over-edit prose. The main goal is consistent structure and correct link destinations.

