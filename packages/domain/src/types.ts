export interface Star {
  id: string;
  name: string;
  mass: number;
  radius: number;
  color: string;
  children: string[];
  parentId: string | null;
  
  // Body type discriminant for identifying different celestial body types
  bodyType?: 'star' | 'planet' | 'moon' | 'asteroid' | 'comet' | 'lagrangePoint' | 'blackHole';
  
  // Optional planetary ring (primarily for planets)
  ring?: PlanetaryRing;
  
  // Reference to parent asteroid belt (if this is an asteroid)
  parentBeltId?: string;
  
  // Optional asteroid subtype (for distinguishing main belt from Kuiper belt objects)
  asteroidSubType?: 'mainBelt' | 'kuiperBelt' | 'generic';
  
  // Optional comet-specific metadata (if this is a comet)
  comet?: CometMeta;
  
  // Optional Lagrange point metadata (if this is a Lagrange point marker)
  lagrangePoint?: LagrangePointMeta;
  
  // Reference to Lagrange point (for Trojan bodies)
  lagrangeHostId?: string;
  
  // Optional black hole metadata (if this is a black hole)
  blackHole?: BlackHoleProperties;
  
  // Rogue planet support (planets not bound to any system)
  isRoguePlanet?: boolean;          // true only for rogue planets
  roguePlanet?: RoguePlanetMeta;    // Rogue planet motion and style metadata
  
  // Legacy circular orbit parameters (maintained for backward compatibility)
  orbitalDistance: number;
  orbitalSpeed: number;
  orbitalPhase: number; // Phase offset in degrees (0-360) for n-ary systems
  
  // Elliptical orbit shape parameters
  semiMajorAxis?: number;        // a - semi-major axis (if undefined, derived from orbitalDistance)
  eccentricity?: number;          // e - eccentricity (0 = circular, 0-1 = ellipse)
  
  // Orbit center offset (3D translation of the ellipse center relative to parent)
  orbitOffsetX?: number;
  orbitOffsetY?: number;
  orbitOffsetZ?: number;
  
  // Orbit plane orientation (Euler angles in degrees)
  // Applied in order: rotZ, then rotY, then rotX
  orbitRotX?: number;  // Rotation around X axis (inclination-like)
  orbitRotY?: number;  // Rotation around Y axis
  orbitRotZ?: number;  // Rotation around Z axis (longitude of ascending node-like)
}

// Per-planet ring system (Saturn-like rings)
export interface PlanetaryRing {
  // Geometry defined in multiples of planet radius
  innerRadiusMultiplier: number; // Inner edge (e.g. 1.5x planet radius)
  outerRadiusMultiplier: number; // Outer edge (e.g. 3.0x planet radius)
  
  // Vertical half-thickness of the ring (visual only, in world units)
  thickness: number;
  
  // Visual style
  opacity: number; // 0-1 base opacity
  albedo: number;  // Brightness / reflectivity scalar
  color: string;   // Base color / tint
  density: number; // 0-1 density hint (used for shader/alpha mapping)
  
  // Optional advanced styling / reproducibility
  warpFactor?: number;
  seed?: string | number;
}

// Comet-specific metadata for cometary bodies
export interface CometMeta {
  // Orbital characterization (beyond what's already on Star)
  isPeriodic: boolean;              // short/long-period or single-pass
  perihelionDistance: number;       // closest approach (derived from orbit)
  aphelionDistance: number;         // farthest distance (derived from orbit)
  lastPerihelionTime?: number;      // in simulation time units, optional
  
  // Visual tail behavior
  hasTail: boolean;                 // usually true, but allow "dead" comets
  tailLengthBase: number;           // base scalar for tail length
  tailWidthBase: number;            // base width / radius
  tailColor: string;                // hex color for tail
  tailOpacityBase: number;          // base opacity (0-1)
  activityFalloffDistance: number;  // distance beyond which tail fades out strongly
  
  // Determinism / misc
  seed?: string | number;           // per-comet seed if needed
}

