# Task 2 — Move existing frontend into `apps/web` and preserve dev/build scripts

## Objective

Relocate the current Vite + React + TypeScript frontend from repo root into `apps/web` as part of the monorepo structure, while preserving equivalent developer commands from the repo root.

## Context to read first

- `docs/plans/PLAN_backend_monorepo_structure.md` (Task 2 section)
- Root: `package.json`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `index.html`
- App: `src/`

## Constraints

- No functional frontend changes (this is a structural move only).
- Keep the move mechanical: prefer file moves + minimal config/script adjustments.
- Maintain a root-level command that developers can keep using (`npm run dev` should remain easy).

## Steps

1. Create `apps/web/`.
2. Move the frontend project files into `apps/web/`:
   - Move at minimum: `src/`, `index.html`, `vite.config.ts`, `tsconfig.json`, `tsconfig.node.json`, `vite-env.d.ts`, and any frontend-specific assets/config.
3. Create `apps/web/package.json` with the frontend dependencies and scripts (`dev`, `build`, `preview`, `typecheck`).
   - Keep the frontend as ESM (`"type": "module"`) if it already is.
4. Update root `package.json` scripts to call the web workspace:
   - `dev:web`, `build:web`, `preview:web`, `typecheck:web`
   - Optionally keep `dev` as an alias to `dev:web` for convenience.
5. Ensure TypeScript configs remain valid:
   - Add `apps/web/tsconfig.json` if needed (may reuse/move existing one).
   - If you created `tsconfig.base.json` in Task 1, consider extending it from `apps/web/tsconfig.json`.
6. Confirm that Vite works from its new location (`apps/web`), including correct path resolution for `index.html` and `src/`.

## Files to create/update

- **Create**: `apps/web/package.json`
- **Update/Move**: `apps/web/src/**` (moved from root `src/`)
- **Update/Move**: `apps/web/vite.config.ts`
- **Update/Move**: `apps/web/index.html`
- **Update/Move**: `apps/web/tsconfig.json`
- **Update/Move**: `apps/web/tsconfig.node.json`
- **Update**: root `package.json`

## Acceptance criteria

- [ ] `npm run dev:web` runs the frontend successfully.
- [ ] `npm run build:web` succeeds.
- [ ] `npm run preview:web` works (if supported).
- [ ] `npm run dev` at repo root still starts the frontend (either directly or as an alias).
- [ ] No changes to runtime behavior in the app (only structure and config paths).

## Verification

```bash
npm run dev:web
npm run build:web
npm run typecheck:web
```

## Notes

- Expect a large “move-only” diff; keep the commit message explicit (e.g., “move frontend to apps/web”).
- If `README.md` or `QUICKSTART.md` mention root-level paths, leave them for Task 6 (docs).

