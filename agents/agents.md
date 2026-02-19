# Agent Contract — Solar System Constructor

## Project Overview

This repo is a **Vite + React + TypeScript** frontend that renders an interactive, procedurally-generated solar system. It uses React Three Fiber / Three.js for 3D rendering, Zustand for state management, and a domain-driven folder layout (`src/domain`, `src/ui`, `src/infra`). The build toolchain is npm + Vite + TypeScript. There is currently no test runner or linter configured.

## Architecture Snapshot

| Layer | Path | Purpose |
|-------|------|---------|
| Domain | `src/domain/` | Models, ports, protocols, services |
| UI | `src/ui/`, `src/components/` | React components, panels, windows |
| State | `src/state/` | Zustand stores |
| Infra | `src/infra/` | Infrastructure adapters |
| Utils | `src/utils/` | Pure helper functions |
| Config | `vite.config.ts`, `tsconfig.json` | Build & type config |
| Agents | `agents/` | Agent contract + skill playbooks |
| Docs | `docs/` | Requests, plans, prompts, decisions |
| MCP | `mcp/server/` | Local MCP server for repo tooling |

## Workflow

1. **Read** — Gather repo context using MCP tools (read, list, search, context snapshot).
2. **Plan** — Use the PO Task Decomposer skill to break a change request into ordered tasks with acceptance criteria. Output goes to `docs/plans/` and `docs/prompts/`.
3. **User Approval** — Human reviews the plan and task prompts before any implementation begins.
4. **Implement Tasks** — Execute tasks one at a time, each as a small, reviewable diff.
5. **Verify** — Run verification commands (build, typecheck, lint, tests as available) after each task.

## Definition of Done

A task is "done" when:

- All acceptance criteria listed in the task prompt are met.
- `npm run build` passes without errors.
- No unrelated files are modified.
- (When available) `npm run lint` and `npm test` pass.

## Change Policy

- Keep diffs **small and focused** — one concern per task.
- Do **not** mix refactors with feature work.
- Do **not** change files outside the task's explicit scope.
- Prefer **editing existing files** over creating new ones unless the task requires it.

## Safety Policy

- **No secrets** — never commit API keys, tokens, or credentials.
- **No destructive commands** — no `rm -rf`, no force-pushes, no DB drops.
- **No network calls** unless explicitly required by a dependency install.
- All tool operations are **repo-root restricted** — no path traversal outside the project.