// Lagrange point metadata for L1-L5 markers and their associated Trojan populations
export interface LagrangePointMeta {
  primaryId: string;                // ID of the primary body (e.g. star)
  secondaryId: string;              // ID of the secondary body (e.g. planet or moon)
  pointIndex: 1 | 2 | 3 | 4 | 5;    // Which Lagrange point (L1-L5)
  stable: boolean;                  // true for L4/L5, false for L1-L3
  pairType: 'starPlanet' | 'planetMoon'; // Type of two-body pair
  label?: string;                   // Optional display label (e.g. "Earth L4")
}

/**
 * Black Hole Properties - metadata for black hole bodies
 * 
 * Black holes are special, extremely dense central objects with visual elements
 * including event horizon shadow, accretion disk, relativistic jets, and
 * simulated gravitational lensing effects.
 */
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
  
  // ============================================================================
  // Enhanced Visual Parameters (optional, for improved realism)
  // ============================================================================
  
  // Accretion disk advanced appearance (optional)
  diskTurbulenceScale?: number;     // 0-1 scale of turbulent noise patterns in disk
  diskInnerColor?: string;          // Hex color for inner disk edge (overrides temperature)
  diskOuterColor?: string;          // Hex color for outer disk edge (overrides temperature)
  diskStreakiness?: number;         // 0-1 azimuthal streaking/shear strength
  
  // Jet advanced appearance (optional)
  jetBaseColor?: string;            // Hex color for jet base (default: white/blue)
  jetTipColor?: string;             // Hex color for jet tip (default: blue/cyan)
  jetGradientPower?: number;        // Exponent for opacity/brightness falloff (default: 2.0)
  
  // Photon ring advanced parameters (optional)
  photonRingMultiImageCount?: number; // Number of sub-rings/lensed images (1-3, default: 2)
  photonRingWidth?: number;         // Relative width of photon ring (default: 0.4 shadow radii)
  
  // Orientation and tilt (optional)
  diskTilt?: number;                // Disk tilt angle in radians (default: 0, ~Math.PI/2 for edge-on)
  diskTiltAxisAngle?: number;       // Azimuthal angle of tilt axis in radians (default: 0)
}

// Rogue Planet metadata for planets not gravitationally bound to any star
export interface RoguePlanetMeta {
  seed: string | number;            // Deterministic per-rogue RNG seed
  initialPosition: { x: number; y: number; z: number }; // World-space position at t=0
  velocity: { x: number; y: number; z: number };        // World-space drift vector
  colorOverride?: string;           // Optional special coloring for rogues
  
  // ============================================================================
  // Curved / Elliptical Path Parameters (optional, for non-linear trajectories)
  // ============================================================================
  
  /**
   * Path curvature coefficient: 0 = perfectly straight/rectilinear, 1 = strongly curved
   * When > 0, the rogue follows an elliptical/curved path instead of pure linear drift.
   * Undefined or 0 defaults to linear motion (backwards compatible).
   */
  pathCurvature?: number;  // 0..1
  
  /**
   * Semi-major axis for elliptical path (reused from elliptical orbit system).
   * When pathCurvature > 0, defines the size of the curved path.
   * If undefined, derived from velocity magnitude and configured ranges.
   */
  semiMajorAxis?: number;
  
  /**
   * Eccentricity for elliptical path: 0 = circular, 0-0.99 = ellipse.
   * Higher curvature typically correlates with more eccentric paths.
   */
  eccentricity?: number;  // 0..0.99
  
  /**
   * Path center offset (translation of the path center relative to initialPosition).
   * Allows the ellipse center to be positioned differently from t=0 position.
   */
  pathOffsetX?: number;
  pathOffsetY?: number;
  pathOffsetZ?: number;
  
  /**
   * 3D orientation of the curved path (Euler angles in degrees).
   * Applied in order: rotZ, then rotY, then rotX (same as orbital rotations).
   * Controls inclination and orientation of the elliptical path plane.
   */
  orbitRotX?: number;  // Rotation around X axis (inclination)
  orbitRotY?: number;  // Rotation around Y axis
  orbitRotZ?: number;  // Rotation around Z axis (longitude of ascending node)
  
