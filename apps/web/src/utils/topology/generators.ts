/**
 * Topology Generator Implementations
 * 
 * This module provides pluggable topology generators that create L-system trees
 * based on grammar definitions.
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  TopologyPresetId,
  TopologyGenerator,
  TopologyGeneratorConfig,
  TopologyRNG,
  LSystemNode,
  GrammarDefinition,
  ProductionRule,
  RepeatDistribution,
  GrammarSymbol,
  TopologyNodeType,
} from './types';
import { getTopologyPreset, DEFAULT_TOPOLOGY_PRESET } from './presets';

// ============================================================================
// Grammar-Based Topology Generator
// ============================================================================

/**
 * A grammar-based topology generator that interprets GrammarDefinition
 * to produce L-system trees.
 */
export class GrammarTopologyGenerator implements TopologyGenerator {
  private presetId: TopologyPresetId;
  private grammar: GrammarDefinition;
  
  constructor(presetId: TopologyPresetId = DEFAULT_TOPOLOGY_PRESET) {
    this.presetId = presetId;
    const preset = getTopologyPreset(presetId);
    this.grammar = preset.grammar;
  }
  
  getPresetId(): TopologyPresetId {
    return this.presetId;
  }
  
  /**
   * Generate the topology tree from the grammar
   */
  generate(rng: TopologyRNG, config: TopologyGeneratorConfig): LSystemNode {
    // Create root system node
    const root: LSystemNode = {
      type: 'system',
      id: uuidv4(),
      parent: null,
      children: [],
      depth: 0,
    };
    
    // Expand from axiom
    this.expandNode(root, rng, config, 0);
    
    return root;
  }
  
  /**
   * Expand a node according to its grammar rules
   */
  private expandNode(
    node: LSystemNode,
    rng: TopologyRNG,
    config: TopologyGeneratorConfig,
    depth: number
  ): void {
    if (depth >= this.grammar.maxDepth) {
      return;
    }
    
    // Get production rules for this node type
    const symbol = this.nodeTypeToSymbol(node.type);
    if (!symbol) return;
    
    const productions = this.grammar.productions[symbol];
    if (!productions || productions.length === 0) {
      return; // Terminal symbol
    }
    
    // Select a production rule
    const rule = this.selectProduction(productions, rng);
    
    // Execute the production
    this.executeProduction(node, rule, rng, config, depth);
  }
  
  /**
   * Map node type to grammar symbol
   */
  private nodeTypeToSymbol(type: TopologyNodeType): GrammarSymbol | null {
    switch (type) {
      case 'system': return 'system';
      case 'star': return 'star';
      case 'planet': return 'planet';
      case 'moon': return 'moon';
      default: return null;
    }
  }
  
  /**
   * Map grammar symbol to node type
   */
  private symbolToNodeType(symbol: GrammarSymbol): TopologyNodeType | null {
    switch (symbol) {
      case 'system': return 'system';
      case 'star': return 'star';
      case 'planet': return 'planet';
      case 'moon':
      case 'submoon': return 'moon'; // Sub-moons become moons
      default: return null;
    }
  }
  
  /**
   * Select a production rule using weighted random selection
   */
  private selectProduction(productions: ProductionRule[], rng: TopologyRNG): ProductionRule {
    if (productions.length === 1) {
      return productions[0];
    }
    
    const weights = productions.map(p => p.weight);
    return rng.weighted(productions, weights);
  }
  
  /**
   * Execute a production rule to expand a node
   */
  private executeProduction(
    parent: LSystemNode,
    rule: ProductionRule,
    rng: TopologyRNG,
    config: TopologyGeneratorConfig,
    depth: number
  ): void {
    for (const symbol of rule.expand) {
      // Handle special symbols
      if (symbol === 'stars') {
        this.expandStars(parent, rng, config, depth);
      } else if (symbol === 'planets') {
        this.expandPlanets(parent, rng, config, depth);
      } else if (symbol === 'moons') {
        this.expandMoons(parent, rng, config, depth);
      } else if (symbol === 'submoons') {
        this.expandSubMoons(parent, rng, config, depth);
      } else {
        // Terminal symbol - create node
        const nodeType = this.symbolToNodeType(symbol);
        if (nodeType) {
          const child = this.createNode(nodeType, parent, depth + 1);
          parent.children.push(child);
          
          // Recursively expand if needed
          this.expandChildBySymbol(child, symbol, rng, config, depth + 1);
        }
      }
    }
  }
  
