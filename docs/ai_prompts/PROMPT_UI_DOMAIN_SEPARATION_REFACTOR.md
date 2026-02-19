# Prompt: Refactor to Separate UI and Domain (Nested Solar System Constructor)

Use this document as a **copy/paste prompt** for another coding model.

## Intended model + role

You are a senior TypeScript/React engineer doing an architectural refactor. Your output should read like a high-quality PR plan + implementation (but you will actually implement it in the target environment when executed).

The key goal is **separation of concerns** between:

- **Domain layer**: pure business rules, data structures, simulation rules, generation rules, invariants
- **UI/presentation layer**: React components, three.js/react-three-fiber rendering, windowing, input handling, local UI state
- **Infrastructure/adapters**: persistence (localStorage), procedural generator integration, any external APIs

Additional forward-looking constraint:

- **MCP readiness**: this refactor should make it straightforward to add **MCP servers later** by ensuring the domain is callable headlessly and has a clean “commands/queries” surface that can be exposed via an adapter (without React/browser dependencies).

## Context to read first

- Primary conversation to mirror intent: [Nested Solar System Builder (shared ChatGPT conversation)](https://chatgpt.com/s/t_6996d8de294c8191a5bf398d72855c82)
- Repo product overview and rules: `README.md` (notably “Nested systems” rule: local heaviest-mass body is the center)
- Getting started / usage notes: `QUICKSTART.md`
- UI windowing rationale (mentions separation of concerns at the UX level): `docs/UI_REDESIGN_WINDOWED.md`
- Generator integration + expectations: `docs/GENERATOR_UI_INTEGRATION.md` and `docs/UI_IMPLEMENTATION_SUMMARY.md`
- Body Inspector modular structure + behavior expectations: `docs/BODY_EDITOR_REFACTOR_SUMMARY.md` and `docs/BODY_EDITOR_STRUCTURE.md`
- Generator algorithm overview (helps decide what can be “domain-pure”): `docs/ALGORITHM_FLOW.md` and `docs/PROCEDURAL_GENERATOR.md`

## Constraints / do-nots

- **Do not include code snippets** in your response. You may reference files and propose folder/module names, but avoid code blocks and concrete implementations so you keep implementation freedom.

## Repository Snapshot (What Exists Today)

Project: Vite + React + TypeScript, using Zustand for state.

Notable current structure:

- `src/state/systemStore.ts`: one large Zustand store that mixes:
  - domain state (stars/groups/belts/fields/disks/nebulae, time, timeScale)
  - domain operations (CRUD, hierarchy ops)
  - UI state (selected IDs, nesting level, camera mode)
  - infrastructure (localStorage persistence via `src/utils/persistence.ts`)
- `src/state/windowStore.ts`: window manager state (UI concern)
- `src/types.ts`: central data types for bodies and visual-only constructs (rings, disks, belts, nebulae, etc.)
- `src/utils/physics.ts`: orbit/trajectory math and “heaviest star” helper
- `src/utils/persistence.ts`: save/load localStorage
- `src/utils/procedural-generator.ts` + `src/utils/generatorBridge.ts`: procedural generation and UI→internal mapping
- `src/components/*`: 3D scene + object renderers and window manager UI shell
- `src/ui/*`: editor panels and controls (read/write directly to `useSystemStore`)

Key coupling patterns to break:

- React components import `useSystemStore` and call domain mutations directly.
- Components read fresh state with `useSystemStore.getState()` inside render loops (e.g., frame updates) and mix rendering logic with domain rules.
- Persistence is triggered inside store actions (hard to test and hard to swap).

Important existing integration “contracts” (preserve behavior while refactoring):

- **Universe generator UI** currently updates the universe by calling `useSystemStore.setState({ ...universe })` and then `useSystemStore.getState().save()` (see `docs/GENERATOR_UI_INTEGRATION.md`). After refactor, the generator UI should still be able to “replace universe” + “persist”, but via the new facade/store API (not direct Zustand internals).
- **Body Inspector UI** (`src/ui/BodyEditorPanel.tsx` and `src/ui/body-editor/*`) expects:
  - selection to be stable and consistent across body types and non-body selections (groups/nebulae/fields)
  - window type naming backwards-compatibility (window type `planetEditor` still exists even if titled “Body Inspector”)
  - operations like attach/detach, delete-with-children, and camera mode toggles to continue to work
- **Window manager** (`src/state/windowStore.ts`) is already a UI-only concern; preserve it as such and avoid pulling domain logic into it.

## Objective

Refactor the codebase to a layered architecture where:

- The **domain** can be executed and unit-tested without React, three.js, Zustand, or the browser (no `localStorage`, no `window`, no DOM).
- The **UI** becomes a thin layer: renders state and dispatches intent to the domain via a stable API.
- **Persistence and generator** become replaceable adapters behind interfaces (ports).

This should be a refactor, not a rewrite: preserve behavior and data compatibility.

## Non-Goals (Avoid Scope Creep)

- No major UI redesign (keep current windowed UI, editors, and scene behavior).
- No new gameplay/features beyond what exists (unless required to preserve behavior after refactor).
- No major changes to procedural generation logic, except moving and wrapping it behind a port.
- Do not change saved-data format or storage key unless absolutely necessary (if you must, add a migration strategy).

## MCP-Readiness Requirements (Why We’re Doing This)

The point of separating UI and domain is not just cleanliness: it’s to make it possible to add **MCP servers later** (e.g., a local tool server that can create bodies, run generation, export stats, or validate systems).

Design now so that later you can implement an MCP adapter without touching core domain logic:

- **Headless execution**: domain can run in Node (no `window`, no `localStorage`, no R3F/three).
- **Serializable protocol**: commands and results should be JSON-serializable (plain objects, no class instances required).
- **Clear ports**: persistence, generator, telemetry/logging, and any “external control” surfaces should be behind interfaces.
- **Stable surface area**: expose an “application service” with explicit commands/queries that maps well to MCP tools (e.g., `createBody`, `updateBody`, `attachBody`, `generateUniverse`, `exportUniverse`, `validateUniverse`).

## Target Architecture (Proposed)

You may adjust naming, but keep the spirit: **domain independent, adapters at edges, UI on top**.

### 1) Domain layer (pure TypeScript)

Create a `src/domain/` (or similarly named) area that contains:

- **Domain models/entities** for:
  - nested star/body tree (including orbit parameters and body subtypes)
  - groups (hierarchical containers + invariants like “no cycles”)
  - visual-only constructs that are still part of the “universe data” (rings, particle fields, protoplanetary disks, nebulae)
- **Domain services/use-cases** for:
  - CRUD and hierarchy operations (add/update/remove/attach/detach/move)
  - simulation time progression (tick) and any derived calculations that are domain-level
  - validation/invariants (no cycles; parent existence; selection clearing should be UI-layer, not domain-layer)
- **Ports (interfaces)** the domain depends on, not implementations:
  - `SystemRepository` (load/save/clear)
  - `UniverseGenerator` (generate universe result from config)
  - optional but recommended for MCP readiness: a `DomainLogger` (or structured event sink) so the domain can emit audit/events without `console.*`
  - optional: `IdGenerator`, `Clock`, `Logger` (only if helpful)

Domain deliverable: a stable “facade” or “application service” API the UI can call (commands and queries), with explicit inputs/outputs.

Strong recommendation for MCP readiness:

- Define a **domain protocol** (commands + query DTOs + result DTOs) in one place (e.g., `src/domain/protocol/`) that is:
  - JSON-serializable
  - versionable (even just a `version` field or careful additive changes)
  - usable by both UI adapters and future MCP adapters

### 2) Infrastructure / adapters layer

Create `src/infra/` or `src/adapters/` containing:

- LocalStorage repository implementing `SystemRepository` using existing persistence logic and **preserving backward compatibility**
- Procedural generator adapter implementing `UniverseGenerator` by delegating to existing generator modules (and/or moving those modules under infra if they are not domain-pure)

Guidance on generator placement:

- The procedural generator has a well-defined algorithm pipeline (see `docs/ALGORITHM_FLOW.md`). If it can remain deterministic/pure given a seed and config, it can be treated as a domain service. If it relies on browser globals or side effects, keep it in infra but still behind the `UniverseGenerator` port.

### 3) Presentation / UI layer

Keep React rendering in `src/components` and `src/ui`, but refactor them to depend on the domain facade rather than reaching into the domain internals.

Split Zustand into **at least two concerns**:

- **Universe/System domain store**: holds the domain state snapshot (or delegates to domain state machine) and exposes domain commands
- **UI store**: selection, window layout, camera mode, nesting level, inspector tab state, etc.

Rule of thumb: if it affects “what exists in the universe” → domain store; if it affects “how it is viewed/edited” → UI store.

## Suggested approach

Implement this in small, safe steps that keep the app running throughout:

1) **Define boundaries**:
   - Decide which state fields are domain vs UI.
   - Identify persistence triggers and generator calls.
   - Identify future MCP-exposed operations (a shortlist of commands the app should support externally).

