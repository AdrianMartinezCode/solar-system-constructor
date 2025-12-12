import { v4 as uuidv4 } from 'uuid';
import { Star, Group, GroupChild, Position, AsteroidBelt, PlanetaryRing, CometMeta, LagrangePointMeta, ProtoplanetaryDisk, SmallBodyField, NebulaRegion } from '../types';
import { createPRNG, PRNG } from '../../prng';

/**
 * Procedural Solar System Generator using L-System Grammar
 * 
 * Grammar:
 * A → S P* | S S P* | S S S P*   (1-3 stars per system)
 * P → p M*                        (planet with moons)
 * M → m                           (moon)
 * 
 * Where S/P/M are structural symbols and lowercase are actual bodies
 */

// ============================================================================
// Configuration
// ============================================================================

interface GeneratorConfig {
  // L-System parameters
  starProbabilities: [number, number, number]; // [1-star, 2-star, 3-star] must sum to 1.0
  planetGeometricP: number; // Geometric distribution parameter for planet count
  moonGeometricP: number;   // Geometric distribution parameter for moon count
  maxDepth: number;         // Maximum depth for L-system expansion
  
  // Orbital parameters
  orbitBase: number;        // Base orbital distance
  orbitGrowth: number;      // Exponential growth factor
  orbitJitter: number;      // Jitter range [-jitter, +jitter]
  orbitK: number;           // Kepler constant for speed calculation
  
  // Elliptical orbit parameters
  eccentricityMin?: number;       // Min eccentricity (default 0)
  eccentricityMax?: number;       // Max eccentricity (default 0)
  inclinationMax?: number;        // Max inclination in degrees (default 0)
  orbitOffsetMagnitude?: number;  // Max orbit center offset (default 0)
  
  // Physical parameters
  massMu: number;           // Mean for log-normal mass distribution
  massSigma: number;        // Std dev for log-normal mass distribution
  radiusPower: number;      // Power law exponent for radius = mass^power
  
  // Grouping parameters
  enableGrouping: boolean;
  numGroups: [number, number];      // [min, max] number of groups
  nestingProbability: number;       // Probability a group becomes child of another
  groupPositionSigma: number;       // Standard deviation for 3D Gaussian group positions
  
  // Asteroid Belt parameters
  enableAsteroidBelts: boolean;               // Master switch for asteroid belt generation
  maxBeltsPerSystem: number;                  // Maximum number of belts per system (0-5+)
  beltPlacementMode: 'none' | 'betweenPlanets' | 'outerBelt' | 'both';
  beltAsteroidGeometricP: number;             // Controls asteroid count per belt (like planetGeometricP)
  beltMinCount: number;                       // Minimum asteroids per belt
  beltMaxCount: number;                       // Maximum asteroids per belt (for stability)
  beltThickness: number;                      // Vertical spread (standard deviation)
  beltColorVariation: number;                 // 0-1, color variation within belt
  beltInnerGapScale: number;                  // Fraction of gap for inner radius (0-1)
  beltOuterGapScale: number;                  // Fraction of gap for outer radius (0-1)
  beltOuterMultiplier: number;                // For outer belts: factor × outermost planet orbit
  beltEccentricityRange: [number, number];    // [min, max] eccentricity for belts

  // Kuiper Belt parameters (trans-Neptunian region)
  enableKuiperBelt: boolean;                  // Master switch for Kuiper belt generation
  kuiperBeltDensity: number;                  // 0-1 density slider mapped to KBO count
  kuiperBeltRadialRange: [number, number];    // Radial multipliers relative to outermost planet
  kuiperBeltInclinationSigma: number;         // Vertical scatter / inclination noise (higher than main belt)
  kuiperBeltEccentricityRange: [number, number]; // Slightly larger eccentricity for scattered feel
  kuiperBeltAsteroidGeometricP: number;       // Separate geometric parameter for KBO counts
  kuiperBeltMinCount: number;                 // Minimum KBOs per belt
  kuiperBeltMaxCount: number;                 // Maximum KBOs per belt

  // Planetary ring parameters (per-planet rings)
  enablePlanetaryRings: boolean;              // Master switch for ring generation
  ringedPlanetProbability: number;            // Base probability that a given planet gets rings
  ringMassBiasThreshold: number;              // Planets above this mass are more likely to be ringed
  ringOuterOrbitBias: number;                 // Bias rings toward outer planets (0-1)
  ringInnerRadiusRange: [number, number];     // Inner radius multipliers relative to planet radius
  ringOuterRadiusRange: [number, number];     // Outer radius multipliers relative to planet radius
  ringThicknessRange: [number, number];       // Thickness range in multiples of planet radius
  ringOpacityRange: [number, number];         // Opacity range 0-1
  ringAlbedoRange: [number, number];          // Albedo (brightness) range
  ringColorVariation: number;                 // 0-1 color variation strength
  ringDensityRange: [number, number];         // 0-1 density range

  // Comet parameters
  enableComets: boolean;                       // Master switch for comet generation
  cometCountRange: [number, number];           // Per-system [min, max] comets
  cometEccentricityRange: [number, number];    // Typical [0.6, 0.99]
  cometInclinationMax: number;                 // Max inclination (degrees)
  cometSemiMajorAxisRange: [number, number];   // Range relative to outermost planet distance
  shortPeriodCometFraction: number;            // 0–1, fraction that have smaller semi-major axis
  cometActivityDistanceRange: [number, number]; // Distances controlling tail strength
  cometTailLengthRange: [number, number];      // Base tail length
  cometTailOpacityRange: [number, number];     // Base opacity

  // Lagrange points / Trojans parameters
  enableLagrangePoints: boolean;               // Master switch for Lagrange point generation
  lagrangePairTypes: 'starPlanet' | 'planetMoon' | 'both'; // Which two-body pairs to consider
  generateL1L2L3Markers: boolean;              // Whether to generate unstable L1-L3 markers
  generateL4L5Markers: boolean;                // Whether to generate stable L4-L5 markers
  enableTrojans: boolean;                      // Whether to generate Trojan bodies at L4/L5
  trojanBodyType: 'asteroid' | 'moon';         // Body type for Trojan objects
  trojanCountRange: [number, number];          // [min, max] Trojans per L4/L5 point
  trojanMassScale: number;                     // Relative mass scale vs normal asteroids/moons
  trojanColorVariation: number;                // 0-1 color variation for Trojans

  // Protoplanetary Disk parameters (visual-only particle fields)
  enableProtoplanetaryDisks: boolean;                    // Master switch for disk generation
  protoplanetaryDiskProbability: number;                 // Base probability (0-1) that a system gets a disk
  protoplanetaryDiskInnerRadiusRange: [number, number];  // Inner radius range (absolute units)
  protoplanetaryDiskOuterRadiusRange: [number, number];  // Outer radius multiplier range (× first planet orbit)
  protoplanetaryDiskThicknessRange: [number, number];    // Half-height thickness range (absolute units)
  protoplanetaryDiskParticleCountRange: [number, number]; // Particle count range before LOD/smallBodyDetail scaling
  protoplanetaryDiskOpacityRange: [number, number];      // Opacity range (0-1)
  protoplanetaryDiskBrightnessRange: [number, number];   // Brightness/emissive intensity range
  protoplanetaryDiskClumpinessRange: [number, number];   // Clumpiness factor range (0-1)
  protoplanetaryDiskRotationSpeedMultiplierRange: [number, number]; // Rotation speed multiplier range

  // Nebula Region parameters (galaxy-scale visual-only volumetric clouds)
  enableNebulae: boolean;                                 // Master switch for nebula generation
  nebulaDensity: number;                                  // 0-1 slider controlling nebula count/frequency
  nebulaCountRange: [number, number];                     // [min, max] total nebula regions for universe
  nebulaSizeRange: [number, number];                      // Approximate radius range (in group distance units)
  nebulaThicknessRange: [number, number];                 // Controls elongation for ellipsoids (1 = sphere, <1 = disk, >1 = cigar)
  nebulaDistanceFromGroups: [number, number];             // [min, max] distance from group centers where nebulae spawn
  nebulaColorPalettes: Array<{ base: string; accent: string }>; // Curated color palettes (HII, reflection, dark)
  nebulaBrightnessRange: [number, number];                // Emissive brightness range (0-1)
  nebulaDensityRange: [number, number];                   // Visual density/opacity range (0-1)
  nebulaNoiseScaleRange: [number, number];                // 3D noise scale range (controls frequency)
  nebulaNoiseDetailRange: [number, number];               // 3D noise detail/octaves range
  nebulaDetail?: 'low' | 'medium' | 'high' | 'ultra';     // Optional LOD control (mirrors smallBodyDetail)

  // Rogue Planets (galaxy-scale wandering planets not bound to any star)
  enableRoguePlanets: boolean;                            // Master switch for rogue planet generation
  roguePlanetCountRange: [number, number];                // [min, max] total rogues in universe
  roguePlanetDistanceRange: [number, number];             // Radial distance from origin / group centers
  roguePlanetSpeedRange: [number, number];                // Drift speed magnitude range
  roguePlanetInclinationMax: number;                      // Max tilt from galactic plane (degrees)
  roguePlanetColorVariation: number;                      // 0-1 variance around typical planet colors
  
  // Curved / Elliptical trajectory parameters for rogue planets
  roguePlanetCurvatureRange: [number, number];            // [min, max] path curvature (0=linear, 1=strongly curved)
  roguePlanetTrajectoryMode: 'linearOnly' | 'mixed' | 'mostlyCurved'; // Distribution of trajectory types
  roguePlanetPathPeriodRange: [number, number];           // [min, max] time to complete one loop (seconds)
  roguePlanetEccentricityRange: [number, number];         // [min, max] eccentricity for curved paths
  roguePlanetSemiMajorAxisRange: [number, number];        // [min, max] semi-major axis for curved paths
  
  // Trajectory visualization settings
  roguePlanetShowTrajectories: boolean;                   // Whether to show trajectory visualization
  roguePlanetTrajectoryPastWindow: number;                // Past trajectory window (seconds or fraction of period)
  roguePlanetTrajectoryFutureWindow: number;              // Future trajectory window (seconds or fraction of period)
  
  // Black Holes (extremely dense central objects with accretion disks and jets)
  enableBlackHoles: boolean;                              // Master switch for black hole generation
  blackHoleSystemProbability: number;                     // Chance that a root system is centered on a black hole
  blackHoleAsCompanionProbability: number;                // Chance to include a black hole in multi-star systems
  blackHoleMassRange: [number, number];                   // Mass range (in solar masses, typically large)
  blackHoleAccretionDiskProbability: number;              // Chance a black hole has an accretion disk
  blackHoleJetProbability: number;                        // Chance a black hole with a disk has jets
  blackHolePhotonRingEnabled: boolean;                    // Whether to render photon rings
  blackHoleDopplerBeamingStrengthRange: [number, number]; // [min, max] Doppler beaming strength
  blackHoleLensingStrengthRange: [number, number];        // [min, max] gravitational lensing strength
  blackHoleShadowRadiusRange: [number, number];           // [min, max] event horizon shadow radius
  blackHoleAccretionInnerRadiusMultiplier: [number, number]; // Inner radius as multiple of shadow radius
  blackHoleAccretionOuterRadiusMultiplier: [number, number]; // Outer radius as multiple of shadow radius
  blackHoleDiskThicknessRange: [number, number];          // Disk half-height thickness range
  blackHoleJetLengthRange: [number, number];              // Jet length range
  blackHoleJetOpeningAngleRange: [number, number];        // Jet opening angle range (degrees)
  blackHoleSpinRange: [number, number];                   // Black hole spin parameter range (0-1)
  
  // Advanced Black Hole Diversity Parameters
  blackHoleMassClassWeights?: { stellar: number; intermediate: number; supermassive: number }; // Mass class distribution weights
  blackHoleMultiplePerSystemProbability?: number;         // Chance of multiple black holes in a system (binary BHs, etc.)
  blackHoleCenterBias?: number;                           // 0-1 bias toward making the central object a black hole
  blackHoleSpinDistribution?: 'uniform' | 'highSpinBiased' | 'lowSpinBiased'; // Spin distribution style
  blackHoleTiltRange?: [number, number];                  // Disk/jet tilt angle range (degrees)
  blackHoleShadowRadiusScaleMode?: 'physicalish' | 'cinematic'; // Shadow radius scaling mode
  blackHoleAccretionStyle?: 'subtle' | 'normal' | 'quasar'; // Accretion disk brightness/style preset
  blackHoleDiskBrightnessRange?: [number, number];        // Disk brightness range
  blackHoleDiskOpacityRange?: [number, number];           // Disk opacity range
  blackHoleDiskTemperatureRange?: [number, number];       // Disk temperature range (Kelvin)
  blackHoleDiskClumpinessRange?: [number, number];        // Disk clumpiness/density variation range
  blackHoleJetBrightnessRange?: [number, number];         // Jet brightness range
  blackHoleSecondaryRingProbability?: number;             // Probability of showing secondary lensing ring
  blackHoleRotationSpeedMultiplierRange?: [number, number]; // Animation speed multiplier range
}

