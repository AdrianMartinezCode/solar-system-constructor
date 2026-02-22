# Task 3 — Scaffold backend `apps/api` (Node + TypeScript + Express) with `/health`

## Objective

Create a backend application skeleton under `apps/api` using Node.js + TypeScript + Express, including a minimal `/health` endpoint and a clean internal directory structure that can later host domain logic and infrastructure adapters (DB, etc.).

## Context to read first

- `docs/plans/PLAN_backend_monorepo_structure.md` (Task 3 section)
- Root: `package.json`, `tsconfig.base.json` (if added in Task 1)
- Existing repo conventions: `.agents/agents.md` (for workflow constraints)

## Constraints

- Keep this as a **skeleton** (no product endpoints).
- Prefer a structure that supports future layering:
  - `src/config/`
  - `src/routes/`
  - `src/domain/` (placeholder)
  - `src/infra/` (placeholder)
- Ensure the API can run in dev mode and build to a `dist/` output.

## Steps

1. Create `apps/api/` with its own `package.json`, `tsconfig.json`, and `src/` tree.
2. Add a minimal Express server:
   - `src/app.ts`: create and configure the Express app (json middleware, basic error handling placeholder).
   - `src/routes/health.ts`: register `GET /health` returning `{ ok: true }` (and optionally version/uptime).
   - `src/server.ts`: start listening on a port from env with a sensible default (e.g., `3001`).
3. Add scripts in `apps/api/package.json`:
   - `dev`: run the TS server in watch mode (choose one tool, e.g. `tsx`).
   - `build`: `tsc -p tsconfig.json`
   - `start`: run `node dist/server.js`
   - `typecheck`: `tsc -p tsconfig.json --noEmit`
4. Wire root scripts (if not already) so `npm run dev:api` works from repo root via workspaces.
5. Add `apps/api/README.md` describing:
   - How to run it (dev/build/start)
   - Default port
   - Folder structure conventions

## Files to create/update

- **Create**: `apps/api/package.json`
- **Create**: `apps/api/tsconfig.json`
- **Create**: `apps/api/src/app.ts`
- **Create**: `apps/api/src/server.ts`
- **Create**: `apps/api/src/routes/health.ts`
- **Create**: `apps/api/README.md`
- **Update**: root `package.json` (only if needed to add `dev:api` orchestration)

## Acceptance criteria

- [ ] `npm run dev:api` starts the server locally.
- [ ] `GET /health` returns HTTP 200 and JSON (at minimum `{ "ok": true }`).
- [ ] `npm run build:api` produces a runnable `dist/` output.
- [ ] The API code is organized under `apps/api/src/` with clear separation of concerns (routes/config placeholders present).

## Verification

```bash
npm run typecheck:api
npm run build:api
npm run dev:api

# in another terminal:
curl http://localhost:3001/health
```

## Notes

- Keep the backend’s dependencies minimal at this stage (Express + TS tooling).
- Do not introduce database dependencies yet; that is Task 5.

