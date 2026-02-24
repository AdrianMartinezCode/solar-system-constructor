---
name: openspec-init
description: Bootstrap the openspec/ directory structure and populate config.yaml with detected project context.
metadata:
  owner: Founder
  version: "0.1.0"
---

# OpenSpec Init

## Purpose

Scaffold the `openspec/` directory and generate a `config.yaml` that captures the project's tech stack, layout, conventions, and phase-specific rules. This skill is the single source of truth for how to initialize or re-initialize the openspec artifact store.

## When to Use This Skill

- The Founder role is active (via `/flow:init`).
- The `openspec/` directory does not exist or `config.yaml` is stale/missing.

## Inputs

- Project root: `package.json`, `tsconfig*.json`, framework configs, `compose.yaml`.
- Existing `openspec/config.yaml` (if re-initializing).

## Outputs

- `openspec/config.yaml`
- `openspec/specs/` (directory)
- `openspec/changes/` (directory)
- `openspec/changes/archive/` (directory)

## Algorithm / Steps

1. **Detect project context**:
   - Read `package.json` for name, workspaces, scripts, and dependencies.
   - Read `tsconfig*.json` for TypeScript configuration details.
   - Scan for framework config files (`vite.config.*`, `compose.yaml`, `.eslintrc.*`, etc.).
   - Identify the directory layout (`apps/`, `packages/`, `src/`, etc.).

2. **Build config structure**:
   - `project.name` — from `package.json`.
   - `project.description` — from `package.json` or inferred from README.
   - `project.stack` — list of detected technologies.
   - `project.layout` — map of logical areas to directory paths.
   - `project.build_command` / `project.typecheck_command` — from `package.json` scripts.
   - `conventions` — naming rules for roles, skills, changes, specs.
   - `artifact_store.mode` — always `openspec`.
   - `rules` — phase-specific rules (proposal, specs, design, tasks, apply, verify, archive).

3. **Create directory structure**:
   - `openspec/specs/` — empty (specs created by Scribe during real changes).
   - `openspec/changes/` — empty (changes created by pipeline).
   - `openspec/changes/archive/` — empty (completed changes land here).

4. **Write or merge config.yaml**:
   - If `config.yaml` does not exist, write it fresh.
   - If it exists, merge detected values without overwriting user-customized rules.

5. **Return structured envelope**:
   ```json
   {
     "status": "ok",
     "executive_summary": "Initialized openspec/ for <project-name>.",
     "artifacts": [{ "name": "config", "path": "openspec/config.yaml" }],
     "next_recommended": ["explore"],
     "risks": []
   }
   ```

## Task Sizing Rules

- This is always a single-task operation (no decomposition needed).
- Never creates placeholder spec files.
- Never touches source code.

## Example Output Headings

```yaml
# openspec/config.yaml
project:
  name: ...
  description: ...
  stack: [...]
  layout: { ... }
  build_command: ...
  typecheck_command: ...
conventions: { ... }
artifact_store:
  mode: openspec
rules:
  proposal: [...]
  specs: [...]
  design: [...]
  tasks: [...]
  apply: [...]
  verify: [...]
  archive: [...]
```
