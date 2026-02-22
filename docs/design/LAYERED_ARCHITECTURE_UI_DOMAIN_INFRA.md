# Layered Architecture: UI / Domain / Infra

This document defines **what lives where** after the UI/domain separation refactor, the initial command surface, and the post-refactor generator integration flow.

**Related**: `docs/decisions/ADR_0002_ui_domain_separation_architecture_refactor.md`

---

## Folder Map and Boundaries

```
src/
├── domain/                    # DOMAIN — pure, headless, side-effect-free
│   ├── universe/
│   │   ├── state.ts           # UniverseState type (the serializable snapshot)
│   │   ├── commands.ts        # UniverseCommand union type
│   │   ├── applyCommand.ts    # Pure reducer: (state, command) → { nextState, events }
│   │   └── validate.ts        # Invariant helpers (cycle check, parent exists, etc.)
│   └── index.ts               # Public API barrel export
│
├── app/                       # APPLICATION — port interfaces (no implementations)
│   └── ports/
│       └── systemRepository.ts  # SystemRepository interface (save/load/clear)
│
├── infra/                     # INFRA — adapter implementations
│   └── persistence/
│       └── localStorageSystemRepository.ts  # localStorage adapter (wraps existing logic)
│
├── state/                     # STATE WIRING — Zustand stores, connects layers
│   ├── systemStore.ts         # Universe data store (delegates to domain commands)
│   ├── uiStore.ts             # UI-only state (selection, camera, nesting, isolation)
│   └── windowStore.ts         # Window layout state (existing, UI-only)
│
├── components/                # UI — React/R3F rendering components
│   ├── Scene.tsx
│   ├── StarObject.tsx
│   ├── BodyCameraController.tsx
│   ├── UniverseGeneratorPanel.tsx
│   └── ...
│
├── ui/                        # UI — React panels and controls
│   ├── BodyEditorPanel.tsx
│   ├── GroupEditorPanel.tsx
│   ├── NestingLevelControl.tsx
│   ├── NebulaEditorPanel.tsx
│   └── ...
│
├── utils/                     # UTILS — pure helpers (can be used by any layer)
│   ├── persistence.ts         # Low-level localStorage helpers (used by infra adapter)
│   ├── generatorBridge.ts     # Generator integration (used by store/infra)
│   ├── procedural-generator.ts
│   ├── physics.ts
│   ├── groupUtils.ts
│   └── ...
│
└── types.ts                   # Shared model types (Star, Group, etc.)
```

### Dependency Rules (strict)

| From | May import | Must NOT import |
|------|-----------|-----------------|
| `src/domain/**` | `src/types.ts`, other `src/domain/**` | React, R3F, Three, Zustand, browser globals, `src/state/`, `src/infra/`, `src/components/`, `src/ui/` |
| `src/app/ports/**` | `src/types.ts`, `src/domain/**` | React, R3F, Three, Zustand, browser globals, `src/infra/`, `src/state/`, `src/components/`, `src/ui/` |
| `src/infra/**` | `src/types.ts`, `src/domain/**`, `src/app/ports/**`, `src/utils/**` | React, R3F, `src/state/`, `src/components/`, `src/ui/` |
| `src/state/**` | `src/types.ts`, `src/domain/**`, `src/app/ports/**`, `src/infra/**`, Zustand | React (hooks only if needed), R3F |
| `src/components/**`, `src/ui/**` | `src/state/**` (Zustand hooks), React, R3F, Three, `src/types.ts` | `src/domain/**` internals, `src/infra/**` directly |
| `src/utils/**` | `src/types.ts` | React, R3F, Zustand, `src/state/`, `src/domain/` (utils are lower-level) |

---

## Command/Protocol Surface

### `UniverseState`

The serializable universe snapshot. Aligns with the currently persisted fields:

```
{
  stars:              Record<string, Star>
  rootIds:            string[]
  groups:             Record<string, Group>
  rootGroupIds:       string[]
  belts:              Record<string, AsteroidBelt>
  smallBodyFields:    Record<string, SmallBodyField>
  protoplanetaryDisks: Record<string, ProtoplanetaryDisk>
  nebulae:            Record<string, NebulaRegion>
  time:               number
}
```

### `UniverseCommand` (initial surface — names only)

