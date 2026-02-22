/**
 * Topology Grammar Types and Interfaces
 * 
 * This module defines the grammar structure for procedural topology generation.
 * The grammar is a simplified L-system that supports stochastic production rules.
 * 
 * ## Overview
 * 
 * The topology system uses a context-free grammar with weighted production rules
 * to generate hierarchical star system structures. This allows for:
 * - Different system shapes (single stars, binaries, ternaries)
 * - Varying planet and moon distributions
 * - Deep hierarchies (moons with sub-moons)
 * - Deterministic generation (same seed + preset = same topology)
 * 
 * ## Key Concepts
 * 
 * ### Symbols
 * - `system`: Root container for the entire system
 * - `stars`: Expands to 1-3 star nodes based on starCount config
 * - `star`: Terminal - becomes an actual star body
 * - `planets`: Expands to 0-N planets based on repeat distribution
 * - `planet`: Contains moons expansion
 * - `moons`: Expands to 0-N moons
 * - `moon`: Terminal or can have submoons
 * - `submoons`/`submoon`: For deep hierarchy presets
 * 
 * ### Production Rules
 * Each symbol can have multiple weighted rules. For example:
 * ```typescript
 * planet: [
 *   { weight: 0.8, expand: ['moons'] },     // 80% have moons
 *   { weight: 0.2, expand: [] }             // 20% are moonless
 * ]
 * ```
 * 
 * ### Repeat Distributions
 * - `geometric`: Uses p parameter (lower p = more children)
 * - `fixed`: Exact count
 * - `uniform`: Random in [min, max] range
 * - `poisson`: Poisson distribution with lambda mean
 * 
 * ## Adding a New Grammar Preset
 * 
 * 1. Add your preset ID to `TopologyPresetId` in this file
 * 2. Define your `TopologyPreset` object in `presets.ts`:
 *    - Unique `id` matching the type
 *    - Human-readable `name` and `description`
 *    - `grammar` with axiom, productions, and maxDepth
 *    - Optional `suggestedOverrides` for parameters that pair well
 * 3. Add it to the `TOPOLOGY_PRESETS` record in `presets.ts`
 * 4. Add UI option in `UniverseGeneratorPanel.tsx` (topology dropdown)
 * 5. The preset will be available in generation via `topologyPreset` config
 * 
 * @example
 * ```typescript
 * // Step 1: Add ID to TopologyPresetId type (in types.ts)
 * export type TopologyPresetId = 
 *   | 'classic'
 *   | 'myCustom'  // Add here
 *   | ...;
 * 
 * // Step 2: Define preset in presets.ts
 * export const MY_CUSTOM_PRESET: TopologyPreset = {
 *   id: 'myCustom',
 *   name: 'My Custom Topology',
 *   description: 'A custom topology with unique characteristics',
 *   grammar: {
 *     axiom: ['system'],
 *     productions: {
 *       system: [
 *         { weight: 1.0, expand: ['stars', 'planets'] }
 *       ],
 *       stars: [
 *         { weight: 1.0, expand: ['star'], maxCount: 2 }
 *       ],
 *       planets: [
 *         { weight: 1.0, expand: ['planet'], repeat: { type: 'geometric', p: 0.3 } }
 *       ],
 *       planet: [
 *         { weight: 0.9, expand: ['moons'] },  // 90% have moons
 *         { weight: 0.1, expand: [] }          // 10% moonless
 *       ],
 *       moons: [
 *         { weight: 1.0, expand: ['moon'], repeat: { type: 'uniform', min: 1, max: 5 } }
 *       ],
 *       star: [{ weight: 1.0, expand: [] }],
 *       moon: [{ weight: 1.0, expand: [] }],
 *     },
 *     maxDepth: 4,
 *     starCount: { single: 0.6, binary: 0.4, ternary: 0.0 },
 *   },
 *   suggestedOverrides: {
 *     planetGeometricP: 0.3,
 *     moonGeometricP: 0.25,
 *   },
 * };
 * 
 * // Step 3: Register in TOPOLOGY_PRESETS (in presets.ts)
 * export const TOPOLOGY_PRESETS: Record<TopologyPresetId, TopologyPreset> = {
 *   ...
 *   myCustom: MY_CUSTOM_PRESET,
 * };
 * ```
 */

// ============================================================================
// Symbol Types
// ============================================================================

/**
 * Grammar symbols for the L-system.
 * - Uppercase-style symbols are structural (define hierarchy)
 * - These symbols expand via production rules
 */
export type GrammarSymbol = 
  | 'system'    // Root system node
  | 'star'      // A star (terminal, becomes actual star)
  | 'stars'     // Star expansion rule (may produce 1-3 stars)
  | 'planet'    // A planet (may have children)
  | 'planets'   // Planet expansion rule (produces 0-N planets)
  | 'moon'      // A moon (usually terminal)
  | 'moons'     // Moon expansion rule
  | 'submoon'   // Sub-moon (moon of a moon, for deep hierarchy)
  | 'submoons'; // Sub-moon expansion rule

/**
 * Node types in the generated L-system tree
 */
export type TopologyNodeType = 'system' | 'star' | 'planet' | 'moon';

// ============================================================================
// Production Rules
// ============================================================================

/**
 * Repeat distribution for production rules
 */
