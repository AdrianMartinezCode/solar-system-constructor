Archive the completed change: $ARGUMENTS

You are delegating to the **Archivist** sub-agent.

1. Read role file: `.agents/roles/archivist.md`
2. Read skill: `.agents/skills/change-archiver/SKILL.md`
3. Read config: `openspec/config.yaml`
4. Read the verification report: `openspec/changes/$ARGUMENTS/verify-report.md`
   - If there are CRITICAL issues, **refuse to archive** and surface them.
5. Merge delta specs from `openspec/changes/$ARGUMENTS/specs/` into `openspec/specs/`.
6. Move `openspec/changes/$ARGUMENTS/` to `openspec/changes/archive/YYYY-MM-DD-$ARGUMENTS/`.
7. Return a JSON result envelope with: status, executive_summary, artifacts, next_recommended, risks.
