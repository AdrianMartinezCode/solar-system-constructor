# Task 4 — Add Docker-first local dev for the backend (compose + Dockerfile)

## Objective

Introduce a Docker-based local development setup for `apps/api` using `docker compose`, including a clean place to attach a database service later. This task establishes structure and developer workflow; it should not force a final DB choice.

## Context to read first

- `docs/plans/PLAN_backend_monorepo_structure.md` (Task 4 section)
- `apps/api/README.md` (from Task 3)
- `apps/api/package.json`

## Constraints

- Keep compose minimal and local-first (no production hardening).
- No secrets in-repo; provide `.env.example` only.
- Compose should build the API image from the repo source.

## Steps

1. Create an API Dockerfile under `apps/api/Dockerfile`:
   - Install dependencies
   - Build the API (`npm run build`)
   - Run with `npm start` (or `node dist/server.js`)
2. Add an `apps/api/.dockerignore` to keep the context small (ignore `node_modules`, `dist`, etc.).
3. Create root `compose.yaml` that defines:
   - `api` service: build from `apps/api`, expose the API port, load env vars from `apps/api/.env` (local) or inline defaults.
   - A commented or optional `db` service section (placeholder) with notes describing where it would go.
4. Add `apps/api/.env.example` documenting required env vars (at minimum `PORT`, plus placeholders for future DB vars).
5. Add `docs/guides/LOCAL_DEV_DOCKER.md` documenting:
   - How to run `docker compose up --build`
   - What ports are used
   - Where env vars are defined

## Files to create/update

- **Create**: `compose.yaml`
- **Create**: `apps/api/Dockerfile`
- **Create**: `apps/api/.dockerignore`
- **Create**: `apps/api/.env.example`
- **Create**: `docs/guides/LOCAL_DEV_DOCKER.md`

## Acceptance criteria

- [ ] `docker compose up --build` starts the API container successfully.
- [ ] `curl http://localhost:3001/health` works when compose is running (adjust port if different).
- [ ] Compose includes an explicit placeholder area for adding a DB service later, with comments.
- [ ] `.env.example` exists and no secrets are committed.

## Verification

```bash
docker compose up --build

# in another terminal:
curl http://localhost:3001/health
```

## Notes

- If the frontend is also run via docker later, extend compose in a separate change request; keep this task backend-only.