  /**
   * Expand child based on its symbol (for rule-based expansion)
   */
  private expandChildBySymbol(
    node: LSystemNode,
    symbol: GrammarSymbol,
    rng: TopologyRNG,
    config: TopologyGeneratorConfig,
    depth: number
  ): void {
    // Get productions for this symbol
    const productions = this.grammar.productions[symbol];
    if (!productions || productions.length === 0) {
      return; // Terminal
    }
    
    const rule = this.selectProduction(productions, rng);
    this.executeProduction(node, rule, rng, config, depth);
  }
  
  /**
   * Expand stars based on starCount configuration or production rules
   */
  private expandStars(
    parent: LSystemNode,
    rng: TopologyRNG,
    config: TopologyGeneratorConfig,
    depth: number
  ): void {
    let numStars: number;
    
    // Use grammar's starCount if available, otherwise use config
    const starCount = this.grammar.starCount;
    if (starCount) {
      numStars = rng.weighted(
        [1, 2, 3],
        [starCount.single, starCount.binary, starCount.ternary]
      );
    } else {
      numStars = rng.weighted([1, 2, 3], config.starProbabilities);
    }
    
    // Check maxCount constraint from 'stars' production
    const starsProduction = this.grammar.productions['stars']?.[0];
    if (starsProduction?.maxCount) {
      numStars = Math.min(numStars, starsProduction.maxCount);
    }
    
    // Create star nodes
    for (let i = 0; i < numStars; i++) {
      const star = this.createNode('star', parent, depth + 1);
      parent.children.push(star);
    }
  }
  
  /**
   * Expand planets based on production rules (supports multiple weighted rules)
   */
  private expandPlanets(
    parent: LSystemNode,
    rng: TopologyRNG,
    config: TopologyGeneratorConfig,
    depth: number
  ): void {
    const productions = this.grammar.productions['planets'];
    if (!productions || productions.length === 0) return;
    
    // Select a production rule using weighted random selection
    const production = this.selectProduction(productions, rng);
    
    // Check if this rule produces nothing (empty expand)
    if (production.expand.length === 0) {
      return; // No planets for this system
    }
    
    // Calculate count based on repeat distribution
    let numPlanets = this.sampleRepeat(production.repeat, rng, config.planetGeometricP);
    
    // Apply constraints
    if (production.maxCount !== undefined) {
      numPlanets = Math.min(numPlanets, production.maxCount);
    }
    if (production.minCount !== undefined) {
      numPlanets = Math.max(numPlanets, production.minCount);
    }
    
    // IMPORTANT FIX: Attach planets to the SYSTEM node, not directly to a star.
    // The StarDataGenerator will later determine the center star (heaviest)
    // and assign planets to orbit it correctly.
    // This fixes the "planets attached to wrong star" bug.
    const systemNode = parent.type === 'system' ? parent : parent.parent;
    const attachTo = systemNode || parent;
    
    // Create planet nodes
    for (let i = 0; i < numPlanets; i++) {
      const planet = this.createNode('planet', attachTo, depth + 1);
      attachTo.children.push(planet);
      
      // Expand planet (add moons)
      this.expandChildBySymbol(planet, 'planet', rng, config, depth + 1);
    }
  }
  
  /**
   * Expand moons based on production rules (supports multiple weighted rules)
   */
  private expandMoons(
    parent: LSystemNode,
    rng: TopologyRNG,
    config: TopologyGeneratorConfig,
    depth: number
  ): void {
    const productions = this.grammar.productions['moons'];
    if (!productions || productions.length === 0) return;
    
    // Select a production rule using weighted random selection
    const production = this.selectProduction(productions, rng);
    
    // Check if this rule produces nothing
    if (production.expand.length === 0) {
      return; // No moons for this planet
    }
    
    // Calculate count
    let numMoons = this.sampleRepeat(production.repeat, rng, config.moonGeometricP);
    
    // Apply constraints
    if (production.maxCount !== undefined) {
      numMoons = Math.min(numMoons, production.maxCount);
    }
    if (production.minCount !== undefined) {
      numMoons = Math.max(numMoons, production.minCount);
    }
    
    // Create moon nodes
    for (let i = 0; i < numMoons; i++) {
      const moon = this.createNode('moon', parent, depth + 1);
      parent.children.push(moon);
      
      // Expand moon (might add sub-moons if grammar allows)
      this.expandChildBySymbol(moon, 'moon', rng, config, depth + 1);
    }
  }
  
