# Agent Skills (`.agents/skills/`)

Skills are structured playbooks that guide an AI sub-agent through a specific workflow.

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

### Core skills — SDD Pipeline

These skills power the SDD pipeline phases. Each is the primary skill for its corresponding sub-agent role.

| Skill (slug) | Path | Owner Role | Notes |
|---|---|---|---|
| `openspec-init` | `.agents/skills/openspec-init/SKILL.md` | Founder | Bootstrap openspec/ structure and config.yaml |
| `codebase-explorer` | `.agents/skills/codebase-explorer/SKILL.md` | Scout | Investigate codebase, compare approaches, produce exploration.md |
| `proposal-writer` | `.agents/skills/proposal-writer/SKILL.md` | Advocate | Create structured change proposals (proposal.md) |
| `spec-writer` | `.agents/skills/spec-writer/SKILL.md` | Scribe | Write delta specs with RFC 2119 + Given/When/Then |
| `design-writer` | `.agents/skills/design-writer/SKILL.md` | Architect | Create technical design documents (design.md) |
| `task-planner` | `.agents/skills/task-planner/SKILL.md` | Strategist | Break down into phased tasks (tasks.md) |
| `dev-task-executor` | `.agents/skills/dev-task-executor/SKILL.md` | Builder | Execute tasks as small diffs and verify |
| `implementation-verifier` | `.agents/skills/implementation-verifier/SKILL.md` | Sentinel | Validate implementation against specs/design/tasks; produce verify-report.md |
| `change-archiver` | `.agents/skills/change-archiver/SKILL.md` | Archivist | Merge delta specs into main specs and archive completed changes |

### Core skills — Curation and Support

These skills support cross-cutting concerns and are loaded by specific roles.

| Skill (slug) | Path | Notes |
|---|---|---|
| `change-request-triage` | `.agents/skills/change-request-triage/SKILL.md` | Classify scope (size/type/risk) and surface blockers — used by Advocate and Builder |
| `curator-decision-steward` | `.agents/skills/curator-decision-steward/SKILL.md` | Capture structural decisions as ADRs — used by Curator |
| `curator-docs-librarian` | `.agents/skills/curator-docs-librarian/SKILL.md` | Maintain doc taxonomy, indexes, templates — used by Curator |
| `curator-entropy-audit` | `.agents/skills/curator-entropy-audit/SKILL.md` | Lightweight repo entropy audit — used by Curator |

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
| `websocket-engineer` | `.agents/skills/websocket-engineer/SKILL.md` | Task involves WebSocket or Socket.IO implementation, real-time bidirectional communication, pub/sub messaging, server push, live updates, presence tracking, or chat systems |
