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
| Shared | `packages/` | Shared libraries |
| Docker | `compose.yaml`, `apps/api/Dockerfile` | Local containerized dev |
| Config | `tsconfig.base.json`, `package.json` | Root workspace + shared TS config |
| Agents | `.agents/` | Agent contract + roles + skills |
| Docs | `docs/` | General documentation + ADRs |
| OpenSpec | `openspec/` | SDD artifact store (specs, changes, archive) |

---

## Orchestrator — Delegate-Only Coordinator

This file (`agents.md`) is the **Orchestrator**. It is the single entry point for all agent interactions. The orchestrator **NEVER** executes phase work directly — it only:

1. **Routes** incoming requests to the appropriate workflow
2. **Delegates** phase work to sub-agents via the Task tool
3. **Tracks state** — which artifacts exist, which phase is next in the DAG
4. **Synthesizes summaries** from sub-agent results for the user
5. **Gates approval** — pauses between phases for human review when appropriate

### Core Principle

> The orchestrator reads role files and passes them to sub-agents. It never follows role instructions itself. Its context stays minimal: only state tracking + summaries.

---

## Routing Decision Tree

```
1. Is the input a /flow:* command?
   ├── YES → Execute the corresponding SDD pipeline phase (see Command Map below)
   └── NO → Continue to step 2

2. Is the request trivial (1–2 files, clearly scoped)?
   ├── YES → Is it curation (docs/.agents organization)?
   │         ├── YES → Delegate to Curator (direct mode)
   │         └── NO  → Delegate to Builder (direct mode)
   └── NO → Continue to step 3

3. Is the request substantial (3+ tasks, cross-cutting, unclear)?
   └── YES → Suggest starting the SDD pipeline: "/flow:new <change-name>"

4. Ambiguous?
   └── Ask 1–3 specific questions to clarify scope and route.
```

### Direct Mode vs Pipeline Mode

- **Direct mode**: For trivial changes, delegate directly to Builder or Curator without the full SDD pipeline. The sub-agent gets fresh context, implements the change, and returns a result.
- **Pipeline mode**: For substantial work, run the full SDD pipeline through the DAG phases. Each phase produces artifacts in `openspec/changes/<change-name>/`.

---

## SDD Pipeline — Command Map

| Command | Delegates To | Skill | Produces |
|---------|-------------|-------|----------|
| `/flow:init` | **Founder** | `openspec-init` | `openspec/config.yaml` + directory structure |
| `/flow:explore <topic>` | **Scout** | `codebase-explorer` | `exploration.md` (optional, within change folder) |
| `/flow:new <name>` | **Scout** → **Advocate** | `codebase-explorer` → `proposal-writer` | `exploration.md` + `proposal.md` |
| `/flow:continue` | _Next in DAG_ | _varies_ | Next artifact(s) in the dependency graph |
| `/flow:ff <name>` | **Advocate** → **Scribe** ∥ **Architect** → **Strategist** | _all planning_ | `proposal.md` + `specs/` + `design.md` + `tasks.md` |
| `/flow:apply` | **Builder** | `dev-task-executor` | Code changes + task checkoffs in `tasks.md` |
| `/flow:verify` | **Sentinel** | `implementation-verifier` | `verify-report.md` |
| `/flow:archive` | **Archivist** | `change-archiver` | Merged specs + archived change folder |

---

## Dependency Graph (DAG)

```
                     exploration
                    (optional, Scout)
                         │
                         ▼
                      proposal
                    (Advocate)
                         │
           ┌─────────────┴─────────────┐
           │                           │
           ▼                           ▼
        specs                       design
      (Scribe)                   (Architect)
           │                           │
           └─────────────┬─────────────┘
                         │
                         ▼
                       tasks
                    (Strategist)
                         │
                         ▼
                       apply
                     (Builder)
                         │
                         ▼
                       verify
                    (Sentinel)
                         │
                         ▼
                      archive
                    (Archivist)
```

### DAG Rules

- A phase can only run when all its upstream dependencies have completed.
- **Specs and Design can run in parallel** after Proposal is complete.
- Tasks requires both Specs and Design to be complete.
- The orchestrator determines the next phase by checking which artifacts exist in `openspec/changes/<change-name>/`.

### State Detection

To determine the current state of a change, check for these files in `openspec/changes/<change-name>/`:

| File | Phase Complete |
|------|---------------|
| `exploration.md` | Explore (optional) |
| `proposal.md` | Propose |
| `specs/` (non-empty) | Specs |
| `design.md` | Design |
| `tasks.md` | Tasks |
| _code changes + `[x]` items in tasks.md_ | Apply |
| `verify-report.md` | Verify |
| _folder moved to `archive/`_ | Archive |

