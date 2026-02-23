# Agent Skills (`.agents/skills/`)

Skills are structured playbooks that guide an AI agent through a specific workflow.

## Canonical structure

Each skill lives in its own folder:

- `.agents/skills/<kebab-skill-slug>/SKILL.md`

Rules:

- Skill folder slugs are **kebab-case**.
- Each skill uses the standardized template in `.agents/skills/_template/SKILL.md`.
- Keep skills operational (purpose, inputs/outputs, steps, sizing rules).

## Skill Loading Protocol

Each role declares **core skills** (always loaded) in its role file. In addition, any role may dynamically load **conditional skills** when the task context matches the trigger conditions listed below.

**How to use**: Before starting work, scan the task/request for domain signals. Match against the "Trigger conditions" column below and load any matching skills alongside the role's core skills.

See `.agents/agents.md` → "Skill Loading Protocol" for the full mechanism.

## Existing skills (catalog)

### Core skills

These skills are loaded by specific roles as part of their core function. They may also be loaded conditionally by other roles.

| Skill (slug) | Path | Notes |
|---|---|---|
| `change-request-triage` | `.agents/skills/change-request-triage/SKILL.md` | Classify CRs (size/type/risk) and surface blockers/questions |
| `curator-decision-steward` | `.agents/skills/curator-decision-steward/SKILL.md` | Capture structural decisions as ADRs and keep the decisions index healthy |
| `curator-docs-librarian` | `.agents/skills/curator-docs-librarian/SKILL.md` | Maintain doc taxonomy, indexes, templates, and cross-links |
| `curator-entropy-audit` | `.agents/skills/curator-entropy-audit/SKILL.md` | Lightweight repo entropy audit → ordered plan of fixes |
| `dev-task-executor` | `.agents/skills/dev-task-executor/SKILL.md` | Execute one approved task prompt as a small diff and verify |
| `po-task-decomposer` | `.agents/skills/po-task-decomposer/SKILL.md` | Decompose a CR into ordered small tasks with acceptance criteria |
| `prompt-writer` | `.agents/skills/prompt-writer/SKILL.md` | Write a single self-contained implementation task prompt |

### Conditional skills

These skills are loaded dynamically when the task/request matches their trigger conditions. **Any role** may load them.

| Skill (slug) | Path | Trigger conditions |
|---|---|---|
| `architecture-patterns` | `.agents/skills/architecture-patterns/SKILL.md` | Task involves backend architecture, clean/hexagonal architecture, DDD, domain modeling, ports/adapters, or entity/aggregate design |
| `backend-dev-guidelines` | `.agents/skills/backend-dev-guidelines/SKILL.md` | Task involves backend development with Node.js + Express + TypeScript, layered architecture, controllers, services, repositories, Prisma, Zod validation, or backend error handling/observability |
| `docker-expert` | `.agents/skills/docker-expert/SKILL.md` | Task involves Docker, Dockerfiles, container builds, Docker Compose, image optimization, container security, or multi-stage build patterns |
| `mcp-builder` | `.agents/skills/mcp-builder/SKILL.md` | Task involves creating, modifying, or documenting MCP servers/tools |
| `nodejs-backend-patterns` | `.agents/skills/nodejs-backend-patterns/SKILL.md` | Task involves creating Node.js servers, REST APIs, GraphQL backends, microservices, middleware patterns, authentication/authorization, or database integration |
| `react-architect-skills` | `.agents/skills/react-architect-skills/SKILL.md` | Task involves React component structure, feature-module layout, frontend naming conventions, or UI layer separation |
| `react-components` | `.agents/skills/react-components/SKILL.md` | Task involves converting designs (Stitch) into modular React components, design-to-code workflows, or building UI components from design specs |
| `skill-creator` | `.agents/skills/skill-creator/SKILL.md` | Task involves creating new skills or updating existing skill definitions under `.agents/skills/` |
| `vite` | `.agents/skills/vite/SKILL.md` | Task involves Vite configuration (`vite.config.ts`), Vite plugins, Vite build optimization, SSR with Vite, library mode, or Rolldown/Vite 8 migration |
| `workflow` | `.agents/skills/workflow/SKILL.md` | Task needs a refresher on the full CR → PLAN → TASK → execution pipeline, or the pipeline itself is being modified |

