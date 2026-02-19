# Task title

Move + refactor design docs (batch B) into `docs/design/`

## Objective

Move the remaining design docs into `docs/design/` and refactor them to follow `docs/design/TEMPLATE.md`, preserving diagrams.

## Context to read first

- `docs/plans/PLAN_docs_root_md_taxonomy_refactor.md`
- `docs/TAXONOMY.md`
- `docs/design/TEMPLATE.md`
- Source docs:
  - `docs/BODY_EDITOR_STRUCTURE.md`
  - `docs/BODY_POV_CAMERA.md`
  - `docs/UI_PREVIEW.md`

## Constraints

- Only touch the files listed below.
- Use `git mv` for moves.
- Preserve diagrams/code fences.

## Steps

1. Move the files:
   - `git mv docs/BODY_EDITOR_STRUCTURE.md docs/design/BODY_EDITOR_STRUCTURE.md`
   - `git mv docs/BODY_POV_CAMERA.md docs/design/BODY_POV_CAMERA.md`
   - `git mv docs/UI_PREVIEW.md docs/design/UI_PREVIEW.md`
2. Refactor each moved doc to match `docs/design/TEMPLATE.md`:
   - `# <Title>` followed by `## ...` template sections.
   - Add `## Status` (`Draft | Stable`).
3. Keep any diagrams embedded (relocate them under “System overview” or “Key flows” as appropriate).
4. Fix obvious intra-doc links inside these docs to the new taxonomy paths.

## Files to create/update

- Move + update:
  - `docs/BODY_EDITOR_STRUCTURE.md` → `docs/design/BODY_EDITOR_STRUCTURE.md`
  - `docs/BODY_POV_CAMERA.md` → `docs/design/BODY_POV_CAMERA.md`
  - `docs/UI_PREVIEW.md` → `docs/design/UI_PREVIEW.md`

## Acceptance criteria

- [ ] All 3 docs are moved into `docs/design/` via history-preserving moves.
- [ ] Each doc follows the design template section structure (including Status).
- [ ] Diagrams/code fences remain embedded and intact.
- [ ] No files outside the list are changed.

## Verification

```bash
npm run typecheck
npm run build
```