  /**
   * Expand sub-moons (moons of moons)
   */
  private expandSubMoons(
    parent: LSystemNode,
    rng: TopologyRNG,
    config: TopologyGeneratorConfig,
    depth: number
  ): void {
    if (!this.grammar.allowSubMoons) return;
    
    const production = this.grammar.productions['submoons']?.[0];
    if (!production) return;
    
    // Calculate count
    let numSubMoons = this.sampleRepeat(production.repeat, rng, config.moonGeometricP * 1.5);
    
    // Apply constraints
    if (production.maxCount !== undefined) {
      numSubMoons = Math.min(numSubMoons, production.maxCount);
    }
    
    // Create sub-moon nodes (as moon type)
    for (let i = 0; i < numSubMoons; i++) {
      const submoon = this.createNode('moon', parent, depth + 1);
      parent.children.push(submoon);
      // Sub-moons are terminal (no further expansion)
    }
  }
  
  /**
   * Sample from a repeat distribution
   */
  private sampleRepeat(
    repeat: RepeatDistribution | undefined,
    rng: TopologyRNG,
    defaultGeometricP: number
  ): number {
    if (!repeat) {
      return rng.geometric(defaultGeometricP);
    }
    
    switch (repeat.type) {
      case 'geometric':
        return rng.geometric(repeat.p ?? defaultGeometricP);
      
      case 'fixed':
        return repeat.count ?? 0;
      
      case 'uniform':
        return rng.int(repeat.min ?? 0, repeat.max ?? 5);
      
      case 'poisson':
        // Simple Poisson approximation if not available
        if (rng.poisson) {
          return rng.poisson(repeat.lambda ?? 3);
        }
        // Fallback: use rounded geometric
        return Math.round(repeat.lambda ?? 3);
      
      default:
        return rng.geometric(defaultGeometricP);
    }
  }
  
  /**
   * Create a new L-system node
   */
  private createNode(
    type: TopologyNodeType,
    parent: LSystemNode,
    depth: number
  ): LSystemNode {
    return {
      type,
      id: uuidv4(),
      parent,
      children: [],
      depth,
    };
  }
}

// ============================================================================
// Classic Topology Generator (Legacy Compatibility)
// ============================================================================

/**
 * ClassicTopologyGenerator exactly replicates the original hardcoded behavior
 * for backward compatibility. Used when presetId === 'classic' for guaranteed
 * identical output.
 */
export class ClassicTopologyGenerator implements TopologyGenerator {
  getPresetId(): TopologyPresetId {
    return 'classic';
  }
  
  generate(rng: TopologyRNG, config: TopologyGeneratorConfig): LSystemNode {
    const root: LSystemNode = {
      type: 'system',
      id: uuidv4(),
      parent: null,
      children: [],
      depth: 0,
    };
    
    this.expandSystem(root, rng, config);
    return root;
  }
  
  /**
   * Expand A → S{1-3} P*
   * Exactly matches the original LSystemGenerator.expandSystem
   */
  private expandSystem(node: LSystemNode, rng: TopologyRNG, config: TopologyGeneratorConfig): void {
    const numStars = rng.weighted([1, 2, 3], config.starProbabilities);
    
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
    
    // FIXED: Attach planets to the SYSTEM node, not the first star.
    // This allows StarDataGenerator to correctly assign planets to the
    // center star (heaviest) after all masses are determined.
    const numPlanets = rng.geometric(config.planetGeometricP);
    for (let i = 0; i < numPlanets; i++) {
      this.expandPlanet(node, rng, config);
    }
  }
  
  /**
   * Expand P → p M*
   */
  private expandPlanet(parent: LSystemNode, rng: TopologyRNG, config: TopologyGeneratorConfig): void {
    const planet: LSystemNode = {
      type: 'planet',
      id: uuidv4(),
      parent,
      children: [],
      depth: parent.depth + 1,
    };
    parent.children.push(planet);
    
    // Add moons
    const numMoons = rng.geometric(config.moonGeometricP);
    for (let i = 0; i < numMoons; i++) {
      this.expandMoon(planet, rng);
    }
  }
  
  /**
   * Expand M → m
   */
  private expandMoon(parent: LSystemNode, _rng: TopologyRNG): void {
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
// Factory Functions
// ============================================================================

/**
 * Create a topology generator for a given preset ID
 */
export function createTopologyGenerator(presetId: TopologyPresetId): TopologyGenerator {
  // For 'classic', use the legacy generator for exact backward compatibility
  if (presetId === 'classic') {
    return new ClassicTopologyGenerator();
  }
  
  // For all other presets, use the grammar-based generator
  return new GrammarTopologyGenerator(presetId);
}

/**
 * Generate topology using a preset
 */
export function generateTopology(
  presetId: TopologyPresetId,
  rng: TopologyRNG,
  config: TopologyGeneratorConfig
): LSystemNode {
  const generator = createTopologyGenerator(presetId);
  return generator.generate(rng, config);
}

