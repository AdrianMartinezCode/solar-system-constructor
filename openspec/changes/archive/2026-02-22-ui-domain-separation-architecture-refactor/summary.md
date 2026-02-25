# UI/Domain Separation Architecture Refactor — Archive Summary

**Date**: 2026-02-22
**Status**: Archived (legacy docs migration)

## What

Refactored the app from a coupled single-store architecture to a layered design with clear boundaries between Domain (pure state + commands), Application (orchestration + ports), Infra (localStorage adapter, generator adapter), and UI (React/R3F rendering). Eliminated imperative `setState` usage in the generator panel and split UI-only state (selection, camera, nesting) out of domain mutations.

## Key Decisions

- Adopted a layered architecture: Domain → Application → Infra → UI, with a strict dependency rule (inward only).
- Domain layer must be headless (no React, R3F, Three.js, Zustand, or browser globals).
- Commands and state are JSON-serializable; reducer is pure and side-effect-free.
- Persistence moved behind a `SystemRepository` port with a localStorage adapter.
- Generator panel replaced imperative `useSystemStore.setState(...)` with a stable `replaceUniverseSnapshot` action.
- UI state (selection, camera, nesting/isolation) separated into a dedicated `uiStore`.
- Incremental migration — app kept working after each task.

## Tasks Completed

1. Architecture decision + boundaries doc (ADR-0002)
2. Domain protocol + pure reducer skeleton (`src/domain/universe/`)
3. Ports + localStorage repository adapter
4. Generator panel explicit API (no more imperative setState)
5. `uiStore` for selection state
6. Camera state migration to `uiStore`
7. Nesting level + group isolation migration to `uiStore`
8. Star CRUD + hierarchy ops migrated to domain reducer
9. Group operations migrated to domain reducer
10. Fields/disks/nebula operations migrated to domain commands

## Related Artifacts (removed)

- docs/requests/CR_ui_domain_separation_architecture_refactor.md
- docs/plans/PLAN_ui_domain_separation_architecture_refactor.md
- docs/prompts/ui_domain_separation_architecture_refactor/ (10 tasks)
- docs/decisions/ADR_0002_ui_domain_separation_architecture_refactor.md
