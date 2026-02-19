# Body Editor Structure

## Status

Stable

## Problem / context

The Body Editor (aka “Body Inspector”) is a complex UI surface with multiple body types, tabs, and cross-cutting actions (selection, camera controls, attach/detach). This doc captures the component structure and UX-level organization.

## Goals / non-goals

- **Goals**:
  - Document the panel/component hierarchy and tab structure.
  - Provide a mental model for where new body-editing controls belong.
- **Non-goals**:
  - Full implementation details (see implementation docs when needed).

## Key concepts / terminology

- **Body Inspector**: the window/panel for viewing/editing a selected body.
- **Tabs**: Basics / Orbit / Special / Advanced sections of the editor form.

## System overview

(Component hierarchy diagram below)

## Data model / invariants

- The editor UI reflects (and edits) the currently selected entity.
- Tab availability depends on body type/parentage (e.g. Orbit tab requires a parent and non-rogue).

## Key flows

- Select body → editor shows form with relevant tabs → edits dispatch store/domain updates.
- Camera controls are available from the editor header for quick POV/overview changes.

## Tradeoffs / alternatives

- A single “mega panel” centralizes editing but requires careful modularization to avoid becoming unmaintainable.

## Open questions

- Should “Advanced” be hidden behind a dev-only toggle?

## Related docs

- `docs/design/UI_REDESIGN_WINDOWED.md`
- `docs/guides/KEYBOARD_SHORTCUTS.md`

## Component Hierarchy

```
BodyEditorPanel (main)
├── Header
│   ├── Title: "Body Inspector"
│   └── "+ Add Body" button
│
├── Add Form (conditional)
│   ├── Body Type selector
│   ├── Basic properties (name, mass, radius, color)
│   └── Parent + orbit settings
│
├── Editor Form (when body selected)
│   ├── Header Row
│   │   ├── Icon (based on body type)
│   │   ├── Name + Type Badge
│   │   └── Camera Controls
│   │
│   ├── Tab Navigation
│   │   ├── [Basics] (always shown)
│   │   ├── [Orbit] (only if has parent & not rogue)
│   │   ├── [Special] (always shown)
│   │   └── [Advanced] (debug view)
│   │
│   └── Tab Content
│       │
│       ├── BASICS TAB
│       │   ├── Name (editable)
│       │   ├── Body Type (read-only)
│       │   ├── ID (read-only)
│       │   ├── Parent selector
│       │   ├── Mass
│       │   ├── Radius
│       │   └── Color
│       │
│       ├── ORBIT TAB
│       │   └── <OrbitEditor />
│       │       ├── Mode toggle (Simple/Advanced)
│       │       ├── Simple: distance, speed, phase
│       │       └── Advanced: semi-major axis, eccentricity,
│       │           offsets, rotations
│       │
│       ├── SPECIAL TAB
│       │   ├── <PlanetaryRingsEditor />     [if bodyType === 'planet']
│       │   ├── <CometEditor />              [if bodyType === 'comet']
│       │   ├── <BlackHoleEditor />          [if bodyType === 'blackHole']
│       │   ├── <RoguePlanetEditor />        [if isRoguePlanet]
│       │   ├── <LagrangePointDisplay />     [if bodyType === 'lagrangePoint']
│       │   └── <ProtoplanetaryDiskSection/> [if root star & not black hole]
│       │
│       └── ADVANCED TAB
│           └── JSON debug view (read-only)
│
└── Empty State (when nothing selected)
    └── "Select a celestial body to inspect or create a new one"
```

## Subcomponent Details

### OrbitEditor
**Shown when**: Body has a parent and is not a rogue planet

**Features**:
- Auto-detects mode based on existing parameters
- Simple mode: circular orbits (distance, speed, phase)
- Advanced mode: elliptical orbits (eccentricity, offsets, rotations)
- Confirms before destructive mode changes
- Resets mode when selection changes

### PlanetaryRingsEditor
**Shown when**: `bodyType === 'planet'`

**Features**:
- Toggle rings on/off
- Inner/outer radius multipliers
- Thickness, opacity, albedo, density
- Ring color picker

### CometEditor
**Shown when**: `bodyType === 'comet'`

**Features**:
- Orbital characterization (periodic, perihelion, aphelion)
- Tail toggle (allow "dead" comets)
- Tail appearance (length, width, color, opacity)
- Activity falloff distance