Simulation:
- `Tick` — advance simulation time by `dt`

Star CRUD + hierarchy:
- `AddStar` — add a new star/planet/moon/body
- `UpdateStar` — patch star properties
- `RemoveStar` — recursive delete (star + descendants)
- `AttachStar` — set parent (with cycle check)
- `DetachStar` — make root-level

Ring operations:
- `UpdateRing` — add/update planetary ring on a body
- `RemoveRing` — remove planetary ring from a body

Group CRUD + hierarchy:
- `AddGroup` — create a group
- `UpdateGroup` — patch group properties
- `RemoveGroup` — delete group (reparent children)
- `AddToGroup` — add child (system or group) to group
- `RemoveFromGroup` — remove child from group
- `MoveToGroup` — move child between groups (with cycle check)

Small body field operations:
- `SetSmallBodyFields` — bulk set/replace fields
- `UpdateSmallBodyField` — patch a field
- `RemoveSmallBodyField` — delete a field

Protoplanetary disk operations:
- `SetProtoplanetaryDisks` — bulk set/replace disks
- `AddProtoplanetaryDisk` — add a disk to a star
- `UpdateProtoplanetaryDisk` — patch a disk
- `RemoveProtoplanetaryDisk` — delete a disk

Nebula operations:
- `SetNebulae` — bulk set/replace nebulae
- `UpdateNebula` — patch a nebula
- `RemoveNebula` — delete a nebula

Snapshot-level:
- `ReplaceSnapshot` — wholesale replace the universe (used by generator)

### JSON-Serializable Requirement

All commands and state must be plain JSON (objects, arrays, strings, numbers, booleans, null). No class instances, no functions, no `Date` objects, no `undefined` as values.

---

## Port Interfaces

### `SystemRepository`

```typescript
interface SystemRepository {
  save(snapshot: UniverseState): void;
  load(): UniverseState | null;
  clear(): void;
}
```

Adapter: `localStorageSystemRepository` — wraps existing `src/utils/persistence.ts`, preserves key `nested-solar-system` and existing JSON shape.

### `UniverseGenerator` (future, optional)

```typescript
interface UniverseGenerator {
  generate(config: GenerationConfig): UniverseState;
}
```

Not required for the initial migration; the generator bridge can remain as a utility called by the store.

### `DomainEventSink` (future, optional)

```typescript
interface DomainEventSink {
  emit(events: DomainEvent[]): void;
}
```

For structured logging, debugging, or MCP tool integration.

---

## Generator Panel "Replace Universe" Flow (Post-Refactor)

### Current flow (problematic)

```
UniverseGeneratorPanel
  → generateUniverse(config)
  → useSystemStore.setState({ stars, rootIds, groups, ... })   ← imperative state replacement
  → useSystemStore.getState().save()                            ← direct persistence call
```

### Target flow (post-refactor)

```
UniverseGeneratorPanel
  → generateUniverse(config)                                   ← same generator call
  → systemStore.replaceUniverseSnapshot(generatedSnapshot)     ← explicit store action
      → internally: set universe state
      → internally: reset UI state (selection) via uiStore
      → internally: persist via SystemRepository adapter
```

Key changes:
- **No `useSystemStore.setState(...)` in UI code** — all state changes go through explicit store actions.
- **No `useSystemStore.getState().save()` in UI code** — persistence policy is owned by the store layer.
- **Selection clearing** is handled by the store action or by `uiStore` reacting to the snapshot replacement.

---

## Migration Stages (aligned with plan)

| Stage | Tasks | What changes |
|-------|-------|-------------|
| **Foundation** | 1–2 | Docs + domain skeleton (new files only) |
| **Infra wiring** | 3–4 | Repository port + generator API fix |
| **UI state extraction** | 5–7 | `uiStore` for selection, camera, nesting/isolation |
| **Domain migration** | 8–10 | Star, group, field/disk/nebula ops → domain commands |

After all stages, `systemStore` is a thin shell that:
1. Holds `UniverseState`.
2. Exposes actions that build `UniverseCommand`, call `applyUniverseCommand`, set next state, and persist via the repository adapter.
3. Does not own UI state (that's in `uiStore`).
4. Does not call `localStorage` or `saveSystem` directly (that's via the repository port).
