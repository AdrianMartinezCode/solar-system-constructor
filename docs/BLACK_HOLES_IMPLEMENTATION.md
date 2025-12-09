# Black Holes Implementation

## Overview

Black holes are fully-integrated exotic celestial objects that can serve as system centers or rare companions in multi-body systems. They feature sophisticated visual effects including event horizon shadows, accretion disks with gravitational lensing, relativistic jets, and Doppler beaming.

## Data Model

### Type Extensions

Black holes extend the existing `Star` interface with a new `bodyType` and associated metadata:

```typescript
// In types.ts
bodyType?: 'star' | 'planet' | 'moon' | 'asteroid' | 'comet' | 'lagrangePoint' | 'blackHole';

blackHole?: BlackHoleProperties;
```

### BlackHoleProperties Interface

```typescript
export interface BlackHoleProperties {
  // Core presence flags
  hasAccretionDisk: boolean;        // Whether this black hole has an accretion disk
  hasRelativisticJet: boolean;      // Whether this black hole has jets
  hasPhotonRing: boolean;           // Whether to render the photon ring
  
  // Physical-ish parameters
  spin: number;                     // 0–1 dimensionless spin parameter (Kerr)
  
  // Visual radii and dimensions (in world units)
  shadowRadius: number;             // Visual radius of black hole shadow (~ 2x event horizon)
  
  // Accretion disk geometry
  accretionInnerRadius: number;     // Inner edge of accretion disk (> shadowRadius)
  accretionOuterRadius: number;     // Outer edge of accretion disk
  diskThickness: number;            // Half-height thickness of disk
  
  // Accretion disk appearance
  diskBrightness: number;           // 0-1 brightness/emissive intensity
  diskOpacity: number;              // 0-1 base opacity
  diskTemperature: number;          // Temperature gradient (affects color, kelvin-like)
  diskClumpiness: number;           // 0-1 clumpiness/density variation
  
  // Relativistic jet parameters
  jetLength: number;                // Length of jet along spin axis
  jetOpeningAngle: number;          // Opening angle in degrees (cone width)
  jetBrightness: number;            // 0-1 brightness/emissive intensity
  
  // Visual effects strengths
  dopplerBeamingStrength: number;   // 0-1, strength of Doppler beaming effect
  lensingStrength: number;          // 0-1, strength of gravitational lensing warping
  
  // Rotation and animation
  rotationSpeedMultiplier: number;  // Multiplier for disk rotation (scales with timeScale)
  
  // Determinism
  seed: string | number;            // Per-black-hole seed for noise/variation
}
```

## Generation Logic

### Configuration

Black hole generation is controlled by parameters in `GeneratorConfig`:

```typescript
// Internal GeneratorConfig (procedural-generator.ts) - Core Parameters
enableBlackHoles: boolean;                              // Master switch
blackHoleSystemProbability: number;                     // Chance system centers on black hole
blackHoleAsCompanionProbability: number;                // Chance in multi-star systems
blackHoleMassRange: [number, number];                   // Base mass range (solar masses)
blackHoleAccretionDiskProbability: number;              // Chance of having disk
blackHoleJetProbability: number;                        // Chance of having jets (requires disk)
blackHolePhotonRingEnabled: boolean;                    // Whether to show photon rings
blackHoleDopplerBeamingStrengthRange: [number, number]; // Doppler effect strength
blackHoleLensingStrengthRange: [number, number];        // Lensing effect strength
blackHoleShadowRadiusRange: [number, number];           // Visual size range
blackHoleAccretionInnerRadiusMultiplier: [number, number]; // Inner radius as multiple of shadow radius
blackHoleAccretionOuterRadiusMultiplier: [number, number]; // Outer radius as multiple of shadow radius
blackHoleDiskThicknessRange: [number, number];          // Disk half-height thickness range
blackHoleJetLengthRange: [number, number];              // Jet length range
blackHoleJetOpeningAngleRange: [number, number];        // Jet opening angle range (degrees)
blackHoleSpinRange: [number, number];                   // Black hole spin parameter range (0-1)

// Advanced Diversity Parameters (optional, for richer control)
blackHoleMassClassWeights?: { stellar: number; intermediate: number; supermassive: number };
blackHoleMultiplePerSystemProbability?: number;         // Chance of multiple BHs per system
blackHoleCenterBias?: number;                           // 0-1 bias toward central BH
blackHoleSpinDistribution?: 'uniform' | 'highSpinBiased' | 'lowSpinBiased';
blackHoleTiltRange?: [number, number];                  // Disk/jet tilt angle range (degrees)
blackHoleShadowRadiusScaleMode?: 'physicalish' | 'cinematic';
blackHoleAccretionStyle?: 'subtle' | 'normal' | 'quasar';
blackHoleDiskBrightnessRange?: [number, number];        // Overrides hardcoded defaults
blackHoleDiskOpacityRange?: [number, number];
blackHoleDiskTemperatureRange?: [number, number];
blackHoleDiskClumpinessRange?: [number, number];
blackHoleJetBrightnessRange?: [number, number];
blackHoleSecondaryRingProbability?: number;
blackHoleRotationSpeedMultiplierRange?: [number, number];
```