const DEFAULT_CONFIG: GeneratorConfig = {
  starProbabilities: [0.65, 0.25, 0.10],
  planetGeometricP: 0.4,
  moonGeometricP: 0.3,
  maxDepth: 3,
  
  orbitBase: 1.0,
  orbitGrowth: 1.8,
  orbitJitter: 0.1,
  orbitK: 20.0,
  
  eccentricityMin: 0,
  eccentricityMax: 0,
  inclinationMax: 0,
  orbitOffsetMagnitude: 0,
  
  massMu: 1.5,
  massSigma: 0.8,
  radiusPower: 0.4,
  
  enableGrouping: false,
  numGroups: [3, 7],
  nestingProbability: 0.2,
  groupPositionSigma: 50.0,
  
  // Asteroid belt defaults (disabled by default)
  enableAsteroidBelts: false,
  maxBeltsPerSystem: 2,
  beltPlacementMode: 'betweenPlanets',
  beltAsteroidGeometricP: 0.3,  // Similar density to moons
  beltMinCount: 50,
  beltMaxCount: 1000,
  beltThickness: 0.5,
  beltColorVariation: 0.2,
  beltInnerGapScale: 0.4,
  beltOuterGapScale: 0.6,
  beltOuterMultiplier: 1.5,
  beltEccentricityRange: [0, 0.1],

  // Kuiper belt defaults (disabled by default)
  enableKuiperBelt: false,
  kuiperBeltDensity: 0.5,
  kuiperBeltRadialRange: [2.0, 3.5],          // 2-3.5× outermost planet distance
  kuiperBeltInclinationSigma: 1.5,            // Higher scatter than main belt
  kuiperBeltEccentricityRange: [0.0, 0.15],   // Slightly more eccentric
  kuiperBeltAsteroidGeometricP: 0.25,         // Lower p = more objects
  kuiperBeltMinCount: 100,
  kuiperBeltMaxCount: 1500,

  // Planetary rings (disabled by default)
  enablePlanetaryRings: false,
  ringedPlanetProbability: 0.1,
  ringMassBiasThreshold: 20,          // Planets roughly "giant" scale become more likely
  ringOuterOrbitBias: 0.5,            // Prefer outer planets somewhat
  ringInnerRadiusRange: [1.3, 1.8],
  ringOuterRadiusRange: [2.3, 3.8],
  ringThicknessRange: [0.05, 0.15],   // Multiples of planet radius
  ringOpacityRange: [0.3, 0.8],
  ringAlbedoRange: [0.4, 1.0],
  ringColorVariation: 0.25,
  ringDensityRange: [0.2, 0.9],

  // Comet defaults (disabled by default)
  enableComets: false,
  cometCountRange: [1, 3],            // Few comets per system by default
  cometEccentricityRange: [0.6, 0.99], // Highly eccentric orbits
  cometInclinationMax: 45,             // Can have wild inclinations
  cometSemiMajorAxisRange: [1.5, 3.0], // Relative to outermost planet distance
  shortPeriodCometFraction: 0.3,       // 30% are short-period comets
  cometActivityDistanceRange: [5, 20], // Tail active within this range
  cometTailLengthRange: [2, 8],        // Base tail length range
  cometTailOpacityRange: [0.3, 0.7],   // Base tail opacity range

  // Lagrange points / Trojans (disabled by default)
  enableLagrangePoints: false,
  lagrangePairTypes: 'starPlanet',
  generateL1L2L3Markers: true,
  generateL4L5Markers: true,
  enableTrojans: false,
  trojanBodyType: 'asteroid',
  trojanCountRange: [0, 4],
  trojanMassScale: 0.5,
  trojanColorVariation: 0.3,

  // Protoplanetary disks (disabled by default)
  enableProtoplanetaryDisks: false,
  protoplanetaryDiskProbability: 0.0,
  protoplanetaryDiskInnerRadiusRange: [0.5, 1.5],       // Just outside star
  protoplanetaryDiskOuterRadiusRange: [3.0, 8.0],      // Up to outer planets
  protoplanetaryDiskThicknessRange: [0.2, 0.8],        // Modest vertical spread
  protoplanetaryDiskParticleCountRange: [5000, 20000], // Base particle count
  protoplanetaryDiskOpacityRange: [0.3, 0.7],
  protoplanetaryDiskBrightnessRange: [0.3, 0.8],
  protoplanetaryDiskClumpinessRange: [0.2, 0.6],
  protoplanetaryDiskRotationSpeedMultiplierRange: [0.1, 0.5],

  // Nebula regions (disabled by default, galaxy-scale visual fields)
  enableNebulae: false,
  nebulaDensity: 0.5,                                   // Moderate density
  nebulaCountRange: [2, 8],                             // Few large nebulae per universe
  nebulaSizeRange: [80, 200],                           // Large radii (in group distance scale)
  nebulaThicknessRange: [0.6, 1.4],                     // Slightly elongated (1 = sphere)
  nebulaDistanceFromGroups: [800, 2000],                // VERY far from clusters - pure background elements
  nebulaColorPalettes: [
    // HII regions (emission nebulae, pinkish-red)
    { base: '#FF6B9D', accent: '#FFB3D9' },
    { base: '#FF4D88', accent: '#FF99CC' },
    // Blue reflection nebulae
    { base: '#4DA6FF', accent: '#99CCFF' },
    { base: '#3399FF', accent: '#66B2FF' },
    // Dark / mixed nebulae (dust + emission)
    { base: '#9966CC', accent: '#CC99FF' },
    { base: '#FF8C42', accent: '#FFB380' },
    // Greenish (rare, oxygen lines)
    { base: '#5BC95B', accent: '#99E699' },
  ],
  nebulaBrightnessRange: [0.8, 1.0],                    // Very high brightness (maximum visibility at distance)
  nebulaDensityRange: [0.7, 0.95],                      // High opacity to stay visible far away
  nebulaNoiseScaleRange: [0.8, 2.5],                    // Medium frequency noise
  nebulaNoiseDetailRange: [3, 6],                       // Moderate detail/octaves
  nebulaDetail: 'medium',                               // Default quality level

  // Rogue planets (disabled by default, galaxy-scale wandering planets)
  enableRoguePlanets: false,
  roguePlanetCountRange: [0, 0],                        // No rogues by default
  roguePlanetDistanceRange: [100, 300],                 // Moderate distance from origin
  roguePlanetSpeedRange: [0.01, 0.05],                  // Slow drift speed
  roguePlanetInclinationMax: 15,                        // Moderate inclination
  roguePlanetColorVariation: 0.3,                       // Some color variation
  
  // Curved trajectory defaults (backwards compatible - linear only by default)
  roguePlanetCurvatureRange: [0, 0],                    // Linear only by default
  roguePlanetTrajectoryMode: 'linearOnly',              // Linear trajectories only
  roguePlanetPathPeriodRange: [300, 800],               // 5-13 minutes for a full loop
  roguePlanetEccentricityRange: [0.1, 0.6],             // Moderate eccentricity for curved paths
  roguePlanetSemiMajorAxisRange: [80, 200],             // Moderate-sized curved paths
  
  // Trajectory visualization defaults
  roguePlanetShowTrajectories: true,                    // Show trajectories by default
  roguePlanetTrajectoryPastWindow: 100,                 // 100 seconds of history
  roguePlanetTrajectoryFutureWindow: 100,               // 100 seconds of prediction
  
  // Black Holes (disabled by default - exotic feature)
  enableBlackHoles: false,                              // Off by default
  blackHoleSystemProbability: 0.05,                     // 5% chance a system has a black hole center
  blackHoleAsCompanionProbability: 0.02,                // 2% chance in multi-star systems
  blackHoleMassRange: [5, 50],                          // 5-50 solar masses (stellar-mass black holes)
  blackHoleAccretionDiskProbability: 0.7,               // 70% have accretion disks
  blackHoleJetProbability: 0.5,                         // 50% of disks have jets
  blackHolePhotonRingEnabled: true,                     // Show photon rings by default
  blackHoleDopplerBeamingStrengthRange: [0.3, 0.8],     // Moderate to strong Doppler effect
  blackHoleLensingStrengthRange: [0.4, 0.9],            // Moderate to strong lensing
  blackHoleShadowRadiusRange: [0.3, 0.8],               // Visual shadow radius (smaller than typical planets)
  blackHoleAccretionInnerRadiusMultiplier: [3, 4],      // Inner disk edge at 3-4× shadow radius
  blackHoleAccretionOuterRadiusMultiplier: [10, 20],    // Outer disk edge at 10-20× shadow radius
  blackHoleDiskThicknessRange: [0.2, 0.5],              // Thin disk (0.2-0.5 units)
  blackHoleJetLengthRange: [20, 50],                    // Jet length (world units)
  blackHoleJetOpeningAngleRange: [3, 8],                // Narrow jets (3-8 degrees)
  blackHoleSpinRange: [0.3, 0.95],                      // Moderate to high spin
  
  // Advanced Black Hole Diversity (optional, undefined = use built-in defaults)
  // blackHoleMassClassWeights: undefined,              // Undefined → all stellar-mass (5-50 M☉)
  // blackHoleMultiplePerSystemProbability: undefined,  // Undefined → no multiple black holes
  // blackHoleCenterBias: undefined,                    // Undefined → use blackHoleSystemProbability as-is
  // blackHoleSpinDistribution: undefined,              // Undefined → uniform distribution
  // blackHoleTiltRange: undefined,                     // Undefined → aligned with system plane
  // blackHoleShadowRadiusScaleMode: undefined,         // Undefined → 'cinematic' (current behavior)
  // blackHoleAccretionStyle: undefined,                // Undefined → 'normal'
  // blackHoleDiskBrightnessRange: undefined,           // Undefined → [0.7, 1.0]
  // blackHoleDiskOpacityRange: undefined,              // Undefined → [0.6, 0.9]
  // blackHoleDiskTemperatureRange: undefined,          // Undefined → [5000, 20000] K
  // blackHoleDiskClumpinessRange: undefined,           // Undefined → [0.3, 0.7]
  // blackHoleJetBrightnessRange: undefined,            // Undefined → [0.8, 1.0]
  // blackHoleSecondaryRingProbability: undefined,      // Undefined → 0.5 (50% if lensing > 0.5)
  // blackHoleRotationSpeedMultiplierRange: undefined,  // Undefined → [0.5, 1.5]
};

// ============================================================================
// L-System Node Types
// ============================================================================

type NodeType = 'system' | 'star' | 'planet' | 'moon';

interface LSystemNode {
  type: NodeType;
  id: string;
  parent: LSystemNode | null;
  children: LSystemNode[];
  depth: number;
}

// ============================================================================
// Random Utilities (PRNG-based)
// ============================================================================

class RandomGenerator {
  private rng: PRNG;
  
  constructor(rng: PRNG) {
    this.rng = rng;
  }
  
  /**
   * Fork the RNG to create a new independent generator
   */
  fork(label: string): RandomGenerator {
    return new RandomGenerator(this.rng.fork(label));
  }
  
  /**
   * Box-Muller transform for normal distribution
   */
  normal(mu: number = 0, sigma: number = 1): number {
    const u1 = this.rng.float();
    const u2 = this.rng.float();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return z0 * sigma + mu;
  }
  
  /**
   * Log-normal distribution
   */
  logNormal(mu: number, sigma: number): number {
    return Math.exp(this.normal(mu, sigma));
  }
  
  /**
   * Geometric distribution (number of successes before first failure)
   */
  geometric(p: number): number {
    if (p <= 0 || p >= 1) return 0;
    return Math.floor(Math.log(this.rng.float()) / Math.log(1 - p));
  }
  
  /**
   * Uniform random in range [min, max]
   */
  uniform(min: number, max: number): number {
    return min + this.rng.float() * (max - min);
  }
  
  /**
   * Random integer in range [min, max] inclusive
   */
  randInt(min: number, max: number): number {
    return this.rng.int(min, max);
  }
  
  /**
   * Sample from weighted array
   */
  weighted<T>(items: T[], weights: number[]): T {
    const total = weights.reduce((sum, w) => sum + w, 0);
    let rand = this.rng.float() * total;
    
    for (let i = 0; i < items.length; i++) {
      rand -= weights[i];
      if (rand <= 0) return items[i];
    }
    
    return items[items.length - 1];
  }
  
  /**
   * Pick a random element from an array
   */
  choice<T>(arr: readonly T[]): T {
    return this.rng.choice(arr);
  }
  
  /**
   * Return true with given probability
   */
  bool(p: number = 0.5): boolean {
    return this.rng.bool(p);
  }
}

// ============================================================================
// L-System Generator
// ============================================================================

class LSystemGenerator {
  private config: GeneratorConfig;
  private rng: RandomGenerator;
  
  constructor(config: GeneratorConfig, rng: RandomGenerator) {
    this.config = config;
    this.rng = rng;
  }
  
  /**
   * Generate the root L-System node (A → system with stars and planets)
   */
  generate(): LSystemNode {
    const root: LSystemNode = {
      type: 'system',
      id: uuidv4(),
      parent: null,
      children: [],
      depth: 0,
    };
    
    this.expandSystem(root);
    return root;
  }
  
  /**
   * Expand A → S P* | S S P* | S S S P*
   */
  private expandSystem(node: LSystemNode): void {
    const numStars = this.rng.weighted(
      [1, 2, 3],
      this.config.starProbabilities
    );
    
    // Add stars
    for (let i = 0; i < numStars; i++) {
      const star: LSystemNode = {
        type: 'star',
        id: uuidv4(),
        parent: node,
        children: [],
        depth: node.depth + 1,
      };
      node.children.push(star);
    }
    
    // Add planets to the first (or heaviest, but we determine that later) star
    // For now, attach planets to the first star
    const primaryStar = node.children[0];
    if (primaryStar) {
      const numPlanets = this.rng.geometric(this.config.planetGeometricP);
      for (let i = 0; i < numPlanets; i++) {
        this.expandPlanet(primaryStar);
      }
    }
  }
  
  /**
   * Expand P → p M*
   */
  private expandPlanet(parent: LSystemNode): void {
    const planet: LSystemNode = {
      type: 'planet',
      id: uuidv4(),
      parent,
      children: [],
      depth: parent.depth + 1,
    };
    parent.children.push(planet);
    
    // Add moons
    const numMoons = this.rng.geometric(this.config.moonGeometricP);
    for (let i = 0; i < numMoons; i++) {
      this.expandMoon(planet);
    }
  }
  
  /**
   * Expand M → m
   */
  private expandMoon(parent: LSystemNode): void {
    const moon: LSystemNode = {
      type: 'moon',
      id: uuidv4(),
      parent,
      children: [],
      depth: parent.depth + 1,
    };
    parent.children.push(moon);
  }
}

// ============================================================================
// Physical Property Generator
// ============================================================================

class PhysicsGenerator {
  private config: GeneratorConfig;
  private rng: RandomGenerator;
  
  constructor(config: GeneratorConfig, rng: RandomGenerator) {
    this.config = config;
    this.rng = rng;
  }
  
  /**
   * Generate mass using log-normal distribution
   */
  generateMass(type: NodeType | 'asteroid' | 'comet'): number {
    const baseMass = this.rng.logNormal(
      this.config.massMu,
      this.config.massSigma
    );
    
    // Scale by type
    switch (type) {
      case 'star':
        return baseMass * 100; // Stars are much more massive
      case 'planet':
        return baseMass * 10;
      case 'moon':
        return baseMass;
      case 'asteroid':
        return baseMass * 0.01; // Asteroids are tiny
      case 'comet':
        return baseMass * 0.005; // Comets are even smaller
      default:
        return baseMass;
    }
  }
  
  /**
   * Generate radius from mass using power law
   * Scaled to be visually appropriate relative to orbital distances
   */
  generateRadius(mass: number): number {
    // Use power law but with much smaller scale
    // For stars (mass ~100-500): radius ~0.5-1.5
    // For planets (mass ~5-50): radius ~0.3-0.7
    // For moons (mass ~0.5-5): radius ~0.15-0.4
    const baseRadius = Math.pow(mass, this.config.radiusPower);
    
    // Scale down dramatically for visual clarity
    return baseRadius * 0.15;
  }
  
  /**
   * Generate color based on mass (spectral classification)
   * For asteroids, can distinguish between main belt (rocky) and Kuiper belt (icy) via optional hint
   */
  generateColor(mass: number, type: NodeType | 'asteroid' | 'comet', isIcy?: boolean): string {
    if (type === 'star') {
      if (mass > 600) return '#9BB0FF';      // Blue-white (O, B)
      if (mass > 200) return '#CAD7FF';      // White (A)
      if (mass > 100) return '#F8F7FF';      // Yellow-white (F)
      if (mass > 50) return '#FFF4EA';       // Orange (G, K)
      return '#FFD2A1';                       // Deep red (M)
    } else if (type === 'planet') {
      // Varied planet colors
      const colors = ['#4A90E2', '#E25822', '#8B7355', '#C0A080', '#A0C0E0'];
      return this.rng.choice(colors);
    } else if (type === 'asteroid') {
      if (isIcy) {
        // Kuiper Belt Objects - icy/bluish colors
        const colors = ['#B0C4DE', '#D3D3D3', '#E0F3FF', '#A8C5DD', '#E0E8F0', '#C9D9E8'];
        return this.rng.choice(colors);
      } else {
        // Main belt asteroids - rocky grays and browns
        const colors = ['#8B7355', '#A0826D', '#6B5D52', '#998877', '#7A6A5C'];
        return this.rng.choice(colors);
      }
    } else if (type === 'comet') {
      // Comets are icy/rocky - bluish-gray, white-gray tones
      const colors = ['#B0C4DE', '#D3D3D3', '#C0D6E4', '#A8C5DD', '#E0E8F0'];
      return this.rng.choice(colors);
    } else {
      // Moons are typically gray
      return '#CCCCCC';
    }
  }
  
  /**
   * Calculate orbital distance for nth child
   */
  calculateOrbitalDistance(index: number): number {
    const base = this.config.orbitBase;
    const growth = this.config.orbitGrowth;
    const jitter = this.rng.uniform(
      -this.config.orbitJitter,
      this.config.orbitJitter
    );
    
    return base * Math.pow(growth, index) + jitter;
  }
  
  /**
   * Calculate orbital speed using Kepler-like formula
   */
  calculateOrbitalSpeed(distance: number): number {
    if (distance === 0) return 0;
    return this.config.orbitK / Math.sqrt(distance);
  }
  
  /**
   * Calculate orbital phase
   */
  calculateOrbitalPhase(index: number, totalSiblings: number, isMultiStar: boolean): number {
    if (isMultiStar) {
      // Evenly spaced phases for multi-star systems
      return (360 * index) / totalSiblings;
    } else {
      // Uniform random phase
      return this.rng.uniform(0, 360);
    }
  }
  
  /**
   * Generate eccentricity for an orbit
   */
  generateEccentricity(): number {
    const min = this.config.eccentricityMin ?? 0;
    const max = this.config.eccentricityMax ?? 0;
    if (min === 0 && max === 0) return 0;
    return this.rng.uniform(min, max);
  }
  
  /**
   * Generate orbit inclination (rotation around X axis)
   */
  generateInclination(): number {
    const maxIncl = this.config.inclinationMax ?? 0;
    if (maxIncl === 0) return 0;
    // Generate inclination in range [-maxIncl, +maxIncl]
    return this.rng.uniform(-maxIncl, maxIncl);
  }
  
  /**
   * Generate orbit orientation (rotations around Y and Z)
   */
  generateOrbitRotations(): { rotY: number; rotZ: number } {
    const maxIncl = this.config.inclinationMax ?? 0;
    if (maxIncl === 0) return { rotY: 0, rotZ: 0 };
    
    // Random orientation angles
    return {
      rotY: this.rng.uniform(-maxIncl * 0.5, maxIncl * 0.5),
      rotZ: this.rng.uniform(0, 360), // Full range for ascending node
    };
  }
  
