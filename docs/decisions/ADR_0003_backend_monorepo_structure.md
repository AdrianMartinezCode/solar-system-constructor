# ADR: Backend + Monorepo Structure (apps/web + apps/api)

- **Status**: accepted
- **Date**: 2026-02-22
- **Decision owners**: Product Owner (planned), Task Developer (implementing)
- **Related**:
  - `docs/requests/CR_backend_monorepo_structure.md`
  - `docs/plans/PLAN_backend_monorepo_structure.md`
  - `docs/prompts/backend_monorepo_structure/`

## Context

The repository is currently a single Vite + React + TypeScript frontend at the repo root. We need to add a Node.js + TypeScript + Express backend while keeping the codebase maintainable, avoiding ad-hoc structure, and enabling shared code between frontend and backend in the future.

The backend will run locally, primarily via Docker Compose, with a database whose technology is not yet decided.

## Decision

Adopt a **monorepo layout** using **npm workspaces** with the following canonical structure:

```
solar-system-constructor/
├── apps/
│   ├── web/          # Vite + React frontend (moved from root)
│   └── api/          # Node.js + Express backend (new)
├── packages/         # Shared libraries (future, e.g. @solar/shared)
├── compose.yaml      # Docker Compose for local dev (backend + DB)
├── tsconfig.base.json # Shared TS base config
├── package.json      # Root workspace orchestrator
└── docs/             # Planning + docs (unchanged)
```

### Key choices

1. **`apps/` + `packages/` layout**: Industry-standard monorepo convention (used by Turborepo, Nx, etc.). Apps are runnable services; packages are shared libraries. Clear separation prevents hidden coupling.

2. **npm workspaces**: The repo already uses npm + `package-lock.json`. npm workspaces are native, zero-config, and sufficient for our scale. No need for Turborepo/Nx/Lerna overhead at this point.

3. **Shared `tsconfig.base.json`**: A base TypeScript config that both `apps/web/tsconfig.json` and `apps/api/tsconfig.json` extend. Keeps TS settings consistent while allowing per-app overrides (e.g., JSX for web, Node types for api).

4. **Docker Compose for local dev**: The backend runs in a container alongside an optional DB service. The frontend continues to run via Vite (outside Docker) for fast HMR. Docker is not required for frontend dev.

5. **DB provider slot (TBD)**: The API isolates persistence behind an interface (`apps/api/src/infra/db/`). A `noop` provider is the default so the API boots without any database. The actual DB technology (Postgres, SQLite, MongoDB, etc.) can be chosen in a follow-up CR without restructuring the app.

6. **Root scripts orchestrate apps**: `npm run dev:web`, `npm run dev:api`, `npm run build:web`, `npm run build:api`, etc. `npm run dev` defaults to running the web frontend for backward compatibility.

## Consequences

**Positive:**
- Clean separation of frontend and backend with independent dependency trees.
- Shared base TypeScript config reduces drift between apps.
- Docker Compose provides reproducible local dev with one command.
- DB choice is deferred without blocking backend scaffolding.
- Future shared packages (types, contracts) have a clear home in `packages/`.

**Negative:**
- Moving the frontend from root to `apps/web/` creates a large diff (file moves).
- Contributors must learn workspace-aware commands (`npm run dev:web` vs `npm run dev`).
- Slightly more complex project root (more config files).

## Alternatives Considered

- **Separate repositories for frontend and backend** — rejected: harder to share types, more deployment coordination overhead, doesn't match the "portfolio project" single-repo goal.
- **Keep frontend at root, add backend in a subfolder** — rejected: asymmetric structure leads to confusion about which `package.json`/`tsconfig.json` is the "real" one.
- **Use pnpm/yarn workspaces** — rejected: npm is already established; switching package managers adds unnecessary churn.
- **Use Turborepo/Nx** — rejected: overkill for 2 apps; can be adopted later if the repo grows significantly.

## Follow-ups

- Execute Tasks 1–6 in `docs/prompts/backend_monorepo_structure/`.
- Choose a database technology (separate CR).
- Consider adding a `packages/shared/` package for API contracts/types.
- Consider adding a linting/testing CR for the backend.