### UI Configuration

User-facing controls in `GenerationConfig` (generationConfig.ts):

#### Basic Controls (always visible)

```typescript
enableBlackHoles?: boolean;                  // Master switch
blackHoleFrequency?: number;                 // 0-1 slider (maps to system probability)
blackHoleAccretionIntensity?: number;        // 0-1 slider (disk brightness/density)
blackHoleJetFrequency?: number;              // 0-1 slider (jet probability)
blackHoleVisualComplexity?: 'minimal' | 'normal' | 'cinematic'; // Effect quality preset
```

#### Advanced Controls (collapsible section)

```typescript
blackHoleMassProfile?: 'stellarOnly' | 'mixed' | 'supermassiveCentres';
blackHoleSpinLevel?: number;                 // 0-1, maps to spin range and distribution
blackHoleDiskThicknessLevel?: number;        // 0-1, scales disk thickness range
blackHoleDiskClumpinessLevel?: number;       // 0-1, scales disk clumpiness range
blackHoleJetDramaLevel?: number;             // 0-1, affects jet length/brightness
blackHoleFxIntensity?: number;               // 0-1, scales Doppler beaming and lensing
blackHoleRarityStyle?: 'ultraRare' | 'rare' | 'common'; // Overrides frequency slider
blackHoleAccretionStyle?: 'subtle' | 'normal' | 'quasar';
blackHoleAllowMultiplePerSystem?: boolean;   // Enable binary BHs and multiple BHs
```

#### Configuration Mapping

The bridge (`generatorBridge.ts`) maps UI sliders to internal generator ranges:

- **Mass Profile**:
  - `stellarOnly` → `{ stellar: 1.0, intermediate: 0.0, supermassive: 0.0 }`
  - `mixed` → `{ stellar: 0.7, intermediate: 0.25, supermassive: 0.05 }`
  - `supermassiveCentres` → `{ stellar: 0.3, intermediate: 0.2, supermassive: 0.5 }`

- **Spin Level** (0-1):
  - `< 0.33` → `[0.0, 0.4]` range, `lowSpinBiased` distribution
  - `0.33-0.67` → `[0.2, 0.8]` range, `uniform` distribution
  - `> 0.67` → `[0.6, 0.99]` range, `highSpinBiased` distribution

- **Accretion Style**:
  - `subtle` → Low brightness/temp ranges
  - `normal` → Standard ranges
  - `quasar` → Maximum brightness/temp, favors jets

- **Rarity Style** (overrides frequency slider):
  - `ultraRare` → 1% system probability
  - `rare` → 5% system probability
  - `common` → 30% system probability

### Generation Algorithm

Black holes are generated during system creation in `processSystem()`:

