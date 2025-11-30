# Quick Start Guide

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
- Visual orbit rings
- Click-to-select stars

✅ **Star Management**
- Create/edit/delete stars
- Set mass, radius, color, orbit parameters
- Attach/detach from parents
- Automatic hierarchy management

✅ **Hierarchy View**
- Collapsible tree structure
- Visual parent-child relationships
- Click to select stars

✅ **Persistence**
- Auto-save to localStorage
- Load on startup
- Reset to example system

✅ **Example System**
- Pre-loaded Sun-Earth-Moon-Mars system
- Demonstrates nested orbits

## Usage Tips

1. **Creating Stars**: Click "+ Add Star" and fill in the properties
2. **Nesting**: Set a parent star to create orbital relationships
3. **Editing**: Click stars in the 3D view or list to select them
4. **Camera**: Use mouse to rotate, pan, and zoom the view
5. **Hierarchy**: Expand/collapse tree nodes to navigate complex systems

## Next Steps

- Try creating multi-level nested systems
- Experiment with different masses to see center-of-gravity effects
- Build your own custom solar system!

Enjoy building your nested solar systems! 🌟

