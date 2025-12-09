# Rogue Planets Implementation

## Overview

Rogue Planets are planet-sized bodies not gravitationally bound to any star that freely traverse the universe. They support both **linear drift motion** (straight-line paths) and **curved/elliptical trajectories** (looping paths), with optional trajectory visualization showing past and future path segments. This feature adds visual and gameplay diversity to the procedural universe generation.

## Data Model

### Types (`src/types.ts`)

**RoguePlanetMeta Interface:**
```typescript
interface RoguePlanetMeta {
  seed: string | number;            // Deterministic per-rogue RNG seed
  initialPosition: { x: number; y: number; z: number }; // World-space position at t=0
  velocity: { x: number; y: number; z: number };        // World-space drift vector
  colorOverride?: string;           // Optional special coloring for rogues
  
  // Curved / Elliptical Path Parameters (optional, for non-linear trajectories)
  pathCurvature?: number;           // 0..1 (0=linear, 1=strongly curved)
  semiMajorAxis?: number;           // Semi-major axis for elliptical path
  eccentricity?: number;            // 0..0.99 eccentricity for curved paths
  pathOffsetX?: number;             // Path center offset (X)
  pathOffsetY?: number;             // Path center offset (Y)
  pathOffsetZ?: number;             // Path center offset (Z)
  orbitRotX?: number;               // 3D orientation (X rotation, degrees)
  orbitRotY?: number;               // 3D orientation (Y rotation, degrees)
  orbitRotZ?: number;               // 3D orientation (Z rotation, degrees)
  pathPeriod?: number;              // Time to complete one loop (seconds)
  
  // Trajectory Visualization Settings (optional)
  showTrajectory?: boolean;         // Whether to show trajectory visualization
  trajectoryPastWindow?: number;    // Past trajectory window (seconds)
  trajectoryFutureWindow?: number;  // Future trajectory window (seconds)
}
```

All curved trajectory fields are optional for backwards compatibility. When `pathCurvature` is 0 or undefined, rogues use simple linear motion.

**Star Interface Extensions:**
- `isRoguePlanet?: boolean` - Flag indicating if this is a rogue planet
- `roguePlanet?: RoguePlanetMeta` - Rogue planet metadata

**GeneratedUniverse Extensions:**
- `roguePlanetIds?: string[]` - IDs of all rogue planets
- `totalRoguePlanets?: number` - Total count for stats

## Configuration

### Internal Generator Config

Located in `src/utils/procedural-generator.ts`:

```typescript
{
  enableRoguePlanets: boolean;                  // Master switch
  roguePlanetCountRange: [number, number];      // [min, max] total rogues
  roguePlanetDistanceRange: [number, number];   // Radial distance from origin
  roguePlanetSpeedRange: [number, number];      // Drift speed magnitude
  roguePlanetInclinationMax: number;            // Max tilt from galactic plane (degrees)
  roguePlanetColorVariation: number;            // 0-1 variance around typical planet colors
  
  // Curved trajectory parameters
  roguePlanetCurvatureRange: [number, number];            // [min, max] path curvature (0-1)
  roguePlanetTrajectoryMode: 'linearOnly' | 'mixed' | 'mostlyCurved';
  roguePlanetPathPeriodRange: [number, number];           // [min, max] loop period (seconds)
  roguePlanetEccentricityRange: [number, number];         // [min, max] eccentricity for curved paths
  roguePlanetSemiMajorAxisRange: [number, number];        // [min, max] semi-major axis
  
  // Trajectory visualization
  roguePlanetShowTrajectories: boolean;                   // Show trajectory visualization
  roguePlanetTrajectoryPastWindow: number;                // Past window (seconds)
  roguePlanetTrajectoryFutureWindow: number;              // Future window (seconds)
}
```

### UI-Level Config

Located in `src/types/generationConfig.ts`:

