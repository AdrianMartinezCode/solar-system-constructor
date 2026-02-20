# Agent Skills (`.agents/skills/`)

Skills are structured playbooks that guide an AI agent through a specific workflow.

## Canonical structure

Each skill lives in its own folder:

- `.agents/skills/<kebab-skill-slug>/SKILL.md`

Rules:

- Skill folder slugs are **kebab-case**.
- Each skill uses the standardized template in `.agents/skills/_template/SKILL.md`.
- Keep skills operational (purpose, inputs/outputs, steps, sizing rules).

## Existing skills (catalog)

| Skill (slug) | Path | Notes |
|---|---|---|
| `architecture-patterns` | `.agents/skills/architecture-patterns/SKILL.md` | Architecture reference patterns |
| `react-architect-skills` | `.agents/skills/react-architect-skills/SKILL.md` | React feature-module architecture guidelines |