  /**
   * Generate orbit center offset
   */
  generateOrbitOffset(): { offsetX: number; offsetY: number; offsetZ: number } {
    const mag = this.config.orbitOffsetMagnitude ?? 0;
    if (mag === 0) return { offsetX: 0, offsetY: 0, offsetZ: 0 };
    
    // Generate random offset within sphere of radius mag
    const theta = this.rng.uniform(0, Math.PI * 2);
    const phi = Math.acos(this.rng.uniform(-1, 1));
    const r = this.rng.uniform(0, mag);
    
    return {
      offsetX: r * Math.sin(phi) * Math.cos(theta),
      offsetY: r * Math.sin(phi) * Math.sin(theta),
      offsetZ: r * Math.cos(phi),
    };
  }
}

// ============================================================================
// Star Data Generator
// ============================================================================

interface SystemData {
  stars: Star[];
  rootIds: string[];
  groups: Group[];
  belts: AsteroidBelt[];
}

class StarDataGenerator {
  private config: GeneratorConfig;
  private physics: PhysicsGenerator;
  private nameCounter: Map<string, number>;
  
  constructor(config: GeneratorConfig, rng: RandomGenerator) {
    this.config = config;
    this.physics = new PhysicsGenerator(config, rng);
    this.nameCounter = new Map();
  }
  
  /**
   * Convert L-System tree to Star array
   */
  convertToStars(root: LSystemNode): SystemData {
    const stars: Star[] = [];
    const rootIds: string[] = [];
    
    // Process each system
    if (root.type === 'system') {
      const systemStars = this.processSystem(root);
      stars.push(...systemStars);
      
      // Find root stars (stars with parentId === null)
      systemStars.forEach(star => {
        if (star.parentId === null) {
          rootIds.push(star.id);
        }
      });
    }
    
    return {
      stars,
      rootIds,
      groups: [],
      belts: [],
    };
  }
  
  /**
   * Process a single system node
   */
  private processSystem(system: LSystemNode): Star[] {
    const stars: Star[] = [];
    const starNodes = system.children.filter(n => n.type === 'star');
    
    // Check if this system should have a black hole center
    const shouldHaveBlackHoleCenter = 
      this.config.enableBlackHoles && 
      this.physics.rng.bool(this.config.blackHoleSystemProbability);
    
    console.log('[processSystem] Black hole check:', {
      enableBlackHoles: this.config.enableBlackHoles,
      blackHoleSystemProbability: this.config.blackHoleSystemProbability,
      shouldHaveBlackHoleCenter,
      starNodesCount: starNodes.length,
    });
    
    let centerStar: Star;
    let centerNode: LSystemNode;
    
    if (shouldHaveBlackHoleCenter && starNodes.length > 0) {
      // Create a black hole as the system center
      centerNode = starNodes[0];
      centerStar = this.createBlackHole(centerNode, null, 0, 0, 0);
      stars.push(centerStar);
      
      // Process remaining stars as companions
      const companionNodes = starNodes.slice(1);
      const companionStars = companionNodes.map(node => ({
        node,
        mass: this.physics.generateMass('star'),
      }));
      
      companionStars.forEach((companionData, index) => {
        const distance = this.physics.calculateOrbitalDistance(0);
        const speed = this.physics.calculateOrbitalSpeed(distance);
        const phase = this.physics.calculateOrbitalPhase(
          index,
          companionStars.length,
          true
        );
        
        const companion = this.createStar(
          companionData.node,
          centerStar.id,
          distance,
          speed,
          phase,
          companionData.mass
        );
        stars.push(companion);
      });
    } else {
      // Normal star-centered system
      // Generate masses for all stars first
      const starData = starNodes.map(node => ({
        node,
        mass: this.physics.generateMass('star'),
      }));
      
      // Sort by mass descending - heaviest becomes center
      starData.sort((a, b) => b.mass - a.mass);
      
      // Process center star (heaviest)
      const centerData = starData[0];
      centerNode = centerData.node;
      centerStar = this.createStar(
        centerData.node,
        null,
        0,
        0,
        0,
        centerData.mass
      );
      stars.push(centerStar);
      
      // Check if we should add a black hole as a companion (rare)
      const shouldHaveBlackHoleCompanion = 
        this.config.enableBlackHoles &&
        starData.length > 1 &&
        this.physics.rng.bool(this.config.blackHoleAsCompanionProbability);
      
      if (shouldHaveBlackHoleCompanion) {
        // Replace one companion star with a black hole
        const companionStars = starData.slice(1);
        const distance = this.physics.calculateOrbitalDistance(0);
        const speed = this.physics.calculateOrbitalSpeed(distance);
        const phase = this.physics.calculateOrbitalPhase(0, companionStars.length + 1, true);
        
        const blackHoleCompanion = this.createBlackHole(
          companionStars[0].node,
          centerStar.id,
          distance,
          speed,
          phase
        );
        stars.push(blackHoleCompanion);
        
        // Process remaining companion stars
        companionStars.slice(1).forEach((companionData, index) => {
          const dist = this.physics.calculateOrbitalDistance(0);
          const spd = this.physics.calculateOrbitalSpeed(dist);
          const phs = this.physics.calculateOrbitalPhase(
            index + 1,
            companionStars.length + 1,
            true
          );
          
          const companion = this.createStar(
            companionData.node,
            centerStar.id,
            dist,
            spd,
            phs,
            companionData.mass
          );
          stars.push(companion);
        });
      } else {
        // Process companion stars normally
        const companionStars = starData.slice(1);
        
        companionStars.forEach((companionData, index) => {
          const distance = this.physics.calculateOrbitalDistance(0);
          const speed = this.physics.calculateOrbitalSpeed(distance);
          const phase = this.physics.calculateOrbitalPhase(
            index,
            companionStars.length,
            true
          );
          
          const companion = this.createStar(
            companionData.node,
            centerStar.id,
            distance,
            speed,
            phase,
            companionData.mass
          );
          stars.push(companion);
        });
      }
    }
    
    // Process planets (attached to center body, whether star or black hole)
    const planetNodes = centerNode.children.filter(n => n.type === 'planet');
    planetNodes.forEach((planetNode, index) => {
      // Calculate companion star count for orbit index offset
      const companionCount = stars.filter(s => s.parentId === centerStar.id && s.bodyType === 'star').length;
      const planetStars = this.processPlanet(
        planetNode,
        centerStar.id,
        index + companionCount
      );
      stars.push(...planetStars);
    });
    
    return stars;
  }
  
  /**
   * Process a planet node
   */
  private processPlanet(planet: LSystemNode, parentId: string, orbitIndex: number): Star[] {
    const stars: Star[] = [];
    
    const mass = this.physics.generateMass('planet');
    const distance = this.physics.calculateOrbitalDistance(orbitIndex);
    const speed = this.physics.calculateOrbitalSpeed(distance);
    const phase = this.physics.calculateOrbitalPhase(orbitIndex, 1, false);
    
    const planetStar = this.createStar(
      planet,
      parentId,
      distance,
      speed,
      phase,
      mass
    );
    stars.push(planetStar);
    
    // Process moons
    const moonNodes = planet.children.filter(n => n.type === 'moon');
    moonNodes.forEach((moonNode, index) => {
      const moonStars = this.processMoon(moonNode, planetStar.id, index);
      stars.push(...moonStars);
    });
    
    return stars;
  }
  
  /**
   * Process a moon node
   */
  private processMoon(moon: LSystemNode, parentId: string, orbitIndex: number): Star[] {
    const mass = this.physics.generateMass('moon');
    const distance = this.physics.calculateOrbitalDistance(orbitIndex);
    const speed = this.physics.calculateOrbitalSpeed(distance);
    const phase = this.physics.calculateOrbitalPhase(orbitIndex, 1, false);
    
    const moonStar = this.createStar(
      moon,
      parentId,
      distance,
      speed,
      phase,
      mass
    );
    
    return [moonStar];
  }
  
  /**
   * Create a Star object
   */
  private createStar(
    node: LSystemNode,
    parentId: string | null,
    orbitalDistance: number,
    orbitalSpeed: number,
    orbitalPhase: number,
    mass: number
  ): Star {
    const radius = this.physics.generateRadius(mass);
    const color = this.physics.generateColor(mass, node.type);
    const name = this.generateName(node.type);
    
    // Determine body type based on node type
    let bodyType: 'star' | 'planet' | 'moon' | undefined;
    if (node.type === 'star') bodyType = 'star';
    else if (node.type === 'planet') bodyType = 'planet';
    else if (node.type === 'moon') bodyType = 'moon';
    
    // Generate elliptical orbit parameters
    const eccentricity = this.physics.generateEccentricity();
    const inclination = this.physics.generateInclination();
    const rotations = this.physics.generateOrbitRotations();
    const offset = this.physics.generateOrbitOffset();
    
    return {
      id: node.id,
      name,
      mass,
      radius,
      color,
      children: [],
      parentId,
      bodyType,
      orbitalDistance,
      orbitalSpeed,
      orbitalPhase,
      // Elliptical orbit parameters (only include if non-zero)
      semiMajorAxis: orbitalDistance, // Use orbital distance as semi-major axis
      eccentricity: eccentricity > 0 ? eccentricity : undefined,
      orbitOffsetX: offset.offsetX !== 0 ? offset.offsetX : undefined,
      orbitOffsetY: offset.offsetY !== 0 ? offset.offsetY : undefined,
      orbitOffsetZ: offset.offsetZ !== 0 ? offset.offsetZ : undefined,
      orbitRotX: inclination !== 0 ? inclination : undefined,
      orbitRotY: rotations.rotY !== 0 ? rotations.rotY : undefined,
      orbitRotZ: rotations.rotZ !== 0 ? rotations.rotZ : undefined,
    };
  }
  
