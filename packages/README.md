# Packages (`packages/`)

This folder contains **shared libraries** consumed by the apps in `apps/`.

## Planned packages

| Package | Path | Description |
|---------|------|-------------|
| **shared** _(future)_ | `packages/shared/` | Shared TypeScript types/contracts between web and api |

## Conventions

- Each package has its own `package.json` and `tsconfig.json`.
- Packages must be **framework-agnostic** (no React, no Express) unless explicitly scoped.
- Apps import packages via npm workspace references (e.g. `"@solar/shared": "*"`).
