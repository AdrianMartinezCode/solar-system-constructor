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
| `change-request-triage` | `.agents/skills/change-request-triage/SKILL.md` | Classify CRs (size/type/risk) and surface blockers/questions |
| `curator-decision-steward` | `.agents/skills/curator-decision-steward/SKILL.md` | Capture structural decisions as ADRs and keep the decisions index healthy |
| `curator-docs-librarian` | `.agents/skills/curator-docs-librarian/SKILL.md` | Maintain doc taxonomy, indexes, templates, and cross-links |
| `curator-entropy-audit` | `.agents/skills/curator-entropy-audit/SKILL.md` | Lightweight repo entropy audit → ordered plan of fixes |
| `dev-task-executor` | `.agents/skills/dev-task-executor/SKILL.md` | Execute one approved task prompt as a small diff and verify |
| `mcp-builder` | `.agents/skills/mcp-builder/SKILL.md` | Guide for creating MCP servers that enable LLMs to interact with external services through well-designed tools |
| `po-task-decomposer` | `.agents/skills/po-task-decomposer/SKILL.md` | Decompose a CR into ordered small tasks with acceptance criteria |
| `prompt-writer` | `.agents/skills/prompt-writer/SKILL.md` | Write a single self-contained implementation task prompt |
| `react-architect-skills` | `.agents/skills/react-architect-skills/SKILL.md` | React feature-module architecture guidelines |
| `skill-creator` | `.agents/skills/skill-creator/SKILL.md` | Guide for creating or updating skills that extend agent capabilities with specialized knowledge, workflows, or tool integrations |
| `workflow` | `.agents/skills/workflow/SKILL.md` | End-to-end runbook for CR → PLAN → TASK prompts → execution |

