# Task title

Move + refactor design docs (batch A) into `docs/design/`

## Objective

Move a first batch of design/architecture docs into `docs/design/` and refactor them to follow `docs/design/TEMPLATE.md`, preserving diagrams and making the docs more scannable.

## Context to read first

- `docs/plans/PLAN_docs_root_md_taxonomy_refactor.md`
- `docs/TAXONOMY.md` (mapping + migration checklist)
- `docs/design/TEMPLATE.md`
- Source docs:
  - `docs/ALGORITHM_FLOW.md`
  - `docs/PROCEDURAL_GENERATOR.md`
  - `docs/TOPOLOGY_GRAMMAR_PRESETS.md`
  - `docs/UI_REDESIGN_WINDOWED.md`

## Constraints

- Only touch the files listed below.
- Use `git mv` for moves.
- Preserve embedded diagrams/code fences (Mermaid included).
- Keep content edits minimal; prefer relocating content into template sections over rewriting.

## Steps

1. Move the files:
   - `git mv docs/ALGORITHM_FLOW.md docs/design/ALGORITHM_FLOW.md`
   - `git mv docs/PROCEDURAL_GENERATOR.md docs/design/PROCEDURAL_GENERATOR.md`
   - `git mv docs/TOPOLOGY_GRAMMAR_PRESETS.md docs/design/TOPOLOGY_GRAMMAR_PRESETS.md`
   - `git mv docs/UI_REDESIGN_WINDOWED.md docs/design/UI_REDESIGN_WINDOWED.md`
2. Refactor each moved doc to match `docs/design/TEMPLATE.md` sections:
   - Keep a single `# <Title>` at the top.
   - Use `## Status` with `Draft | Stable` (choose the most accurate).
   - Ensure “Problem / context”, “Goals / non-goals”, “Key concepts / terminology”, “System overview”, “Key flows”, “Related docs” are present.
3. Place any diagrams in a fitting location (typically “System overview” or “Key flows”) without changing their content.
4. Update any local doc links inside these files to the new taxonomy paths where obvious.

## Files to create/update

- Move + update:
  - `docs/ALGORITHM_FLOW.md` → `docs/design/ALGORITHM_FLOW.md`
  - `docs/PROCEDURAL_GENERATOR.md` → `docs/design/PROCEDURAL_GENERATOR.md`
  - `docs/TOPOLOGY_GRAMMAR_PRESETS.md` → `docs/design/TOPOLOGY_GRAMMAR_PRESETS.md`
  - `docs/UI_REDESIGN_WINDOWED.md` → `docs/design/UI_REDESIGN_WINDOWED.md`

## Acceptance criteria

- [ ] All 4 docs are moved into `docs/design/` via history-preserving moves.
- [ ] Each doc follows the design template section structure (including Status).
- [ ] Diagrams/code fences remain embedded and intact.
- [ ] No files outside the list are changed.

## Verification

```bash
npm run typecheck
npm run build
```