2) **Extract pure domain operations**:
   - Move logic for star/group CRUD and hierarchy changes out of `src/state/systemStore.ts` into domain functions/services.
   - Ensure those functions are pure: input state + command → output state (or patches) with no side effects.

3) **Introduce ports and adapters**:
   - Replace direct localStorage usage in domain paths with `SystemRepository`.
   - Wrap generator usage behind `UniverseGenerator`.
   - Add a minimal “domain protocol” (DTOs) layer so commands/results don’t leak UI-only types.

4) **Refactor stores**:
   - Convert `systemStore` into a thin composition layer that wires domain + adapters + persistence policies.
   - Create a separate UI store for selection/camera/nesting; update components accordingly.
   - Ensure “selection clearing” is a UI concern (today it’s embedded in domain mutations).
   - Preserve generator panel flow by offering an explicit “replace universe” action that also triggers persistence via the repository adapter (instead of `setState` + `save`).

5) **Update UI components**:
   - Replace direct `useSystemStore` coupling with domain facade hooks/selectors plus UI-store selection.
   - Reduce or eliminate direct `getState()` usage inside render loops; prefer explicit selectors and injected values.
   - Keep the windowing system (`windowStore`) UI-only; avoid moving domain concerns into it.

6) **Verify saved-data compatibility**:
   - Load existing saved data and confirm the same behavior.