```typescript
{
  enableRoguePlanets: boolean;
  roguePlanetFrequency: number;                          // 0-1 slider
  roguePlanetOrbitStyle?: 'slowDrifters' | 'mixed' | 'fastIntruders';
  roguePlanetVisibility?: number;                        // 0-1 visual emphasis
  
  // Trajectory configuration
  rogueTrajectoryMode?: 'linearOnly' | 'mixed' | 'curved';
  rogueCurvatureMin?: number;                            // 0-1 minimum curvature
  rogueCurvatureMax?: number;                            // 0-1 maximum curvature
  rogueTrajectoryShow?: boolean;                         // Show trajectory visualization
  rogueTrajectoryPreviewLength?: number;                 // 0-1 trajectory length
}
```

### Presets

- **sparse**: Disabled, linear-only trajectories
- **solarLike**: Enabled, low frequency (0.2), slow drifters, mostly linear with gentle curves (curvature 0-0.3)
- **crowded**: Enabled, medium frequency (0.5), mixed styles, more curved paths (curvature 0-0.6)
- **superDenseExperimental**: Enabled, high frequency (0.8), fast intruders, highly curved elliptical paths (curvature 0.3-1.0)

## Generation Algorithm

### Implementation

Located in `src/utils/procedural-generator.ts` as `RoguePlanetGenerator` class:

1. **PRNG Setup**: Uses deterministic fork `masterRng.fork('rogue-planets')`
2. **Count Sampling**: Samples from `roguePlanetCountRange`
3. **Position**: Random position at configured distance from origin/group centers
4. **Velocity**: Random drift vector with diverse directions (uniform on sphere with inclination limit)
5. **Trajectory Type**: Samples curvature based on `roguePlanetTrajectoryMode`:
   - `linearOnly`: curvature = 0 (straight-line paths)
   - `mixed`: uniform distribution across curvature range
   - `mostlyCurved`: biased toward high curvature (elliptical paths)
6. **Curved Path Parameters** (if curvature > 0):
   - Semi-major axis, eccentricity, 3D orientation, path period
   - Reuses elliptical orbit math for parametric motion
7. **Physical Properties**: Planet-sized mass/radius with color variation
8. **Integration**: Added to stars map after all systems/groups are generated

### Key Features

- Universe-level generation (not per-system)
- No parent/orbit parameters (parentId = null, orbitalDistance = 0)
- Deterministic via PRNG seeding
- Group-aware positioning (if groups exist)

## Physics & Rendering

### Motion Calculation

Located in `src/utils/physics.ts`:

```typescript
export function calculateRoguePlanetPosition(
  meta: RoguePlanetMeta,
  time: number
): { x: y: z }
```

**Linear Mode** (pathCurvature = 0 or undefined):
- Simple linear kinematics: `position = initialPosition + velocity * time`

**Curved/Elliptical Mode** (pathCurvature > 0):
- Parametric ellipse motion (reuses elliptical orbit math)
- Angular velocity computed from `pathPeriod`
- 3D rotation applied via `orbitRotX/Y/Z`
- Path center at `initialPosition + pathOffset`
- Periodic motion (returns to starting position after one period)

**Trajectory Visualization:**

```typescript
export function computeRogueTrajectoryPoints(
  meta: RoguePlanetMeta,
  currentTime: number,
  options: { pastWindow, futureWindow, sampleCount }
): { pastPoints, futurePoints }
```

Samples positions at regular intervals to generate:
- **Past path** (history): dimmer line showing where rogue has been
- **Future path** (prediction): brighter line showing where it's going

For curved paths, windows can be expressed as fractions of `pathPeriod`.

### Rendering

**StarObject.tsx:**
- Checks `isRoguePlanet` flag
- Uses `calculateRoguePlanetPosition(meta, time)` instead of `calculateOrbitalPosition`
- No orbit ring rendering for rogues
- Standard planet mesh/glow visualization
- Renders `RogueTrajectory` component for path visualization

**RogueTrajectory.tsx:**
- Dedicated component for visualizing rogue planet trajectories
- Renders two line segments:
  - Past path (dimmer, opacity 0.3)
  - Future path (brighter, opacity 0.6)
- Color varies by curvature (pink for curved, blue for less curved)
- Respects `showTrajectory` flag and window settings

**Scene.tsx:**
- Renders rogues via dedicated loop over `roguePlanetIds`
- Root-level rendering (not part of system hierarchy)

## UI Integration

### Universe Generator Panel