  /**
   * Time period to complete one loop of the curved path (in seconds).
   * When curved, the path is periodic. If undefined, derived from semiMajorAxis.
   * Used to compute angular velocity for parametric motion.
   */
  pathPeriod?: number;
  
  // ============================================================================
  // Trajectory Visualization Settings (optional)
  // ============================================================================
  
  /**
   * Whether to show trajectory visualization for this rogue planet.
   * If undefined, uses global rogue trajectory visibility setting.
   */
  showTrajectory?: boolean;
  
  /**
   * Length of past trajectory segment to visualize (in seconds or as fraction of pathPeriod).
   * If undefined, uses global default.
   */
  trajectoryPastWindow?: number;
  
  /**
   * Length of future trajectory segment to visualize (in seconds or as fraction of pathPeriod).
   * If undefined, uses global default.
   */
  trajectoryFutureWindow?: number;
}

/**
 * Asteroid belt entity representing a collection of many small bodies.
 * This is the unified data model for both main asteroid belts and Kuiper belt objects.
 * Use `beltType` to distinguish between 'main' (rocky, inner) and 'kuiper' (icy, outer) belts.
 * 
 * The UI presents these as a unified "Small Body Belts" family while preserving
 * the physical distinctions (position, composition, colors) internally.
 */
export interface AsteroidBelt {
  id: string;
  name: string;
  parentId: string; // The star or planet this belt orbits
  
  // Belt geometry
  innerRadius: number;     // Inner edge of the belt
  outerRadius: number;     // Outer edge of the belt
  thickness: number;       // Vertical spread (standard deviation for Y offsets)
  
  // Belt orbital parameters (shared by all asteroids in the belt)
  eccentricity: number;    // 0 for circular, >0 for elliptical belts
  inclination: number;     // Degrees of tilt from parent's orbital plane
  
  // Asteroid population
  asteroidCount: number;   // Number of asteroids in this belt
  asteroidIds: string[];   // IDs of all asteroids belonging to this belt
  
  // Visual properties
  color?: string;          // Optional belt color hint
  
  // Belt type discriminator (for distinguishing main belt from Kuiper belt)
  // Both types are conceptually part of the unified "Small Body Belts" system
  beltType?: 'main' | 'kuiper';
  
  // Optional belt metadata
  regionLabel?: string;        // e.g. "Main Belt", "Kuiper Belt"
  isIcy?: boolean;             // true for Kuiper-type belts (bluish icy colors)
  inclinationSigma?: number;   // Extra vertical scatter / inclination noise
  radialRangeHint?: [number, number]; // For documentation/debugging
  
  // Performance / LOD hints
  lodLevel?: number;           // Current LOD level (0=full detail, higher=reduced)
  visible?: boolean;           // Visibility toggle for UI control
  
  // Generation seed (for reproducible belt generation)
  seed?: string | number;
}

/**
 * Type alias for unified "Small Body Belt" concept.
 * Both asteroid belts and Kuiper belts are represented by this same type.
 * This alias exists for semantic clarity in the UI and editor code.
 */
export type SmallBodyBelt = AsteroidBelt;

export interface Position {
  x: number;
  y: number;
  z: number;
}

// Group entity for organizing solar systems
export interface Group {
  id: string;
  name: string;
  children: GroupChild[]; // Can contain solar systems (root star IDs) or other groups
  parentGroupId: string | null; // Parent group ID (null for top-level groups)
  color?: string; // Optional color for visualization
  icon?: string; // Optional icon/symbol
  position?: Position; // Optional position for spatial layout
}

// Union type for group children
export interface GroupChild {
  id: string;
  type: 'system' | 'group'; // Either a root solar system or another group
}

// Type for nesting level control
export type NestingLevel = number | 'max';

/**
 * Protoplanetary Disk - a visual-only shader-driven disk representing
 * a young circumstellar disk of gas and dust around a star.
 * 
 * Rendered as a GPU-efficient mesh with a fragment shader for continuous
 * disk appearance with bands, gaps, and radial gradients, plus an optional
 * lightweight particle overlay for sparkle. NOT individual Star objects.
 * The disk is purely visual and does not affect physics.
 */
