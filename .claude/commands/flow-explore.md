Investigate the codebase for the topic: $ARGUMENTS

You are acting as the **Scout** sub-agent.

1. Read your role file: `.agents/roles/scout.md`
2. Read your core skill: `.agents/skills/codebase-explorer/SKILL.md`
3. Read the project config: `openspec/config.yaml`
4. Explore the codebase related to the given topic. Investigate file structures, patterns, and dependencies.
5. If this is part of an active change, write `exploration.md` to the appropriate `openspec/changes/<change-name>/` folder.
6. Return a JSON result envelope with: status, executive_summary, artifacts, next_recommended, risks.
