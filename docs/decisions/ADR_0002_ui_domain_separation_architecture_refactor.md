# ADR: Separate UI, Application, Domain, and Infrastructure Layers

- **Status**: accepted
- **Date**: 2026-02-22
- **Decision owners**: Task Developer (implementing), Product Owner (planned)
- **Related**:
  - `docs/requests/CR_ui_domain_separation_architecture_refactor.md`
  - `docs/plans/PLAN_ui_domain_separation_architecture_refactor.md`
  - `docs/prompts/ui_domain_separation_architecture_refactor/`
  - `docs/ai_prompts/PROMPT_UI_DOMAIN_SEPARATION_REFACTOR.md`

## Context

The app works, but key concerns are mixed:

- **`src/state/systemStore.ts`** owns universe data, UI state (selection, camera, nesting/isolation), and persistence side effects (calls `saveSystem`/`loadSystem` inside mutations).
- **`src/components/UniverseGeneratorPanel.tsx`** replaces the universe imperatively via `useSystemStore.setState(...)` and then calls `useSystemStore.getState().save()`, bypassing any stable API.
- **`src/infra/`** exists but is empty; there are no established ports or adapters.
- UI-only concerns (selected body, camera POV mode, nesting level, isolated group) live alongside domain mutations, meaning every domain change risks side effects on UI state and vice versa.

This coupling makes it harder to:

- Test domain logic in isolation (Node, no browser).
- Expose a command surface for future MCP tools or automation.
- Reason about persistence policy (which mutations save, which don't).

## Decision

Adopt a **layered architecture** with strict dependency direction (inward):

```
UI  →  State wiring  →  Application  →  Domain
                              ↕
                           Infra
```

### Layers and dependency rule

| Layer | Location | May depend on | Must NOT depend on |
|-------|----------|---------------|-------------------|
| **Domain** | `src/domain/` | Only itself + `src/types.ts` (shared model) | React, R3F, Three.js, Zustand, browser globals (`window`, `localStorage`, `document`) |
| **Application (ports)** | `src/app/ports/` | Domain types | UI, Infra implementations |
| **Infra (adapters)** | `src/infra/` | Domain types, port interfaces | React, UI components |
| **State wiring** | `src/state/` | Domain, ports, Zustand | Infra implementations directly (uses adapters via ports) |
| **UI** | `src/components/`, `src/ui/` | State stores (Zustand hooks), React, R3F | Domain internals, Infra directly |

### What is Domain vs UI vs Infra

**Domain** ("what exists in the universe"):
- Universe snapshot: stars (with hierarchy), groups (with hierarchy), asteroid belts, small body fields, protoplanetary disks, nebulae.
- Pure commands: add/update/remove/attach/detach stars, groups, fields, disks, nebulae; simulation tick.
- Invariants: cycle prevention, parent existence checks, safe recursive delete.
- Must be JSON-serializable, deterministic, side-effect-free.

**UI state** (not persisted with universe):
- Selection: `selectedStarId`, `selectedGroupId`, `selectedBeltId`, `selectedSmallBodyFieldId`, `selectedProtoplanetaryDiskId`, `selectedNebulaId`.
- Camera: `cameraMode`, `cameraTargetBodyId`, `cameraOffset`.
- Viewport display: `nestingLevel`, `isolatedGroupId`.
- Window layout (already in `windowStore`).
- Time scale (`timeScale`) — treated as UI preference, passed into domain tick as a parameter.

**Infra** (adapters implementing ports):
- **Repository**: localStorage persistence (wraps `src/utils/persistence.ts`), preserving key `nested-solar-system` and existing JSON shape.
- **Generator**: wraps `src/utils/generatorBridge.ts` / `src/utils/procedural-generator.ts`.
- **Logger/event sink**: console logger or no-op (optional, future).

### Persistence and generator access via ports

- **`SystemRepository`** port: `save(snapshot)`, `load(): snapshot | null`, `clear()`.
- **`UniverseGenerator`** port (optional/future): `generate(config): snapshot`.
- **`DomainEventSink`** port (optional/future): `emit(events)`.

The store layer calls port implementations (adapters); domain code never calls persistence or generator directly.

### Command/protocol concept

All universe mutations are expressed as `UniverseCommand` discriminated unions:

- Commands are JSON-serializable plain objects.
- A pure reducer `applyUniverseCommand(state, command) → { nextState, events }` processes them.
- Events are optional, JSON-serializable, for logging/debugging/future use.
- The reducer is deterministic and side-effect-free (no `Math.random`, `Date`, `localStorage`, `console`).

### Incremental migration strategy

Migration proceeds task-by-task (see plan), keeping the app working after each task:

1. Document boundaries (this ADR + design note).
2. Create domain skeleton (new files only).
3. Wire persistence behind a repository port.
4. Fix generator panel's imperative state replacement.
5–7. Extract UI state into `uiStore` (selection → camera → nesting/isolation).
8–10. Migrate universe mutations to domain commands (stars → groups → fields/disks/nebulae).

## Consequences

**Positive:**
- Domain logic is testable in Node without browser/React.
- Clear persistence policy (store layer decides when to save, not individual mutations).
- Generator panel uses a stable API instead of imperative state replacement.
- MCP-ready command surface (JSON commands can be dispatched from tools).
- UI state changes cannot accidentally corrupt universe data.

**Negative:**
- More files and indirection (port interfaces, adapter wrappers).
- Migration period: some stores may temporarily have both old and new patterns.
- Slightly more boilerplate for simple mutations (command → reducer → store update).

## Alternatives Considered

- **Big-bang rewrite** — rejected: too risky, breaks the app during migration.
- **Keep everything in `systemStore` but add comments** — rejected: doesn't solve the coupling or testability issues.
- **Use React Context instead of Zustand** — rejected: Zustand is already established and performant; the issue is coupling, not the state library choice.
- **Full DDD with event sourcing** — rejected: overkill for a frontend app; a simple command/reducer pattern provides sufficient separation.

## Follow-ups

- Execute tasks 2–10 in `docs/prompts/ui_domain_separation_architecture_refactor/`.
- After migration, consider a follow-up CR for adding unit tests (Vitest) to validate domain reducer purity.
- Consider a follow-up CR for migrating `windowStore` persistence behind an adapter (lower priority).
