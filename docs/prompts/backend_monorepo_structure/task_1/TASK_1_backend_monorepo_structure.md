# Task 1 — Monorepo workspace scaffolding + ADR (backend + frontend in one repo)

## Objective

Introduce the canonical monorepo structure and root-level orchestration without yet building the backend or moving the frontend. Capture the key structural decisions in an ADR so future contributors understand the “why” behind the layout.

## Context to read first

- `docs/requests/CR_backend_monorepo_structure.md`
- `docs/plans/PLAN_backend_monorepo_structure.md`
- `package.json`
- `tsconfig.json`
- `docs/decisions/ADR_0001_agents_dot_agents_consolidation.md`
- `docs/decisions/ADR_0002_ui_domain_separation_architecture_refactor.md`

## Constraints

- Do **not** implement the backend app yet (that is Task 3).
- Do **not** move the frontend yet (that is Task 2).
- Keep diffs focused on structure + orchestration; avoid adding lint/test tooling in this task.
- Use **npm workspaces** (this repo already uses npm + `package-lock.json`).

## Steps

1. Create top-level directories (empty folders can be documented via README files):
   - `apps/`
   - `packages/`
   - (optional) `infra/` (only if you add a README; actual Docker comes later)
2. Add `apps/README.md` and `packages/README.md` that briefly describe their purpose and the intended contents (`apps/web`, `apps/api`, `packages/shared`, etc.).
3. Add a shared TypeScript base config at repo root (`tsconfig.base.json`) for future apps to extend.
   - Keep it generic (Node/Web-friendly), and keep frontend-specific bundler settings in the web app tsconfig (later).
4. Update root `package.json` to support workspaces and monorepo scripts.
   - Add `workspaces` entries for `apps/*` and `packages/*`.
   - Add scripts placeholders that will work once `apps/web` and `apps/api` exist (Tasks 2–4), e.g.:
     - `dev:web`, `build:web`, `typecheck:web`
     - `dev:api`, `build:api`, `typecheck:api`
     - `dev` (either runs `dev:web` by default or runs both via a later task/tool)
5. Write an ADR documenting:
   - Why we chose `apps/` + `packages/`
   - How we will run things locally (web via Vite, api via Node/Express, api via Docker compose)
   - How we will handle DB “TBD” safely (provider slot + env-driven wiring)

## Files to create/update

- **Create**: `apps/README.md`
- **Create**: `packages/README.md`
- **Create**: `tsconfig.base.json`
- **Create**: `docs/decisions/ADR_0003_backend_monorepo_structure.md`
- **Update**: `package.json`

## Acceptance criteria

- [ ] `apps/README.md` and `packages/README.md` exist and describe the intended structure.
- [ ] `tsconfig.base.json` exists and is suitable for both Node and web packages to extend.
- [ ] Root `package.json` includes `workspaces` for `apps/*` and `packages/*`.
- [ ] Root scripts include `dev:web`, `build:web`, `dev:api`, `build:api` (they may fail until Tasks 2–4 add the workspaces, but must be syntactically correct).
- [ ] `docs/decisions/ADR_0003_backend_monorepo_structure.md` exists and clearly states the decision and consequences.

## Verification

```bash
npm run typecheck
```

## Notes

- If `npm run typecheck` begins failing due to workspace changes, keep the root `typecheck` targeting the current frontend TS config until Task 2 relocates the frontend into `apps/web`.

