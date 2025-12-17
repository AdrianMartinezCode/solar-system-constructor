/**
 * Topology Module
 * 
 * This module provides pluggable topology generation for the procedural generator.
 * It allows different grammar presets to control how system hierarchies are built.
 * 
 * ## Quick Start
 * 
 * ```typescript
 * import { createTopologyGenerator, TopologyPresetId } from './topology';
 * 
 * const generator = createTopologyGenerator('classic');
 * const tree = generator.generate(rng, config);
 * ```
 * 
 * ## Adding a New Preset
 * 
 * See `presets.ts` for the full guide. Quick steps:
 * 1. Add your preset ID to `TopologyPresetId` in `types.ts`
 * 2. Define your grammar and preset in `presets.ts`
 * 3. Add it to `TOPOLOGY_PRESETS` record
 */

// Types
export type {
  GrammarSymbol,
  TopologyNodeType,
  RepeatDistribution,
  ProductionRule,
  StarCountConfig,
  GrammarDefinition,
  TopologyPreset,
  TopologyParameterOverrides,
  TopologyPresetId,
  LSystemNode,
  TopologyRNG,
  TopologyGeneratorConfig,
  TopologyGenerator,
} from './types';

// Presets
export {
  TOPOLOGY_PRESETS,
  CLASSIC_PRESET,
  COMPACT_PRESET,
  MULTI_STAR_HEAVY_PRESET,
  MOON_RICH_PRESET,
  SPARSE_OUTPOST_PRESET,
  DEEP_HIERARCHY_PRESET,
  getTopologyPreset,
  getTopologyPresetIds,
  getTopologyPresetOptions,
  DEFAULT_TOPOLOGY_PRESET,
} from './presets';

// Generators
export {
  GrammarTopologyGenerator,
  ClassicTopologyGenerator,
  createTopologyGenerator,
  generateTopology,
} from './generators';