export interface ProtoplanetaryDisk {
  /** Unique identifier for this disk */
  id: string;
  
  /** System ID that this disk belongs to (for multi-system organization) */
  systemId: string;
  
  /** ID of the central star this disk surrounds */
  centralStarId: string;
  
  // Geometry (in orbital distance units)
  /** Inner radius of the disk (start of particle distribution) */
  innerRadius: number;
  
  /** Outer radius of the disk (end of particle distribution) */
  outerRadius: number;
  
  /** Half-height thickness of the disk (controls vertical spread and volumetric feel) */
  thickness: number;
  
  // Visual parameters
  /** Target particle count for sparkle overlay (much lower than before) */
  particleCount: number;
  
  /** Base color for dust/gas (hex string, e.g. warm dusty colors) */
  baseColor: string;
  
  /** Highlight color for hotter/denser regions (hex string) */
  highlightColor: string;
  
  /** Overall opacity (0-1) */
  opacity: number;
  
  /** Brightness/emissive intensity scalar */
  brightness: number;
  
  /** Clumpiness factor (0-1) controlling density variation/noise */
  clumpiness: number;
  
  /** Rotation speed multiplier (scales visual swirl relative to timeScale) */
  rotationSpeedMultiplier: number;
  
  // PRNG and style
  /** Seed for deterministic particle distribution and shader noise */
  seed: string | number;
  
  /** Visual style preset */
  style: 'thin' | 'moderate' | 'thick' | 'extreme';
  
  /** Optional display name */
  name?: string;
  
  // ============================================================================
  // Shader-Specific Visual Controls (new fields for realistic disk appearance)
  // ============================================================================
  
  /**
   * Band/ring structure strength (0-1).
   * Controls how pronounced the concentric bright/dark rings are.
   * 0 = uniform disk, 1 = very strong ring contrast
   */
  bandStrength?: number;
  
  /**
   * Band frequency - typical number of visible bright/dark bands.
   * Higher values create more fine rings, lower values create broader bands.
   * Range: 2-12 (default: 5)
   */
  bandFrequency?: number;
  
  /**
   * Gap sharpness (0-1).
   * Controls how sharp/crisp the dark gaps between rings appear.
   * 0 = soft, gradient gaps, 1 = sharp, defined gaps
   */
  gapSharpness?: number;
  
  /**
   * Inner glow strength (0-1).
   * Extra brightness/emission boost near the inner edge close to the star.
   * Simulates hotter, denser material at smaller radii.
   */
  innerGlowStrength?: number;
  
  /**
   * Noise scale for radial/azimuthal variation.
   * Controls the spatial frequency of noise patterns that break up perfect circles.
   * Lower = larger scale variations, higher = finer detail (0.5-3.0)
   */
  noiseScale?: number;
  
  /**
   * Noise strength (0-1).
   * How much the noise modulates brightness and color.
   * 0 = perfectly uniform rings, 1 = highly varied/turbulent appearance
   */
  noiseStrength?: number;
  
  /**
   * Spiral arm perturbation strength (0-1), optional.
   * Small non-axisymmetric wave that creates subtle spiral structure.
   * 0 = no spiral, 1 = prominent spiral arms
   */
  spiralStrength?: number;
  
  /**
   * Spiral arm count (1-4), optional.
   * Number of spiral arms when spiralStrength > 0.
   */
  spiralArmCount?: number;
  
  /**
   * Edge softness (0-1).
   * Controls how soft/gradual the outer edge falloff is.
   * 0 = hard edge, 1 = very soft, diffuse edge
   */
  edgeSoftness?: number;
  
  /**
   * Temperature gradient exponent.
   * Controls how quickly color transitions from hot (inner) to cool (outer).
   * Higher = steeper gradient near inner edge (0.5-3.0, default: 1.5)
   */
  temperatureGradient?: number;
}

