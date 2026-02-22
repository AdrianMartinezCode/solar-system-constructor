# Change Request: Separate UI, Application, Domain, and Infra Concerns

## Summary

Refactor the project to a clearer layered architecture where **domain rules/state**, **UI state/rendering**, and **infrastructure concerns** (persistence, generator integration, logging) are separated. The current implementation works, but core concerns are mixed (especially in Zustand stores and generator integration), which makes change-risk and testing higher than necessary.

## Context

Today, key coupling points include:

- `src/state/systemStore.ts` mixes universe data, UI state (selection/camera/nesting), and persistence side effects.
- `src/components/UniverseGeneratorPanel.tsx` imperatively replaces state via `useSystemStore.setState(...)` then calls `save()`.
- `src/state/windowStore.ts` persists workspace data via `localStorage` and depends on browser globals (`window.*`).
- `src/infra/` exists but is currently empty; adapters/ports aren’t established yet.

We want an architecture that is maintainable, testable, and ready for future adapters (e.g., MCP tools) without React/browser dependencies leaking into the domain.

## Goals

- Establish a layered architecture:
  - **Domain**: pure state + commands + invariants, headless (Node-compatible).
  - **Application**: orchestrates domain commands and effect policies via ports.
  - **Infra**: persistence/generator/logging adapters.
  - **UI**: renders and dispatches intent; no persistence policy and no direct state replacement.
- Preserve behavior and saved-data compatibility.
- Replace the generator panel’s imperative “setState + save” flow with an explicit, stable API.
- Split UI state (selection/camera/nesting/isolation) out of domain mutations.

## Non-goals

- No UI redesign (keep the windowed UI and panels as-is).
- No rewrite of the procedural generator algorithm (wrapping/adapting is fine).
- No storage-format migration unless required for compatibility (and then only with an explicit migration step).
- No broad performance initiative (except changes that fall out naturally from removing pathological coupling).

## Constraints

- Incremental, task-sized refactor. Keep the app working after each task/PR.
- Keep tasks small (guideline: ≤ 5 files touched per task) unless explicitly justified.
- Verification must be non-interactive.

## Out of Scope

- Introducing a full test suite (Vitest/Jest) as part of this refactor (can be a follow-up CR).
- Any new gameplay/features beyond what exists today.

## Acceptance Criteria

- [ ] `npm run typecheck` and `npm run build` pass.
- [ ] `src/domain/**` contains no imports from React, R3F/three, Zustand, or browser globals.
- [ ] Persistence is behind a replaceable repository/port (localStorage is an adapter).
- [ ] Generator entrypoint used by UI goes through a replaceable port/facade (no direct `useSystemStore.setState(...)`).
- [ ] UI-only state (selection/camera/nesting/isolation/window layout) is not embedded in domain mutations.
- [ ] Generator panel can still replace the universe and the result persists.
- [ ] Existing behaviors remain: nested hierarchies, groups + isolation + nesting, time tick, editors.

## Verification

```bash
npm run typecheck
npm run build
```

