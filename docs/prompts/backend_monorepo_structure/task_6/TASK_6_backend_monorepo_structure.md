# Task 6 — Update docs for the new monorepo workflow (web + api + docker)

## Objective

Update repository documentation so contributors understand the new structure and how to run the frontend and backend locally (with or without Docker). This task should align docs with the scripts and ports introduced in Tasks 1–4.

## Context to read first

- `README.md`
- `QUICKSTART.md`
- `docs/README.md` (docs taxonomy + workflow)
- `package.json` (root scripts)
- `apps/web/package.json` (after Task 2)
- `apps/api/README.md` (after Task 3)
- `compose.yaml` (after Task 4)

## Constraints

- Keep docs concise and actionable.
- Do not introduce new tooling requirements in docs that aren’t actually implemented.
- Use the existing docs taxonomy: guides under `docs/guides/`, high-level overview in root `README.md`.

## Steps

1. Update root `README.md`:
   - Add a short “Monorepo structure” section (`apps/web`, `apps/api`, optional `packages/*`).
   - Add “Local development” commands for web and api.
2. Update `QUICKSTART.md`:
   - Ensure paths reflect the new location of the frontend (if moved to `apps/web`).
   - Add backend instructions: run API locally, run API via docker compose.
3. Add `docs/guides/LOCAL_DEV_BACKEND.md`:
   - Backend ports, env vars, basic run commands
   - How `/health` works and how to verify it
4. Cross-link to `docs/guides/LOCAL_DEV_DOCKER.md` (added in Task 4).

## Files to create/update

- **Update**: `README.md`
- **Update**: `QUICKSTART.md`
- **Create**: `docs/guides/LOCAL_DEV_BACKEND.md`

## Acceptance criteria

- [ ] Root README describes the new repo structure and has correct commands.
- [ ] QUICKSTART works as a copy/paste onboarding flow and includes backend steps.
- [ ] `docs/guides/LOCAL_DEV_BACKEND.md` exists and is consistent with the actual scripts/ports.

## Verification

```bash
# Commands referenced by docs must exist and work after prior tasks:
npm run dev:web
npm run dev:api
docker compose up --build
```

## Notes

- If you notice inconsistencies (ports/scripts), fix the scripts to match the docs rather than documenting broken behavior.

