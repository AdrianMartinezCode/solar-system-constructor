# Elliptical Orbits Feature

## Overview

The Solar System Constructor now supports **full 3D elliptical orbits** with:
- Elliptical orbit shapes (eccentricity-based)
- 3D orbit plane rotation (inclination, orientation)
- Orbit center translation (offset from parent)
- Full backward compatibility with existing circular orbits

## Orbit Parameters

### Shape Parameters

#### `semiMajorAxis` (a)
- The semi-major axis of the ellipse
- For circular orbits, this equals `orbitalDistance`
- Default: derived from `orbitalDistance`

#### `eccentricity` (e)
- Controls how elliptical the orbit is
- Range: 0 to 0.99
  - `0` = perfect circle
  - `0.0 - 0.3` = low eccentricity (slightly elliptical)
  - `0.3 - 0.7` = moderate eccentricity
  - `0.7 - 0.99` = high eccentricity (very elongated)
- Default: `0` (circular)

### Offset Parameters

#### `orbitOffsetX`, `orbitOffsetY`, `orbitOffsetZ`
- 3D translation of the ellipse center relative to the parent body
- Measured in world units
- Default: `0, 0, 0` (centered on parent)

### Orientation Parameters

#### `orbitRotX`, `orbitRotY`, `orbitRotZ`
- Euler angles (in degrees) for rotating the orbit plane in 3D
- Applied in order: Z → Y → X
- **orbitRotX**: Inclination-like tilt around X axis
- **orbitRotY**: Rotation around Y axis
- **orbitRotZ**: Ascending node-like rotation around Z axis (0-360°)
- Default: `0, 0, 0` (orbit in XZ plane)

### Legacy Parameters (Maintained for Compatibility)

- `orbitalDistance`: Still used for circular orbits and as fallback
- `orbitalSpeed`: Angular velocity in degrees/second
- `orbitalPhase`: Starting angle offset in degrees (0-360)

## Data Model

```typescript
interface Star {
  // ... existing fields ...
  
  // Legacy circular orbit (always present)
  orbitalDistance: number;
  orbitalSpeed: number;
  orbitalPhase: number;
  
  // Elliptical orbit shape (optional, defaults to circular)
  semiMajorAxis?: number;      // Default: orbitalDistance
  eccentricity?: number;        // Default: 0 (circular)
  
  // Orbit center offset (optional)
  orbitOffsetX?: number;        // Default: 0
  orbitOffsetY?: number;        // Default: 0
  orbitOffsetZ?: number;        // Default: 0
  
  // Orbit plane orientation (optional)
  orbitRotX?: number;           // Default: 0
  orbitRotY?: number;           // Default: 0
  orbitRotZ?: number;           // Default: 0
}
```

## Orbit Math

### Position Calculation

The `calculateOrbitalPosition()` function in `src/utils/physics.ts` implements the orbit calculation:

1. **Compute mean anomaly**: `θ = time × orbitalSpeed + orbitalPhase`
2. **Map to ellipse**: Generate point on ellipse in local 2D plane
   - `x' = a × cos(θ)`
   - `z' = b × sin(θ)` where `b = a × √(1 - e²)`
3. **Apply 3D rotation**: Rotate by Z, then Y, then X
4. **Apply offset**: Add orbit center offset
5. **Return 3D position** relative to parent

### Backward Compatibility

When no ellipse parameters are specified:
- `semiMajorAxis` defaults to `orbitalDistance`
- `eccentricity` defaults to `0`
- All offsets and rotations default to `0`
- Produces **exactly** the same circular path as before

## UI Integration

### Star Editor Panel

The Star Editor Panel (`src/ui/StarEditorPanel.tsx`) has two modes:

#### Simple Circular Mode
- Shows only: Orbital Distance, Orbital Speed, Orbital Phase
- Sets `eccentricity = 0` and all offsets/rotations to `0`
- Ideal for quick, circular orbit editing

#### Advanced Elliptical Mode
- **Orbit Shape Section**:
  - Semi-Major Axis (a)
  - Eccentricity (e)
  - Orbital Speed
  - Orbital Phase
  
- **Orbit Center Offset Section**:
  - Offset X, Y, Z
  
- **Orbit Plane Rotation Section**:
  - Rotation X (Inclination)
  - Rotation Y
  - Rotation Z (Ascending Node)

Toggle between modes with the "Simple Circular" / "Advanced Elliptical" buttons.

### System Overview

- Displays semi-major axis (or orbitalDistance as fallback) for distance sorting
- Shows eccentricity value when `e > 0`

## Rendering

### Orbit Visualization

The `OrbitRing` component (`src/components/OrbitRing.tsx`) now supports:
- **Legacy mode**: Pass a `radius` for circular orbits
- **Advanced mode**: Pass precomputed 3D `points` for elliptical orbits

`StarObject` uses `generateOrbitPath()` to create 3D points representing the full orbit, which are then rendered as a line.

### Performance

- Orbit paths are generated once per star when orbit parameters change
- Paths are cached in `useMemo` and only regenerate when star properties update
- Position calculation is fast enough for real-time animation