/**
 * Small Body Field - a GPU particle field for asteroid belts and Kuiper belts.
 * 
 * This replaces the previous system of creating thousands of individual Star entities
 * for asteroids/KBOs with a performant GPU-based particle field approach.
 * 
 * Modeled after ProtoplanetaryDisk but specialized for rocky/icy small body populations.
 * The field is visual-only and uses deterministic PRNG for particle distribution.
 */
export interface SmallBodyField {
  /** Unique identifier for this field */
  id: string;
  
  /** System ID that this field belongs to (for multi-system organization) */
  systemId: string;
  
  /** ID of the host star this field orbits */
  hostStarId: string;
  
  // Geometry (in orbital distance units)
  /** Inner radius of the belt (start of particle distribution) */
  innerRadius: number;
  
  /** Outer radius of the belt (end of particle distribution) */
  outerRadius: number;
  
  /** Vertical thickness / scatter (standard deviation for Y offsets) */
  thickness: number;
  
  // Visual parameters
  /** Approximate particle count (before LOD scaling) */
  particleCount: number;
  
  /** Base color for particles (hex string) */
  baseColor: string;
  
  /** Highlight/accent color for variation (hex string) */
  highlightColor: string;
  
  /** Overall opacity (0-1) */
  opacity: number;
  
  /** Brightness scalar */
  brightness: number;
  
  /** Clumpiness factor (0-1) controlling density variation */
  clumpiness: number;
  
  /** Rotation speed multiplier (scales belt rotation relative to timeScale) */
  rotationSpeedMultiplier: number;
  
  // Belt-specific metadata
  /** Belt type discriminator ('main' = inner rocky, 'kuiper' = outer icy) */
  beltType: 'main' | 'kuiper';
  
  /** Region label for UI display (e.g. "Main Belt", "Kuiper Belt") */
  regionLabel: string;
  
  /** Whether this belt represents icy bodies (affects color palette) */
  isIcy: boolean;
  
  /** Extra inclination scatter for Kuiper-type belts (adds to thickness) */
  inclinationSigma?: number;
  
  // PRNG and style
  /** Seed for deterministic particle distribution */
  seed: string | number;
  
  /** Visual style preset */
  style: 'thin' | 'moderate' | 'thick' | 'scattered';
  
  /** Optional display name */
  name?: string;
  
  /** Optional visibility toggle for UI control */
  visible?: boolean;
}

/**
 * Nebula Region - a large-scale volumetric gas/dust cloud at galactic scale.
 * 
 * These are visual-only regions that exist outside star/group clusters,
 * primarily for dramatic visual effect and scene composition at universe scale.
 * They are NOT physical bodies and do not participate in orbital mechanics.
 * 
 * Rendered as volumetric fog or GPU particle fields with noise-based density.
 */
export interface NebulaRegion {
  /** Unique identifier for this nebula */
  id: string;
  
  /** Display name (e.g. "Orion Nebula", "Eagle Nebula") */
  name: string;
  
  // Position (in the same coordinate space as groups/systems)
  /** 3D position in universe space */
  position: Position;
  
  // Geometry (spherical or ellipsoidal volume)
  /** Primary radius (for spherical) or half-dimensions (for ellipsoid) */
  radius: number;
  
  /** Optional dimensions for ellipsoidal nebulae (x, y, z half-extents) */
  dimensions?: { x: number; y: number; z: number };
  
  // Visual parameters
  /** Density/opacity control (0-1), drives visual thickness */
  density: number;
  
  /** Brightness/emissive intensity (0-1) */
  brightness: number;
  
  /** Base/dominant color (hex string) */
  baseColor: string;
  
  /** Accent/highlight color for gradients and edges (hex string) */
  accentColor: string;
  
  /** 3D noise scale parameter (controls noise frequency) */
  noiseScale: number;
  
  /** Noise detail/octaves parameter (controls noise complexity) */
  noiseDetail: number;
  
  // Optional metadata
  /** Associated group IDs (groups this nebula borders or surrounds) */
  associatedGroupIds?: string[];
  
  /** Per-nebula PRNG seed for deterministic noise/particle distribution */
  seed: string | number;
  
  /** Optional visibility toggle for UI control */
  visible?: boolean;
}
