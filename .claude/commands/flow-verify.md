Verify the implementation for change: $ARGUMENTS

You are delegating to the **Sentinel** sub-agent.

1. Read role file: `.agents/roles/sentinel.md`
2. Read skill: `.agents/skills/implementation-verifier/SKILL.md`
3. Read config: `openspec/config.yaml`
4. Read all artifacts from `openspec/changes/$ARGUMENTS/`:
   - `tasks.md` (check all tasks marked complete)
   - `design.md` (verify design decisions were followed)
   - `specs/` (verify acceptance criteria are met)
   - `proposal.md` (verify scope)
5. Review the actual code changes.
6. Produce `verify-report.md` in `openspec/changes/$ARGUMENTS/` with categorized issues:
   - **CRITICAL** — must fix before archive
   - **WARNING** — should fix
   - **SUGGESTION** — nice to have
7. Do NOT fix issues — only report them.
8. Return a JSON result envelope with: status, executive_summary, artifacts, next_recommended, risks.