1. **System-Level Decision**: When a new system is created, check if it should be black-hole-centered based on `blackHoleSystemProbability`
2. **Black Hole as Center**: If yes, replace the primary star with a black hole created via `createBlackHole()`
3. **Companion Black Holes**: In multi-star systems, optionally replace one companion star with a black hole based on `blackHoleAsCompanionProbability`
4. **Multiple Black Holes**: If `blackHoleMultiplePerSystemProbability` is set and triggered, additional black holes may be generated (binary BH systems)
5. **Property Generation**: For each black hole (`createBlackHole()` method):
   
   **Mass Generation**:
   - If `blackHoleMassClassWeights` is defined, pick a class (stellar/intermediate/supermassive) based on weights
   - Sample mass from appropriate range for that class:
     - Stellar: 5-50 M☉
     - Intermediate: 50-10,000 M☉
     - Supermassive: 1M-1B M☉ (scaled for visualization)
   - Otherwise, use base `blackHoleMassRange`
   
   **Shadow Radius**:
   - Sample from `blackHoleShadowRadiusRange`
   - If `blackHoleShadowRadiusScaleMode === 'physicalish'`, loosely tie radius to mass
   - If `'cinematic'` (default), allow independent sizing for visibility
   
   **Spin Parameter**:
   - Sample from `blackHoleSpinRange`
   - Apply distribution bias if `blackHoleSpinDistribution` is set:
     - `highSpinBiased`: quadratic toward max
     - `lowSpinBiased`: inverse quadratic toward min
     - `uniform`: linear distribution
   
   **Accretion Disk & Jets**:
   - Roll for accretion disk presence
   - Sample geometry (inner/outer radius, thickness) from ranges
   - Sample appearance (brightness, opacity, temperature, clumpiness) from ranges
     - Use advanced ranges if provided, otherwise fallback to defaults
     - Apply `blackHoleAccretionStyle` presets if configured
   - If disk present, roll for jets with configurable probability
   - Sample jet length, opening angle, brightness from ranges
   
   **Relativistic Effects**:
   - Sample Doppler beaming and lensing strengths from ranges
   - Optionally enable secondary lensing ring based on `blackHoleSecondaryRingProbability`
   
   **Animation & Determinism**:
   - Sample rotation speed multiplier from range
   - Assign per-BH seed for noise/variation

### Determinism

All black hole generation uses the same seeded PRNG system as other procedural features, ensuring:
- Reproducible universes from the same seed
- Consistent black hole properties across regenerations
- Deterministic particle distributions in accretion disks

## Rendering

### Component Architecture

Black holes are rendered via `BlackHoleObject.tsx`, following the pattern of `ProtoplanetaryDiskObject` and `SmallBodyFieldObject`:

- **Invocation**: `StarObject.tsx` detects `bodyType === 'blackHole'` and renders `<BlackHoleObject bodyId={starId} />`
- **Data Source**: Reads black hole properties from `useSystemStore`
- **Animation**: Uses `useFrame` to animate disk rotation based on global `timeScale`

### Visual Components

#### 1. Event Horizon Shadow

- **Geometry**: Spherical mesh at `shadowRadius`
- **Material**: `meshBasicMaterial` with `color: #000000` (perfectly black)
- **Purpose**: Represents the region where no light escapes

#### 2. Photon Ring

- **Geometry**: Ring geometry at ~2× shadow radius (thin annulus)
- **Material**: Additive blending, bright white, semi-transparent
- **Conditional**: Only rendered if `hasPhotonRing === true`
- **Purpose**: Represents light orbiting the black hole multiple times

#### 3. Accretion Disk

- **System**: GPU particle field (THREE.Points)
- **Particle Count**: ~3000 particles, scaled by disk area
- **Distribution**:
  - Radial: Non-uniform (denser near inner edge) using √u distribution
  - Angular: Uniform 0-2π
  - Vertical: Gaussian with thickness σ
- **Colors**: Temperature gradient from inner (hot, blue-white, ~20000K) to outer (cool, red-orange, ~5000K)
- **Shader Effects**:
  - **Gravitational Lensing**: Vertex shader warps positions near black hole to approximate light bending
  - **Doppler Beaming**: Fragment shader modulates brightness based on tangential velocity relative to camera:
    - Approaching side: brighter, blue-shifted
    - Receding side: dimmer, red-shifted
  - **Clumpiness**: Density variations via sin-based noise
- **Animation**: Rotates around Y-axis, speed scaled by `timeScale` and `rotationSpeedMultiplier`

#### 4. Relativistic Jets

- **Geometry**: Two cylindrical cones along Y-axis (top and bottom)
- **Material**: Additive blending, cyan-blue color, semi-transparent
- **Core**: Thin bright cylinder at center for enhanced visibility
- **Conditional**: Only rendered if `hasRelativisticJet === true`
- **Opening Angle**: Controlled by `jetOpeningAngle` (typically 3-8°)

#### 5. Secondary Lensing Ring (Optional)

- **Geometry**: Outer ring at ~3× shadow radius
- **Purpose**: Represents secondary lensed images (far side of disk wrapped around)
- **Material**: Faint orange/red ring, additive blending
- **Conditional**: Only visible if `lensingStrength > 0.5`