  /**
   * Create a black hole Star object
   */
  private createBlackHole(
    node: LSystemNode,
    parentId: string | null,
    orbitalDistance: number,
    orbitalSpeed: number,
    orbitalPhase: number
  ): Star {
    // Use the physics RNG which is a RandomGenerator instance
    const rng = this.physics.rng;
    
    // ============================================================================
    // Mass Generation with Class Support
    // ============================================================================
    let mass: number;
    let massClass: 'stellar' | 'intermediate' | 'supermassive' = 'stellar';
    
    if (this.config.blackHoleMassClassWeights) {
      // Pick a mass class based on weights
      const weights = this.config.blackHoleMassClassWeights;
      const totalWeight = weights.stellar + weights.intermediate + weights.supermassive;
      const rand = rng.uniform(0, totalWeight);
      
      if (rand < weights.stellar) {
        massClass = 'stellar';
        mass = rng.uniform(5, 50); // Stellar-mass: 5-50 M☉
      } else if (rand < weights.stellar + weights.intermediate) {
        massClass = 'intermediate';
        mass = rng.uniform(50, 10000); // Intermediate: 50-10,000 M☉
      } else {
        massClass = 'supermassive';
        mass = rng.uniform(1e6, 1e9); // Supermassive: 1M-1B M☉
      }
    } else {
      // Default: use base mass range (stellar-mass)
      mass = rng.uniform(
        this.config.blackHoleMassRange[0],
        this.config.blackHoleMassRange[1]
      );
      massClass = 'stellar';
    }
    
    // ============================================================================
    // Shadow Radius with Optional Scaling Mode
    // ============================================================================
    let shadowRadius: number;
    const scaleMode = this.config.blackHoleShadowRadiusScaleMode ?? 'cinematic';
    
    if (scaleMode === 'physicalish') {
      // Loosely tie radius to mass (Schwarzschild radius ~ mass, but scaled for visibility)
      const baseRadius = rng.uniform(
        this.config.blackHoleShadowRadiusRange[0],
        this.config.blackHoleShadowRadiusRange[1]
      );
      // Scale by log of mass for supermassive BHs (clamped to prevent extreme values)
      if (massClass === 'supermassive') {
        const logScale = Math.min(Math.log10(mass / 1e6), 3.0); // Cap at 3 (1000x scaling)
        shadowRadius = baseRadius * logScale * 0.3 + baseRadius; // Reduced multiplier
      } else if (massClass === 'intermediate') {
        shadowRadius = baseRadius * 1.5;
      } else {
        shadowRadius = baseRadius;
      }
    } else {
      // Cinematic: independent random radius for visibility
      shadowRadius = rng.uniform(
        this.config.blackHoleShadowRadiusRange[0],
        this.config.blackHoleShadowRadiusRange[1]
      );
      // Slight bias for larger classes (but keep it reasonable)
      if (massClass === 'supermassive') {
        shadowRadius *= rng.uniform(1.5, 2.5);
      } else if (massClass === 'intermediate') {
        shadowRadius *= rng.uniform(1.2, 1.8);
      }
    }
    
    // Safety clamp: ensure shadow radius stays within reasonable bounds for rendering
    shadowRadius = Math.max(0.1, Math.min(shadowRadius, 10.0)); // Max 10 units
    
    // Black hole is dark (no emission except from accretion disk)
    const color = '#000000';
    const name = this.generateBlackHoleName();
    
    // ============================================================================
    // Accretion Disk Presence and Parameters
    // ============================================================================
    const hasAccretionDisk = rng.bool(this.config.blackHoleAccretionDiskProbability);
    
    // Accretion disk geometry
    const accretionInnerRadiusMultiplier = rng.uniform(
      this.config.blackHoleAccretionInnerRadiusMultiplier[0],
      this.config.blackHoleAccretionInnerRadiusMultiplier[1]
    );
    const accretionOuterRadiusMultiplier = rng.uniform(
      this.config.blackHoleAccretionOuterRadiusMultiplier[0],
      this.config.blackHoleAccretionOuterRadiusMultiplier[1]
    );
    
    // Calculate disk radii with safety bounds
    let accretionInnerRadius = shadowRadius * accretionInnerRadiusMultiplier;
    let accretionOuterRadius = shadowRadius * accretionOuterRadiusMultiplier;
    
    // Clamp disk radii to prevent rendering issues (max 50 units for disk outer radius)
    accretionInnerRadius = Math.max(shadowRadius * 1.1, Math.min(accretionInnerRadius, 40));
    accretionOuterRadius = Math.max(accretionInnerRadius * 1.5, Math.min(accretionOuterRadius, 50));
    
    // Disk thickness (clamped to reasonable values)
    let diskThickness = rng.uniform(
      this.config.blackHoleDiskThicknessRange[0],
      this.config.blackHoleDiskThicknessRange[1]
    );
    diskThickness = Math.max(0.05, Math.min(diskThickness, 2.0));
    
    // Disk appearance (use advanced ranges if provided, otherwise fallback to hardcoded)
    const diskBrightness = hasAccretionDisk 
      ? rng.uniform(...(this.config.blackHoleDiskBrightnessRange ?? [0.7, 1.0]))
      : 0;
    const diskOpacity = hasAccretionDisk 
      ? rng.uniform(...(this.config.blackHoleDiskOpacityRange ?? [0.6, 0.9]))
      : 0;
    const diskTemperature = hasAccretionDisk 
      ? rng.uniform(...(this.config.blackHoleDiskTemperatureRange ?? [5000, 20000]))
      : 0;
    const diskClumpiness = hasAccretionDisk 
      ? rng.uniform(...(this.config.blackHoleDiskClumpinessRange ?? [0.3, 0.7]))
      : 0;
    
    // ============================================================================
    // Relativistic Jets
    // ============================================================================
    const hasRelativisticJet = hasAccretionDisk && rng.bool(this.config.blackHoleJetProbability);
    
    const jetLength = rng.uniform(
      this.config.blackHoleJetLengthRange[0],
      this.config.blackHoleJetLengthRange[1]
    );
    const jetOpeningAngle = rng.uniform(
      this.config.blackHoleJetOpeningAngleRange[0],
      this.config.blackHoleJetOpeningAngleRange[1]
    );
    const jetBrightness = hasRelativisticJet 
      ? rng.uniform(...(this.config.blackHoleJetBrightnessRange ?? [0.8, 1.0]))
      : 0;
    
    // ============================================================================
    // Spin Parameter with Optional Distribution
    // ============================================================================
    let spin: number;
    const spinDist = this.config.blackHoleSpinDistribution;
    const [spinMin, spinMax] = this.config.blackHoleSpinRange;
    
    if (spinDist === 'highSpinBiased') {
      // Bias toward high spin (quadratic distribution toward max)
      const u = rng.uniform(0, 1);
      spin = spinMin + (spinMax - spinMin) * (u * u);
    } else if (spinDist === 'lowSpinBiased') {
      // Bias toward low spin (inverse quadratic)
      const u = rng.uniform(0, 1);
      spin = spinMin + (spinMax - spinMin) * Math.sqrt(u);
    } else {
      // Uniform distribution (default)
      spin = rng.uniform(spinMin, spinMax);
    }
    
    // ============================================================================
    // Visual Effect Strengths
    // ============================================================================
    const dopplerBeamingStrength = rng.uniform(
      this.config.blackHoleDopplerBeamingStrengthRange[0],
      this.config.blackHoleDopplerBeamingStrengthRange[1]
    );
    const lensingStrength = rng.uniform(
      this.config.blackHoleLensingStrengthRange[0],
      this.config.blackHoleLensingStrengthRange[1]
    );
    
    // Photon ring (with optional secondary ring based on lensing strength)
    const hasPhotonRing = this.config.blackHolePhotonRingEnabled;
    
    // ============================================================================
    // Animation and Determinism
    // ============================================================================
    const rotationSpeedMultiplier = rng.uniform(
      ...(this.config.blackHoleRotationSpeedMultiplierRange ?? [0.5, 1.5])
    );
    
    // ============================================================================
    // Enhanced Visual Parameters (optional, for improved realism)
    // ============================================================================
    // These are generated based on existing properties for backward compatibility
    const accretionStyle = this.config.blackHoleAccretionStyle ?? 'normal';
    
    // Disk turbulence and streaking
    const diskTurbulenceScale = rng.uniform(0.4, 0.7);
    const diskStreakiness = accretionStyle === 'quasar' 
      ? rng.uniform(0.7, 0.9)  // Quasars have strong spiral patterns
      : rng.uniform(0.4, 0.6);  // Normal disks have moderate streaking
    
    // Jet color gradient (optional - depends on style)
    let jetBaseColor: string | undefined;
    let jetTipColor: string | undefined;
    let jetGradientPower: number | undefined;
    
    if (hasRelativisticJet) {
      // Vary jet colors slightly for diversity
      const jetHue = rng.uniform(0.5, 0.65); // Blue-cyan range
      jetBaseColor = undefined; // Use defaults in renderer
      jetTipColor = undefined;  // Use defaults in renderer
      jetGradientPower = accretionStyle === 'quasar' 
        ? rng.uniform(1.5, 2.0)  // Quasar jets fade slower
        : rng.uniform(2.0, 2.5); // Normal jets fade faster
    }
    
    // Photon ring parameters
    const photonRingMultiImageCount = lensingStrength > 0.7 ? 3 : 2;
    const photonRingWidth = rng.uniform(0.3, 0.5);
    
    // Disk tilt and orientation
    let diskTilt: number | undefined;
    let diskTiltAxisAngle: number | undefined;
    
    if (this.config.blackHoleTiltRange) {
      // Use configured tilt range
      const tiltMin = this.config.blackHoleTiltRange[0] * (Math.PI / 180); // Convert to radians
      const tiltMax = this.config.blackHoleTiltRange[1] * (Math.PI / 180);
      diskTilt = rng.uniform(tiltMin, tiltMax);
      // Random azimuthal angle for tilt axis (0-2π)
      diskTiltAxisAngle = rng.uniform(0, Math.PI * 2);
    } else {
      // Default: slight random tilt for visual variety (0-15 degrees)
      diskTilt = rng.uniform(0, 15 * (Math.PI / 180));
      diskTiltAxisAngle = rng.uniform(0, Math.PI * 2);
    }
    
    // ============================================================================
    // Orbit Parameters
    // ============================================================================
    const eccentricity = orbitalDistance > 0 ? this.physics.generateEccentricity() : 0;
    const inclination = orbitalDistance > 0 ? this.physics.generateInclination() : 0;
    const rotations = orbitalDistance > 0 ? this.physics.generateOrbitRotations() : { rotY: 0, rotZ: 0 };
    const offset = orbitalDistance > 0 ? this.physics.generateOrbitOffset() : { offsetX: 0, offsetY: 0, offsetZ: 0 };
    
    // ============================================================================
    // Final Validation: Ensure all values are finite
    // ============================================================================
    // This prevents NaN or Infinity from causing rendering errors
    const ensureFinite = (value: number, fallback: number): number => {
      return Number.isFinite(value) ? value : fallback;
    };
    
    return {
      id: node.id,
      name,
      mass,
      radius: shadowRadius, // Visual size is the shadow radius
      color,
      children: [],
      parentId,
      bodyType: 'blackHole',
      blackHole: {
        hasAccretionDisk,
        hasRelativisticJet,
        hasPhotonRing,
        spin: ensureFinite(spin, 0.5),
        shadowRadius: ensureFinite(shadowRadius, 0.5),
        accretionInnerRadius: ensureFinite(accretionInnerRadius, 2.0),
        accretionOuterRadius: ensureFinite(accretionOuterRadius, 10.0),
        diskThickness: ensureFinite(diskThickness, 0.3),
        diskBrightness: ensureFinite(diskBrightness, 0.7),
        diskOpacity: ensureFinite(diskOpacity, 0.7),
        diskTemperature: ensureFinite(diskTemperature, 10000),
        diskClumpiness: ensureFinite(diskClumpiness, 0.5),
        jetLength: ensureFinite(jetLength, 30),
        jetOpeningAngle: ensureFinite(jetOpeningAngle, 5),
        jetBrightness: ensureFinite(jetBrightness, 0.9),
        dopplerBeamingStrength: ensureFinite(dopplerBeamingStrength, 0.5),
        lensingStrength: ensureFinite(lensingStrength, 0.6),
        rotationSpeedMultiplier: ensureFinite(rotationSpeedMultiplier, 1.0),
        seed: rng.randInt(0, 999999),
        
        // Enhanced visual parameters (optional)
        diskTurbulenceScale: ensureFinite(diskTurbulenceScale, 0.5),
        diskStreakiness: ensureFinite(diskStreakiness, 0.5),
        jetGradientPower: jetGradientPower !== undefined ? ensureFinite(jetGradientPower, 2.0) : undefined,
        photonRingMultiImageCount,
        photonRingWidth: ensureFinite(photonRingWidth, 0.4),
        diskTilt: diskTilt !== undefined ? ensureFinite(diskTilt, 0) : undefined,
        diskTiltAxisAngle: diskTiltAxisAngle !== undefined ? ensureFinite(diskTiltAxisAngle, 0) : undefined,
        // jetBaseColor and jetTipColor left undefined to use renderer defaults
        // diskInnerColor and diskOuterColor left undefined to use temperature gradient
      },
      orbitalDistance,
      orbitalSpeed,
      orbitalPhase,
      semiMajorAxis: orbitalDistance > 0 ? orbitalDistance : undefined,
      eccentricity: eccentricity > 0 ? eccentricity : undefined,
      orbitOffsetX: offset.offsetX !== 0 ? offset.offsetX : undefined,
      orbitOffsetY: offset.offsetY !== 0 ? offset.offsetY : undefined,
      orbitOffsetZ: offset.offsetZ !== 0 ? offset.offsetZ : undefined,
      orbitRotX: inclination !== 0 ? inclination : undefined,
      orbitRotY: rotations.rotY !== 0 ? rotations.rotY : undefined,
      orbitRotZ: rotations.rotZ !== 0 ? rotations.rotZ : undefined,
    };
  }
  
  /**
   * Generate a name for a black hole
   */
  private generateBlackHoleName(): string {
    const count = (this.nameCounter.get('blackHole') || 0) + 1;
    this.nameCounter.set('blackHole', count);
    
    const prefixes = [
      'Cygnus X',
      'GRS',
      'V404',
      'XTE J',
      'GRO J',
      'H',
      'LMC X',
      'SAX J',
      'GX',
    ];
    
    if (count <= prefixes.length) {
      return `${prefixes[count - 1]}-${count}`;
    }
    
    // Generate catalog-style designations
    const prefix = this.physics.rng.choice(prefixes);
    const number = 1000 + count;
    return `${prefix}${number}`;
  }
  
  /**
   * Generate a name for a celestial body
   */
  private generateName(type: NodeType): string {
    const typeKey = type.charAt(0).toUpperCase() + type.slice(1);
    const count = (this.nameCounter.get(type) || 0) + 1;
    this.nameCounter.set(type, count);
    
    if (type === 'star') {
      const greekLetters = ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Eta', 'Theta'];
      const constellations = ['Centauri', 'Orionis', 'Cygni', 'Tauri', 'Lyrae', 'Aquilae'];
      const letter = greekLetters[count % greekLetters.length];
      const constellation = constellations[Math.floor(count / greekLetters.length) % constellations.length];
      return `${letter} ${constellation}`;
    } else if (type === 'planet') {
      const names = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
      if (count <= names.length) {
        return names[count - 1];
      }
      return `${typeKey} ${String.fromCharCode(64 + count)}`;
    } else {
      const names = ['Moon', 'Phobos', 'Deimos', 'Io', 'Europa', 'Ganymede', 'Callisto', 'Titan'];
      if (count <= names.length) {
        return names[count - 1];
      }
      return `${typeKey} ${count}`;
    }
  }
}

// ============================================================================
// Group Generator
// ============================================================================

class GroupGenerator {
  private config: GeneratorConfig;
  private rng: RandomGenerator;
  
  constructor(config: GeneratorConfig, rng: RandomGenerator) {
    this.config = config;
    this.rng = rng;
  }
  
  /**
   * Generate groups for the given systems
   */
  generate(rootIds: string[]): Group[] {
    if (!this.config.enableGrouping || rootIds.length === 0) {
      return [];
    }
    
    const numGroups = this.rng.randInt(
      this.config.numGroups[0],
      Math.min(this.config.numGroups[1], rootIds.length)
    );
    
    if (numGroups === 0) return [];
    
    // Create groups
    const groups: Group[] = [];
    for (let i = 0; i < numGroups; i++) {
      const group: Group = {
        id: uuidv4(),
        name: `Cluster ${String.fromCharCode(65 + i)}`,
        children: [],
        parentGroupId: null,
        color: this.generateGroupColor(),
        position: this.generatePosition(),
      };
      groups.push(group);
    }
    
    // Randomly assign systems to groups
    rootIds.forEach(rootId => {
      const randomGroup = this.rng.choice(groups);
      randomGroup.children.push({
        id: rootId,
        type: 'system',
      });
    });
    
    // Optional nesting
    this.addNesting(groups);
    
    return groups;
  }
  
  /**
   * Add optional group nesting
   */
  private addNesting(groups: Group[]): void {
    if (groups.length < 2) return;
    
    // Try to nest some groups
    for (let i = 1; i < groups.length; i++) {
      if (this.rng.bool(this.config.nestingProbability)) {
        // Pick a random parent (not self, not already parented)
        const candidates = groups.filter(g => 
          g.id !== groups[i].id && 
          g.parentGroupId === null &&
          !this.wouldCreateCycle(groups[i], g, groups)
        );
        
        if (candidates.length > 0) {
          const parent = this.rng.choice(candidates);
          groups[i].parentGroupId = parent.id;
          parent.children.push({
            id: groups[i].id,
            type: 'group',
          });
        }
      }
    }
  }
  
  /**
   * Check if adding child to parent would create a cycle
   */
  private wouldCreateCycle(child: Group, parent: Group, allGroups: Group[]): boolean {
    let current: Group | undefined = parent;
    while (current) {
      if (current.id === child.id) return true;
      current = allGroups.find(g => g.id === current?.parentGroupId);
    }
    return false;
  }
  
  /**
   * Generate a random group color
   */  
  private generateGroupColor(): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
      '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'
    ];
    return this.rng.choice(colors);
  }
  
  /**
   * Generate a 3D position on a Gaussian cloud
   */
  private generatePosition(): Position {
    return {
      x: this.rng.normal(0, this.config.groupPositionSigma),
      y: this.rng.normal(0, this.config.groupPositionSigma),
      z: this.rng.normal(0, this.config.groupPositionSigma),
    };
  }
}

// ============================================================================
// Asteroid Belt Generator (Particle Field Version)
// ============================================================================

class AsteroidBeltGenerator {
  private config: GeneratorConfig;
  private rng: RandomGenerator;
  private physics: PhysicsGenerator;
  
  constructor(config: GeneratorConfig, rng: RandomGenerator) {
    this.config = config;
    this.rng = rng;
    this.physics = new PhysicsGenerator(config, rng);
  }
  
  /**
   * Generate asteroid belt particle fields for a given system.
   * This replaces the previous system of creating thousands of individual Star entities
   * with performant GPU particle fields.
   * 
   * @param stars - All stars in the system
   * @param centerStarId - The central star ID
   * @param systemId - System ID for field organization
   * @returns Array of SmallBodyField objects (no asteroid Star entities)
   */
  generate(stars: Star[], centerStarId: string, systemId: string): { fields: SmallBodyField[] } {
    console.log('[AsteroidBeltGenerator] Generate called:', {
      enableAsteroidBelts: this.config.enableAsteroidBelts,
      beltPlacementMode: this.config.beltPlacementMode,
      centerStarId,
      systemId,
    });
    
    if (!this.config.enableAsteroidBelts || this.config.beltPlacementMode === 'none') {
      console.log('[AsteroidBeltGenerator] Belts disabled, returning empty array');
      return { fields: [] };
    }
    
    const fields: SmallBodyField[] = [];
    
    // Find planets orbiting the center star
    const planets = stars.filter(s => s.parentId === centerStarId && s.bodyType !== 'star');
    
    console.log('[AsteroidBeltGenerator] Found planets:', planets.length);
    
    // Sort planets by orbital distance
    const sortedPlanets = [...planets].sort((a, b) => a.orbitalDistance - b.orbitalDistance);
    
    let beltsCreated = 0;
    
    // Generate belts based on placement mode
    if ((this.config.beltPlacementMode === 'betweenPlanets' || this.config.beltPlacementMode === 'both') 
        && sortedPlanets.length >= 2) {
      // Create belts in gaps between planets
      for (let i = 0; i < sortedPlanets.length - 1 && beltsCreated < this.config.maxBeltsPerSystem; i++) {
        // Decide whether to place a belt in this gap (50% chance)
        if (this.rng.bool(0.5)) {
          const innerPlanet = sortedPlanets[i];
          const outerPlanet = sortedPlanets[i + 1];
          const field = this.createBeltFieldBetweenPlanets(innerPlanet, outerPlanet, centerStarId, systemId, beltsCreated);
          
          fields.push(field);
          beltsCreated++;
        }
      }
    }
    
    if ((this.config.beltPlacementMode === 'outerBelt' || this.config.beltPlacementMode === 'both') 
        && beltsCreated < this.config.maxBeltsPerSystem
        && sortedPlanets.length > 0) {
      // Create a Kuiper-like outer belt
      const outermostPlanet = sortedPlanets[sortedPlanets.length - 1];
      const field = this.createOuterBeltField(outermostPlanet, centerStarId, systemId, beltsCreated);
      
      fields.push(field);
      beltsCreated++;
    }
    
    console.log(`[AsteroidBeltGenerator] Created ${beltsCreated} belt fields:`, fields.map(f => ({
      name: f.name,
      type: f.beltType,
      particleCount: f.particleCount,
      innerRadius: f.innerRadius,
      outerRadius: f.outerRadius,
    })));
    
    return { fields };
  }
  
  /**
   * Create a belt field between two planets
   */
  private createBeltFieldBetweenPlanets(
    innerPlanet: Star, 
    outerPlanet: Star, 
    hostStarId: string, 
    systemId: string,
    index: number
  ): SmallBodyField {
    const r1 = innerPlanet.orbitalDistance;
    const r2 = outerPlanet.orbitalDistance;
    const gap = r2 - r1;
    
    // Place belt in the middle portion of the gap
    const innerRadius = r1 + gap * this.config.beltInnerGapScale;
    const outerRadius = r1 + gap * this.config.beltOuterGapScale;
    
    return this.createBeltField(hostStarId, systemId, innerRadius, outerRadius, index, 'Main Belt', 'main');
  }
  
  /**
   * Create an outer belt field beyond the last planet
   */
  private createOuterBeltField(
    outermostPlanet: Star, 
    hostStarId: string, 
    systemId: string,
    index: number
  ): SmallBodyField {
    const rMax = outermostPlanet.orbitalDistance;
    const innerRadius = rMax * this.config.beltOuterMultiplier;
    const outerRadius = innerRadius * 1.5; // Belt width is 50% of inner radius
    
    return this.createBeltField(hostStarId, systemId, innerRadius, outerRadius, index, 'Outer Belt', 'main');
  }
  
