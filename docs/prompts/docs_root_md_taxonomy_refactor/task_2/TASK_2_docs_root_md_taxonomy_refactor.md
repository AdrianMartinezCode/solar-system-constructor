# Task title

Move + refactor AI copy/paste prompts into `docs/ai_prompts/`

## Objective

Move the AI prompt markdown docs from `docs/` root into `docs/ai_prompts/` and refactor them to follow `docs/ai_prompts/TEMPLATE.md`, preserving any code fences/diagrams.

## Context to read first

- `docs/plans/PLAN_docs_root_md_taxonomy_refactor.md`
- `docs/TAXONOMY.md` (mapping + migration checklist)
- `docs/ai_prompts/TEMPLATE.md`
- Source docs:
  - `docs/PROMPT_AGENT_SYSTEM_SETUP.md`
  - `docs/PROMPT_MINIMAL_AGENT_RUNBOOK.md`
  - `docs/PROMPT_UI_DOMAIN_SEPARATION_REFACTOR.md`

## Constraints

- Only touch the files listed below (no `docs/README.md` updates yet; that’s a later task).
- Use history-preserving moves (`git mv`).
- Preserve all embedded code fences/diagrams; do not externalize diagrams.
- Keep `docs/prompts/` (workflow task prompts) unchanged; do not confuse it with `docs/ai_prompts/`.

## Steps

1. For each file, do a history-preserving move:
   - `git mv docs/PROMPT_AGENT_SYSTEM_SETUP.md docs/ai_prompts/PROMPT_AGENT_SYSTEM_SETUP.md`
   - `git mv docs/PROMPT_MINIMAL_AGENT_RUNBOOK.md docs/ai_prompts/PROMPT_MINIMAL_AGENT_RUNBOOK.md`
   - `git mv docs/PROMPT_UI_DOMAIN_SEPARATION_REFACTOR.md docs/ai_prompts/PROMPT_UI_DOMAIN_SEPARATION_REFACTOR.md`
2. Refactor each moved document to follow `docs/ai_prompts/TEMPLATE.md`:
   - Keep a single top-level title (recommended: `# ...`), then use `## ...` sections mirroring the template.
   - Ensure “Context to read first”, “Constraints / do-nots”, “Files to touch”, and “Verification commands” are present.
3. If any of these prompts reference old paths like `docs/PROMPT_...`, update those references **within these moved files** to the new `docs/ai_prompts/...` paths.

## Files to create/update

- Move + update:
  - `docs/PROMPT_AGENT_SYSTEM_SETUP.md` → `docs/ai_prompts/PROMPT_AGENT_SYSTEM_SETUP.md`
  - `docs/PROMPT_MINIMAL_AGENT_RUNBOOK.md` → `docs/ai_prompts/PROMPT_MINIMAL_AGENT_RUNBOOK.md`
  - `docs/PROMPT_UI_DOMAIN_SEPARATION_REFACTOR.md` → `docs/ai_prompts/PROMPT_UI_DOMAIN_SEPARATION_REFACTOR.md`

## Acceptance criteria

- [ ] All 3 docs are moved into `docs/ai_prompts/` via history-preserving moves.
- [ ] All 3 docs follow the section structure of `docs/ai_prompts/TEMPLATE.md`.
- [ ] No diagrams/code fences are removed; any such blocks remain embedded in the markdown files.
- [ ] No changes are made outside the listed files.

## Verification

```bash
npm run typecheck
npm run build
```

## Notes

- It’s OK if `docs/README.md` still links to the old paths after this task; Task 11 will update indexes/links once all moves are complete.