export interface RepeatDistribution {
  /** Distribution type */
  type: 'geometric' | 'fixed' | 'uniform' | 'poisson';
  
  /** For geometric: probability parameter p (higher = fewer) */
  p?: number;
  
  /** For fixed: exact count */
  count?: number;
  
  /** For uniform: [min, max] inclusive range */
  min?: number;
  max?: number;
  
  /** For poisson: lambda (mean) */
  lambda?: number;
}

/**
 * A production rule that expands a symbol
 */
export interface ProductionRule {
  /** Weight for stochastic selection (relative, normalized at runtime) */
  weight: number;
  
  /** Symbols to expand to (empty = terminal) */
  expand: GrammarSymbol[];
  
  /** Optional repeat distribution (applies to last symbol in expand) */
  repeat?: RepeatDistribution;
  
  /** Optional constraint: maximum count of this expansion */
  maxCount?: number;
  
  /** Optional constraint: minimum count */
  minCount?: number;
}

/**
 * Star count probabilities for direct control (used by 'stars' symbol)
 */
export interface StarCountConfig {
  /** Probability of 1 star */
  single: number;
  /** Probability of 2 stars (binary) */
  binary: number;
  /** Probability of 3 stars (ternary) */
  ternary: number;
}

// ============================================================================
// Grammar Definition
// ============================================================================

/**
 * Complete grammar definition for topology generation
 */
export interface GrammarDefinition {
  /** Starting symbols */
  axiom: GrammarSymbol[];
  
  /** Production rules for each symbol */
  productions: Partial<Record<GrammarSymbol, ProductionRule[]>>;
  
  /** Maximum expansion depth (prevents infinite recursion) */
  maxDepth: number;
  
  /** Optional star count configuration (alternative to 'stars' production) */
  starCount?: StarCountConfig;
  
  /** Optional: Default planet geometric P (can be overridden by rule) */
  defaultPlanetGeometricP?: number;
  
  /** Optional: Default moon geometric P */
  defaultMoonGeometricP?: number;
  
  /** Whether this grammar allows sub-moons (moons of moons) */
  allowSubMoons?: boolean;
}

// ============================================================================
// Topology Preset
// ============================================================================

/**
 * A complete topology preset including grammar and metadata
 */
export interface TopologyPreset {
  /** Unique identifier for the preset */
  id: TopologyPresetId;
  
  /** Human-readable name */
  name: string;
  
  /** Description of what this topology produces */
  description: string;
  
  /** The grammar definition */
  grammar: GrammarDefinition;
  
  /** Optional: Suggested parameter overrides that pair well with this grammar */
  suggestedOverrides?: TopologyParameterOverrides;
}

/**
 * Parameter overrides that can be suggested by a topology preset
 */
export interface TopologyParameterOverrides {
  /** Override planet geometric P */
  planetGeometricP?: number;
  
  /** Override moon geometric P */
  moonGeometricP?: number;
  
  /** Override star probabilities [single, binary, ternary] */
  starProbabilities?: [number, number, number];
  
  /** Override max depth */
  maxDepth?: number;
}

// ============================================================================
// Topology Preset IDs
// ============================================================================

/**
 * Known topology preset identifiers.
 * Add new preset IDs here when creating new grammars.
 */
export type TopologyPresetId = 
  | 'classic'           // Current default behavior
  | 'compact'           // Fewer planets, more moons
  | 'multiStarHeavy'    // Favors binary/ternary systems
  | 'moonRich'          // Many moons per planet
  | 'sparseOutpost'     // Minimal systems
  | 'deepHierarchy';    // Allows sub-moons (moons of moons)

// ============================================================================
// L-System Node (Generated Tree)
// ============================================================================

/**
 * A node in the generated L-system tree
 */
export interface LSystemNode {
  type: TopologyNodeType;
  id: string;
  parent: LSystemNode | null;
  children: LSystemNode[];
  depth: number;
}

// ============================================================================
// Topology Generator Interface
// ============================================================================

/**
 * Random generator interface for topology generation
 */
export interface TopologyRNG {
  /** Generate float in [0, 1) */
  float(): number;
  
  /** Generate int in [min, max] inclusive */
  int(min: number, max: number): number;
  
  /** Weighted random selection */
  weighted<T>(items: T[], weights: number[]): T;
  
  /** Geometric distribution (successes before first failure) */
  geometric(p: number): number;
  
  /** Poisson distribution */
  poisson?(lambda: number): number;
  
  /** Fork the RNG for a sub-generator */
  fork(label: string): TopologyRNG;
}

/**
 * Configuration passed to topology generators
 */
export interface TopologyGeneratorConfig {
  /** Star count probabilities [single, binary, ternary] */
  starProbabilities: [number, number, number];
  
  /** Geometric P for planet count */
  planetGeometricP: number;
  
  /** Geometric P for moon count */
  moonGeometricP: number;
  
  /** Maximum depth */
  maxDepth: number;
}

/**
 * Interface for pluggable topology generators
 */
export interface TopologyGenerator {
  /** Generate the topology tree */
  generate(rng: TopologyRNG, config: TopologyGeneratorConfig): LSystemNode;
  
  /** Get the preset ID this generator implements */
  getPresetId(): TopologyPresetId;
}