## Procedural Generation

### Generator Configuration

The procedural generator (`src/utils/procedural-generator.ts`) supports:

#### Eccentricity Generation
- `eccentricityMin` / `eccentricityMax`: Range for random eccentricity
- Controlled by `orbitEccentricityStyle` in UI:
  - `"circular"`: e = 0
  - `"mixed"`: e = 0 to 0.3
  - `"eccentric"`: e = 0.1 to 0.7

#### Inclination Generation
- `inclinationMax`: Maximum tilt angle in degrees
- Generates random inclinations in range `[-max, +max]`

#### Orbit Offset Generation
- `orbitOffsetMagnitude`: Maximum offset distance
- Generates random 3D offset within sphere of given radius

#### Orientation Generation
- Generates random rotation angles for 3D orbit plane orientation
- Full 360° range for ascending node (rotZ)

### Generator UI

The Universe Generator Panel (`src/components/UniverseGeneratorPanel.tsx`) exposes:

- **Eccentricity Style** dropdown: circular / mixed / eccentric
- **Max Inclination** slider: 0° to 90°
- **Enable Orbit Center Offsets** checkbox

### Presets

Each style preset has default orbit characteristics:
- **sparse**: Circular, slight tilt (5°)
- **solarLike**: Circular, low inclinations (10°)
- **crowded**: Mixed eccentricity, moderate tilt (25°)
- **superDenseExperimental**: Eccentric, wild tilts (45°), offsets enabled

## Examples

### Creating a Circular Orbit (Simple Mode)
```typescript
{
  orbitalDistance: 20,
  orbitalSpeed: 15,
  orbitalPhase: 0,
  // No other orbit parameters needed
}
```

### Creating an Elliptical Orbit
```typescript
{
  orbitalDistance: 20,        // Maintained for compatibility
  orbitalSpeed: 15,
  orbitalPhase: 0,
  semiMajorAxis: 20,          // Main radius
  eccentricity: 0.5,          // Moderate ellipse
}
```

### Creating a Tilted Elliptical Orbit
```typescript
{
  orbitalDistance: 20,
  orbitalSpeed: 15,
  orbitalPhase: 0,
  semiMajorAxis: 20,
  eccentricity: 0.3,
  orbitRotX: 15,              // 15° inclination
  orbitRotZ: 45,              // 45° ascending node
}
```

### Creating an Offset Elliptical Orbit
```typescript
{
  orbitalDistance: 20,
  orbitalSpeed: 15,
  orbitalPhase: 0,
  semiMajorAxis: 20,
  eccentricity: 0.4,
  orbitOffsetX: 5,            // Shifted 5 units in X
  orbitOffsetY: 2,            // Shifted 2 units in Y
  orbitRotX: 20,
}
```

## Technical Details

### Coordinate System
- X-Z plane is the default orbit plane (Y = 0)
- Rotations are applied as Euler angles in Z-Y-X order
- Positive rotation follows right-hand rule

### Ellipse Semi-Minor Axis
- Not stored directly
- Calculated from eccentricity: `b = a × √(1 - e²)`

### Kepler's Laws
- Current implementation uses **parametric ellipse** (uniform angular parameter)
- Not true Keplerian motion (which has non-uniform angular velocity)
- Sufficient for visualization; can be upgraded to true Kepler solver if needed

### Orbit Center Offset vs. Focal Point
- Offset translates the **entire ellipse center**
- This is different from placing the parent at a focal point
- Parent remains at the origin of the translated coordinate system

## Migration Guide

### Updating Existing Systems

Existing systems will load with:
- All existing `orbitalDistance`, `orbitalSpeed`, `orbitalPhase` values intact
- New fields default to circular/neutral values
- Visually identical to pre-ellipse behavior

No migration is needed; the system is fully backward compatible.

### Converting Circular to Elliptical

To convert an existing circular orbit to elliptical:
1. Open the star in the Star Editor
2. Switch from "Simple Circular" to "Advanced Elliptical" mode
3. Adjust eccentricity, rotation, and offset as desired
4. The system auto-saves

## Performance Considerations

- Orbit path generation: O(n) where n = number of segments (default 64)
- Position calculation: O(1) per frame per body
- Minimal performance impact compared to circular orbits
- Large systems (100+ bodies) still run smoothly

## Future Enhancements

Potential improvements:
- True Keplerian motion (solve Kepler's equation for non-uniform speed)
- Orbital elements input (inclination, ascending node, argument of periapsis)
- Visual focus point indicators
- Apsides markers (periapsis/apoapsis)
- Orbit prediction/propagation tools

## References

- **Semi-major axis & eccentricity**: Standard orbital element definitions
- **Euler angles**: Z-Y-X rotation convention (similar to Tait-Bryan angles)
- **Parametric ellipse**: `x = a cos(θ)`, `y = b sin(θ)`

---

For more information, see:
- `src/types.ts` - Star interface definition
- `src/utils/physics.ts` - Orbit calculation implementation
- `src/ui/StarEditorPanel.tsx` - UI for editing orbits
- `src/utils/procedural-generator.ts` - Procedural orbit generation

