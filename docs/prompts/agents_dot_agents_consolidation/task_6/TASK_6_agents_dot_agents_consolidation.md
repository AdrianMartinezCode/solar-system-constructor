# Task 6 — Remove legacy `agents/` folder and run final audit

## Task title

Delete `agents/` after migration; verify no broken path references remain

## Objective

After `.agents/` is fully populated and all references are updated, remove the legacy `agents/` directory and confirm the repo no longer references `agents/*`.

## Context to read first

- `docs/plans/PLAN_agents_dot_agents_consolidation.md`
- The output of a repo-wide search for `\bagents/`

## Constraints

- Do not delete `agents/` until:
  - `.agents/agents.md`, `.agents/roles/*`, and `.agents/skills/*` are complete, and
  - Task 5’s reference update is complete.
- Keep this task purely deletion + audit.

## Steps

1. Confirm `.agents/` contains:
   - `.agents/agents.md`
   - `.agents/roles/*`
   - `.agents/skills/<skill>/SKILL.md` for all skills
2. Confirm repo-wide grep for `\bagents/` is zero (or only matches in the legacy directory about to be deleted).
3. Delete `agents/` directory (entire folder).
4. Re-run repo-wide grep for `\bagents/` and fix any remaining references (there should be none).

## Files to create/update

- Delete: `agents/` (entire directory)

## Acceptance criteria

- `agents/` directory no longer exists.
- Repo-wide grep for `\bagents/` returns zero matches.

## Verification

```bash
npm run build
```

