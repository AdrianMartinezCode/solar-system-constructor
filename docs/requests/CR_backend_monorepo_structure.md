# Change Request: Add Backend + Monorepo Structure (Web + API) with Docker-First Local Dev

## Summary

Introduce a backend service to this repo while keeping a clean, scalable monorepo structure. The backend will be **Node.js + TypeScript + Express**, designed to run locally via a **dockerized setup** and backed by a database (DB type TBD). The change should keep the existing frontend working while establishing a predictable “apps + packages + infra” layout.

## Context

Today this repository is a single Vite + React + TypeScript frontend at repo root, with strong docs conventions (`docs/requests` → `docs/plans` → `docs/prompts`). There is no backend, no Docker configuration, and no database integration. We want to grow into a full-stack project without letting repo structure and tooling become ad-hoc.

## Goals

- Establish a **monorepo layout** that cleanly separates frontend and backend codebases.
- Scaffold a backend app (**Express + TS**) with an opinionated internal structure (config, routing, domain, infra).
- Provide a **Docker-first local dev** baseline for the backend (and optionally the DB), without committing to a final database choice prematurely.
- Enable a future “shared contracts” package for types/schemas between web and api (optional but planned).
- Maintain or improve developer ergonomics: predictable scripts, clear docs, minimal setup steps.

## Non-goals

- Implementing any product API features (auth, CRUD endpoints, etc.).
- Finalizing the database technology (Postgres/MySQL/SQLite/Mongo/etc.) in this change.
- Deploying to cloud / production infrastructure (this is local-first scaffolding).
- Refactoring frontend application architecture beyond what’s required to fit the monorepo structure.

## Constraints

- Keep changes **incremental** and **reviewable** (small tasks, ordered, one concern per task).
- Avoid breaking the current frontend `dev/build/preview` flows during the transition (if a move is needed, provide replacement scripts).
- Backend must be **TypeScript-first** and compatible with modern Node (ESM-friendly).
- Docker setup must be usable on typical Linux/macOS machines and avoid embedding secrets.

## Out of Scope

- CI/CD pipelines, production Docker images, hosting, reverse proxy / ingress.
- Database migrations and schema design (beyond a minimal “plug-in DB provider” structure).
- Adding lint/test frameworks unless required by the new structure (can be a follow-up CR).

## Acceptance Criteria

- [ ] Repo has a clearly documented target structure for **web** + **api** + (optional) **shared** packages.
- [ ] A backend app skeleton exists (Express + TS), with a minimal health endpoint and a standard internal folder layout.
- [ ] Docker-based local dev is documented and scaffolded for the backend; DB container support is structured but DB choice remains configurable.
- [ ] Developer commands are documented: how to run web, run api, run both, and run the docker compose stack.
- [ ] The monorepo structure does not introduce hidden coupling between web and api; shared code (if any) is isolated under `packages/`.

## Verification

```bash
# After tasks are implemented (not part of this planning step)
npm run build
npm run typecheck

# Expected monorepo scripts (to be introduced)
npm run dev
npm run dev:web
npm run dev:api

# Docker local dev (to be introduced)
docker compose up --build
```

