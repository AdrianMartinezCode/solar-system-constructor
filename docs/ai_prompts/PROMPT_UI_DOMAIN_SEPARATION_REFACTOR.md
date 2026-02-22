# Prompt: Refactor to Separate UI, Application, Domain, and Infra (Nested Solar System Constructor)

Use this document as a **copy/paste prompt** for another coding model. It is a guide, not a script: the model should adapt it to repo reality and keep changes incremental.

## Intended model + role

You are a senior TypeScript/React engineer doing an architectural refactor in a Vite + React Three Fiber app. You can read/write repo files and run non-interactive verification commands.

Primary goals:

- **Separate concerns**: UI vs application orchestration vs domain rules vs infrastructure
- **Headless domain**: Node-compatible (no `window`, no `localStorage`, no React/R3F/Zustand)
- **MCP readiness**: expose a JSON-serializable commands/queries surface that can be adapted later

## Context to read first

- `README.md`
- `docs/README.md`
- `docs/design/UI_REDESIGN_WINDOWED.md`
- `docs/design/PROCEDURAL_GENERATOR.md`
- `docs/guides/GENERATOR_UI_INTEGRATION.md`
- Hotspots to inspect before refactoring:
  - `src/state/systemStore.ts`
  - `src/state/windowStore.ts`
  - `src/components/UniverseGeneratorPanel.tsx`
  - `src/components/Scene.tsx`
  - `src/components/StarObject.tsx`
  - `src/utils/persistence.ts`
  - `src/utils/procedural-generator.ts`
  - `src/utils/generatorBridge.ts`
  - `src/types.ts`

## Constraints / do-nots

- No major UI redesign; preserve behavior and saved-data compatibility.
- No “big bang rewrite”; keep the app working after each task/PR.
- Do not change storage keys or save format unless adding an explicit migration.
- Prefer small diffs and explicit file allowlists; one concern per task.
- Avoid code snippets in written outputs; reference files and paths.

## Repository reality (couplings to break)

This repo is Vite + React + TypeScript with Zustand. Today:

- `src/state/systemStore.ts` mixes **universe state**, **UI state** (selection/camera/nesting), and **infra** (persistence calls inside mutations).
- `src/components/UniverseGeneratorPanel.tsx` replaces the universe via `useSystemStore.setState(...)` and then calls `useSystemStore.getState().save()` (bypassing a stable API).
- `src/state/windowStore.ts` is UI-focused but still uses browser globals (`window.*`) and persists workspace via `localStorage`.
- `src/infra/` exists but is currently **empty** (adapters are not established yet).

Preserve these contracts while refactoring:

- Generator panel can still **replace universe** and **persist** the result.
- “Body Inspector” window type compatibility (`planetEditor`) remains stable.
- Groups + isolation + nesting-level behavior remains unchanged.

## Objective

Refactor to a layered architecture where:

- **Domain** is pure and deterministic: state + commands + invariants (no side effects).
- **Application layer** orchestrates effects via ports (persistence, generator, logging).
- **Infra** implements ports (localStorage, generator adapter, dev logger).
- **UI** renders state and dispatches intent; it does not contain domain rules or persistence policy.

## Target architecture (recommended for frontend)

### 1) Domain: `src/domain/` (pure TS)

Deliverables:

- `UniverseState`: the serializable universe snapshot (“what exists”).
- `UniverseCommand`: JSON-serializable commands (“what the user wants to do”).
- `applyUniverseCommand(state, command) -> { nextState, events }`
- Validation/invariants helpers (cycle prevention, parent existence, delete semantics).

Rule: **selection, camera, window layout, and nesting-level display are UI state**, not domain state.

### 2) Application: `src/app/` (or `src/application/`)

Deliverables:

- Port interfaces: `SystemRepository`, `UniverseGenerator`, `DomainEventSink` (and optional `IdGenerator`, `Clock`).
- Use-cases that:
  - accept UI/adapter DTOs
  - validate/normalize
  - call domain reducer
  - decide effects (e.g., “persist after command”)

Design the facade to map cleanly to future MCP tools:

- `dispatch(command)`
- `replaceSnapshot(snapshot)`
- `generateFromConfig(config)`
- `exportSnapshot()`
- `validateSnapshot()`

### 3) Infra: `src/infra/`

Adapters that implement ports:

- LocalStorage repository (wrap or move logic from `src/utils/persistence.ts`)
- Procedural generator adapter (wrap `src/utils/generatorBridge.ts` and/or `procedural-generator.ts`)
- Logger/event sink (console/no-op/structured buffer)

### 4) State wiring: `src/state/`

Zustand is used to wire UI to the app layer:

- `universeStore`: owns `UniverseState` + provides a small command API.
- `uiStore`: selection/camera/nesting/isolation/editor-tab state (UI only).
- `windowStore`: remains UI-only; if it persists workspace, do it via an adapter rather than calling `localStorage` directly inside the store.

### 5) UI: `src/components/`, `src/ui/`

UI reads state and dispatches intent:

- Generator panel should stop calling `useSystemStore.setState(...)` directly; use an explicit “replace universe” API.
- Avoid imperative `getState()` reads in render paths when possible.

## Migration strategy (incremental, low-risk)

- Start by extracting a **small domain slice** (e.g., simulation time tick + star CRUD) behind a facade while keeping the rest in place.
- Introduce ports/adapters for persistence and generation, delegating to current implementations.
- Split UI state out of `systemStore` into `uiStore` (selection/camera/nesting/isolation).
- Migrate remaining universe mutations to the domain reducer in chunks.

## Acceptance Criteria (must-haves)

- `npm run typecheck` and `npm run build` pass.
- No React/R3F/Zustand/browser imports in `src/domain/**`.
- Persistence and generator entry points are behind ports (replaceable).
- Generator panel can replace universe and persists correctly.
- UI state (selection/camera/nesting) is separated from domain mutations.
- Existing behaviors remain: nested hierarchies, groups, isolation, time progression, editors.

## Verification commands

```bash
npm run typecheck
npm run build
```
