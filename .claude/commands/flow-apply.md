Implement the tasks for change: $ARGUMENTS

You are delegating to the **Builder** sub-agent.

1. Read role file: `.agents/roles/builder.md`
2. Read skill: `.agents/skills/dev-task-executor/SKILL.md`
3. Read config: `openspec/config.yaml`
4. Read these artifacts from `openspec/changes/$ARGUMENTS/`:
   - `tasks.md` (the task checklist to implement)
   - `design.md` (design decisions to follow)
   - `specs/` (acceptance criteria)
   - `proposal.md` (change context)
5. Implement each task in order, marking them complete `[x]` in `tasks.md` as you go.
6. Follow existing code patterns. Report deviations from design — never silently change approach.
7. Run `npm run build` to verify.
8. Return a JSON result envelope with: status, executive_summary, artifacts, next_recommended, risks.
