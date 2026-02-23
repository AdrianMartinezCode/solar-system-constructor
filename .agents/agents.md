# Agent Contract — Solar System Constructor

## Project Overview

This repo is a **monorepo** containing a **Vite + React + TypeScript** frontend (`apps/web`) and a **Node.js + Express + TypeScript** backend API (`apps/api`). The frontend renders an interactive, procedurally-generated solar system using React Three Fiber / Three.js, Zustand for state management, and a domain-driven folder layout. The backend provides an Express API with Docker-based local development. The build toolchain is npm workspaces + Vite (web) + tsc (api). There is currently no test runner or linter configured.

## Architecture Snapshot

| Layer | Path | Purpose |
|-------|------|---------|
| Frontend | `apps/web/` | Vite + React 3D app |
| Backend | `apps/api/` | Node + Express API |
| FE Domain | `apps/web/src/domain/` | Models, ports, protocols, services |
| FE UI | `apps/web/src/ui/`, `apps/web/src/components/` | React components, panels, windows |
| FE State | `apps/web/src/state/` | Zustand stores |
| FE Infra | `apps/web/src/infra/` | Frontend infrastructure adapters |
| API Routes | `apps/api/src/routes/` | Express route handlers |
| API Infra | `apps/api/src/infra/` | Backend infrastructure (DB, etc.) |
| API Config | `apps/api/src/config/` | Environment parsing |
| Shared | `packages/` | Shared libraries (future) |
| Docker | `compose.yaml`, `apps/api/Dockerfile` | Local containerized dev |
| Config | `tsconfig.base.json`, `package.json` | Root workspace + shared TS config |
| Agents | `.agents/` | Agent contract + skill playbooks |
| Docs | `docs/` | Requests, plans, prompts, decisions |

## Orchestrator / Role Routing

`.agents/agents.md` is the **Orchestrator entry point**. It routes each incoming request to the most appropriate role, then the agent “acquires” that role by following its role file under `.agents/roles/`.

### Roles (targets)

- **Product Owner** (`.agents/roles/product_owner.md`): generates change requests, plans, and per-task prompts (CR → PLAN → TASK). Does not implement or verify.
- **Developer** (`.agents/roles/developer.md`): handles **small, direct implementation** requests (no PO task decomposition).
- **Task Developer** (`.agents/roles/task_developer.md`): executes **approved task prompts** under `docs/prompts/<slug>/task_<n>/...`.
- **Curator of Order** (`.agents/roles/curator_of_order.md`): handles **small, direct curation** (docs/.agents organization, taxonomy, indexes, decisions).
- **Task Curator of Order** (`.agents/roles/task_curator_of_order.md`): executes **approved curator-oriented task prompts** under `docs/prompts/<slug>/task_<n>/...`.

### Deterministic routing rules

1. **If the input references a task prompt**, route to a **Task** role:
   - If the task prompt’s “Files to create/update” includes `src/` (or other implementation code), route to **Task Developer**.
   - If the task prompt primarily targets `docs/`, `.agents/` organization/index/taxonomy/decisions, route to **Task Curator of Order**.
2. **Else, decide if the request is “big” or “small”**:
   - Use triage sizing conventions: **small** (1–2 tasks), **medium** (3–5), **large** (6+).
   - Route **medium/large** (“big”) to **Product Owner** to produce CR/PLAN/TASK prompts first.
3. **Else (small request), decide curation vs implementation**:
   - **Curation** (re-org/index/taxonomy/agent-doc conventions) → **Curator of Order**
   - **Implementation** (code changes, behavior changes, bugfixes) → **Developer**

### Tie-breaker / stop conditions

- If the request is ambiguous, ask **1–3 specific questions** (e.g., “Is this a doc-organization change or app behavior change?” “Is there an existing task prompt to execute?”).
- If both curation and implementation are needed, route to **Product Owner** (split into tasks) unless the user explicitly narrows scope to a single small change.

### How to acquire a role

Once a role is selected:

- Explicitly state: **“Acting as: <Role Name>”**.
- Read and follow the selected role file in `.agents/roles/`.
- Use skills in `.agents/skills/` as playbooks (don’t “wing it”).

## Skill Loading Protocol

Skills are **not** limited to a role's core skills list. Any role may dynamically load additional skills when the task context warrants it.

### How it works

1. **Core skills**: Each role file lists core skills that are always loaded for that role. These cover the role's primary function.
2. **Conditional skills**: The skills catalog (`.agents/skills/README.md`) lists all available skills with **trigger conditions**. Before starting work, scan the task/request for trigger matches and load relevant conditional skills alongside the core ones.
3. **Loading order**: Core skills first, then conditional skills matched by the task.

### Trigger matching rules

- Read the task/request description and identify its **domain signals** (e.g., mentions of architecture, React components, MCP tools, new skills, domain modeling).
- Match against the trigger conditions listed in the skills catalog (`.agents/skills/README.md`).
- Load matched skills alongside core skills.
- If unsure whether a skill applies, **load it** — context is cheaper than missed guidance.

### Example

A Product Owner planning a feature that adds a new Express route with hexagonal architecture:
- **Core skills** (always): `change-request-triage`, `po-task-decomposer`, `prompt-writer`
- **Conditional skills** (matched): `architecture-patterns` (backend architecture signal), `workflow` (full pipeline reference)

## Multi-Agent Compatibility

This repo supports multiple "roles" (agents with different responsibilities) while keeping the original contract intact.

- **Contract (this file)**: global rules that all agents must follow.
- **Agent roles**: `.agents/roles/` — individual role definitions (personas + responsibilities + outputs).
- **Skills**: `.agents/skills/` — reusable playbooks any role can invoke (core + conditional).

### Available roles (catalog)

- `.agents/roles/curator_of_order.md`
- `.agents/roles/developer.md`
- `.agents/roles/product_owner.md`
- `.agents/roles/task_developer.md`
- `.agents/roles/task_curator_of_order.md`

## Workflow

1. **Read** — Gather repo context using available tools (read, list, search, context snapshot).
2. **Route** — Use the orchestrator routing rules (above) to select the correct role.
3. **If routed to Product Owner (big work)**:
   - Produce CR → PLAN → TASK prompts (`docs/requests/`, `docs/plans/`, `docs/prompts/`).
   - **Stop for human approval** (plan + prompts) before any implementation begins.
4. **If routed to a direct role (small work)**:
   - **Developer** implements the small, direct change.
   - **Curator of Order** performs the small, direct curation change.
5. **If routed to a task-execution role (prompt execution)**:
   - **Task Developer** or **Task Curator of Order** executes one approved task prompt at a time, in order.
6. **Verify** — Run verification commands (build, typecheck, lint/tests as available) after each implementation/cure task.

## Definition of Done

A change/task is "done" when:

- All acceptance criteria (from the task prompt, plan, or request) are met.
- `npm run build` passes without errors.
- No unrelated files are modified.
- (When available) `npm run lint` and `npm test` pass.

## Change Policy

- Keep diffs **small and focused** — one concern per task.
- Do **not** mix refactors with feature work.
- Do **not** change files outside the task's explicit scope.
- Prefer **editing existing files** over creating new ones unless the task requires it.

## Safety Policy

- **No secrets** — never commit API keys, tokens, or credentials.
- **No destructive commands** — no `rm -rf`, no force-pushes, no DB drops.
- **No network calls** unless explicitly required by a dependency install.
- All tool operations are **repo-root restricted** — no path traversal outside the project.