### Shader Implementation

Key shader techniques:

**Vertex Shader** (Accretion Disk):
```glsl
// Approximate gravitational lensing
float distFromCenter = length(pos.xz);
float lensingFactor = lensingStrength * smoothstep(shadowRadius * 5.0, shadowRadius * 2.0, distFromCenter);
if (distFromCenter < shadowRadius * 4.0) {
  float bendAmount = lensingFactor * 0.3;
  pos.y += bendAmount * shadowRadius * (1.0 - distFromCenter / (shadowRadius * 4.0));
}
```

**Fragment Shader** (Doppler Beaming):
```glsl
// Approximate Doppler shift and beaming
float angle = atan(vPosition.z, vPosition.x);
float velocityFactor = cos(angle); // Positive = toward camera
float dopplerBrightness = 1.0 + dopplerStrength * velocityFactor * 0.5;

// Color shift
vec3 dopplerShift = vColor;
if (velocityFactor > 0.0) {
  // Blue shift (approaching)
  dopplerShift += vec3(-0.1, 0.0, 0.2) * dopplerStrength * velocityFactor;
} else {
  // Red shift (receding)
  dopplerShift += vec3(0.2, 0.0, -0.1) * dopplerStrength * abs(velocityFactor);
}
```

### Performance

- **GPU-Driven**: All particles rendered via instanced points, no CPU per-frame updates
- **LOD Aware**: Particle counts scale with disk area (capped at reasonable limits)
- **Shader Complexity**: Three presets:
  - **Minimal**: Simplified shaders, no photon ring
  - **Normal**: Full effects with moderate parameters
  - **Cinematic**: Maximum visual quality, strongest effects

## Selection-Time Customization

### Black Hole Inspector Panel

When a black hole is selected in the 3D scene, the `StarEditorPanel` displays a comprehensive **Black Hole Inspector** with live-editable properties:

#### Core Presence Flags
- `hasAccretionDisk` (checkbox)
- `hasRelativisticJet` (checkbox)
- `hasPhotonRing` (checkbox)

#### Geometry Section
- `shadowRadius` (number input)
- `accretionInnerRadius` (number, validated > shadowRadius)
- `accretionOuterRadius` (number, validated > innerRadius)
- `diskThickness` (number)

#### Accretion Disk Appearance (when disk enabled)
- `diskBrightness` (slider, 0-1)
- `diskOpacity` (slider, 0-1)
- `diskTemperature` (number, 1000-50000 K)
- `diskClumpiness` (slider, 0-1)

#### Relativistic Jets (when jets enabled)
- `jetLength` (number)
- `jetOpeningAngle` (number, degrees)
- `jetBrightness` (slider, 0-1)

#### Physical Parameters
- `spin` (slider, 0-1; 0=Schwarzschild, 1=extremal Kerr)

#### Relativistic Effects
- `dopplerBeamingStrength` (slider, 0-1)
- `lensingStrength` (slider, 0-1)

#### Animation
- `rotationSpeedMultiplier` (number, 0.1-3.0)
- `seed` (read-only display)

### Real-Time Updates

All property edits:
- Update the `useSystemStore` immediately
- Trigger re-render of `BlackHoleObject.tsx` with new props
- Persist through save/load cycles
- Maintain determinism via existing seed

### Validation

The inspector enforces constraints:
- `shadowRadius > 0`
- `accretionInnerRadius > shadowRadius * 1.1`
- `accretionOuterRadius > accretionInnerRadius * 1.1`
- `spin ∈ [0, 1]`
- All FX strengths ∈ [0, 1]

## UI Integration

### UniverseGeneratorPanel

Added "Black Holes 🕳️" section with **basic controls** (always visible):
1. **Enable Black Holes** checkbox (master switch)
2. **Black Hole Frequency** slider (0-100%: None → Common)
3. **Accretion Disk Intensity** slider (0-100%: Faint → Blinding)
4. **Relativistic Jet Frequency** slider (0-100%: Rare → Common)
5. **Visual Complexity** dropdown (Minimal / Normal / Cinematic)

