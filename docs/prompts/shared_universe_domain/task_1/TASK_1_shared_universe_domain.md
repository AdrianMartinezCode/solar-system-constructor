# Task 1: Bootstrap `@solar/domain` Package

## Objective

Create the `packages/domain/` package skeleton with the necessary `package.json`, `tsconfig.json`, and an empty barrel export. Wire it into the monorepo's workspace and TypeScript project references so downstream tasks can populate it.

## Context to Read First

- `package.json` (root) — confirm `"packages/*"` is in workspaces.
- `tsconfig.base.json` — shared compiler options the new package will extend.
- `tsconfig.json` (root) — project references to add the new package.
- `packages/README.md` — document the new package entry.
- `apps/api/tsconfig.json` — reference for a package that emits declarations (the new package should emit too).

## Constraints

- **No domain code yet** — this task only creates the skeleton.
- Do **not** modify any files under `apps/web/` or `apps/api/`.
- The package must be **framework-agnostic** (no React, no Express dependencies).
- The package must emit declarations (`"declaration": true`) so the API's compiled output can reference them.

## Steps

1. Create `packages/domain/package.json`:
   - `"name": "@solar/domain"`
   - `"version": "1.0.0"`
   - `"private": true`
   - `"type": "module"`
   - `"exports"` field pointing to `./src/index.ts` (for TypeScript source consumption via bundler resolution).
   - `"main"` and `"types"` pointing to `./dist/index.js` and `./dist/index.d.ts` (for compiled consumption).
   - `"scripts"`: `"build": "tsc -p tsconfig.json"`, `"typecheck": "tsc --noEmit"`
   - `"devDependencies"`: `"typescript": "^5.3.3"` (match workspace version).

2. Create `packages/domain/tsconfig.json`:
   - Extend `../../tsconfig.base.json`.
   - Set `"compilerOptions"`: `"outDir": "dist"`, `"rootDir": "src"`, `"declaration": true`, `"declarationMap": true`, `"sourceMap": true`, `"composite": true`.
   - `"include": ["src"]`.

3. Create `packages/domain/src/index.ts`:
   - Single line: `// @solar/domain barrel — types and logic will be added in subsequent tasks.`
   - (Must be a valid, non-empty TS file so the package compiles.)

4. Update root `tsconfig.json`:
   - Add `{ "path": "packages/domain" }` to the `"references"` array.

5. Update `packages/README.md`:
   - Change "**shared** _(future)_" row to document `@solar/domain` as the first real package.

6. Run `npm install` from root to link the new workspace package.

## Files to Create/Update

| File | Action |
|------|--------|
| `packages/domain/package.json` | Create |
| `packages/domain/tsconfig.json` | Create |
| `packages/domain/src/index.ts` | Create |
| `tsconfig.json` (root) | Update |
| `packages/README.md` | Update |

## Acceptance Criteria

- [ ] `packages/domain/package.json` exists with name `@solar/domain`.
- [ ] `packages/domain/tsconfig.json` extends the base config and has `composite: true`.
- [ ] `packages/domain/src/index.ts` exists and is a valid TypeScript file.
- [ ] Root `tsconfig.json` includes `packages/domain` in its project references.
- [ ] `npx tsc -p packages/domain/tsconfig.json --noEmit` passes with zero errors.
- [ ] `npm run build` from root does not regress (both apps still build).

## Verification

```bash
npx tsc -p packages/domain/tsconfig.json --noEmit
npm run build
```

## Notes

- The `"composite": true` option is required for TypeScript project references to work.
- Using `"exports"` with `./src/index.ts` allows Vite and `tsx` to consume TypeScript sources directly without a build step during development. The `"main"`/`"types"` fields serve the compiled output for production builds.
- If `npm install` warns about unresolved peer dependencies, that's acceptable — the package has no runtime deps.
