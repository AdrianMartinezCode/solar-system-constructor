# Agent Contract — Solar System Constructor

## Project Overview

This repo is a **Vite + React + TypeScript** frontend that renders an interactive, procedurally-generated solar system. It uses React Three Fiber / Three.js for 3D rendering, Zustand for state management, and a domain-driven folder layout (`src/domain`, `src/ui`, `src/infra`). The build toolchain is npm + Vite + TypeScript. There is currently no test runner or linter configured.

## Architecture Snapshot

| Layer | Path | Purpose |
|-------|------|---------|
| Domain | `src/domain/` | Models, ports, protocols, services |
| UI | `src/ui/`, `src/components/` | React components, panels, windows |
| State | `src/state/` | Zustand stores |
| Infra | `src/infra/` | Infrastructure adapters |
| Utils | `src/utils/` | Pure helper functions |
| Config | `vite.config.ts`, `tsconfig.json` | Build & type config |
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

## Multi-Agent Compatibility

This repo supports multiple “roles” (agents with different responsibilities) while keeping the original contract intact.

- **Contract (this file)**: global rules that all agents must follow.
- **Agent roles**: `.agents/roles/` — individual role definitions (personas + responsibilities + outputs).
- **Skills**: `.agents/skills/` — reusable playbooks any role can invoke.

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