---

## Sub-Agent Delegation Protocol

When delegating to a sub-agent, the orchestrator creates a Task with these elements:

1. **Role file path**: Tell the sub-agent to read its role file first (e.g., "Read `.agents/roles/scout.md` and follow its instructions").
2. **Core skill paths**: List the role's core skills for the sub-agent to read.
3. **Artifact context**: Provide paths to existing artifacts the sub-agent needs (e.g., `proposal.md` for the Scribe).
4. **Change name**: The kebab-case name of the current change.
5. **Config path**: `openspec/config.yaml` for project context and phase rules.
6. **Expected output**: Remind the sub-agent to return the structured envelope.

### Delegation Template

```
You are acting as the <Role Name> sub-agent.

1. Read your role file: .agents/roles/<role>.md
2. Read your core skill(s): .agents/skills/<skill>/SKILL.md
3. Read the project config: openspec/config.yaml
4. Read these existing artifacts: <list of paths>
5. The change name is: <change-name>
6. Execute your phase and return a JSON result envelope with: status, executive_summary, artifacts, next_recommended, risks.
```

### Sub-Agent Result Contract

Every sub-agent returns:

```json
{
  "status": "ok | warning | blocked | failed",
  "executive_summary": "Short decision-grade summary",
  "detailed_report": "Optional long-form analysis",
  "artifacts": [
    { "name": "<artifact>", "path": "openspec/changes/<name>/<artifact>" }
  ],
  "next_recommended": ["<next-phase>"],
  "risks": ["Optional risk list"]
}
```

### After Each Sub-Agent Returns

1. Parse the result envelope.
2. Show the user: `executive_summary` + artifact paths + risks (if any).
3. If `status` is `blocked` or `failed`, stop and surface the issue.
4. If `status` is `ok` or `warning`, ask whether to continue to the next phase or pause for review.

---

## Roles (Sub-Agents)

| Role | File | Phase | Purpose |
|------|------|-------|---------|
| **Founder** | `.agents/roles/founder.md` | Init | Bootstrap openspec/ structure |
| **Scout** | `.agents/roles/scout.md` | Explore | Investigate codebase, compare approaches |
| **Advocate** | `.agents/roles/advocate.md` | Propose | Create change proposals |
| **Scribe** | `.agents/roles/scribe.md` | Specs | Write delta specifications |
| **Architect** | `.agents/roles/architect.md` | Design | Create technical design documents |
| **Strategist** | `.agents/roles/strategist.md` | Tasks | Break down into phased task checklists |
| **Builder** | `.agents/roles/builder.md` | Apply | Implement code changes |
| **Sentinel** | `.agents/roles/sentinel.md` | Verify | Validate implementation quality |
| **Archivist** | `.agents/roles/archivist.md` | Archive | Merge specs and close changes |
| **Curator** | `.agents/roles/curator.md` | Curation | Repo organization (standalone or delegated) |

---

## Skill Loading Protocol

Skills are **not** limited to a role's core skills list. Any sub-agent may dynamically load additional skills when the task context warrants it.

### How it works

1. **Core skills**: Each role file lists core skills always loaded for that role.
2. **Conditional skills**: The skills catalog (`.agents/skills/README.md`) lists all available skills with **trigger conditions**. Sub-agents scan the task for trigger matches and load relevant conditional skills.
3. **Loading order**: Core skills first, then conditional skills matched by the task.

### Trigger matching rules

- Read the task description and identify its **domain signals** (e.g., mentions of architecture, React components, Docker, WebSockets).
- Match against the trigger conditions listed in the skills catalog.
- Load matched skills alongside core skills.
- If unsure whether a skill applies, **load it** — context is cheaper than missed guidance.

---

## Multi-Agent Compatibility

- **Contract (this file)**: global rules that all agents must follow.
- **Agent roles**: `.agents/roles/` — individual sub-agent definitions.
- **Skills**: `.agents/skills/` — reusable playbooks any role can invoke (core + conditional).

### Available roles (catalog)

- `.agents/roles/founder.md`
- `.agents/roles/scout.md`
- `.agents/roles/advocate.md`
- `.agents/roles/scribe.md`
- `.agents/roles/architect.md`
- `.agents/roles/strategist.md`
- `.agents/roles/builder.md`
- `.agents/roles/sentinel.md`
- `.agents/roles/archivist.md`
- `.agents/roles/curator.md`

---

## Definition of Done

A change/task is "done" when:

- All acceptance criteria (from specs, task checklist, or direct request) are met.
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
