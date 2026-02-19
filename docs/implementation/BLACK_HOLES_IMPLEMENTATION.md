# Black Holes Implementation

## Overview (user-facing outcome)

Black holes are fully-integrated exotic celestial objects that can serve as system centers or rare companions in multi-body systems. They feature sophisticated visual effects including event horizon shadows, accretion disks with gravitational lensing, relativistic jets, and Doppler beaming.

## Behavior / UX notes

- Black holes render with distinct visuals (shadow, disk, jets, photon ring) and can be edited like other bodies where supported.
- Generation may produce black holes as rare/exotic outcomes depending on config.

## Data model changes

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
  
  // Enhanced visual parameters (optional, for improved realism)
  diskTurbulenceScale?: number;     // 0-1 scale of turbulent noise patterns in disk
  diskInnerColor?: string;          // Hex color for inner disk edge (overrides temperature)
  diskOuterColor?: string;          // Hex color for outer disk edge (overrides temperature)
  diskStreakiness?: number;         // 0-1 azimuthal streaking/shear strength
  jetBaseColor?: string;            // Hex color for jet base (default: white/blue)
  jetTipColor?: string;             // Hex color for jet tip (default: blue/cyan)
  jetGradientPower?: number;        // Exponent for opacity/brightness falloff (default: 2.0)
  photonRingMultiImageCount?: number; // Number of sub-rings/lensed images (1-3, default: 2)
  photonRingWidth?: number;         // Relative width of photon ring (default: 0.4 shadow radii)
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

#### 2. Photon Ring (Enhanced)

- **Implementation**: Dedicated `PhotonRingObject` component with custom shader
- **Geometry**: Ring geometry at ~1.8-2.2× shadow radius
- **Features**:
  - **Multiple Lensed Images**: Shows 2-3 concentric bright bands representing light that orbited multiple times
  - **Intensity Control**: Driven by `lensingStrength` - stronger lensing creates more prominent multi-image structure
  - **Temperature-Based Color**: Inherits color from `diskTemperature` for consistency
  - **Angular Asymmetry**: Slight brightness variations around the ring for realism
- **Parameters**:
  - `photonRingMultiImageCount`: Number of visible sub-rings (1-3)
  - `photonRingWidth`: Width of the ring in shadow radii units
- **Conditional**: Only rendered if `hasPhotonRing === true`

#### 3. Accretion Disk (Completely Reworked)

- **System**: Mesh-based continuous disk (THREE.Mesh with custom shader material)
- **Geometry**: Ring geometry with 128 radial segments for smooth appearance
- **Shader-Based Rendering**: All effects computed in GPU shaders for performance
- **Visual Features**:
  - **Continuous Dense Flow**: Appears as a solid, glowing sheet rather than separated particles
  - **Radial Intensity Gradient**: Intense white-hot glow at inner edge, fading toward outer edge
  - **Azimuthal Streaking**: Spiral patterns simulating gas streams being dragged into rotation
  - **Multi-Scale Turbulence**: 3D noise at multiple frequencies creates realistic density variations
  - **Temperature Gradient**: Inner regions 3× hotter than outer, with black-body color mapping
  - **Custom Color Support**: Optional `diskInnerColor` and `diskOuterColor` override temperature gradient
- **Shader Effects**:
  - **Gravitational Lensing**: Vertex shader warps disk geometry near shadow, creating visible bending
  - **Doppler Beaming**: Fragment shader modulates brightness and color:
    - Approaching side: brighter, blue-shifted
    - Receding side: dimmer, red-shifted
  - **Clumpiness**: Controlled by `diskClumpiness` parameter via turbulent noise
  - **Streakiness**: Controlled by `diskStreakiness` parameter for spiral pattern strength
- **Animation**: Rotates around Y-axis, speed scaled by `timeScale`, `rotationSpeedMultiplier`, and `spin`
- **Parameters**:
  - `diskTurbulenceScale`: Controls scale of noise patterns (0.4-0.7)
  - `diskStreakiness`: Controls strength of spiral streaking (0.4-0.9 for quasars)

#### 4. Lensed Far-Side Disk Image (New)

- **Implementation**: Separate `LensedDiskImage` component
- **Purpose**: Represents the far side of the disk bent over the top by gravitational lensing
- **Geometry**: Warped ring positioned above the black hole
- **Features**:
  - **Warped Geometry**: Vertex shader bends the mesh to simulate light path bending
  - **Synchronized Rotation**: Matches main disk rotation for consistency
  - **Dimmer Appearance**: Secondary image is ~30% brightness of main disk
  - **Temperature Offset**: Slightly cooler color than main disk
- **Conditional**: Only visible if `lensingStrength > 0.3`
- **Visual Impact**: Creates the iconic "wraparound" effect seen in realistic black hole visualizations