7) **Document** the new architecture in a short `docs/` note (what lives where, how to add a new entity).

## Acceptance Criteria (Must-Haves)

Your refactor is “done” when all of the following are true:

- **Build/TypeScript**: project builds without type errors.
- **No React dependencies in domain**: domain files do not import React, three.js, `@react-three/fiber`, Zustand, or browser globals.
- **Replaceable persistence**: persistence is behind a repository interface; changing storage mechanism would not require editing domain logic.
- **Replaceable generator**: generation entrypoint for UI goes through a port (even if adapter delegates to current implementation).
- **MCP-ready domain surface**:
  - domain commands/queries are JSON-serializable DTOs
  - domain can run headless (Node-compatible) without browser globals
  - it is realistic to add an MCP adapter later without editing domain logic
- **UI/domain separation**:
  - UI selection, window layout, and camera mode are not mixed into domain mutations.
  - Domain commands do not implicitly “select” things; they return updated state and/or identifiers so the UI can decide.
- **Behavior preserved**:
  - Nested star hierarchies still work.
  - Grouping + nesting level + isolation still work.
  - Time progression (`tick`) still updates orbits/animations.
  - Editors still create/update/delete bodies and groups.
  - Persistence still saves and reloads.

## Nice-to-Haves (If Cheap)

- Add a small suite of unit tests for extracted domain operations (cycle prevention, attach/detach rules, etc.).
- Add lightweight runtime assertions for invariants in development mode.

## Deliverables

When you execute this prompt, produce:

- A refactor that introduces the new layered structure.
- A short written summary of what moved where and why.
- A checklist of the acceptance criteria with notes on how you verified each item.

## Files to touch

- Primary:
  - `src/domain/` (new/extracted domain logic)
  - `src/infra/` (ports/adapters, persistence, generator integration)
  - `src/state/` (store split / wiring)
  - `src/ui/` and `src/components/` (UI updated to use the new facade/API)
- Secondary (as needed for documentation):
  - `docs/` (short architecture note)

## Verification commands

```bash
npm run typecheck
npm run build
```
