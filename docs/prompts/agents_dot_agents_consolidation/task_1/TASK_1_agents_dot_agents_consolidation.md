# Task 1 — ADR: Make `.agents/` the single canonical agent root

## Task title

ADR: Consolidate agent contract/roles/skills into `.agents/` only

## Objective

Capture a durable decision that:

- `.agents/` is the **only** canonical agent system root
- `.agents/agents.md` is the entry point (orchestrator/global contract)
- `.agents/roles/*` and `.agents/skills/<kebab-skill-slug>/SKILL.md` are the canonical locations
- legacy `agents/` will be removed after migrating content and references

## Context to read first

- `docs/decisions/ADR_TEMPLATE.md`
- `docs/decisions/README.md`
- `docs/requests/CR_agents_dot_agents_consolidation.md`
- `.agents/skills/architecture-patterns/SKILL.md` (frontmatter style example)
- `.agents/skills/react-architect-skills/SKILL.md` (frontmatter + metadata example)

## Constraints

- Planning/capture only: do not move or rename any agent files in this task.
- Keep ADR short (1–2 pages max).

## Steps

1. Pick the next ADR number (4-digit, zero-padded) by checking `docs/decisions/README.md`.
2. Create `docs/decisions/ADR_<nnnn>_agents_dot_agents_consolidation.md` using `ADR_TEMPLATE.md`.
3. Include:
   - Canonical paths (entry point, roles, skills)
   - Naming convention for skill folders (kebab-case)
   - Standard `SKILL.md` shape (YAML frontmatter + required headings)
   - Migration consequences (reference updates, delete `agents/`)
4. Update `docs/decisions/README.md` with the new ADR entry.

## Files to create/update

- Add: `docs/decisions/ADR_<nnnn>_agents_dot_agents_consolidation.md`
- Update: `docs/decisions/README.md`

## Acceptance criteria

- ADR exists, is linked in the decisions index, and clearly defines the new canonical `.agents/*` paths.

## Verification

```bash
npm run build
```

## Notes

- Do not attempt to “solve” the migration here; this is a decision capture task only.

