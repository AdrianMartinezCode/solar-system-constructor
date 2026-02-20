# Task 3 — Migrate orchestrator + roles into `.agents/` (update internal refs)

## Task title

Move `agents/agents.md` + `agents/roles/*` into `.agents/` and update internal references

## Objective

Make `.agents/` the canonical home for:

- Orchestrator/global contract (`.agents/agents.md`)
- Roles (`.agents/roles/*`)
- Agent system index (`.agents/README.md`)

Update any internal references in these moved files from `agents/...` to `.agents/...`.

## Context to read first

- `agents/agents.md`
- `agents/README.md`
- `agents/roles/README.md`
- `agents/roles/*.md`
- `docs/prompts/agents_dot_agents_consolidation/task_2/TASK_2_agents_dot_agents_consolidation.md` (the new target indexes/templates)

## Constraints

- Keep this task focused: orchestrator + roles only (skills handled in Task 4).
- Prefer `git mv`-style moves to preserve history.
- Do not delete the legacy `agents/` directory yet (that’s Task 6).

## Steps

1. Move files:
   - `agents/agents.md` → `.agents/agents.md`
   - `agents/README.md` → `.agents/README.md` (merge content if you created `.agents/README.md` in Task 2)
   - `agents/roles/*` → `.agents/roles/*`
2. Update internal links in moved files:
   - Role file references: `agents/roles/...` → `.agents/roles/...`
   - Skill references: `agents/skills/...` → `.agents/skills/...` (even if the skill files are not moved yet; they will be in Task 4)
3. Ensure `.agents/roles/README.md` catalog matches the moved role filenames.

## Files to create/update

- Move: `agents/agents.md` → `.agents/agents.md`
- Move: `agents/README.md` → `.agents/README.md`
- Move: `agents/roles/README.md` → `.agents/roles/README.md`
- Move: `agents/roles/_template.md` → `.agents/roles/_template.md`
- Move: `agents/roles/curator_of_order.md` → `.agents/roles/curator_of_order.md`
- Move: `agents/roles/developer.md` → `.agents/roles/developer.md`
- Move: `agents/roles/product_owner.md` → `.agents/roles/product_owner.md`
- Move: `agents/roles/task_developer.md` → `.agents/roles/task_developer.md`
- Move: `agents/roles/task_curator_of_order.md` → `.agents/roles/task_curator_of_order.md`

## Acceptance criteria

- `.agents/agents.md` exists and references roles under `.agents/roles/*`.
- All moved role files reference skills under `.agents/skills/...` (no `agents/skills/...` remain).
- Legacy files under `agents/` may still exist temporarily, but `.agents/` is now the canonical location.

## Verification

```bash
npm run build
```

