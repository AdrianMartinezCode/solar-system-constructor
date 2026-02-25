Fast-forward all planning phases for change: $ARGUMENTS

Run these phases sequentially (or in parallel where the DAG allows):

## 1. Advocate (Proposal) — if `proposal.md` doesn't exist
Delegate: `.agents/roles/advocate.md` + `.agents/skills/proposal-writer/SKILL.md`

## 2. Scribe (Specs) + Architect (Design) — run in parallel
- **Scribe**: `.agents/roles/scribe.md` + `.agents/skills/spec-writer/SKILL.md`
- **Architect**: `.agents/roles/architect.md` + `.agents/skills/design-doc-writer/SKILL.md`
Both receive `proposal.md` as input.

## 3. Strategist (Tasks)
Delegate: `.agents/roles/strategist.md` + `.agents/skills/task-planner/SKILL.md`
Receives: `proposal.md`, `specs/`, `design.md`

Read `openspec/config.yaml` for project conventions and phase rules.
Change name: `$ARGUMENTS`
All artifacts go to `openspec/changes/$ARGUMENTS/`.

After completion, present a summary of all produced artifacts and ask whether to proceed to `/project:flow-apply`.
