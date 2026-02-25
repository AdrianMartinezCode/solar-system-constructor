Start a new SDD change named: $ARGUMENTS

This command runs two phases sequentially:

## Phase 1 — Scout (Exploration)

Delegate to a sub-agent acting as the **Scout**:
1. Read role file: `.agents/roles/scout.md`
2. Read skill: `.agents/skills/codebase-explorer/SKILL.md`
3. Read config: `openspec/config.yaml`
4. Create `openspec/changes/$ARGUMENTS/` directory
5. Explore the codebase and produce `exploration.md`

## Phase 2 — Advocate (Proposal)

Delegate to a sub-agent acting as the **Advocate**:
1. Read role file: `.agents/roles/advocate.md`
2. Read skill: `.agents/skills/proposal-writer/SKILL.md`
3. Read config: `openspec/config.yaml`
4. Read the `exploration.md` from Phase 1
5. Produce `proposal.md` in `openspec/changes/$ARGUMENTS/`

After both phases complete, present the executive summaries and ask whether to continue to the next phase (specs + design).
