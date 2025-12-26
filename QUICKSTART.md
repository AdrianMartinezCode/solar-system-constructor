# Quick Start Guide

## Roadmap / Future Ideas

- Otros algoritmos de generación
- Todos los clusters deben estar entorno a un núcleo
- n-body fisics
- más tipos de astros
- ✅ ~~elliptical orbit + translated orbit + rotated in xyz~~ **IMPLEMENTED!**
- el fondo por defecto de estrellas es muy poco amplio y parece una esfera cuando alejas la cámara
- crear más default presets

## Installation

You'll need Node.js and npm installed. If not installed yet:

```bash
# On Ubuntu/Debian
sudo apt install npm

# Or download from https://nodejs.org/
```

## Setup and Run

```bash
# Navigate to project directory
cd /home/adr/front-portfolio-interactive/solar-system-constructor

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

## Project Structure

```
solar-system-constructor/
├── src/
│   ├── components/          # R3F 3D components
│   │   ├── Scene.tsx        # Main 3D canvas
│   │   ├── StarObject.tsx   # Recursive star rendering
│   │   └── OrbitRing.tsx    # Orbital path visualization
│   ├── ui/                  # React UI panels
│   │   ├── StarListPanel.tsx
│   │   ├── StarEditorPanel.tsx
│   │   └── HierarchyTree.tsx
│   ├── state/
│   │   └── systemStore.ts   # Zustand store
│   ├── utils/
│   │   ├── physics.ts       # Orbital calculations
│   │   ├── persistence.ts   # localStorage
│   │   └── exampleData.ts   # Initial system
│   ├── types.ts             # TypeScript interfaces
│   ├── App.tsx              # Main layout
│   └── main.tsx             # Entry point
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Features Implemented

✅ **3D Visualization**
- Real-time orbital simulation
- Interactive camera controls
- Visual orbit rings (circular and elliptical)
- Click-to-select stars

✅ **Star Management**
- Create/edit/delete stars
- Set mass, radius, color, orbit parameters
- **NEW:** Advanced elliptical orbits with eccentricity
- **NEW:** 3D orbit plane rotation (inclination, orientation)
- **NEW:** Orbit center offsets for translated ellipses
- Simple circular mode and advanced elliptical mode
- Attach/detach from parents
- Automatic hierarchy management

✅ **Elliptical Orbits (NEW!)**
- Full 3D elliptical orbit support
- Eccentricity control (0 = circular, up to 0.99 = highly elliptical)
- Orbit plane rotation in all three axes
- Orbit center translation (offset from parent)
- Backward compatible with existing circular orbits
- UI toggle between simple circular and advanced elliptical modes

✅ **Hierarchy View**
- Collapsible tree structure
- Visual parent-child relationships
- Click to select stars

✅ **Persistence**
- Auto-save to localStorage
- Load on startup
- Reset to example system
- All orbit parameters saved and restored

✅ **Procedural Generation**
- L-System based generation algorithm
- Multiple style presets (sparse, solar-like, crowded, super-dense)
- **NEW:** Configurable orbit eccentricity styles (circular/mixed/eccentric)
- **NEW:** Configurable orbit inclination (0-90 degrees)
- **NEW:** Optional orbit center offsets
- Deterministic seed-based generation
- Hierarchical grouping support

✅ **Example System**
- Pre-loaded Sun-Earth-Moon-Mars system
- Demonstrates nested orbits

## Usage Tips

### Basic Operations
1. **Creating Stars**: Click "+ Add Star" and fill in the properties
2. **Nesting**: Set a parent star to create orbital relationships
3. **Editing**: Click stars in the 3D view or list to select them
4. **Camera**: Use mouse to rotate, pan, and zoom the view
5. **Hierarchy**: Expand/collapse tree nodes to navigate complex systems

### Elliptical Orbits (Advanced)
1. **Simple Mode**: Use the default circular orbit controls (radius, speed, phase)
2. **Advanced Mode**: Switch to "Advanced Elliptical" in the orbit mode toggle to access:
   - **Semi-Major Axis**: The primary orbital radius
   - **Eccentricity**: How elliptical the orbit is (0 = circle, 0.5 = moderately elliptical, 0.9+ = very elongated)
   - **Orbit Offset**: Translate the ellipse center in 3D space (X, Y, Z)
   - **Orbit Rotation**: Tilt and rotate the orbit plane in 3D:
     - Rotation X: Inclination-like tilt
     - Rotation Y: Secondary rotation
     - Rotation Z: Ascending node-like rotation
3. **Visualizing**: Orbit rings will update in real-time to show the elliptical shape and 3D orientation

### Procedural Generation
1. Open the **Universe Generator** panel
2. Choose a **Style Preset** or customize parameters
3. Adjust **Orbit Styles**:
   - **Eccentricity Style**: Circular, Mixed, or Eccentric
   - **Max Inclination**: How much orbits can be tilted (0-90°)
   - **Orbit Offsets**: Enable for translated orbit centers
4. Click **Generate Universe** to create a system
5. Use a **Seed** for reproducible results

## Next Steps

- Try creating multi-level nested systems
- Experiment with different masses to see center-of-gravity effects
- **NEW:** Create eccentric elliptical orbits and tilted orbit planes
- **NEW:** Use the procedural generator with different orbit styles
- Build your own custom solar system!

Enjoy building your nested solar systems with realistic elliptical orbits! 🌟✨