#### 5. Relativistic Jets (Completely Reworked)

- **Implementation**: Dedicated `RelativisticJet` component with custom shader
- **Geometry**: True cone geometry (CylinderGeometry with different top/bottom radii)
- **Shape**: Wider at base near black hole, narrowing toward tip
- **Features**:
  - **Color Gradient**: Smooth transition from `jetBaseColor` (base) to `jetTipColor` (tip)
  - **Brightness Gradient**: Intense at base, fades to zero at tip using power curve
  - **Radial Falloff**: Brighter in center, dimmer at edges for 3D volume appearance
  - **Smooth Fade**: Jets "disappear completely" at far tips for natural look
- **Default Colors**:
  - Base: White/blue-white (#ffffff)
  - Tip: Cyan-blue (#66ccff)
- **Parameters**:
  - `jetGradientPower`: Controls falloff curve (1.5-2.5, lower = slower fade)
  - `jetBaseColor`, `jetTipColor`: Optional custom colors
- **Conditional**: Only rendered if `hasRelativisticJet === true`
- **Visual Impact**: Much more dramatic and realistic than previous cylindrical jets

### Shader Implementation

The new implementation uses sophisticated GPU shaders for all visual effects:

#### Accretion Disk Vertex Shader

```glsl
// Gravitational lensing with improved warping
vec3 pos = position;
float distFromCenter = length(pos.xy);
float lensingFactor = lensingStrength * smoothstep(outerRadius, innerRadius * 1.5, distFromCenter);

// Bend light paths near black hole (creates visible far-side wraparound)
if (distFromCenter < innerRadius * 2.0) {
  float bendAmount = lensingFactor * 0.5;
  float proximityFactor = 1.0 - (distFromCenter / (innerRadius * 2.0));
  pos.z += bendAmount * shadowRadius * proximityFactor;
}
```

#### Accretion Disk Fragment Shader

Key techniques:

**Radial Intensity Gradient**:
```glsl
// Intense inner glow, fades outward
float radialIntensity = pow(1.0 - radial, 2.5) * 2.0 + 0.2;
```

**Azimuthal Streaking** (spiral gas streams):
```glsl
float spiralFactor = radial * 8.0 - time * 0.5;
float streaks = sin(angle * 12.0 + spiralFactor) * 0.5 + 0.5;
streaks = mix(1.0, streaks, streakiness);
```

**Multi-Scale Turbulence**:
```glsl
vec3 noiseCoord = vec3(vWorldPosition.x, vWorldPosition.z, time * 0.1) * turbulenceScale;
float turbulence = noise3D(noiseCoord);
turbulence += noise3D(noiseCoord * 2.4) * 0.5;
turbulence += noise3D(noiseCoord * 5.8) * 0.25;
turbulence /= 1.75;
```

**Temperature Gradient**:
```glsl
// Inner regions 3× hotter than outer
float localTemp = temperature * (1.0 + (1.0 - radial) * 2.0);
vec3 baseColor = temperatureToColor(localTemp);
```

**Doppler Beaming** (enhanced):
```glsl
float velocityFactor = cos(angle);
float dopplerBrightness = 1.0 + dopplerStrength * velocityFactor;

vec3 dopplerShift = baseColor;
if (velocityFactor > 0.0) {
  // Approaching: blue shift
  dopplerShift += vec3(-0.2, 0.0, 0.3) * dopplerStrength * velocityFactor;
} else {
  // Receding: red shift
  dopplerShift += vec3(0.3, 0.0, -0.2) * dopplerStrength * abs(velocityFactor);
}
```

#### Photon Ring Shader

```glsl
// Multiple lensed image rings
float imagePattern = 0.0;
for (float i = 0.0; i < multiImageCount; i += 1.0) {
  float ringPos = 0.3 + i * 0.3;
  float ringDist = abs(radial - ringPos);
  float ringIntensity = smoothstep(0.15, 0.05, ringDist);
  imagePattern += ringIntensity * (1.0 - i * 0.3); // Outer rings dimmer
}

float intensity = imagePattern * lensingStrength * diskBrightness * 1.5;
```

#### Relativistic Jet Shader

```glsl
// Distance from base (0) to tip (1)
float dist = vUv.y;

// Power curve for gradient falloff
float falloff = pow(1.0 - dist, gradientPower);

// Color gradient from base to tip
vec3 color = mix(baseColor, tipColor, dist);

// Radial falloff (brighter in center)
float radialDist = length(vUv.x - 0.5) * 2.0;
float radialFalloff = 1.0 - smoothstep(0.3, 1.0, radialDist);

// Combine falloffs
float intensity = falloff * radialFalloff * jetBrightness;

// Smooth fade at tip
intensity *= smoothstep(1.0, 0.8, dist);
```

### Performance

- **GPU-Driven**: All rendering done via mesh geometries with custom shaders, no CPU per-frame updates
- **Mesh-Based Efficiency**: Accretion disk uses a single ring mesh (128 segments) instead of thousands of particles
- **Shader Optimization**:
  - All visual effects computed in shaders (turbulence, streaking, gradients)
  - No texture lookups required (procedural noise only)
  - Additive blending minimizes overdraw cost
- **Component Architecture**: Photon ring, lensed disk, and jets are separate components for clean composition
- **Complexity Presets**: Three visual quality levels:
  - **Minimal**: Simplified shaders, basic photon ring, fewer jet segments
  - **Normal**: Full effects with moderate parameters, 2 photon ring images
  - **Cinematic**: Maximum visual quality, 3 photon ring images, strongest lensing effects
- **Performance Impact**: New implementation is actually **more efficient** than particle-based approach:
  - Fewer draw calls (1 mesh vs 1 point cloud)
  - Better GPU cache coherency
  - Reduced vertex processing (128 vertices vs 3000+ particles)

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

- **Not Physically Accurate**: This is an approximation of GR effects using simplified shaders, not a full relativistic simulation or raytraced solution
- **Artistic License**: Visual effects are tuned for dramatic, cinematic appearance while maintaining physical plausibility
- **Mass Scale**: Black hole masses are in solar mass units (typically 5-50 M☉ for stellar-mass black holes)
- **Visual Scale**: Shadow radius is scaled for visibility; not strictly proportional to physical Schwarzschild radius
- **Color Temperature**: Simplified black-body approximation; actual accretion disk spectra are more complex (include X-ray emission, etc.)
- **Lensing Approximation**: Gravitational lensing is approximated via vertex displacement and secondary geometry, not full geodesic integration
- **Doppler Effect**: Simplified relativistic beaming calculation; does not account for full special/general relativistic effects
- **Jet Physics**: Jets are purely visual; no actual particle acceleration or magnetic field simulation

## Visual Quality Comparison

### Before (Particle-Based)

- Accretion disk looked like separated asteroid belt particles
- Simple cylindrical jets with uniform color
- Basic photon ring (single bright ring)
- Minimal lensing effect
- Obvious individual point sprites

### After (Mesh + Shader-Based)

- Accretion disk appears as continuous, dense glowing fluid
- Cone-shaped jets with realistic color/brightness gradients that fade to zero
- Photon ring shows multiple lensed images (2-3 sub-rings)
- Strong lensing with visible far-side disk wraparound
- Intense inner-edge glow with radial temperature gradient
- Azimuthal streaking simulates spiral gas streams
- Multi-scale turbulence creates realistic density variations
- Much more cinematic and physically suggestive appearance

## Configuration Impact

Existing UI controls now have enhanced visual impact:

- **blackHoleAccretionIntensity**: Now controls both brightness AND how continuous/dense the disk appears
- **blackHoleFxIntensity**: Scales both Doppler beaming and lensing strength, making photon ring and far-side image more prominent in cinematic mode
- **blackHoleAccretionStyle**:
  - `subtle`: Dimmer disk, less streaking, faster jet fade
  - `normal`: Balanced appearance
  - `quasar`: Intense disk, strong spiral patterns, slower jet fade (more dramatic)
- **blackHoleJetDramaLevel**: Now affects both jet length and gradient power (higher = longer, slower fade)

All existing saves and presets remain compatible; new parameters have sensible defaults that improve visuals automatically.

## References

- Interstellar (film) visual reference for accretion disk lensing
- Event Horizon Telescope black hole shadow imaging
- Kerr black hole spin parameter conventions
- Relativistic jet morphology from AGN/quasar observations


## Algorithms / approach

- Rendering layers combine multiple effects (shadow, accretion disk, jets, photon ring) with parameterized controls.
- Generator chooses whether/when to create black holes and populates `BlackHoleProperties` deterministically when seeded.

## Files touched

- UI:
  - Black hole editor section(s)
  - Black hole render components/materials
- State:
  - `src/types.ts` (`BlackHoleProperties`, `bodyType` extension)
  - Generator config + generator implementation
- Docs:
  - This doc

## Performance considerations

- Visual effects should be bounded in cost (avoid high-resolution meshes/textures where unnecessary).
- Ensure expensive effects are conditional on feature flags/visibility.

## Compatibility / migrations

- Backward compatible: `blackHole` metadata is optional and absent in older saves.

## Verification

- Manual checks:
  - Generate a universe with black holes enabled and confirm visuals render correctly.
  - Edit black hole properties (disk/jets/photon ring toggles) and confirm updates.
- Scripts:
  - `npm run typecheck`
  - `npm run build`

## Follow-ups

- Add a small “visual sanity checklist” for extreme parameter values (very high spin, large disks, long jets).
