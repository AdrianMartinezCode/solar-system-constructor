# Nested Solar System Constructor

An interactive 3D web application for building nested solar systems with infinite depth.

## Features

- **🪟 Windowed UI**: Professional panel-based interface with floating/dockable windows
- **3D Visualization**: Real-time orbital simulation using react-three-fiber
- **Nested Systems**: Create infinite-depth hierarchies of stars, planets, and moons
- **N-ary Systems**: Place multiple stars on the same orbital ring (binary, ternary, etc.)
- **Body POV Camera**: View the universe from any star/planet's perspective with smooth transitions
- **Procedural Generation**: L-System based automatic system generator with Kepler-inspired orbits
- **Grouping System**: Organize solar systems into hierarchical groups (galaxies, clusters, etc.)
- **Black-box Groups**: Groups act as single entities with controllable nesting depth
- **Group Isolation**: Solo/isolate individual groups to focus on specific regions
- **Interactive Editor**: Full CRUD operations with visual editing panels
- **Hierarchy View**: Tree-based visualization of system structure
- **Auto-centering**: Heaviest object becomes the center of each local system
- **⌨️ Keyboard Shortcuts**: Full keyboard control for power users
- **🎨 Workspace Presets**: Exploration, Editing, and Generation layouts
- **📊 System Overview**: Search, filter, and browse 1000+ objects efficiently
- **Persistence**: Automatic save/load using localStorage

## Monorepo Structure

```
solar-system-constructor/
├── apps/
│   ├── web/            # Vite + React frontend (3D solar system constructor)
│   └── api/            # Node.js + Express backend API
├── packages/           # Shared libraries (future)
├── compose.yaml        # Docker Compose for local backend dev
├── tsconfig.base.json  # Shared TypeScript base config
├── package.json        # Root workspace orchestrator
└── docs/               # Planning, design, and guides
```

## Tech Stack

### Frontend (`apps/web`)
- **Vite** - Fast build tool
- **React** - UI framework
- **TypeScript** - Type safety
- **react-three-fiber** - 3D rendering
- **drei** - R3F helpers
- **Zustand** - State management

### Backend (`apps/api`)
- **Node.js** - Runtime
- **Express** - HTTP framework
- **TypeScript** - Type safety
- **Docker** - Containerized local development

## Getting Started

### Installation

```bash
npm install
```

### Local Development

```bash
# Run frontend (default)
npm run dev

# Run frontend explicitly
npm run dev:web

# Run backend API
npm run dev:api

# Run backend via Docker
docker compose up --build
```

### Build

```bash
# Build everything
npm run build

# Build individually
npm run build:web
npm run build:api
```

### Type checking

```bash
npm run typecheck:web
npm run typecheck:api
```

### Procedural Generator

The project includes a powerful procedural generator using L-System grammar:

```typescript
import { generateSolarSystem } from './utils/procedural-generator';

// Generate a system
const system = generateSolarSystem({
  starProbabilities: [0.6, 0.3, 0.1], // Single/Binary/Ternary
  planetGeometricP: 0.4,
  enableGrouping: true,
});
```

See [`docs/design/PROCEDURAL_GENERATOR.md`](docs/design/PROCEDURAL_GENERATOR.md) for complete documentation.

## Usage

### Windowed UI

The application now uses a **modular windowed interface** instead of a fixed sidebar:

- **App Header**: Top bar with compact simulation speed control and quick actions
- **Floating Windows**: Draggable, resizable panels for different tools
- **Taskbar**: Bottom bar showing all open windows
- **Workspace Presets**: Pre-configured layouts for different workflows

#### Opening Windows
- Click buttons in the **taskbar** to open/close windows
- Use **keyboard shortcuts**: `Ctrl+G` (Generator), `Ctrl+H` (Hierarchy), `Ctrl+O` (Overview), `Ctrl+E` (Editor)
- Windows auto-open when needed (e.g., selecting an object opens the editor)

#### Moving & Docking Windows
- **Drag** window header to move
- **Drag to screen edge** to dock (visual feedback appears)
- **Drag corner** to resize
- **Click ━** to minimize, **✕** to close

See [`KEYBOARD_SHORTCUTS.md`](KEYBOARD_SHORTCUTS.md) for complete shortcuts reference.

### Creating Stars

1. Open the **Star List** or **Editor** window (press `Ctrl+E` or click in taskbar)
2. Click "+ Add Star" 
3. Fill in the properties (name, mass, radius, color)
4. Optionally select a parent star to create an orbit
5. Set orbital parameters (distance, speed, and phase)
6. Click "Create Star"

### Creating N-ary Systems

To create binary, ternary, or higher-order systems:

1. Create multiple stars with the same parent
2. Set them to have the same `Orbital Distance`
3. Use different `Orbital Phase` values (in degrees) to position them around the ring
   - Example for binary: 0° and 180°
   - Example for ternary: 0°, 120°, and 240°
   - Example for quaternary: 0°, 90°, 180°, and 270°

The default example system includes a ternary star system at the center.

### Creating Groups (Galaxies, Clusters, etc.)

Groups allow you to organize multiple solar systems into higher-level structures:

1. Click "+ Add Group" in the Group Editor panel
2. Give your group a name (e.g., "Milky Way", "Local Group")
3. Choose a color for visualization
4. Optionally select a parent group for nested hierarchies
5. Click "Create Group"

### Adding Systems to Groups

Once you have a group:

1. Select the group in the 3D view or from the sidebar
2. In the Group Editor, use the "Add to Group" section
3. Click on available systems or groups to add them
4. Remove items by clicking the ✕ button next to them

### Nesting Level Control

Control how many levels of group hierarchy are visible:

- **Level 0**: Show only individual solar systems (no groups)
- **Level 1**: Show top-level groups as boxes (contents hidden)
- **Level 2+**: Expand groups to the specified depth
- **Max**: Fully expand all groups to show all systems

This allows you to view your universe at different scales - from individual systems to galaxy clusters.

### Solo / Isolate Group in Viewport

Focus on a specific group by hiding everything else:

1. Select a group (click on it or find it in System Overview)
2. Enable the **"Solo in viewport"** checkbox in the Group Editor, or
3. Click the **lock icon** (🔒) next to the group in System Overview

When a group is isolated:
- ✅ The isolated group stays in its original position
- ✅ All systems in the group (including nested groups) remain visible
- ✅ Everything else is hidden: other groups, ungrouped systems, rogue planets
- ✅ No camera movement or repositioning occurs

Click the toggle again or the unlock icon (🔓) to exit isolation mode.

See [`docs/GROUP_ISOLATION_FEATURE.md`](docs/GROUP_ISOLATION_FEATURE.md) for complete documentation.

### Black-box Behavior

When groups are shown at their collapsed level:
- They appear as a single colored box in 3D space
- The box size scales with the number of items inside
- Internal structure is hidden until you increase the nesting level
- Select the box to edit the group or see its contents

### Editing Stars

1. Select a star from the list or click it in the 3D view
2. Modify properties in the editor panel
3. Changes are saved automatically

### Building Hierarchies

- Attach stars by setting their parent in the editor
- Detach stars by setting parent to "None"
- View the hierarchy in the tree panel

### Body POV Camera Mode

The Body POV (Point of View) Camera feature allows you to view your solar system from the perspective of any star or planet.

**Entering Body POV Mode:**
1. Select a star or planet by clicking on it in the 3D view
2. In the Star Editor Panel, click **"👁️ View from Here"**
3. The camera will smoothly transition to the body's position

**While in Body POV Mode:**
- The camera moves with the body as it orbits through space
- You can still rotate (left click + drag) to look around
- Pan (right click + drag) and zoom (scroll) still work
- A camera mode indicator appears at the top showing which body you're viewing from

**Exiting Body POV Mode:**
- Click **"📷 Exit Body View"** in the Star Editor Panel, or
- Click the **✕** button on the camera mode indicator

**Use Cases:**
- Observe orbital mechanics from a moving reference frame
- Experience your nested solar systems from within
- Create cinematic views for presentations
- Debug orbital paths from specific vantage points

See [`docs/BODY_POV_CAMERA.md`](docs/BODY_POV_CAMERA.md) for detailed technical documentation.

### Controls

#### 3D Scene
- **Rotate**: Left click + drag
- **Pan**: Right click + drag
- **Zoom**: Mouse wheel
- **Select**: Click on a star or group box

#### Keyboard Shortcuts
- **Space**: Pause/unpause simulation
- **Ctrl+G**: Open Generator
- **Ctrl+H**: Open Hierarchy
- **Ctrl+O**: Open Overview
- **Ctrl+E**: Open Editor
- **Ctrl+W**: Close active window
- **Ctrl+1-9**: Quick switch to windows
- **Tab**: Cycle through windows
- **Escape**: Minimize active window

See [`KEYBOARD_SHORTCUTS.md`](KEYBOARD_SHORTCUTS.md) for complete list.

## Grouping System

The grouping system allows you to organize solar systems into hierarchical structures like galaxies, clusters, and super-clusters.

### Key Concepts

**Groups**: Containers that can hold:
- Solar systems (root stars with their orbits)
- Other groups (for nested hierarchies)

**Black-box Behavior**: When viewed at a collapsed level, groups appear as single entities. Their internal structure is hidden until the nesting level is increased.

**Nesting Levels**: Control how deep into the hierarchy you want to see:
- Level 0 = Individual systems only
- Level 1 = Top-level groups (collapsed)
- Level 2+ = Expand N levels deep
- Max = Everything expanded

**No Cycles**: Groups cannot contain themselves directly or indirectly.

### Use Cases

- **Galaxy Simulation**: Group solar systems into a galaxy
- **Cluster Organization**: Group galaxies into clusters
- **Universe Building**: Create super-clusters and cosmic structures
- **Scenario Management**: Save different configurations as separate groups

### Example Hierarchy

```
Universe (Group)
├── Milky Way (Group)
│   ├── Solar System (Star System)
│   ├── Alpha Centauri (Star System)
│   └── Sirius (Star System)
└── Andromeda (Group)
    ├── System A (Star System)
    └── System B (Star System)
```

## System Rules

The defining rule of nested systems:
> Within any composite system, the star with the highest gravitational mass becomes the center of that local system. Other stars orbit around the heaviest parent in that specific nesting.

## Data Structure

### Star

Each star contains:
- `id`: Unique identifier
- `name`: Display name
- `mass`: Gravitational weight (determines center)
- `radius`: Visual size
- `color`: Emissive color
- `children`: Array of child star IDs
- `parentId`: Parent star ID (null for root)
- `orbitalDistance`: Distance from parent
- `orbitalSpeed`: Degrees per second
- `orbitalPhase`: Starting angle offset (0-360°) for positioning multiple stars on the same orbit

### Group

Each group contains:
- `id`: Unique identifier
- `name`: Display name
- `children`: Array of child items (solar systems or groups)
  - Each child has: `id`, `type` ('system' or 'group')
- `parentGroupId`: Parent group ID (null for top-level)
- `color`: Optional color for visualization
- `icon`: Optional icon/symbol
- `position`: Optional position for spatial layout

## Persistence

The system automatically saves to localStorage after each change. Data persists across browser sessions. Use the "Reset" button to load the example system.

## License

MIT

