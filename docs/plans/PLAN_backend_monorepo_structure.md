# Plan: Add Backend + Monorepo Structure (Web + API) with Docker-First Local Dev

## Summary

This plan introduces a backend into the repository while keeping a senior-grade structure for long-term maintainability. The target is a monorepo with `apps/` for runnable applications (**web** and **api**) and `packages/` for shared code. The backend will be **Node.js + TypeScript + Express** and will support **dockerized local development**, including a database container option while keeping the DB technology configurable (TBD).

The work is intentionally split into small, ordered tasks: first decide/document structure and tooling, then migrate the frontend into its app folder (if needed), then scaffold the backend, then add Docker, then introduce a DB provider “slot”, and finally document the developer workflow.

## Repo snapshot used

| File / Directory | Purpose |
|---|---|
| `package.json` | Current single-project scripts and dependencies |
| `tsconfig.json` / `tsconfig.node.json` | Current TypeScript setup (Vite-oriented) |
| `vite.config.ts` | Frontend build/dev configuration |
| `src/` | Frontend application code |
| `docs/` | Planning workflow + conventions (CR/PLAN/TASK) |
| `.agents/` | Agent workflow contract and roles |
| `.gitignore` | Current ignore rules (no Docker artifacts yet) |

## Assumptions

- We will adopt a standard monorepo layout:
  - `apps/web` for the Vite frontend
  - `apps/api` for the Express backend
  - `packages/*` for shared code (types/contracts), if/when needed
- npm is the package manager; we can use **npm workspaces** for orchestration.
- Backend will run locally primarily via Docker (compose), but should also be runnable without Docker for debugging.

## Risks / unknowns

- **Database choice is TBD**: we need a structure that does not force a decision too early while still being “real” enough to build on.
- **Frontend move risk**: moving the frontend from repo root into `apps/web` can create path/config churn. We mitigate by making the move explicit, scripted, and verified early.
- **Tooling drift**: adding a second app can lead to inconsistent TS configs and scripts. We mitigate with a small shared base TS config and consistent npm scripts.

## Out of scope

- Building real backend features (auth, CRUD resources, persistence logic beyond a provider interface).
- Production deployment concerns (multi-stage images, secrets, cloud config).
- Repo-wide linting/testing setup (can be its own CR).

## Task list (ordered)

### Task 1 — Decide & document the target monorepo structure (ADR) + introduce workspace scaffolding

- **Goal**: Establish the canonical folder layout (`apps/`, `packages/`, `infra/`) and workspace orchestration at repo root.
- **Scope**: Planning/structure and root-level tooling only. No backend implementation yet.
- **Dependencies**: None.
- **Files likely touched**:
  - `docs/decisions/ADR_0003_backend_monorepo_structure.md` (new)
  - `package.json` (update to workspaces + top-level scripts)
  - `tsconfig.base.json` (new)
  - `apps/README.md` (new, brief map)
  - `packages/README.md` (new, brief map)
- **Acceptance criteria**:
  - ADR clearly explains the chosen layout and why.
  - Root `package.json` can orchestrate `web` and `api` commands via workspaces (even if `apps/api` is added in later tasks).
  - There is a shared `tsconfig.base.json` that future app tsconfigs can extend.
- **Verification**: `npm -v` (workspace-capable), then later tasks will verify `npm run build` once apps exist.

### Task 2 — Move the existing frontend into `apps/web` (monorepo alignment) with equivalent scripts

- **Goal**: Relocate the current Vite app into `apps/web` while preserving developer experience via root scripts.
- **Scope**: File moves + config/script updates only; no functional frontend changes.
- **Dependencies**: Task 1.
- **Files likely touched** (representative; moves will include many files):
  - Move: `src/`, `index.html`, `vite.config.ts`, `tsconfig*.json`, `public/` (if present), etc. into `apps/web/`
  - Root `package.json` (update scripts to call workspace)
  - `apps/web/package.json` (new)
  - `apps/web/tsconfig.json` (new, extends base)
  - `apps/web/vite.config.ts` (moved/updated)