### BlackHoleEditor
**Shown when**: `bodyType === 'blackHole'`

**Features**:
- Component toggles (disk, jets, photon ring)
- Geometry (shadow radius, disk dimensions)
- Disk appearance (brightness, opacity, temperature, clumpiness, turbulence)
- Jet parameters (length, angle, brightness, colors)
- Physical parameters (spin)
- Relativistic effects (Doppler beaming, lensing)
- Disk orientation (tilt, axis angle)

### RoguePlanetEditor
**Shown when**: `isRoguePlanet === true`

**Features**:
- Linear velocity (X, Y, Z)
- Path curvature slider (0=linear, 1=curved)
- Curved path parameters (semi-major axis, eccentricity, period)
- Path orientation (rotations)
- Path center offset
- Trajectory visualization settings

### LagrangePointDisplay
**Shown when**: `bodyType === 'lagrangePoint'`

**Features**:
- Read-only metadata display
- Point index (L1-L5)
- Primary and secondary body names
- Pair type (star-planet / planet-moon)
- Stability indicator with explanation
- User-friendly educational content

### ProtoplanetaryDiskSection
**Shown when**: Body is a root star (no parent) and not a black hole

**Features**:
- Toggle disk on/off
- Integrates existing ProtoplanetaryDiskEditor
- Compact mode for inline display

## Non-Star Selection Handling

When a non-star entity is selected (group, nebula, disk, belt):

```
┌─────────────────────────────────────┐
│ Body Inspector                       │
├─────────────────────────────────────┤
│                                     │
│              ℹ️                      │
│                                     │
│         Group Selected              │
│                                     │
│  This editor is for celestial       │
│  bodies (stars, planets, etc.).     │
│  To edit the selected group,        │
│  please use the appropriate editor. │
│                                     │
│    [Open Group Editor]              │
│                                     │
└─────────────────────────────────────┘
```

Similar messages for:
- Nebula → "Open Nebula Editor"
- Protoplanetary Disk → "Open Overview"
- Small Body Field → "Open Overview"
- Belt → "Open Overview"

## Body Type Icons & Labels

| Body Type      | Icon | Label            | Special Badge  |
|----------------|------|------------------|----------------|
| star           | ⭐   | Star             | -              |
| planet         | 🪐   | Planet           | -              |
| planet (rogue) | 🌌   | Planet           | (Rogue)        |
| moon           | 🌙   | Moon             | -              |
| asteroid       | 🪨   | Asteroid         | -              |
| comet          | ☄️   | Comet            | -              |
| lagrangePoint  | 🔷   | Lagrange Point   | -              |
| blackHole      | 🕳️   | Black Hole       | -              |

## State Management

### Selection State
- `selectedStarId`: Currently selected body
- `selectedGroupId`: Currently selected group (triggers non-star message)
- `selectedNebulaId`: Currently selected nebula (triggers non-star message)
- `selectedProtoplanetaryDiskId`: Currently selected disk (triggers non-star message)
- `selectedSmallBodyFieldId`: Currently selected field (triggers non-star message)
- `selectedBeltId`: Currently selected belt (triggers non-star message)

### Store Methods Used
- `updateStar(id, patch)`: Update any body field
- `updateRing(planetId, patch)`: Update planetary ring
- `removeRing(planetId)`: Remove planetary ring
- `addProtoplanetaryDisk(starId)`: Add disk to root star
- `updateProtoplanetaryDisk(id, patch)`: Update disk
- `removeProtoplanetaryDisk(id)`: Remove disk
- `attachStar(childId, parentId)`: Set parent
- `detachStar(childId)`: Remove parent
- `removeStar(id)`: Delete body (recursive)

## Tab Visibility Logic

```typescript
// Basics tab: ALWAYS shown

// Orbit tab: shown only if
body.parentId !== null && !body.isRoguePlanet

// Special tab: ALWAYS shown
// (content inside is conditionally rendered)

// Advanced tab: ALWAYS shown
```

## CSS Classes Used

All subcomponents use existing classes from `StarEditorPanel.css`:
- `.star-editor-panel`
- `.editor-header`
- `.form-group`
- `.btn-add`, `.btn-primary`, `.btn-danger`, `.btn-secondary`
- `.btn-toggle`, `.btn-toggle.active`
- `.empty-state`
- `.generator-checkbox` (for checkbox labels)

No new CSS files were created—100% reuses existing styles for consistency.

