import { v4 as uuidv4 } from 'uuid';
import { Star, Group, GroupChild, Position } from '../types';
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
  
  // Physical parameters
  massMu: number;           // Mean for log-normal mass distribution
  massSigma: number;        // Std dev for log-normal mass distribution
  radiusPower: number;      // Power law exponent for radius = mass^power
  
  // Grouping parameters
  enableGrouping: boolean;
  numGroups: [number, number];      // [min, max] number of groups
  nestingProbability: number;       // Probability a group becomes child of another
  groupPositionSigma: number;       // Standard deviation for 3D Gaussian group positions
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
  
  massMu: 1.5,
  massSigma: 0.8,
  radiusPower: 0.4,
  
  enableGrouping: false,
  numGroups: [3, 7],
  nestingProbability: 0.2,
  groupPositionSigma: 50.0,
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
  generateMass(type: NodeType): number {
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
  generateColor(mass: number, type: NodeType): string {
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
}

// ============================================================================
// Star Data Generator
// ============================================================================

interface SystemData {
  stars: Star[];
  rootIds: string[];
  groups: Group[];
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
    
    return {
      id: node.id,
      name,
      mass,
      radius,
      color,
      children: [],
      parentId,
      orbitalDistance,
      orbitalSpeed,
      orbitalPhase,
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
} {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  
  // Create deterministic RNG from seed, or use random seed
  const actualSeed = seed ?? Date.now();
  const masterRng = createPRNG(actualSeed);
  
  // Fork RNGs for different subsystems
  const lsystemRng = new RandomGenerator(masterRng.fork('lsystem'));
  const starDataRng = new RandomGenerator(masterRng.fork('stardata'));
  const groupRng = new RandomGenerator(masterRng.fork('groups'));
  
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
  
  // 4. Generate groups (optional)
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
} {
  const fullConfig = { ...DEFAULT_CONFIG, ...config, enableGrouping: true };
  
  const allStars: Record<string, Star> = {};
  const allRootIds: string[] = [];
  
  // Use seed to create deterministic sequence for multiple systems
  const actualSeed = seed ?? Date.now();
  const masterRng = createPRNG(actualSeed);
  
  // Generate multiple systems
  for (let i = 0; i < count; i++) {
    // Each system gets its own forked seed
    const systemSeed = masterRng.int(0, 2147483647);
    const system = generateSolarSystem(systemSeed, { ...fullConfig, enableGrouping: false });
    Object.assign(allStars, system.stars);
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
  };
}

// Export config type for external use
export type { GeneratorConfig };
export { DEFAULT_CONFIG };