- **Acceptance criteria**:
  - `npm run dev:web` runs the frontend.
  - `npm run build:web` builds the frontend.
  - Root `npm run dev` still works (runs web, or runs both if that becomes the default).
- **Verification**: `npm run dev:web`, `npm run build:web`

### Task 3 — Scaffold backend app `apps/api` (Node + TS + Express) with a minimal health endpoint

- **Goal**: Create an Express+TS service skeleton with standard layering and a `/health` endpoint.
- **Scope**: Structure + minimal runtime only; no business endpoints.
- **Dependencies**: Task 1.
- **Files likely touched**:
  - `apps/api/package.json` (new)
  - `apps/api/tsconfig.json` (new, extends base)
  - `apps/api/src/server.ts` (new)
  - `apps/api/src/app.ts` (new)
  - `apps/api/src/routes/health.ts` (new)
  - `apps/api/README.md` (new: usage + structure)
- **Acceptance criteria**:
  - `npm run dev:api` starts the API locally.
  - `GET /health` returns `200` with a simple JSON body.
  - API uses a predictable directory structure (`src/config`, `src/routes`, `src/domain`, `src/infra` placeholders are fine).
- **Verification**: `npm run dev:api`, then `curl http://localhost:<api_port>/health`

### Task 4 — Add Docker-first local dev for backend (compose + Dockerfile)

- **Goal**: Add docker compose scaffolding to run the API locally, with an optional DB container slot.
- **Scope**: Docker files + env samples + documentation only.
- **Dependencies**: Task 3.
- **Files likely touched**:
  - `compose.yaml` (new)
  - `apps/api/Dockerfile` (new)
  - `apps/api/.dockerignore` (new)
  - `apps/api/.env.example` (new)
  - `docs/guides/LOCAL_DEV_DOCKER.md` (new)
- **Acceptance criteria**:
  - `docker compose up --build` brings up the API container.
  - The compose file includes a clean, documented place to add a DB service, without hard-coding DB choice.
  - No secrets are committed; `.env.example` documents required variables.
- **Verification**: `docker compose up --build`, `curl http://localhost:<api_port>/health`

### Task 5 — Create a DB “provider slot” in the API without committing to a specific DB

- **Goal**: Create the code structure that isolates persistence behind an interface so the database can be chosen later.
- **Scope**: Interfaces and wiring only; no real schema/migrations required.
- **Dependencies**: Task 3 (API skeleton exists).
- **Files likely touched**:
  - `apps/api/src/infra/db/types.ts` (new)
  - `apps/api/src/infra/db/index.ts` (new)
  - `apps/api/src/config/env.ts` (new or update)
  - `apps/api/src/app.ts` (update: wire provider initialization)
- **Acceptance criteria**:
  - API startup selects a DB provider via env (e.g. `DB_PROVIDER` or `DATABASE_URL`) but can run with a “noop/in-memory” provider by default.
  - Persistence code is isolated under `src/infra/db/`.
  - Clear TODO markers and docs indicate where the real DB implementation will go.
- **Verification**: `npm run dev:api` (no DB required), `docker compose up --build` (no DB required)

### Task 6 — Document the monorepo developer workflow (commands, ports, envs)

- **Goal**: Make the new structure approachable and low-friction for contributors.
- **Scope**: Documentation updates only.
- **Dependencies**: Tasks 1–4 (structure exists).
- **Files likely touched**:
  - `README.md` (update: monorepo overview + commands)
  - `QUICKSTART.md` (update: new setup/run steps)
  - `docs/guides/LOCAL_DEV_BACKEND.md` (new)
- **Acceptance criteria**:
  - Docs explain how to run **web**, **api**, and **docker compose**, including ports and env var examples.
  - Repo structure is described at a high level (`apps/`, `packages/`, `infra/`).
- **Verification**: N/A (docs), but commands listed must match actual scripts introduced in Tasks 1–4.