Located in `src/components/UniverseGeneratorPanel.tsx`:

**Controls:**
- Enable Rogue Planets (checkbox)
- Rogue Planet Frequency (0-100% slider)
- Trajectory Style (slowDrifters | mixed | fastIntruders)
- Visual Emphasis (0-100% slider)
- **Rogue Trajectory Mode** (linearOnly | mixed | curved)
- **Min/Max Path Curvature** (0-100% sliders, shown when mode is mixed or curved)
- **Show Rogue Trajectories** (checkbox)
- **Trajectory Length** (0-100% slider, controls visible path segment length)

**Stats Display:**
- "🧭 Rogue Planets: N" shown when totalRoguePlanets > 0

### System Overview

Located in `src/components/SystemOverview.tsx`:

**Features:**
- Filter button: "🧭 Rogues"
- Rogue planets excluded from normal planet count
- Shows trajectory type and stats:
  - Linear paths: "Linear Drift | Speed: X.XXX units/s"
  - Curved paths: "Curved Path (XX%) | Speed: X.XXX units/s | e=X.XX"
- Icon: 🧭 (compass)
- Summary stats include rogue count (when > 0)

### Star Editor Panel

Located in `src/ui/StarEditorPanel.tsx`:

**Per-Rogue Editing** (shown when rogue planet is selected):
- **Velocity Components**: Edit vx, vy, vz individually
- **Path Curvature**: Slider (0-1) to adjust trajectory shape
- **Curved Path Parameters** (shown when curvature > 0):
  - Semi-Major Axis
  - Eccentricity (0-0.99)
  - Inclination (X rotation, 0-90°)
  - Path Period (seconds)
- **Show Trajectory**: Checkbox to toggle visualization

## Validation & Analysis

### Validation (`src/utils/generator-examples.ts`)

**Exclusions:**
- Rogue planets excluded from "heaviest star is center" check
- Not validated as system roots (they have no parent but aren't system centers)

### Analysis Stats

**Additional Metrics:**
- `roguePlanets` - Total count
- `avgRogueSpeed` - Average drift speed
- `minRogueSpeed` / `maxRogueSpeed` - Speed range

## Time Scale & Camera Compatibility

### Time Scale

Rogue planets respect global `timeScale`:
- Pausing (timeScale = 0) freezes rogue motion
- High speeds (e.g., 50x) make rogues traverse scene quickly
- Uses same `time` state as orbital bodies

### Body POV Camera

Fully compatible:
- Rogue planets are selectable
- Camera can follow/anchor to rogues
- World position calculated correctly for camera targeting

## Backward Compatibility

All new fields are optional:
- Old saves load without rogue data (undefined checks)
- Validation skips rogue-specific logic if not present
- UI gracefully handles missing rogue planet stats
- Default config has rogues disabled

## Testing Checklist

### Core Functionality
- [x] Generation is deterministic with fixed seed
- [x] Disabling `enableRoguePlanets` yields no rogues
- [x] Rogues visible and moving in scene
- [x] Time scale affects rogue motion (both linear and curved)
- [x] Validation passes with rogues
- [x] Backward compatibility maintained (old saves load correctly)

### Trajectory Features
- [x] Linear trajectories work (curvature = 0)
- [x] Curved/elliptical trajectories work (curvature > 0)
- [x] Trajectory visualization renders correctly
- [x] Past and future path segments display
- [x] Trajectory respects time scale and pausing
- [x] Diverse directions generated (not all same direction)

### UI Integration
- [x] Generator panel controls work (all new sliders/dropdowns)
- [x] System Overview shows trajectory type and stats
- [x] Star Editor Panel allows per-rogue editing
- [x] Trajectory visualization can be toggled
- [x] Stats display correctly (linear vs curved counts)

## Future Enhancements

Potential additions not yet implemented:
1. **Collision detection**: Alert when rogues pass near systems
2. **Capture mechanics**: Allow rogues to be "captured" by massive stars
3. **Enhanced naming**: More varied rogue planet naming schemes
4. **Trajectory persistence**: Save/load trajectory visualization state
5. **Advanced trajectory modes**: Hyperbolic escape paths, multi-body influenced paths

