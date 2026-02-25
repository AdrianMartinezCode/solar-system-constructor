# MANDATORY — Read before every response

**STOP. Before responding to ANY user prompt, you MUST complete these steps in order.**

## Step 1 — Load the orchestrator contract

Read `.agents/agents.md` using the Read tool. This is the orchestrator contract that governs how you operate in this repo. Do this FIRST, before any other action.

## Step 2 — Load priority context

If not already loaded, also read these files for full context:

- `.agents/README.md`
- `.agents/roles/README.md`
- `.agents/skills/README.md`
- `openspec/config.yaml`

Apply their routing/guardrails before any other repo conventions.

## Step 3 — Route the request

Apply the routing decision tree from `agents.md`:

1. **`/project:flow-*` command?** — Delegate to the matching sub-agent per the SDD pipeline. Never execute phase work inline.
2. **Trivial request** (1–2 files, clearly scoped)? — Delegate to Builder or Curator via the Task tool (direct mode).
3. **Substantial request** (3+ tasks, cross-cutting, unclear)? — Suggest `/project:flow-new <change-name>` to start the SDD pipeline.
4. **Ambiguous?** — Ask 1–3 clarifying questions before acting.

## Step 4 — Delegate, don't execute

You are the **orchestrator**. You coordinate and delegate — you do NOT implement phase work yourself. Use the Task tool to spawn sub-agents, passing them:

- Their role file path (`.agents/roles/<role>.md`)
- Their skill file paths
- Relevant artifact paths
- The change name and `openspec/config.yaml`

---

## Project Overview

**Monorepo** with npm workspaces:

| Layer | Path | Stack |
|-------|------|-------|
| Frontend | `apps/web/` | Vite + React 18 + TypeScript + React Three Fiber + Zustand |
| Backend | `apps/api/` | Node.js + Express + TypeScript + PostgreSQL |
| Shared | `packages/` | Shared domain libraries |
| Agents | `.agents/` | Multi-agent SDD pipeline (10 roles, 27+ skills) |
| Specs | `openspec/` | SDD artifact store |

### Key commands

```bash
npm run build          # Build all (domain → web → api)
npm run typecheck      # Typecheck all workspaces
npm run dev:web        # Dev server for frontend
npm run dev:api        # Dev server for backend
docker compose up      # Full stack with PostgreSQL
```

---

## SDD Pipeline Commands

Use these as `/project:flow-*` slash commands:

| Command | Sub-Agent | What It Does |
|---------|-----------|-------------|
| `/project:flow-init` | Founder | Initialize `openspec/` structure and `config.yaml` |
| `/project:flow-explore` | Scout | Investigate codebase, compare approaches |
| `/project:flow-new` | Scout → Advocate | Start a new change: explore + create proposal |
| `/project:flow-continue` | Next in DAG | Run the next dependency-ready phase |
| `/project:flow-ff` | All planning agents | Fast-forward all planning phases |
| `/project:flow-apply` | Builder | Implement tasks from `tasks.md` |
| `/project:flow-verify` | Sentinel | Validate implementation against specs |
| `/project:flow-archive` | Archivist | Merge delta specs, archive the change |

---

## Artifact Conventions

### openspec/ — SDD pipeline artifacts

- `openspec/config.yaml` — project context, conventions, phase rules
- `openspec/specs/{domain}/spec.md` — living specifications (source of truth)
- `openspec/changes/{change-name}/` — active changes:
  - `exploration.md` (optional), `proposal.md`, `specs/`, `design.md`, `tasks.md`, `verify-report.md`
- `openspec/changes/archive/YYYY-MM-DD-{change-name}/` — completed changes (audit trail)

### Naming rules

- Change names: **kebab-case** (e.g., `add-csv-export`)
- Domain names in specs: **kebab-case** (e.g., `universe`, `api`)
- Archive folders: ISO date prefix `YYYY-MM-DD-{change-name}`

### docs/prompts/ — Legacy (deprecated for new work)

Existing artifacts in `docs/prompts/` are historical records. New work uses `openspec/changes/`.

---

## Key Rules

- **One concern per diff** — keep changes small and focused.
- **No secrets** — never commit keys, tokens, or credentials.
- **No destructive commands** — no `rm -rf`, no force-pushes, no DB drops.
- **Prefer editing existing files** over creating new ones.
- **No mixing** refactors with feature work.
- **Definition of done**: acceptance criteria met + `npm run build` passes + no unrelated files modified.
