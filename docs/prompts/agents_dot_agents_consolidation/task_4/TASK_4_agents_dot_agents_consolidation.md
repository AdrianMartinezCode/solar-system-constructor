# Task 4 — Migrate all skills into `.agents/skills/<skill>/SKILL.md` using the new template

## Task title

Convert legacy `agents/skills/*.md` into folder-per-skill `.agents/skills/*/SKILL.md`

## Objective

Move/convert all skills so the only canonical skill locations are:

- `.agents/skills/<kebab-skill-slug>/SKILL.md`

Each `SKILL.md` must include:

- YAML frontmatter (`name`, `description`, optional `license` + `metadata`)
- Standard headings from `.agents/skills/_template/SKILL.md`

Also ensure the pre-existing `.agents/skills/*/SKILL.md` skills conform to the template minimally (add missing standard headings near the top; keep the rest of their content intact).

## Context to read first

- `.agents/skills/_template/SKILL.md` (created in Task 2)
- `agents/skills/README.md` (current list + conventions)
- `agents/skills/_template.md` (legacy template)
- `agents/skills/WORKFLOW.md`
- All files in `agents/skills/*.md`
- Existing `.agents/skills/*/SKILL.md` examples

## Constraints

- Keep this task focused on **skills only** (no orchestrator/role moves here).
- Content edits should be minimal and primarily structural (frontmatter + standardized headings).
- Prefer `git mv` for file moves.

## Steps

1. Define the skill folder mapping (kebab-case folder slugs), e.g.:
   - `agents/skills/change_request_triage.md` → `.agents/skills/change-request-triage/SKILL.md`
   - `agents/skills/po_task_decomposer.md` → `.agents/skills/po-task-decomposer/SKILL.md`
   - `agents/skills/prompt_writer.md` → `.agents/skills/prompt-writer/SKILL.md`
   - `agents/skills/dev_task_executor.md` → `.agents/skills/dev-task-executor/SKILL.md`
   - `agents/skills/curator_entropy_audit.md` → `.agents/skills/curator-entropy-audit/SKILL.md`
   - `agents/skills/curator_docs_librarian.md` → `.agents/skills/curator-docs-librarian/SKILL.md`
   - `agents/skills/curator_decision_steward.md` → `.agents/skills/curator-decision-steward/SKILL.md`
2. Handle special cases:
   - Convert `agents/skills/WORKFLOW.md` into `.agents/skills/workflow/SKILL.md` (or, if you chose a different canonical location in the ADR, apply that consistently).
   - Convert legacy `agents/skills/_template.md` into `.agents/skills/_template/SKILL.md` (folder-based).
3. For each converted skill:
   - Add YAML frontmatter (`name` should match the folder slug).
   - Ensure the required headings exist (can be brief).
4. Update `.agents/skills/README.md` to catalog skills by folder slug + short purpose.
5. For the existing `.agents` skills (`architecture-patterns`, `react-architect-skills`):
   - Add missing standard headings near the top (Purpose/Inputs/Outputs/etc.).
   - Do not rewrite their long guideline sections; just make them template-compliant.

## Files to create/update

- Move/convert:
  - `agents/skills/change_request_triage.md`
  - `agents/skills/po_task_decomposer.md`
  - `agents/skills/prompt_writer.md`
  - `agents/skills/dev_task_executor.md`
  - `agents/skills/curator_entropy_audit.md`
  - `agents/skills/curator_docs_librarian.md`
  - `agents/skills/curator_decision_steward.md`
  - `agents/skills/WORKFLOW.md`
  - `agents/skills/_template.md`
- Update:
  - `.agents/skills/README.md`
  - `.agents/skills/architecture-patterns/SKILL.md`
  - `.agents/skills/react-architect-skills/SKILL.md`

## Acceptance criteria

- Every skill lives under `.agents/skills/<kebab-skill-slug>/SKILL.md`.
- Each skill file has YAML frontmatter and the standard headings.
- No role/orchestrator docs reference `agents/skills/...` anymore (they should already point to `.agents/skills/...` from Task 3).

## Verification

```bash
npm run build
```