  /**
   * Create a belt particle field with given parameters.
   * This replaces the previous createBelt + generateAsteroidsForBelt pattern.
   */
  private createBeltField(
    hostStarId: string,
    systemId: string,
    innerRadius: number,
    outerRadius: number,
    index: number,
    namePrefix: string,
    beltType: 'main' | 'kuiper'
  ): SmallBodyField {
    const fieldId = uuidv4();
    
    // Determine particle count using geometric distribution (same logic as before)
    const baseCount = this.rng.geometric(this.config.beltAsteroidGeometricP);
    const particleCount = Math.max(
      this.config.beltMinCount,
      Math.min(this.config.beltMaxCount, baseCount)
    );
    
    // Generate colors based on belt type
    // Main belts: rocky browns/grays
    // Kuiper belts: icy blues/grays
    const isIcy = beltType === 'kuiper';
    const baseColor = isIcy ? '#8B7D6B' : '#8B7355';  // Rocky brown for main
    const highlightColor = isIcy ? '#B8A896' : '#A68A6D';  // Lighter brown for main
    
    // Visual properties (maximized for visibility)
    const opacity = this.rng.uniform(0.8, 1.0);
    const brightness = this.rng.uniform(1.2, 1.8);
    const clumpiness = this.rng.uniform(0.2, 0.4);  // Lower clumpiness = more uniform density
    
    // Rotation speed (belts rotate very slowly)
    const rotationSpeedMultiplier = this.rng.uniform(0.5, 1.5);
    
    // Style based on belt type
    const style: 'thin' | 'moderate' | 'thick' | 'scattered' = 
      beltType === 'main' ? 'moderate' : 'scattered';
    
    // Seed for deterministic particle distribution
    const seed = this.rng.randInt(0, 2147483647);
    
    return {
      id: fieldId,
      systemId,
      hostStarId,
      innerRadius,
      outerRadius,
      thickness: this.config.beltThickness,
      particleCount,
      baseColor,
      highlightColor,
      opacity,
      brightness,
      clumpiness,
      rotationSpeedMultiplier,
      beltType,
      regionLabel: namePrefix,
      isIcy,
      seed,
      style,
      name: `${namePrefix} ${index + 1}`,
      visible: true,
    };
  }
}

// ============================================================================
// Kuiper Belt Generator (Particle Field Version)
// ============================================================================

class KuiperBeltGenerator {
  private config: GeneratorConfig;
  private rng: RandomGenerator;
  private physics: PhysicsGenerator;
  
  constructor(config: GeneratorConfig, rng: RandomGenerator) {
    this.config = config;
    this.rng = rng;
    this.physics = new PhysicsGenerator(config, rng);
  }
  
  /**
   * Generate Kuiper belt particle field for a given system (trans-Neptunian region).
   * This replaces the previous system of creating thousands of individual KBO Star entities
   * with a performant GPU particle field.
   * 
   * @param stars - All stars in the system
   * @param centerStarId - The central star ID
   * @param systemId - System ID for field organization
   * @returns SmallBodyField object representing the Kuiper belt (no KBO Star entities)
   */
  generate(stars: Star[], centerStarId: string, systemId: string): { fields: SmallBodyField[] } {
    console.log('[KuiperBeltGenerator] Generate called:', {
      enableKuiperBelt: this.config.enableKuiperBelt,
      centerStarId,
      systemId,
    });
    
    if (!this.config.enableKuiperBelt) {
      console.log('[KuiperBeltGenerator] Kuiper belt disabled, returning empty array');
      return { fields: [] };
    }
    
    // Find planets orbiting the center star
    const planets = stars.filter(s => s.parentId === centerStarId && s.bodyType === 'planet');
    
    console.log('[KuiperBeltGenerator] Found planets:', planets.length);
    
    if (planets.length === 0) {
      // No planets, skip Kuiper belt generation
      console.log('[KuiperBeltGenerator] No planets found, skipping Kuiper belt');
      return { fields: [] };
    }
    
    // Find outermost planet
    const sortedPlanets = [...planets].sort((a, b) => a.orbitalDistance - b.orbitalDistance);
    const outermostPlanet = sortedPlanets[sortedPlanets.length - 1];
    const rMax = outermostPlanet.orbitalDistance;
    
    // Calculate Kuiper belt radii
    const innerRadius = rMax * this.config.kuiperBeltRadialRange[0];
    const outerRadius = rMax * this.config.kuiperBeltRadialRange[1];
    
    // Create the Kuiper belt field
    const field = this.createKuiperBeltField(centerStarId, systemId, innerRadius, outerRadius);
    
    console.log('[KuiperBeltGenerator] Created Kuiper belt field:', {
      name: field.name,
      type: field.beltType,
      particleCount: field.particleCount,
      innerRadius: field.innerRadius,
      outerRadius: field.outerRadius,
    });
    
    return { fields: [field] };
  }
  
  /**
   * Create a Kuiper belt particle field with given parameters.
   * This replaces the previous createKuiperBelt + generateKBOsForBelt pattern.
   */
  private createKuiperBeltField(
    hostStarId: string,
    systemId: string,
    innerRadius: number,
    outerRadius: number
  ): SmallBodyField {
    const fieldId = uuidv4();
    
    // Determine KBO particle count using geometric distribution
    // Note: min/max counts are already scaled by density in generatorBridge
    const baseCount = this.rng.geometric(this.config.kuiperBeltAsteroidGeometricP);
    const particleCount = Math.max(
      this.config.kuiperBeltMinCount,
      Math.min(this.config.kuiperBeltMaxCount, baseCount)
    );
    
    // Thickness is higher for Kuiper belt (more scattered)
    const thickness = this.config.kuiperBeltInclinationSigma;
    
    // Generate icy colors for Kuiper belt
    const baseColor = '#A8C5DD';  // Icy bluish-gray
    const highlightColor = '#D0E0F0';  // Lighter icy blue
    
    // Visual properties (maximized for visibility)
    const opacity = this.rng.uniform(0.7, 0.9);  // High opacity for visibility
    const brightness = this.rng.uniform(1.0, 1.5);
    const clumpiness = this.rng.uniform(0.3, 0.5);  // Moderate clumpiness
    
    // Rotation speed (Kuiper belt rotates very slowly)
    const rotationSpeedMultiplier = this.rng.uniform(0.3, 0.8);
    
    // Seed for deterministic particle distribution
    const seed = this.rng.randInt(0, 2147483647);
    
    return {
      id: fieldId,
      systemId,
      hostStarId,
      innerRadius,
      outerRadius,
      thickness,
      particleCount,
      baseColor,
      highlightColor,
      opacity,
      brightness,
      clumpiness,
      rotationSpeedMultiplier,
      beltType: 'kuiper',
      regionLabel: 'Kuiper Belt',
      isIcy: true,
      inclinationSigma: this.config.kuiperBeltInclinationSigma,
      seed,
      style: 'scattered',
      name: 'Kuiper Belt',
      visible: true,
    };
  }
}

// ============================================================================
// Planetary Ring Generator
// ============================================================================

class PlanetaryRingGenerator {
  private config: GeneratorConfig;
  private rng: RandomGenerator;

  constructor(config: GeneratorConfig, rng: RandomGenerator) {
    this.config = config;
    this.rng = rng;
  }

  /**
   * Assign planetary rings to suitable planets in a given system.
   * Rings are attached directly to planet Star objects as PlanetaryRing.
   */
  generate(stars: Star[], centerStarId: string): void {
    if (!this.config.enablePlanetaryRings) {
      return;
    }

    // Find planets orbiting the center star
    const planets = stars.filter(
      (s) => s.parentId === centerStarId && s.bodyType === 'planet'
    );

    if (planets.length === 0) {
      return;
    }

    const maxDistance = planets.reduce(
      (max, p) => Math.max(max, p.orbitalDistance),
      0
    );

    planets.forEach((planet) => {
      const baseProb = this.config.ringedPlanetProbability;

      // Mass bias: heavier planets are more likely to have rings
      let massFactor = 1;
      if (planet.mass >= this.config.ringMassBiasThreshold) {
        const ratio = planet.mass / this.config.ringMassBiasThreshold;
        massFactor = Math.min(2, 1 + (ratio - 1) * 0.5);
      }

      // Outer orbit bias: outer planets are slightly more likely
      let distanceFactor = 1;
      if (maxDistance > 0 && this.config.ringOuterOrbitBias > 0) {
        const normalized = planet.orbitalDistance / maxDistance;
        distanceFactor =
          1 + normalized * this.config.ringOuterOrbitBias;
      }

      const finalProb = Math.min(1, baseProb * massFactor * distanceFactor);

      if (!this.rng.bool(finalProb)) {
        return;
      }

      // Fork RNG per planet for deterministic ring styling
      const planetRng = this.rng.fork(`ring-${planet.id}`);

      const innerMultiplier = planetRng.uniform(
        this.config.ringInnerRadiusRange[0],
        this.config.ringInnerRadiusRange[1]
      );
      const outerMultiplierRaw = planetRng.uniform(
        this.config.ringOuterRadiusRange[0],
        this.config.ringOuterRadiusRange[1]
      );
      const outerMultiplier = Math.max(
        innerMultiplier + 0.1,
        outerMultiplierRaw
      );

      const thicknessMultiplier = planetRng.uniform(
        this.config.ringThicknessRange[0],
        this.config.ringThicknessRange[1]
      );
      const thickness = planet.radius * thicknessMultiplier;

      const opacity = planetRng.uniform(
        this.config.ringOpacityRange[0],
        this.config.ringOpacityRange[1]
      );

      const albedo = planetRng.uniform(
        this.config.ringAlbedoRange[0],
        this.config.ringAlbedoRange[1]
      );

      const density = planetRng.uniform(
        this.config.ringDensityRange[0],
        this.config.ringDensityRange[1]
      );

      // Derive ring color from planet color with small variation
      const color = this.varyColor(
        planet.color,
        this.config.ringColorVariation,
        planetRng
      );

      const ring: PlanetaryRing = {
        innerRadiusMultiplier: Math.max(1.1, innerMultiplier),
        outerRadiusMultiplier: Math.max(
          innerMultiplier + 0.1,
          outerMultiplier
        ),
        thickness,
        opacity,
        albedo,
        color,
        density,
        seed: planetRng.randInt(0, 2147483647),
      };

      // Attach ring to planet
      planet.ring = ring;
    });
  }

