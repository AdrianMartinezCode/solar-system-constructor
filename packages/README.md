# Packages (`packages/`)

This folder contains **shared libraries** consumed by the apps in `apps/`.

## Packages

| Package | Path | Description |
|---------|------|-------------|
| **@solar/domain** | `packages/domain/` | Shared universe domain types, state, commands, reducer, and validation logic |

## Conventions

- Each package has its own `package.json` and `tsconfig.json`.
- Packages must be **framework-agnostic** (no React, no Express) unless explicitly scoped.
- Apps import packages via npm workspace references (e.g. `"@solar/shared": "*"`).