Plus a collapsible **"Advanced Black Hole Settings"** subsection with:
1. **Mass Profile** dropdown (Stellar Only / Mixed / Supermassive Centres)
2. **Spin Level** slider (0-100%: Slow → Near-Extremal)
3. **Disk Thickness** slider (0-100%: Thin → Thick)
4. **Disk Clumpiness** slider (0-100%: Smooth → Clumpy)
5. **Jet Drama Level** slider (0-100%: Subtle → Dramatic)
6. **Relativistic FX Intensity** slider (0-100%: Low → Extreme)
7. **Accretion Style** dropdown (Subtle / Normal / Quasar)
8. **Rarity Style** dropdown (Ultra Rare / Rare / Common)
9. **Allow Multiple Black Holes per System** checkbox

### Generation Stats

Stats display includes:
- **🕳️ Black Holes**: Total count
  - **↳ By Type**: S:# I:# SM:# (Stellar / Intermediate / Supermassive counts)
  - **↳ Avg Spin**: Average spin parameter (min, max in parentheses)
  - **↳ With Accretion Disks**: Subset with disks
  - **↳ With Relativistic Jets**: Subset with jets
  - **↳ With Photon Rings**: Subset with photon rings

### Generator Bridge

`generatorBridge.ts` maps UI config to internal config:
- `blackHoleFrequency` → `blackHoleSystemProbability` (scaled to 0-15%)
- `blackHoleAccretionIntensity` → disk brightness/opacity ranges
- `blackHoleJetFrequency` → direct mapping to jet probability
- `blackHoleVisualComplexity` → shader effect strength presets

## Analysis & Validation

### Stats Tracking

`generateUniverse()` in `generatorBridge.ts` returns:
- `totalBlackHoles`: Total count
- `totalBlackHolesWithDisks`: Count with accretion disks
- `totalBlackHolesWithJets`: Count with jets
- `totalBlackHolesByType`: Object with stellar/intermediate/supermassive counts
- `avgBlackHoleSpin`: Average spin parameter across all black holes
- `minBlackHoleSpin`: Minimum spin parameter
- `maxBlackHoleSpin`: Maximum spin parameter
- `blackHolesWithPhotonRings`: Count with photon rings enabled
- `blackHolesWithQuasarAccretion`: Count with quasar-style accretion (if detectable)

### Validation

`validateSystem()` could be extended to check:
- `blackHole.shadowRadius > 0`
- `blackHole.accretionInnerRadius > blackHole.shadowRadius`
- `blackHole.accretionOuterRadius > blackHole.accretionInnerRadius`
- `blackHole.spin ∈ [0, 1]`
- Jet and disk parameters are non-negative

## Preset Integration

Black holes added to all style presets in `generatorConfigDefaults.ts`:
- **sparse**: Disabled, minimal complexity
- **solarLike**: Disabled (mature systems)
- **crowded**: Disabled by default, normal complexity if enabled
- **superDenseExperimental**: Disabled by default, cinematic complexity if enabled

## Compatibility

- **Backward Compatible**: All existing universes remain valid; black holes are opt-in
- **Orbital Mechanics**: Black holes respect the same orbital physics as stars (Kepler's laws, elliptical orbits)
- **Selection**: Black holes are selectable like any other body; selection indicator is a larger wireframe sphere
- **Body POV Camera**: Compatible; camera can orbit black holes just like stars
- **Time Scale**: All animations respond to global `timeScale` and `rotationSpeedMultiplier`

## Future Enhancements

Possible extensions:
1. **Advanced Lensing**: More accurate light-bending using raymarching or image-space distortion
2. **Ergosphere**: Visual representation of frame-dragging for high-spin black holes
3. **X-ray Binaries**: Black holes actively accreting from companion stars
4. **Tidal Disruption Events**: Animated effects when objects pass too close
5. **Gravitational Waves**: Visual representation for binary black holes
6. **Supermassive Black Holes**: Galactic centers with larger scale effects
7. **Quasar Mode**: Ultra-luminous accretion disks for young systems

## Technical Notes

- **Not Physically Accurate**: This is an approximation of GR effects using simplified shaders, not a full relativistic simulation
- **Mass Scale**: Black hole masses are in solar mass units (typically 5-50 M☉ for stellar-mass black holes)
- **Visual Scale**: Shadow radius is scaled for visibility; not strictly proportional to physical Schwarzschild radius
- **Color Temperature**: Simplified black-body approximation; actual accretion disk spectra are more complex

## References

- Interstellar (film) visual reference for accretion disk lensing
- Event Horizon Telescope black hole shadow imaging
- Kerr black hole spin parameter conventions
- Relativistic jet morphology from AGN/quasar observations

