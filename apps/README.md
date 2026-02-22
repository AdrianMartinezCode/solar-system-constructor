# Apps (`apps/`)

This folder contains the **runnable applications** in the monorepo.

## Contents

| App | Path | Description |
|-----|------|-------------|
| **web** | `apps/web/` | Vite + React + TypeScript frontend (3D solar system constructor) |
| **api** | `apps/api/` | Node.js + TypeScript + Express backend API |

## Conventions

- Each app has its own `package.json`, `tsconfig.json`, and `src/` tree.
- Apps may depend on packages under `packages/` but must **not** import from each other directly.
- Root-level npm scripts orchestrate per-app commands (e.g. `npm run dev:web`, `npm run dev:api`).
