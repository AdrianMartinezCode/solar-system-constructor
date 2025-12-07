import { v4 as uuidv4 } from 'uuid';
import { Star, Group, GroupChild, Position, AsteroidBelt, PlanetaryRing, CometMeta, LagrangePointMeta } from '../types';
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
  
  /**
   * Create a forked RNG with a label
   */
  fork(label: string): RandomGenerator {
    return new RandomGenerator(this.rng.fork(label));
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
   */
  generateColor(mass: number, type: NodeType | 'asteroid' | 'comet'): string {
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
      // Asteroids are rocky grays and browns
      const colors = ['#8B7355', '#A0826D', '#6B5D52', '#998877', '#7A6A5C'];
      return this.rng.choice(colors);
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
    
    // Generate masses for all stars first
    const starData = starNodes.map(node => ({
      node,
      mass: this.physics.generateMass('star'),
    }));
    
    // Sort by mass descending - heaviest becomes center
    starData.sort((a, b) => b.mass - a.mass);
    
    // Process center star (heaviest)
    const centerData = starData[0];
    const centerStar = this.createStar(
      centerData.node,
      null,
      0,
      0,
      0,
      centerData.mass
    );
    stars.push(centerStar);
    
    // Process companion stars
    const companionStars = starData.slice(1);
    const isMultiStar = companionStars.length > 0;
    
    companionStars.forEach((companionData, index) => {
      const distance = this.physics.calculateOrbitalDistance(0); // All companions at same orbit
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
    
    // Process planets (attached to center star)
    const planetNodes = centerData.node.children.filter(n => n.type === 'planet');
    planetNodes.forEach((planetNode, index) => {
      const planetStars = this.processPlanet(
        planetNode,
        centerStar.id,
        index + companionStars.length // Offset orbit index by number of companion stars
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
// Asteroid Belt Generator
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
   * Generate asteroid belts for a given system
   * @param stars - All stars in the system
   * @param centerStarId - The central star ID
   * @returns Array of AsteroidBelt objects and new asteroid Star objects
   */
  generate(stars: Star[], centerStarId: string): { belts: AsteroidBelt[]; asteroids: Star[] } {
    if (!this.config.enableAsteroidBelts || this.config.beltPlacementMode === 'none') {
      return { belts: [], asteroids: [] };
    }
    
    const belts: AsteroidBelt[] = [];
    const asteroids: Star[] = [];
    
    // Find planets orbiting the center star
    const planets = stars.filter(s => s.parentId === centerStarId && s.bodyType !== 'star');
    
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
          const belt = this.createBeltBetweenPlanets(innerPlanet, outerPlanet, centerStarId, beltsCreated);
          const beltAsteroids = this.generateAsteroidsForBelt(belt);
          
          belts.push(belt);
          asteroids.push(...beltAsteroids);
          beltsCreated++;
        }
      }
    }
    
    if ((this.config.beltPlacementMode === 'outerBelt' || this.config.beltPlacementMode === 'both') 
        && beltsCreated < this.config.maxBeltsPerSystem
        && sortedPlanets.length > 0) {
      // Create a Kuiper-like outer belt
      const outermostPlanet = sortedPlanets[sortedPlanets.length - 1];
      const belt = this.createOuterBelt(outermostPlanet, centerStarId, beltsCreated);
      const beltAsteroids = this.generateAsteroidsForBelt(belt);
      
      belts.push(belt);
      asteroids.push(...beltAsteroids);
      beltsCreated++;
    }
    
    return { belts, asteroids };
  }
  
  /**
   * Create a belt between two planets
   */
  private createBeltBetweenPlanets(innerPlanet: Star, outerPlanet: Star, parentId: string, index: number): AsteroidBelt {
    const r1 = innerPlanet.orbitalDistance;
    const r2 = outerPlanet.orbitalDistance;
    const gap = r2 - r1;
    
    // Place belt in the middle portion of the gap
    const innerRadius = r1 + gap * this.config.beltInnerGapScale;
    const outerRadius = r1 + gap * this.config.beltOuterGapScale;
    
    return this.createBelt(parentId, innerRadius, outerRadius, index, 'Main Belt');
  }
  
  /**
   * Create an outer belt beyond the last planet
   */
  private createOuterBelt(outermostPlanet: Star, parentId: string, index: number): AsteroidBelt {
    const rMax = outermostPlanet.orbitalDistance;
    const innerRadius = rMax * this.config.beltOuterMultiplier;
    const outerRadius = innerRadius * 1.5; // Belt width is 50% of inner radius
    
    return this.createBelt(parentId, innerRadius, outerRadius, index, 'Kuiper Belt');
  }
  
  /**
   * Create a belt with given parameters
   */
  private createBelt(parentId: string, innerRadius: number, outerRadius: number, index: number, namePrefix: string): AsteroidBelt {
    const beltId = uuidv4();
    
    // Generate belt properties
    const eccentricity = this.rng.uniform(
      this.config.beltEccentricityRange[0],
      this.config.beltEccentricityRange[1]
    );
    const inclination = this.rng.uniform(0, (this.config.inclinationMax ?? 0) * 0.5); // Belts have lower inclination
    
    // Determine asteroid count using geometric distribution
    const baseCount = this.rng.geometric(this.config.beltAsteroidGeometricP);
    const asteroidCount = Math.max(
      this.config.beltMinCount,
      Math.min(this.config.beltMaxCount, baseCount)
    );
    
    // Generate belt color (grayish-brown)
    const baseColor = '#8B7355';
    
    return {
      id: beltId,
      name: `${namePrefix} ${index + 1}`,
      parentId,
      innerRadius,
      outerRadius,
      thickness: this.config.beltThickness,
      eccentricity,
      inclination,
      asteroidCount,
      asteroidIds: [], // Will be populated when asteroids are created
      color: baseColor,
      seed: this.rng.randInt(0, 2147483647),
    };
  }
  
  /**
   * Generate individual asteroids for a belt
   */
  private generateAsteroidsForBelt(belt: AsteroidBelt): Star[] {
    const asteroids: Star[] = [];
    
    // Fork RNG for this specific belt to ensure determinism
    const beltRng = this.rng.fork(`belt-${belt.id}`);
    const beltPhysics = new PhysicsGenerator(this.config, beltRng);
    
    for (let i = 0; i < belt.asteroidCount; i++) {
      const asteroidId = uuidv4();
      
      // Sample position within the belt
      const radialDistance = beltRng.uniform(belt.innerRadius, belt.outerRadius);
      const angle = beltRng.uniform(0, 360);
      const verticalOffset = beltRng.normal(0, belt.thickness);
      
      // Generate physical properties for small rocky body
      const mass = beltPhysics.generateMass('asteroid');
      const radius = beltPhysics.generateRadius(mass);
      const baseColor = beltPhysics.generateColor(mass, 'asteroid');
      
      // Apply color variation
      const color = this.varyColor(baseColor, this.config.beltColorVariation, beltRng);
      
      // Calculate orbital speed
      const speed = beltPhysics.calculateOrbitalSpeed(radialDistance);
      
      const asteroid: Star = {
        id: asteroidId,
        name: `${belt.name} Asteroid ${i + 1}`,
        mass,
        radius,
        color,
        children: [],
        parentId: belt.parentId,
        bodyType: 'asteroid',
        parentBeltId: belt.id,
        orbitalDistance: radialDistance,
        orbitalSpeed: speed,
        orbitalPhase: angle,
        // Add slight eccentricity and inclination variation
        eccentricity: belt.eccentricity > 0 ? beltRng.uniform(0, belt.eccentricity * 1.2) : undefined,
        orbitRotX: belt.inclination + beltRng.uniform(-2, 2), // Small variation around belt inclination
        orbitOffsetY: verticalOffset !== 0 ? verticalOffset : undefined,
      };
      
      asteroids.push(asteroid);
      belt.asteroidIds.push(asteroidId);
    }
    
    return asteroids;
  }
  
  /**
   * Vary a hex color by a given amount
   */
  private varyColor(hexColor: string, variation: number, rng: RandomGenerator): string {
    // Parse hex color
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);
    
    // Apply variation
    const vary = (value: number) => {
      const delta = rng.uniform(-variation * 50, variation * 50);
      return Math.max(0, Math.min(255, Math.round(value + delta)));
    };
    
    const newR = vary(r);
    const newG = vary(g);
    const newB = vary(b);
    
    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
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
  const ringRng = new RandomGenerator(masterRng.fork('rings'));
  const cometRng = new RandomGenerator(masterRng.fork('comets'));
  const lagrangeRng = new RandomGenerator(masterRng.fork('lagrange'));
  
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
  
  // 4. Generate asteroid belts (if enabled)
  const beltGen = new AsteroidBeltGenerator(fullConfig, beltRng);
  const beltMap: Record<string, AsteroidBelt> = {};
  
  // For each root system, generate belts
  systemData.rootIds.forEach(rootId => {
    const { belts, asteroids } = beltGen.generate(systemData.stars, rootId);
    
    // Add belts to the map
    belts.forEach(belt => {
      beltMap[belt.id] = belt;
    });
    
    // Add asteroids to the star map
    asteroids.forEach(asteroid => {
      starMap[asteroid.id] = asteroid;
      // Add asteroid to parent's children array
      if (asteroid.parentId && starMap[asteroid.parentId]) {
        starMap[asteroid.parentId].children.push(asteroid.id);
      }
    });
  });

  // 5. Generate planetary rings (if enabled)
  const ringGen = new PlanetaryRingGenerator(fullConfig, ringRng);
  systemData.rootIds.forEach((rootId) => {
    ringGen.generate(systemData.stars, rootId);
  });

  // 6. Generate comets (if enabled)
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
  
  // 7. Generate Lagrange points and Trojans (if enabled)
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
  
  // 8. Generate groups (optional)
  const groupGen = new GroupGenerator(fullConfig, groupRng);
  const groupList = groupGen.generate(systemData.rootIds);
  
  const groupMap: Record<string, Group> = {};
  groupList.forEach(group => {
    groupMap[group.id] = group;
  });
  
  const rootGroupIds = groupList
    .filter(g => g.parentGroupId === null)
    .map(g => g.id);
  
  return {
    stars: starMap,
    rootIds: systemData.rootIds,
    groups: groupMap,
    rootGroupIds,
    belts: beltMap,
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
} {
  const fullConfig = { ...DEFAULT_CONFIG, ...config, enableGrouping: true };
  
  const allStars: Record<string, Star> = {};
  const allRootIds: string[] = [];
  const allBelts: Record<string, AsteroidBelt> = {};
  
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
  
  return {
    stars: allStars,
    rootIds: allRootIds,
    groups: groupMap,
    rootGroupIds,
    belts: allBelts,
  };
}

// Export config type for external use
export type { GeneratorConfig };
export { DEFAULT_CONFIG };