  /**
   * Vary a hex color by a given amount (reused pattern from belt generator)
   */
  private varyColor(hexColor: string, variation: number, rng: RandomGenerator): string {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    const vary = (value: number) => {
      const delta = rng.uniform(-variation * 40, variation * 40);
      return Math.max(0, Math.min(255, Math.round(value + delta)));
    };

    const newR = vary(r);
    const newG = vary(g);
    const newB = vary(b);

    return `#${newR.toString(16).padStart(2, '0')}${newG
      .toString(16)
      .padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }
}

// ============================================================================
// Comet Generator
// ============================================================================

class CometGenerator {
  private config: GeneratorConfig;
  private rng: RandomGenerator;
  private physics: PhysicsGenerator;

  constructor(config: GeneratorConfig, rng: RandomGenerator) {
    this.config = config;
    this.rng = rng;
    this.physics = new PhysicsGenerator(config, rng);
  }

  /**
   * Generate comets for a given system
   * @param stars - All stars in the system
   * @param centerStarId - The central star ID
   * @returns Array of comet Star objects
   */
  generate(stars: Star[], centerStarId: string): Star[] {
    if (!this.config.enableComets) {
      return [];
    }

    const comets: Star[] = [];

    // Find planets orbiting the center star to determine outermost orbit
    const planets = stars.filter(
      (s) => s.parentId === centerStarId && s.bodyType === 'planet'
    );

    if (planets.length === 0) {
      // No planets, use a default distance
      return comets;
    }

    // Find outermost planet distance
    const maxPlanetDistance = planets.reduce(
      (max, p) => Math.max(max, p.orbitalDistance),
      0
    );

    // Sample number of comets
    const cometCount = this.rng.randInt(
      this.config.cometCountRange[0],
      this.config.cometCountRange[1]
    );

    // Generate each comet
    for (let i = 0; i < cometCount; i++) {
      const comet = this.createComet(i, centerStarId, maxPlanetDistance);
      comets.push(comet);
    }

    return comets;
  }

  /**
   * Create a single comet
   */
  private createComet(
    index: number,
    parentId: string,
    maxPlanetDistance: number
  ): Star {
    // Fork RNG for this comet
    const cometRng = this.rng.fork(`comet-${index}`);
    const cometPhysics = new PhysicsGenerator(this.config, cometRng);

    // Determine if this is a short-period comet
    const isShortPeriod = cometRng.bool(this.config.shortPeriodCometFraction);

    // Sample semi-major axis relative to outermost planet
    const semiMajorAxisMultiplier = cometRng.uniform(
      this.config.cometSemiMajorAxisRange[0],
      this.config.cometSemiMajorAxisRange[1]
    );
    const semiMajorAxis = isShortPeriod
      ? maxPlanetDistance * semiMajorAxisMultiplier * 0.5 // Short-period: closer
      : maxPlanetDistance * semiMajorAxisMultiplier;

    // Sample high eccentricity
    const eccentricity = cometRng.uniform(
      this.config.cometEccentricityRange[0],
      this.config.cometEccentricityRange[1]
    );

    // Calculate perihelion and aphelion
    const perihelionDistance = semiMajorAxis * (1 - eccentricity);
    const aphelionDistance = semiMajorAxis * (1 + eccentricity);

    // Sample inclination
    const inclinationX = cometRng.uniform(
      -this.config.cometInclinationMax,
      this.config.cometInclinationMax
    );
    const inclinationY = cometRng.uniform(
      -this.config.cometInclinationMax * 0.5,
      this.config.cometInclinationMax * 0.5
    );
    const inclinationZ = cometRng.uniform(0, 360);

    // Generate physical properties (small icy body)
    const mass = cometPhysics.generateMass('comet');
    const radius = cometPhysics.generateRadius(mass);
    const color = cometPhysics.generateColor(mass, 'comet');

    // Calculate orbital speed (using semi-major axis)
    const orbitalSpeed = cometPhysics.calculateOrbitalSpeed(semiMajorAxis);

    // Random orbital phase
    const orbitalPhase = cometRng.uniform(0, 360);

    // Generate tail properties
    const hasTail = cometRng.bool(0.95); // 95% have visible tails
    const tailLengthBase = cometRng.uniform(
      this.config.cometTailLengthRange[0],
      this.config.cometTailLengthRange[1]
    );
    const tailWidthBase = tailLengthBase * 0.15; // Tail width proportional to length
    const tailOpacityBase = cometRng.uniform(
      this.config.cometTailOpacityRange[0],
      this.config.cometTailOpacityRange[1]
    );

    // Tail color - bluish-white (ion tail) or yellowish (dust tail)
    const tailColors = ['#87CEEB', '#B0E0E6', '#F5DEB3', '#FFE4B5'];
    const tailColor = cometRng.choice(tailColors);

    // Activity falloff distance (tail fades beyond this)
    const activityFalloffDistance = cometRng.uniform(
      this.config.cometActivityDistanceRange[0],
      this.config.cometActivityDistanceRange[1]
    );

    // Create comet metadata
    const cometMeta: CometMeta = {
      isPeriodic: isShortPeriod,
      perihelionDistance,
      aphelionDistance,
      hasTail,
      tailLengthBase,
      tailWidthBase,
      tailColor,
      tailOpacityBase,
      activityFalloffDistance,
      seed: cometRng.randInt(0, 2147483647),
    };

    // Generate a name
    const name = this.generateCometName(index);

    const cometId = uuidv4();

    return {
      id: cometId,
      name,
      mass,
      radius,
      color,
      children: [],
      parentId,
      bodyType: 'comet',
      comet: cometMeta,
      orbitalDistance: semiMajorAxis, // Use semi-major axis as base distance
      orbitalSpeed,
      orbitalPhase,
      semiMajorAxis,
      eccentricity,
      orbitRotX: inclinationX,
      orbitRotY: inclinationY,
      orbitRotZ: inclinationZ,
    };
  }

  /**
   * Generate a comet name
   */
  private generateCometName(index: number): string {
    const prefixes = [
      'Halley',
      'Hale-Bopp',
      'Hyakutake',
      'NEAT',
      'LINEAR',
      'SOHO',
      'McNaught',
      'Lovejoy',
      'ISON',
      'Encke',
      'Swift-Tuttle',
      'Tempel',
    ];
    
    if (index < prefixes.length) {
      return `Comet ${prefixes[index]}`;
    }
    
    // Generate alphanumeric designation
    const year = 2020 + (index % 20);
    const letter = String.fromCharCode(65 + (index % 26));
    return `Comet ${year}${letter}${index}`;
  }
}

// ============================================================================
// Lagrange Point Generator
// ============================================================================

class LagrangePointGenerator {
  private config: GeneratorConfig;
  private rng: RandomGenerator;
  private physics: PhysicsGenerator;

  constructor(config: GeneratorConfig, rng: RandomGenerator) {
    this.config = config;
    this.rng = rng;
    this.physics = new PhysicsGenerator(config, rng);
  }

  /**
   * Generate Lagrange points and optional Trojan bodies for a given system
   * @param stars - All stars in the system (Record)
   * @param centerStarId - The central star ID
   * @returns Array of Lagrange marker Stars and Trojan Stars
   */
  generate(stars: Record<string, Star>, centerStarId: string): Star[] {
    if (!this.config.enableLagrangePoints) {
      return [];
    }

    const lagrangeMarkers: Star[] = [];
    const trojanBodies: Star[] = [];

    // Collect eligible pairs based on configuration
    const pairs = this.collectEligiblePairs(stars, centerStarId);

    // Generate Lagrange points for each pair
    for (const pair of pairs) {
      const markers = this.createLagrangeMarkers(pair, stars);
      lagrangeMarkers.push(...markers);

      // Generate Trojans at L4/L5 if enabled
      if (this.config.enableTrojans) {
        for (const marker of markers) {
          if (marker.lagrangePoint && marker.lagrangePoint.stable) {
            const trojans = this.createTrojansForPoint(marker, pair);
            trojanBodies.push(...trojans);
          }
        }
      }
    }

    return [...lagrangeMarkers, ...trojanBodies];
  }

  /**
   * Collect eligible two-body pairs for Lagrange point generation
   */
  private collectEligiblePairs(
    stars: Record<string, Star>,
    centerStarId: string
  ): Array<{ primary: Star; secondary: Star; pairType: 'starPlanet' | 'planetMoon' }> {
    const pairs: Array<{ primary: Star; secondary: Star; pairType: 'starPlanet' | 'planetMoon' }> = [];
    const starsArray = Object.values(stars);

    // Star-Planet pairs
    if (this.config.lagrangePairTypes === 'starPlanet' || this.config.lagrangePairTypes === 'both') {
      const centerStar = stars[centerStarId];
      if (centerStar) {
        const planets = starsArray.filter(
          (s) => s.parentId === centerStarId && s.bodyType === 'planet'
        );
        for (const planet of planets) {
          pairs.push({ primary: centerStar, secondary: planet, pairType: 'starPlanet' });
        }
      }
    }

    // Planet-Moon pairs
    if (this.config.lagrangePairTypes === 'planetMoon' || this.config.lagrangePairTypes === 'both') {
      const planets = starsArray.filter(
        (s) => s.bodyType === 'planet'
      );
      for (const planet of planets) {
        const moons = starsArray.filter(
          (s) => s.parentId === planet.id && s.bodyType === 'moon'
        );
        for (const moon of moons) {
          pairs.push({ primary: planet, secondary: moon, pairType: 'planetMoon' });
        }
      }
    }

    return pairs;
  }

  /**
   * Create Lagrange point markers for a two-body pair
   */
  private createLagrangeMarkers(
    pair: { primary: Star; secondary: Star; pairType: 'starPlanet' | 'planetMoon' },
    stars: Record<string, Star>
  ): Star[] {
    const markers: Star[] = [];
    const { primary, secondary, pairType } = pair;

    // Determine which points to generate
    const pointsToGenerate: Array<{ index: 1 | 2 | 3 | 4 | 5; stable: boolean }> = [];

    if (this.config.generateL1L2L3Markers) {
      pointsToGenerate.push(
        { index: 1, stable: false },
        { index: 2, stable: false },
        { index: 3, stable: false }
      );
    }

    if (this.config.generateL4L5Markers) {
      pointsToGenerate.push(
        { index: 4, stable: true },
        { index: 5, stable: true }
      );
    }

    // Create markers
    for (const point of pointsToGenerate) {
      const marker = this.createLagrangeMarker(primary, secondary, point.index, point.stable, pairType);
      markers.push(marker);
    }

    return markers;
  }

  /**
   * Create a single Lagrange point marker
   */
  private createLagrangeMarker(
    primary: Star,
    secondary: Star,
    pointIndex: 1 | 2 | 3 | 4 | 5,
    stable: boolean,
    pairType: 'starPlanet' | 'planetMoon'
  ): Star {
    const markerId = uuidv4();
    const label = `${secondary.name} L${pointIndex}`;

    // Calculate position based on point index
    // L4 and L5 are at ±60° from the secondary's phase
    // L1, L2, L3 are colinear (on the line between primary and secondary)
    
    const secondaryDistance = secondary.orbitalDistance;
    const secondaryPhase = secondary.orbitalPhase;
    const secondarySpeed = secondary.orbitalSpeed;

    let orbitalDistance: number;
    let orbitalPhase: number;
    let orbitalSpeed: number;

    if (pointIndex === 4) {
      // L4: 60° ahead of secondary
      orbitalDistance = secondaryDistance;
      orbitalPhase = (secondaryPhase + 60) % 360;
      orbitalSpeed = secondarySpeed;
    } else if (pointIndex === 5) {
      // L5: 60° behind secondary
      orbitalDistance = secondaryDistance;
      orbitalPhase = (secondaryPhase - 60 + 360) % 360;
      orbitalSpeed = secondarySpeed;
    } else {
      // L1, L2, L3: Use approximate formulas for circular restricted three-body problem
      // For simplicity, place them along the orbital radius with slight offsets
      const massRatio = secondary.mass / (primary.mass + secondary.mass);
      
      if (pointIndex === 1) {
        // L1: Between primary and secondary
        orbitalDistance = secondaryDistance * (1 - Math.cbrt(massRatio / 3));
      } else if (pointIndex === 2) {
        // L2: Beyond secondary
        orbitalDistance = secondaryDistance * (1 + Math.cbrt(massRatio / 3));
      } else {
        // L3: Opposite side of primary from secondary
        orbitalDistance = secondaryDistance * (1 + 5 * massRatio / 12);
      }

      // Same phase as secondary (colinear)
      if (pointIndex === 3) {
        // L3 is on the opposite side
        orbitalPhase = (secondaryPhase + 180) % 360;
      } else {
        orbitalPhase = secondaryPhase;
      }

      // Orbital speed calculated from distance
      orbitalSpeed = this.physics.calculateOrbitalSpeed(orbitalDistance);
    }

    // Color coding: unstable = orange/red, stable = green/blue
    const color = stable ? '#5BC95B' : '#FF8C42'; // Green for stable, orange for unstable

    const lagrangePointMeta: LagrangePointMeta = {
      primaryId: primary.id,
      secondaryId: secondary.id,
      pointIndex,
      stable,
      pairType,
      label,
    };

    return {
      id: markerId,
      name: label,
      mass: 0.001, // Negligible mass
      radius: 0.05, // Very small marker
      color,
      children: [],
      parentId: primary.id, // Lagrange points orbit the primary
      bodyType: 'lagrangePoint',
      lagrangePoint: lagrangePointMeta,
      orbitalDistance,
      orbitalSpeed,
      orbitalPhase,
      semiMajorAxis: orbitalDistance,
      eccentricity: secondary.eccentricity || 0, // Inherit eccentricity from secondary
      orbitRotX: secondary.orbitRotX,
      orbitRotY: secondary.orbitRotY,
      orbitRotZ: secondary.orbitRotZ,
    };
  }

  /**
   * Create Trojan bodies for a Lagrange point
   */
  private createTrojansForPoint(
    marker: Star,
    pair: { primary: Star; secondary: Star }
  ): Star[] {
    const trojans: Star[] = [];
    
    // Fork RNG for this Lagrange point
    const trojanRng = this.rng.fork(`trojan-${marker.id}`);

    // Sample number of Trojans
    const trojanCount = trojanRng.randInt(
      this.config.trojanCountRange[0],
      this.config.trojanCountRange[1]
    );

    for (let i = 0; i < trojanCount; i++) {
      const trojan = this.createTrojan(marker, pair, i, trojanRng);
      trojans.push(trojan);
    }

    return trojans;
  }

  /**
   * Create a single Trojan body
   */
  private createTrojan(
    marker: Star,
    pair: { primary: Star; secondary: Star },
    index: number,
    trojanRng: RandomGenerator
  ): Star {
    const trojanId = uuidv4();
    const lagrangeLabel = marker.lagrangePoint?.label || `L${marker.lagrangePoint?.pointIndex}`;
    const name = `${pair.secondary.name} ${lagrangeLabel} Trojan ${index + 1}`;

    // Generate physical properties based on body type
    const trojanPhysics = new PhysicsGenerator(this.config, trojanRng);
    const baseMass = trojanPhysics.generateMass(this.config.trojanBodyType);
    const mass = baseMass * this.config.trojanMassScale;
    const radius = trojanPhysics.generateRadius(mass);

    // Color: rocky/asteroid colors with variation
    const baseColors = ['#8B7355', '#A0826D', '#6B5D56', '#9C8F7A', '#7A6E5E'];
    const baseColor = trojanRng.choice(baseColors);
    const color = this.varyColor(baseColor, this.config.trojanColorVariation, trojanRng);

    // Orbital parameters: cluster around the Lagrange point with small offsets
    const orbitalDistance = marker.orbitalDistance + trojanRng.uniform(-0.1, 0.1);
    const orbitalPhase = (marker.orbitalPhase + trojanRng.uniform(-5, 5) + 360) % 360;
    const orbitalSpeed = this.physics.calculateOrbitalSpeed(orbitalDistance);

    return {
      id: trojanId,
      name,
      mass,
      radius,
      color,
      children: [],
      parentId: pair.primary.id,
      bodyType: this.config.trojanBodyType,
      lagrangeHostId: marker.id, // Link to Lagrange point
      orbitalDistance,
      orbitalSpeed,
      orbitalPhase,
      semiMajorAxis: orbitalDistance,
      eccentricity: marker.eccentricity,
      orbitRotX: marker.orbitRotX,
      orbitRotY: marker.orbitRotY,
      orbitRotZ: marker.orbitRotZ,
    };
  }

  /**
   * Vary a color slightly
   */
  private varyColor(hexColor: string, variation: number, rng: RandomGenerator): string {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    const vary = (value: number) => {
      const delta = Math.floor(rng.uniform(-40, 40) * variation);
      return Math.max(0, Math.min(255, value + delta));
    };

    const newR = vary(r);
    const newG = vary(g);
    const newB = vary(b);

    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }
}

// ============================================================================
// Protoplanetary Disk Generator (Visual-Only Particle Fields)
// ============================================================================

/**
 * Generates protoplanetary disks as visual-only particle fields around stars.
 * These are NOT Star objects - they are separate entities rendered as GPU particles.
 */
class ProtoplanetaryDiskGenerator {
  private config: GeneratorConfig;
  private rng: RandomGenerator;

  constructor(config: GeneratorConfig, rng: RandomGenerator) {
    this.config = config;
    this.rng = rng;
  }

  /**
   * Generate protoplanetary disks for all systems
   * @param stars - All stars in the universe
   * @param rootIds - Root system IDs
   * @returns Record of ProtoplanetaryDisk objects keyed by ID
   */
  generate(
    stars: Record<string, Star>,
    rootIds: string[]
  ): Record<string, ProtoplanetaryDisk> {
    if (!this.config.enableProtoplanetaryDisks) {
      return {};
    }

    const disks: Record<string, ProtoplanetaryDisk> = {};

    // Generate disks for each root system
    for (const rootId of rootIds) {
      const disk = this.generateDiskForSystem(stars, rootId);
      if (disk) {
        disks[disk.id] = disk;
      }
    }

    return disks;
  }

  /**
   * Generate a protoplanetary disk for a single system
   * @param stars - All stars
   * @param centerStarId - The central star of the system
   * @returns ProtoplanetaryDisk or null if not generated
   */
  private generateDiskForSystem(
    stars: Record<string, Star>,
    centerStarId: string
  ): ProtoplanetaryDisk | null {
    const centerStar = stars[centerStarId];
    if (!centerStar) return null;

    // Fork RNG for this system
    const diskRng = this.rng.fork(`disk-${centerStarId}`);

    // Check probability for having a disk
    const hasDisk = diskRng.bool(this.config.protoplanetaryDiskProbability);
    if (!hasDisk) return null;

    // Find the innermost and outermost planets for reference
    const planets = Object.values(stars).filter(
      s => s.parentId === centerStarId && s.bodyType === 'planet'
    );

    // Reference distances
    const innerRef = centerStar.radius * 2; // Just outside star
    let outerRef = 10; // Default outer reference
    if (planets.length > 0) {
      const sortedByOrbit = planets.sort((a, b) => a.orbitalDistance - b.orbitalDistance);
      const outermostDistance = sortedByOrbit[sortedByOrbit.length - 1].orbitalDistance;
      outerRef = Math.max(outerRef, outermostDistance * 1.5);
    }

    // Sample geometry
    const innerRadius = diskRng.uniform(
      this.config.protoplanetaryDiskInnerRadiusRange[0],
      this.config.protoplanetaryDiskInnerRadiusRange[1]
    );
    const outerRadius = diskRng.uniform(
      this.config.protoplanetaryDiskOuterRadiusRange[0],
      this.config.protoplanetaryDiskOuterRadiusRange[1]
    ) * (outerRef / 5); // Scale relative to system size
    const thickness = diskRng.uniform(
      this.config.protoplanetaryDiskThicknessRange[0],
      this.config.protoplanetaryDiskThicknessRange[1]
    );

    // Sample visual properties
    const particleCount = Math.floor(diskRng.uniform(
      this.config.protoplanetaryDiskParticleCountRange[0],
      this.config.protoplanetaryDiskParticleCountRange[1]
    ));
    const opacity = diskRng.uniform(
      this.config.protoplanetaryDiskOpacityRange[0],
      this.config.protoplanetaryDiskOpacityRange[1]
    );
    const brightness = diskRng.uniform(
      this.config.protoplanetaryDiskBrightnessRange[0],
      this.config.protoplanetaryDiskBrightnessRange[1]
    );
    const clumpiness = diskRng.uniform(
      this.config.protoplanetaryDiskClumpinessRange[0],
      this.config.protoplanetaryDiskClumpinessRange[1]
    );
    const rotationSpeedMultiplier = diskRng.uniform(
      this.config.protoplanetaryDiskRotationSpeedMultiplierRange[0],
      this.config.protoplanetaryDiskRotationSpeedMultiplierRange[1]
    );

    // Sample colors - warm dusty colors for the base, hotter/brighter for highlights
    const baseColors = [
      '#D4A574', // warm beige
      '#C9956C', // dusty orange
      '#B8860B', // dark goldenrod
      '#CD853F', // peru
      '#DAA520', // goldenrod
      '#E6BE8A', // pale gold
    ];
    const highlightColors = [
      '#FFE4B5', // moccasin
      '#FFDAB9', // peach puff
      '#FFD700', // gold
      '#FFA500', // orange
      '#FF8C00', // dark orange
      '#FFEBCD', // blanched almond
    ];

    const baseColor = diskRng.choice(baseColors);
    const highlightColor = diskRng.choice(highlightColors);

    // Determine style based on thickness and opacity
    let style: 'thin' | 'moderate' | 'thick' | 'extreme' = 'moderate';
    if (thickness < 0.3 && opacity < 0.4) {
      style = 'thin';
    } else if (thickness > 0.6 || opacity > 0.7) {
      style = thickness > 0.8 ? 'extreme' : 'thick';
    }

    // Generate disk ID and seed
    const diskId = uuidv4();
    const diskSeed = diskRng.randInt(0, 2147483647);

    // ========================================================================
    // Shader-Specific Visual Parameters (based on style + randomization)
    // ========================================================================
    
    // Style-based parameter ranges for realistic ALMA-like disk appearance
    const stylePresets = {
      thin: {
        bandStrength: [0.3, 0.5],
        bandFrequency: [4, 7],
        gapSharpness: [0.3, 0.5],
        innerGlowStrength: [0.4, 0.6],
        noiseScale: [1.0, 2.0],
        noiseStrength: [0.2, 0.4],
        spiralStrength: [0.0, 0.1],
        edgeSoftness: [0.4, 0.6],
        temperatureGradient: [1.2, 1.8],
      },
      moderate: {
        bandStrength: [0.4, 0.7],
        bandFrequency: [3, 6],
        gapSharpness: [0.4, 0.7],
        innerGlowStrength: [0.5, 0.8],
        noiseScale: [0.8, 1.8],
        noiseStrength: [0.3, 0.5],
        spiralStrength: [0.0, 0.2],
        edgeSoftness: [0.3, 0.5],
        temperatureGradient: [1.0, 2.0],
      },
      thick: {
        bandStrength: [0.5, 0.8],
        bandFrequency: [2, 5],
        gapSharpness: [0.5, 0.8],
        innerGlowStrength: [0.6, 0.9],
        noiseScale: [0.6, 1.5],
        noiseStrength: [0.4, 0.6],
        spiralStrength: [0.1, 0.3],
        edgeSoftness: [0.2, 0.4],
        temperatureGradient: [0.8, 1.5],
      },
      extreme: {
        bandStrength: [0.6, 0.95],
        bandFrequency: [2, 4],
        gapSharpness: [0.6, 0.9],
        innerGlowStrength: [0.7, 1.0],
        noiseScale: [0.5, 1.2],
        noiseStrength: [0.5, 0.8],
        spiralStrength: [0.2, 0.5],
        edgeSoftness: [0.15, 0.3],
        temperatureGradient: [0.6, 1.2],
      },
    };
    
    const preset = stylePresets[style];
    
    // Sample shader parameters from style-based ranges
    const bandStrength = diskRng.uniform(preset.bandStrength[0], preset.bandStrength[1]);
    const bandFrequency = Math.round(diskRng.uniform(preset.bandFrequency[0], preset.bandFrequency[1]));
    const gapSharpness = diskRng.uniform(preset.gapSharpness[0], preset.gapSharpness[1]);
    const innerGlowStrength = diskRng.uniform(preset.innerGlowStrength[0], preset.innerGlowStrength[1]);
    const noiseScale = diskRng.uniform(preset.noiseScale[0], preset.noiseScale[1]);
    const noiseStrength = diskRng.uniform(preset.noiseStrength[0], preset.noiseStrength[1]);
    const spiralStrength = diskRng.uniform(preset.spiralStrength[0], preset.spiralStrength[1]);
    const edgeSoftness = diskRng.uniform(preset.edgeSoftness[0], preset.edgeSoftness[1]);
    const temperatureGradient = diskRng.uniform(preset.temperatureGradient[0], preset.temperatureGradient[1]);
    
    // Spiral arm count: 1-3 arms, biased toward 2
    const spiralArmCount = spiralStrength > 0.05 
      ? (diskRng.uniform(0, 1) < 0.6 ? 2 : (diskRng.bool(0.5) ? 1 : 3))
      : 2;
    
    // Reduce particle count since shader now does the heavy lifting
    // Particles are now just for sparkle/dust overlay
    const sparkleParticleCount = Math.max(100, Math.floor(particleCount * 0.02)); // 2% of original

    return {
      id: diskId,
      systemId: centerStarId,
      centralStarId: centerStarId,
      innerRadius: Math.max(innerRadius, innerRef), // Ensure outside star
      outerRadius: Math.max(outerRadius, innerRadius + 1), // Ensure outer > inner
      thickness,
      particleCount: sparkleParticleCount, // Reduced for sparkle overlay only
      baseColor,
      highlightColor,
      opacity,
      brightness,
      clumpiness,
      rotationSpeedMultiplier,
      seed: diskSeed,
      style,
      name: `${centerStar.name} Protoplanetary Disk`,
      // Shader-specific visual parameters
      bandStrength,
      bandFrequency,
      gapSharpness,
      innerGlowStrength,
      noiseScale,
      noiseStrength,
      spiralStrength,
      spiralArmCount,
      edgeSoftness,
      temperatureGradient,
    };
  }
}

// ============================================================================
// Nebula Generator (Galaxy-Scale Visual-Only Volumetric Regions)
// ============================================================================

/**
 * Generates large volumetric nebula regions at galaxy/universe scale.
 * These are visual-only fields that sit mostly between or around galaxy groups,
 * not as circumstellar features. They are highly visible and meant for scene composition.
 */
class NebulaGenerator {
  private config: GeneratorConfig;
  private rng: RandomGenerator;

  constructor(config: GeneratorConfig, rng: RandomGenerator) {
    this.config = config;
    this.rng = rng;
  }

  /**
   * Generate nebulae for the universe at group scale.
   * @param groups - All groups in the universe
   * @param rootGroupIds - Root group IDs
   * @param stars - All stars (for deriving system extents if no groups)
   * @param rootIds - Root star IDs (fallback if no grouping)
   * @returns Record of NebulaRegion objects keyed by ID
   */
  generate(
    groups: Record<string, Group>,
    rootGroupIds: string[],
    stars: Record<string, Star>,
    rootIds: string[]
  ): Record<string, NebulaRegion> {
    if (!this.config.enableNebulae) {
      return {};
    }

    const nebulae: Record<string, NebulaRegion> = {};

    // Decide nebula count based on density slider
    const targetCount = this.calculateNebulaCount();
    
    if (targetCount === 0) {
      return {};
    }

    // Precompute group/cluster extents for spatial placement
    const clusterCenters = this.computeClusterCenters(groups, rootGroupIds, stars, rootIds);

    if (clusterCenters.length === 0) {
      // No spatial reference, place nebulae at random positions
      for (let i = 0; i < targetCount; i++) {
        const nebula = this.createRandomNebula(i);
        nebulae[nebula.id] = nebula;
      }
    } else {
      // Place nebulae outside clusters
      for (let i = 0; i < targetCount; i++) {
        const nebula = this.createNebulaOutsideClusters(i, clusterCenters);
        nebulae[nebula.id] = nebula;
      }
    }

    return nebulae;
  }

  /**
   * Calculate target nebula count based on density and range
   */
  private calculateNebulaCount(): number {
    const [minCount, maxCount] = this.config.nebulaCountRange;
    const density = this.config.nebulaDensity;
    
    // Map density 0-1 to count range with geometric scaling
    // density 0 → minCount, density 1 → maxCount (with some nonlinearity)
    const t = Math.pow(density, 0.8); // Slight nonlinearity
    const targetCount = Math.round(minCount + t * (maxCount - minCount));
    
    return targetCount;
  }

  /**
   * Compute cluster centers from groups or stars
   */
  private computeClusterCenters(
    groups: Record<string, Group>,
    rootGroupIds: string[],
    stars: Record<string, Star>,
    rootIds: string[]
  ): Array<{ position: Position; radius: number; groupId?: string }> {
    const centers: Array<{ position: Position; radius: number; groupId?: string }> = [];

    if (rootGroupIds.length > 0) {
      // Use group positions and estimate radius
      rootGroupIds.forEach(groupId => {
        const group = groups[groupId];
        if (group?.position) {
          centers.push({
            position: group.position,
            radius: this.config.groupPositionSigma * 1.5, // Approximate cluster extent
            groupId: group.id,
          });
        }
      });
    } else if (rootIds.length > 0) {
      // Fallback: create synthetic clusters from root star positions
      // (In practice, stars are at origin unless grouping is enabled, so this is mostly for completeness)
      const clusterSize = 50; // Default radius
      rootIds.forEach((rootId, index) => {
        centers.push({
          position: { x: 0, y: 0, z: 0 }, // Stars default to origin
          radius: clusterSize,
        });
      });
    }

    return centers;
  }

  /**
   * Create a nebula positioned outside cluster regions
   */
  private createNebulaOutsideClusters(
    index: number,
    clusterCenters: Array<{ position: Position; radius: number; groupId?: string }>
  ): NebulaRegion {
    // Fork RNG for this nebula
    const nebulaRng = this.rng.fork(`nebula-${index}`);

    // Pick a "host" cluster to position relative to
    const hostCluster = nebulaRng.choice(clusterCenters);
    
    // Sample distance from host cluster
    const [minDist, maxDist] = this.config.nebulaDistanceFromGroups;
    const distance = nebulaRng.uniform(minDist, maxDist);

    // Sample random direction (uniform on sphere)
    const theta = nebulaRng.uniform(0, Math.PI * 2);
    const phi = Math.acos(nebulaRng.uniform(-1, 1));
    
    const dirX = Math.sin(phi) * Math.cos(theta);
    const dirY = Math.sin(phi) * Math.sin(theta);
    const dirZ = Math.cos(phi);

    // Compute nebula position
    const position: Position = {
      x: hostCluster.position.x + dirX * distance,
      y: hostCluster.position.y + dirY * distance,
      z: hostCluster.position.z + dirZ * distance,
    };

    // Sample geometry and visual parameters
    return this.createNebulaAtPosition(index, position, hostCluster.groupId ? [hostCluster.groupId] : undefined, nebulaRng);
  }

  /**
   * Create a nebula at a random position (no clusters available)
   */
  private createRandomNebula(index: number): NebulaRegion {
    // Fork RNG for this nebula
    const nebulaRng = this.rng.fork(`nebula-${index}`);

    // Random position in a VERY large spherical shell (far background)
    const minDistance = 1000; // Very far from origin
    const maxDistance = 2500; // Extreme distance for pure background
    
    // Sample distance and direction
    const distance = nebulaRng.uniform(minDistance, maxDistance);
    const theta = nebulaRng.uniform(0, Math.PI * 2);
    const phi = Math.acos(nebulaRng.uniform(-1, 1));
    
    const position: Position = {
      x: distance * Math.sin(phi) * Math.cos(theta),
      y: distance * Math.sin(phi) * Math.sin(theta),
      z: distance * Math.cos(phi),
    };

    return this.createNebulaAtPosition(index, position, undefined, nebulaRng);
  }

  /**
   * Create a nebula with full parameters at a given position
   */
  private createNebulaAtPosition(
    index: number,
    position: Position,
    associatedGroupIds: string[] | undefined,
    nebulaRng: RandomGenerator
  ): NebulaRegion {
    // Sample geometry
    const radius = nebulaRng.uniform(
      this.config.nebulaSizeRange[0],
      this.config.nebulaSizeRange[1]
    );

    const thicknessFactor = nebulaRng.uniform(
      this.config.nebulaThicknessRange[0],
      this.config.nebulaThicknessRange[1]
    );

    // Decide if ellipsoid or sphere
    const isEllipsoid = thicknessFactor !== 1.0 || nebulaRng.bool(0.3); // 30% chance of ellipsoid even if thickness=1

    let dimensions: { x: number; y: number; z: number } | undefined;
    if (isEllipsoid) {
      // Create ellipsoidal dimensions
      // thicknessFactor < 1 → disk-like, thicknessFactor > 1 → cigar-like
      const xRad = radius;
      const yRad = radius * thicknessFactor;
      const zRad = radius * nebulaRng.uniform(0.8, 1.2); // Slight variation
      
      dimensions = { x: xRad, y: yRad, z: zRad };
    }

    // Sample visual parameters
    const density = nebulaRng.uniform(
      this.config.nebulaDensityRange[0],
      this.config.nebulaDensityRange[1]
    );

    const brightness = nebulaRng.uniform(
      this.config.nebulaBrightnessRange[0],
      this.config.nebulaBrightnessRange[1]
    );

    // Pick color palette
    const palette = nebulaRng.choice(this.config.nebulaColorPalettes);

    const noiseScale = nebulaRng.uniform(
      this.config.nebulaNoiseScaleRange[0],
      this.config.nebulaNoiseScaleRange[1]
    );

    const noiseDetail = Math.floor(nebulaRng.uniform(
      this.config.nebulaNoiseDetailRange[0],
      this.config.nebulaNoiseDetailRange[1]
    ));

    // Generate seed for per-nebula PRNG
    const seed = nebulaRng.randInt(0, 2147483647);

    // Generate name
    const name = this.generateNebulaName(index);

    const nebulaId = uuidv4();

    return {
      id: nebulaId,
      name,
      position,
      radius,
      dimensions,
      density,
      brightness,
      baseColor: palette.base,
      accentColor: palette.accent,
      noiseScale,
      noiseDetail,
      associatedGroupIds,
      seed,
      visible: true,
    };
  }

  /**
   * Generate a nebula name
   */
  private generateNebulaName(index: number): string {
    const names = [
      'Orion Nebula',
      'Eagle Nebula',
      'Horsehead Nebula',
      'Carina Nebula',
      'Helix Nebula',
      'Ring Nebula',
      'Crab Nebula',
      'Lagoon Nebula',
      'Trifid Nebula',
      'Rosette Nebula',
      'Veil Nebula',
      'Pillars of Creation',
      'Cat\'s Eye Nebula',
      'Tarantula Nebula',
      'Omega Nebula',
      'North America Nebula',
      'Crescent Nebula',
      'Dumbbell Nebula',
      'Butterfly Nebula',
      'Iris Nebula',
    ];

    if (index < names.length) {
      return names[index];
    }

    // Generate alphanumeric designations
    const catalogPrefix = ['NGC', 'IC', 'M', 'SH2', 'LDN', 'VdB'];
    const prefix = this.rng.choice(catalogPrefix);
    const number = 100 + index;
    return `${prefix} ${number}`;
  }
}

// ============================================================================
// Rogue Planet Generator (Unbound Planets Traversing the Universe)
// ============================================================================

/**
 * Generates rogue planets - planet-sized bodies not gravitationally bound to any star,
 * which freely traverse the scene using linear drift motion.
 */
class RoguePlanetGenerator {
  private config: GeneratorConfig;
  private rng: RandomGenerator;
  private physics: PhysicsGenerator;

  constructor(config: GeneratorConfig, rng: RandomGenerator) {
    this.config = config;
    this.rng = rng;
    this.physics = new PhysicsGenerator(config, rng);
  }

  /**
   * Generate rogue planets for the universe.
   * @param groups - All groups in the universe (for position reference)
   * @param rootGroupIds - Root group IDs
   * @param stars - All stars (for fallback position reference)
   * @param rootIds - Root star IDs
   * @returns Array of rogue planet Star objects
   */
  generate(
    groups: Record<string, Group>,
    rootGroupIds: string[],
    stars: Record<string, Star>,
    rootIds: string[]
  ): Star[] {
    if (!this.config.enableRoguePlanets) {
      return [];
    }

    const roguePlanets: Star[] = [];

    // Decide rogue planet count
    const targetCount = this.rng.randInt(
      this.config.roguePlanetCountRange[0],
      this.config.roguePlanetCountRange[1]
    );

    if (targetCount === 0) {
      return [];
    }

    // Precompute reference positions (groups or origin)
    const referencePositions = this.computeReferencePositions(groups, rootGroupIds, stars, rootIds);

    // Generate each rogue planet
    for (let i = 0; i < targetCount; i++) {
      const rogue = this.createRoguePlanet(i, referencePositions);
      roguePlanets.push(rogue);
    }

    return roguePlanets;
  }

  /**
   * Compute reference positions for rogue planet placement
   */
  private computeReferencePositions(
    groups: Record<string, Group>,
    rootGroupIds: string[],
    stars: Record<string, Star>,
    rootIds: string[]
  ): Array<Position> {
    const positions: Position[] = [];

    if (rootGroupIds.length > 0) {
      // Use group positions as references
      rootGroupIds.forEach(groupId => {
        const group = groups[groupId];
        if (group?.position) {
          positions.push(group.position);
        }
      });
    }

    // If no groups, use origin or add scattered positions
    if (positions.length === 0) {
      positions.push({ x: 0, y: 0, z: 0 });
    }

    return positions;
  }

  /**
   * Create a single rogue planet
   */
  private createRoguePlanet(
    index: number,
    referencePositions: Array<Position>
  ): Star {
    // Fork RNG for this rogue planet
    const rogueRng = this.rng.fork(`rogue-planet-${index}`);
    const roguePhysics = new PhysicsGenerator(this.config, rogueRng);

    // Pick a reference position
    const refPos = rogueRng.choice(referencePositions);

    // Sample distance from reference
    const distance = rogueRng.uniform(
      this.config.roguePlanetDistanceRange[0],
      this.config.roguePlanetDistanceRange[1]
    );

    // Sample random direction (uniform on sphere)
    const theta = rogueRng.uniform(0, Math.PI * 2);
    const phi = Math.acos(rogueRng.uniform(-1, 1));

    const dirX = Math.sin(phi) * Math.cos(theta);
    const dirY = Math.sin(phi) * Math.sin(theta);
    const dirZ = Math.cos(phi);

    // Initial position
    const initialPosition = {
      x: refPos.x + dirX * distance,
      y: refPos.y + dirY * distance,
      z: refPos.z + dirZ * distance,
    };

    // Sample drift velocity
    const speed = rogueRng.uniform(
      this.config.roguePlanetSpeedRange[0],
      this.config.roguePlanetSpeedRange[1]
    );

    // Sample velocity direction with inclination limit (diverse directions)
    const velTheta = rogueRng.uniform(0, Math.PI * 2);
    const inclinationRad = (this.config.roguePlanetInclinationMax * Math.PI) / 180;
    const velPhi = Math.acos(rogueRng.uniform(Math.cos(inclinationRad), 1));

    const velDirX = Math.sin(velPhi) * Math.cos(velTheta);
    const velDirY = Math.sin(velPhi) * Math.sin(velTheta);
    const velDirZ = Math.cos(velPhi);

    const velocity = {
      x: velDirX * speed,
      y: velDirY * speed,
      z: velDirZ * speed,
    };

    // Generate physical properties (planet-sized)
    const mass = roguePhysics.generateMass('planet');
    const radius = roguePhysics.generateRadius(mass);
    const baseColor = roguePhysics.generateColor(mass, 'planet');

    // Apply color variation
    const color = this.varyColor(baseColor, this.config.roguePlanetColorVariation, rogueRng);

    // ============================================================================
    // Curved / Elliptical Trajectory Generation
    // ============================================================================
    
    // Determine if this rogue should have a curved path
    let pathCurvature = 0;
    let semiMajorAxis: number | undefined;
    let eccentricity: number | undefined;
    let orbitRotX: number | undefined;
    let orbitRotY: number | undefined;
    let orbitRotZ: number | undefined;
    let pathPeriod: number | undefined;
    
    // Sample curvature based on trajectory mode
    const curvatureMin = this.config.roguePlanetCurvatureRange[0];
    const curvatureMax = this.config.roguePlanetCurvatureRange[1];
    
    if (this.config.roguePlanetTrajectoryMode === 'linearOnly') {
      pathCurvature = 0;
    } else if (this.config.roguePlanetTrajectoryMode === 'mostlyCurved') {
      // Bias toward high curvature
      const biasedSample = Math.pow(rogueRng.uniform(0, 1), 0.5); // Square root bias
      pathCurvature = curvatureMin + biasedSample * (curvatureMax - curvatureMin);
    } else {
      // Mixed: uniform distribution
      pathCurvature = rogueRng.uniform(curvatureMin, curvatureMax);
    }
    
    // If curved, generate elliptical path parameters
    if (pathCurvature > 0) {
      // Sample semi-major axis
      semiMajorAxis = rogueRng.uniform(
        this.config.roguePlanetSemiMajorAxisRange[0],
        this.config.roguePlanetSemiMajorAxisRange[1]
      );
      
      // Sample eccentricity (higher curvature → more eccentric)
      const eMin = this.config.roguePlanetEccentricityRange[0];
      const eMax = this.config.roguePlanetEccentricityRange[1];
      eccentricity = eMin + pathCurvature * (eMax - eMin);
      
      // Sample 3D orientation (inclination and rotation)
      // Use diverse random orientations
      orbitRotX = rogueRng.uniform(0, this.config.roguePlanetInclinationMax);
      orbitRotY = rogueRng.uniform(0, 360);
      orbitRotZ = rogueRng.uniform(0, 360);
      
      // Sample path period
      pathPeriod = rogueRng.uniform(
        this.config.roguePlanetPathPeriodRange[0],
        this.config.roguePlanetPathPeriodRange[1]
      );
    }

    // Create rogue planet metadata
    const roguePlanetMeta = {
      seed: rogueRng.randInt(0, 2147483647),
      initialPosition,
      velocity,
      colorOverride: color !== baseColor ? color : undefined,
      
      // Curved trajectory parameters (optional, for backwards compatibility)
      pathCurvature: pathCurvature > 0 ? pathCurvature : undefined,
      semiMajorAxis,
      eccentricity,
      orbitRotX,
      orbitRotY,
      orbitRotZ,
      pathPeriod,
      
      // Trajectory visualization settings (use global defaults)
      showTrajectory: this.config.roguePlanetShowTrajectories,
      trajectoryPastWindow: this.config.roguePlanetTrajectoryPastWindow,
      trajectoryFutureWindow: this.config.roguePlanetTrajectoryFutureWindow,
    };

    // Generate name
    const name = this.generateRoguePlanetName(index);

    const rogueId = uuidv4();

    return {
      id: rogueId,
      name,
      mass,
      radius,
      color,
      children: [],
      parentId: null,  // No parent - not bound to any star
      bodyType: 'planet',
      isRoguePlanet: true,
      roguePlanet: roguePlanetMeta,
      // Set orbital parameters to zero/default (not used for rogues)
      orbitalDistance: 0,
      orbitalSpeed: 0,
      orbitalPhase: 0,
    };
  }

  /**
   * Vary a color by a given amount
   */
  private varyColor(hexColor: string, variation: number, rng: RandomGenerator): string {
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    const vary = (value: number) => {
      const delta = rng.uniform(-variation * 60, variation * 60);
      return Math.max(0, Math.min(255, Math.round(value + delta)));
    };

    const newR = vary(r);
    const newG = vary(g);
    const newB = vary(b);

    return `#${newR.toString(16).padStart(2, '0')}${newG
      .toString(16)
      .padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  /**
   * Generate a rogue planet name
   */
  private generateRoguePlanetName(index: number): string {
    const prefixes = [
      'Nomad',
      'Wanderer',
      'Vagrant',
      'Drifter',
      'Outcast',
      'Exile',
      'Stray',
      'Hermit',
      'Voyager',
      'Rover',
      'Wayfarer',
      'Rambler',
    ];

    if (index < prefixes.length) {
      return `${prefixes[index]}`;
    }

    // Generate alphanumeric designations
    const catalogPrefix = ['RG', 'WISE J', 'PSO J', '2MASS J', 'CFBDS'];
    const prefix = this.rng.choice(catalogPrefix);
    const number = 1000 + index;
    return `${prefix}${number}`;
  }
}

// ============================================================================
// Main Generator Function
// ============================================================================

/**
 * Generate a complete solar system with stars and optional groups.
 * @param seed - Optional seed for deterministic generation. Can be string or number.
 * @param config - Optional configuration overrides.
 */
export function generateSolarSystem(
  seed?: string | number,
  config: Partial<GeneratorConfig> = {}
): {
  stars: Record<string, Star>;
  rootIds: string[];
  groups: Record<string, Group>;
  rootGroupIds: string[];
  belts: Record<string, AsteroidBelt>;
  smallBodyFields: Record<string, SmallBodyField>;
  protoplanetaryDisks: Record<string, ProtoplanetaryDisk>;
  nebulae: Record<string, NebulaRegion>;
} {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Create deterministic RNG from seed, or use random seed
  const actualSeed = seed ?? Date.now();
  const masterRng = createPRNG(actualSeed);
  
  // Fork RNGs for different subsystems
  const lsystemRng = new RandomGenerator(masterRng.fork('lsystem'));
  const starDataRng = new RandomGenerator(masterRng.fork('stardata'));
  const groupRng = new RandomGenerator(masterRng.fork('groups'));
  const beltRng = new RandomGenerator(masterRng.fork('belts'));
  const kuiperRng = new RandomGenerator(masterRng.fork('kuiper'));
  const ringRng = new RandomGenerator(masterRng.fork('rings'));
  const cometRng = new RandomGenerator(masterRng.fork('comets'));
  const lagrangeRng = new RandomGenerator(masterRng.fork('lagrange'));
  const diskRng = new RandomGenerator(masterRng.fork('protoplanetary-disks'));
  const nebulaRng = new RandomGenerator(masterRng.fork('nebulae'));
  
  // 1. Generate L-System topology
  const lsystem = new LSystemGenerator(fullConfig, lsystemRng);
  const tree = lsystem.generate();
  
  // 2. Convert to Star data with physical properties and orbits
  const starGen = new StarDataGenerator(fullConfig, starDataRng);
  const systemData = starGen.convertToStars(tree);
  
  // 3. Build children arrays for stars
  const starMap: Record<string, Star> = {};
  systemData.stars.forEach(star => {
    starMap[star.id] = star;
  });
  
  // Populate children arrays
  systemData.stars.forEach(star => {
    if (star.parentId && starMap[star.parentId]) {
      starMap[star.parentId].children.push(star.id);
    }
  });
  
  // 4. Generate asteroid belt particle fields (if enabled)
  console.log('[generateSolarSystem] Generating asteroid belt fields...');
  const beltGen = new AsteroidBeltGenerator(fullConfig, beltRng);
  const beltMap: Record<string, AsteroidBelt> = {};  // Legacy, kept empty for backwards compat
  const smallBodyFieldMap: Record<string, SmallBodyField> = {};
  
  // For each root system, generate belt fields
  systemData.rootIds.forEach((rootId, systemIndex) => {
    const systemId = `system-${systemIndex}`;
    const { fields } = beltGen.generate(systemData.stars, rootId, systemId);
    
    // Add belt fields to the map
    fields.forEach(field => {
      smallBodyFieldMap[field.id] = field;
    });
  });
  
  console.log('[generateSolarSystem] Total main belt fields created:', Object.values(smallBodyFieldMap).filter(f => f.beltType === 'main').length);

  // 5. Generate Kuiper belt particle fields (if enabled)
  console.log('[generateSolarSystem] Generating Kuiper belt fields...');
  const kuiperGen = new KuiperBeltGenerator(fullConfig, kuiperRng);
  
  systemData.rootIds.forEach((rootId, systemIndex) => {
    const systemId = `system-${systemIndex}`;
    const { fields } = kuiperGen.generate(systemData.stars, rootId, systemId);
    
    // Add Kuiper belt fields to the map
    fields.forEach(field => {
      smallBodyFieldMap[field.id] = field;
    });
  });
  
  console.log('[generateSolarSystem] Total Kuiper belt fields created:', Object.values(smallBodyFieldMap).filter(f => f.beltType === 'kuiper').length);
  console.log('[generateSolarSystem] Total small body fields:', Object.keys(smallBodyFieldMap).length);

  // 6. Generate planetary rings (if enabled)
  const ringGen = new PlanetaryRingGenerator(fullConfig, ringRng);
  systemData.rootIds.forEach((rootId) => {
    ringGen.generate(systemData.stars, rootId);
  });

  // 7. Generate comets (if enabled)
  const cometGen = new CometGenerator(fullConfig, cometRng);
  systemData.rootIds.forEach((rootId) => {
    const comets = cometGen.generate(systemData.stars, rootId);
    
    // Add comets to the star map
    comets.forEach((comet) => {
      starMap[comet.id] = comet;
      // Add comet to parent's children array
      if (comet.parentId && starMap[comet.parentId]) {
        starMap[comet.parentId].children.push(comet.id);
      }
    });
  });
  
  // 8. Generate Lagrange points and Trojans (if enabled)
  const lagrangeGen = new LagrangePointGenerator(fullConfig, lagrangeRng);
  systemData.rootIds.forEach((rootId) => {
    const lagrangeBodies = lagrangeGen.generate(starMap, rootId);
    
    // Add Lagrange markers and Trojans to the star map
    lagrangeBodies.forEach((body) => {
      starMap[body.id] = body;
      // Add to parent's children array
      if (body.parentId && starMap[body.parentId]) {
        starMap[body.parentId].children.push(body.id);
      }
    });
  });
  
  // 9. Generate protoplanetary disks (visual-only, if enabled)
  const diskGen = new ProtoplanetaryDiskGenerator(fullConfig, diskRng);
  const diskMap = diskGen.generate(starMap, systemData.rootIds);
  
  // 10. Generate groups (optional)
  const groupGen = new GroupGenerator(fullConfig, groupRng);
  const groupList = groupGen.generate(systemData.rootIds);
  
  const groupMap: Record<string, Group> = {};
  groupList.forEach(group => {
    groupMap[group.id] = group;
  });
  
  const rootGroupIds = groupList
    .filter(g => g.parentGroupId === null)
    .map(g => g.id);
  
  // 11. Generate nebulae (galaxy-scale visual regions, if enabled)
  const nebulaGen = new NebulaGenerator(fullConfig, nebulaRng);
  const nebulaMap = nebulaGen.generate(groupMap, rootGroupIds, starMap, systemData.rootIds);
  
  // 12. Generate rogue planets (unbound planets, if enabled)
  const rogueRng = new RandomGenerator(masterRng.fork('rogue-planets'));
  const rogueGen = new RoguePlanetGenerator(fullConfig, rogueRng);
  const roguePlanets = rogueGen.generate(groupMap, rootGroupIds, starMap, systemData.rootIds);
  
  // Add rogue planets to the star map (they are root-level, not attached to any system)
  roguePlanets.forEach((rogue) => {
    starMap[rogue.id] = rogue;
    // Don't add to rootIds - rogue planets are tracked separately
  });
  
  return {
    stars: starMap,
    rootIds: systemData.rootIds,
    groups: groupMap,
    rootGroupIds,
    belts: beltMap,  // Legacy, kept empty
    smallBodyFields: smallBodyFieldMap,
    protoplanetaryDisks: diskMap,
    nebulae: nebulaMap,
  };
}

/**
 * Generate multiple systems with optional seed for reproducibility.
 * @param count - Number of systems to generate.
 * @param seed - Optional seed for deterministic generation. Can be string or number.
 * @param config - Optional configuration overrides.
 */
export function generateMultipleSystems(
  count: number,
  seed?: string | number,
  config: Partial<GeneratorConfig> = {}
): {
  stars: Record<string, Star>;
  rootIds: string[];
  groups: Record<string, Group>;
  rootGroupIds: string[];
  belts: Record<string, AsteroidBelt>;
  smallBodyFields: Record<string, SmallBodyField>;
  protoplanetaryDisks: Record<string, ProtoplanetaryDisk>;
  nebulae: Record<string, NebulaRegion>;
} {
  const fullConfig = { ...DEFAULT_CONFIG, ...config, enableGrouping: true };
  
  const allStars: Record<string, Star> = {};
  const allRootIds: string[] = [];
  const allBelts: Record<string, AsteroidBelt> = {};
  const allSmallBodyFields: Record<string, SmallBodyField> = {};
  const allDisks: Record<string, ProtoplanetaryDisk> = {};
  const allNebulae: Record<string, NebulaRegion> = {};
  
  // Use seed to create deterministic sequence for multiple systems
  const actualSeed = seed ?? Date.now();
  const masterRng = createPRNG(actualSeed);
  
  // Generate multiple systems
  for (let i = 0; i < count; i++) {
    // Each system gets its own forked seed
    const systemSeed = masterRng.int(0, 2147483647);
    const system = generateSolarSystem(systemSeed, { ...fullConfig, enableGrouping: false });
    Object.assign(allStars, system.stars);
    Object.assign(allBelts, system.belts);
    Object.assign(allSmallBodyFields, system.smallBodyFields);
    Object.assign(allDisks, system.protoplanetaryDisks);
    Object.assign(allNebulae, system.nebulae);
    allRootIds.push(...system.rootIds);
  }
  
  // Generate groups to organize systems
  const groupRng = new RandomGenerator(masterRng.fork('groups'));
  const groupGen = new GroupGenerator(fullConfig, groupRng);
  const groupList = groupGen.generate(allRootIds);
  
  const groupMap: Record<string, Group> = {};
  groupList.forEach(group => {
    groupMap[group.id] = group;
  });
  
  const rootGroupIds = groupList
    .filter(g => g.parentGroupId === null)
    .map(g => g.id);
  
  // Generate nebulae at universe scale (after groups are established)
  const nebulaRng = new RandomGenerator(masterRng.fork('nebulae'));
  const nebulaGen = new NebulaGenerator(fullConfig, nebulaRng);
  const nebulaMap = nebulaGen.generate(groupMap, rootGroupIds, allStars, allRootIds);
  Object.assign(allNebulae, nebulaMap);
  
  // Generate rogue planets at universe scale (after all systems and groups)
  const rogueRng = new RandomGenerator(masterRng.fork('rogue-planets'));
  const rogueGen = new RoguePlanetGenerator(fullConfig, rogueRng);
  const roguePlanets = rogueGen.generate(groupMap, rootGroupIds, allStars, allRootIds);
  
  // Add rogue planets to the star map (they are not part of any root system)
  roguePlanets.forEach((rogue) => {
    allStars[rogue.id] = rogue;
  });
  
  return {
    stars: allStars,
    rootIds: allRootIds,
    groups: groupMap,
    rootGroupIds,
    belts: allBelts,
    smallBodyFields: allSmallBodyFields,
    protoplanetaryDisks: allDisks,
    nebulae: allNebulae,
  };
}

// Export config type for external use
export type { GeneratorConfig };
export { DEFAULT_CONFIG };

