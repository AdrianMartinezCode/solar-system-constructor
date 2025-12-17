/**
 * Topology Grammar Presets
 * 
 * This file defines all available topology presets for the procedural generator.
 * Each preset specifies a grammar that controls how the system hierarchy is built.
 * 
 * ## L-System Grammar Notation
 * 
 * Each preset uses a stochastic context-free L-system grammar:
 * 
 * - **S** = System (root)
 * - **★** = Star (terminal)
 * - **●** = Planet (may expand to moons)
 * - **◦** = Moon (may expand to sub-moons)
 * - **·** = Sub-moon (terminal)
 * - **{n}** = Exactly n instances
 * - **{n,m}** = Uniform random in [n,m]
 * - ****** = Geometric distribution (p=value)
 * - **[w%: ...]** = Weighted rule with probability w%
 * - **ε** = Empty (terminal, no expansion)
 * 
 * ## How to Add a New Preset
 * 
 * 1. Define your `TopologyPreset` object with:
 *    - Unique `id` (add to `TopologyPresetId` type in types.ts)
 *    - Human-readable `name` and `description`
 *    - `grammar` with axiom, productions, and maxDepth
 *    - Optional `suggestedOverrides` for parameters that pair well
 * 
 * 2. Add it to the `TOPOLOGY_PRESETS` record below
 * 
 * 3. The preset will automatically appear in the UI dropdown
 */

import type { TopologyPreset, TopologyPresetId, GrammarDefinition } from './types';

// ============================================================================
// Classic Grammar (matches current behavior)
// ============================================================================

/**
 * Classic grammar replicates the original hardcoded L-system behavior:
 * - 1-3 stars per system based on starProbabilities
 * - Planets via geometric distribution
 * - Moons via geometric distribution
 * 
 * ## L-System Grammar (Formal Notation)
 * 
 * ```
 * S  →  ★{1-3}  ●*                    System expands to 1-3 stars + planets
 * ★  →  ε                             Star is terminal
 * ●  →  ◦*                            Planet expands to moons
 * ◦  →  ε                             Moon is terminal
 * 
 * Where:
 *   ★{1-3}  : Star count from starCount config (65% single, 25% binary, 10% ternary)
 *   ●*      : Planets via geometric(p=0.4), expected ~1.5 planets
 *   ◦*      : Moons via geometric(p=0.3), expected ~2.3 moons per planet
 * ```
 * 
 * ## Production Rules (Weighted)
 * 
 * ```
 * system  → [100%: stars, planets]
 * stars   → [100%: star, maxCount=3]     ; uses starProbabilities
 * planets → [100%: planet, geom(0.4)]
 * planet  → [100%: moons]
 * moons   → [100%: moon, geom(0.3)]
 * star    → [100%: ε]
 * moon    → [100%: ε]
 * ```
 */
const CLASSIC_GRAMMAR: GrammarDefinition = {
  axiom: ['system'],
  productions: {
    system: [
      // Single production: expands to stars + planets
      { weight: 1.0, expand: ['stars', 'planets'] }
    ],
    // Stars use starProbabilities directly (special handling)
    stars: [
      { weight: 1.0, expand: ['star'], maxCount: 3 }
    ],
    // Planets use geometric distribution
    planets: [
      { weight: 1.0, expand: ['planet'], repeat: { type: 'geometric', p: 0.4 } }
    ],
    // Each planet can have moons
    planet: [
      { weight: 1.0, expand: ['moons'] }
    ],
    // Moons use geometric distribution
    moons: [
      { weight: 1.0, expand: ['moon'], repeat: { type: 'geometric', p: 0.3 } }
    ],
    // Terminal symbols
    star: [{ weight: 1.0, expand: [] }],
    moon: [{ weight: 1.0, expand: [] }],
  },
  maxDepth: 4,
  starCount: { single: 0.65, binary: 0.25, ternary: 0.10 },
  allowSubMoons: false,
};

export const CLASSIC_PRESET: TopologyPreset = {
  id: 'classic',
  name: 'Classic',
  description: 'Standard L-system topology: 1-3 stars, geometric planet/moon distribution',
  grammar: CLASSIC_GRAMMAR,
};

// ============================================================================
// Compact Grammar (very few planets, TONS of moons)
// ============================================================================

/**
 * EXTREMELY compact systems: only 1-2 planets but each is a mini-system
 * with 5-15 moons. Think Jupiter-like systems focused on moon detail.
 * Single star only for simplicity.
 * 
 * ## L-System Grammar (Formal Notation)
 * 
 * ```
 * S  →  ★{1}  ●{1,2}                  Always 1 star, 1-2 planets
 * ★  →  ε                             Star is terminal
 * ●  →  ◦{5-18}                       Planet has 5-18 moons (geom, clamped)
 * ◦  →  ε                             Moon is terminal
 * 
 * Where:
 *   ★{1}     : Always exactly 1 star (100% single)
 *   ●{1,2}   : Uniform 1-2 planets
 *   ◦{5-18}  : Geometric(p=0.08) clamped to [5,18], expected ~12.5 moons!
 * ```
 * 
 * ## Production Rules (Weighted)
 * 
 * ```
 * system  → [100%: stars, planets]
 * stars   → [100%: star, maxCount=1]         ; ALWAYS single star
 * planets → [100%: planet, uniform(1,2)]
 * planet  → [100%: moons]
 * moons   → [100%: moon, geom(0.08), min=5, max=18]  ; 5-18 moons!
 * star    → [100%: ε]
 * moon    → [100%: ε]
 * ```
 */
const COMPACT_GRAMMAR: GrammarDefinition = {
  axiom: ['system'],
  productions: {
    system: [
      { weight: 1.0, expand: ['stars', 'planets'] }
    ],
    stars: [
      { weight: 1.0, expand: ['star'], maxCount: 1 }  // ALWAYS single star
    ],
    // VERY few planets - exactly 1-2
    planets: [
      { weight: 1.0, expand: ['planet'], repeat: { type: 'uniform', min: 1, max: 2 } }
    ],
    planet: [
      { weight: 1.0, expand: ['moons'] }
    ],
    // TONS of moons per planet - minimum 5, typically 8-15
    moons: [
      { weight: 1.0, expand: ['moon'], repeat: { type: 'geometric', p: 0.08 }, minCount: 5, maxCount: 18 }
    ],
    star: [{ weight: 1.0, expand: [] }],
    moon: [{ weight: 1.0, expand: [] }],
  },
  maxDepth: 4,
  starCount: { single: 1.0, binary: 0.0, ternary: 0.0 },  // Always single
  allowSubMoons: false,
  defaultPlanetGeometricP: 0.9,  // Very few planets
  defaultMoonGeometricP: 0.08,   // LOTS of moons
};

export const COMPACT_PRESET: TopologyPreset = {
  id: 'compact',
  name: 'Compact',
  description: 'Only 1-2 planets but each has 5-18 moons - Jupiter-like systems',
  grammar: COMPACT_GRAMMAR,
  suggestedOverrides: {
    planetGeometricP: 0.9,
    moonGeometricP: 0.08,
    starProbabilities: [1.0, 0.0, 0.0],
  },
};

// ============================================================================
// Multi-Star Heavy Grammar (ALMOST ALWAYS binary/ternary)
// ============================================================================

/**
 * EXTREME multi-star systems: 95% are binary or ternary!
 * Focus is on the multiple stars dancing together.
 * Fewer planets to keep visual focus on the stars.
 * 
 * ## L-System Grammar (Formal Notation)
 * 
 * ```
 * S  →  ★{1-3}  ●{1-4}                Stars + limited planets
 * ★  →  ε                             Star is terminal
 * ●  →  [70%: ◦{1-3}]                 70% of planets have 1-3 moons
 *    |  [30%: ε]                      30% have no moons
 * ◦  →  ε                             Moon is terminal
 * 
 * Where:
 *   ★{1-3}  : Star count heavily biased (5% single, 55% binary, 40% ternary)
 *   ●{1-4}  : Uniform 1-4 planets (stars are the focus)
 *   ◦{1-3}  : Uniform 1-3 moons (if planet has any)
 * ```
 * 
 * ## Production Rules (Weighted)
 * 
 * ```
 * system  → [100%: stars, planets]
 * stars   → [100%: star, maxCount=3]        ; uses starCount (5/55/40)
 * planets → [100%: planet, uniform(1,4)]
 * planet  → [70%: moons]                    ; 70% have moons
 *         | [30%: ε]                        ; 30% moonless
 * moons   → [100%: moon, uniform(1,3)]
 * star    → [100%: ε]
 * moon    → [100%: ε]
 * ```
 */
const MULTI_STAR_HEAVY_GRAMMAR: GrammarDefinition = {
  axiom: ['system'],
  productions: {
    system: [
      { weight: 1.0, expand: ['stars', 'planets'] }
    ],
    stars: [
      { weight: 1.0, expand: ['star'], maxCount: 3 }
    ],
    // Fewer planets - stars are the focus
    planets: [
      { weight: 1.0, expand: ['planet'], repeat: { type: 'uniform', min: 1, max: 4 } }
    ],
    planet: [
      { weight: 0.7, expand: ['moons'] },  // 70% have moons
      { weight: 0.3, expand: [] }          // 30% no moons - simpler
    ],
    moons: [
      { weight: 1.0, expand: ['moon'], repeat: { type: 'uniform', min: 1, max: 3 } }
    ],
    star: [{ weight: 1.0, expand: [] }],
    moon: [{ weight: 1.0, expand: [] }],
  },
  maxDepth: 4,
  // EXTREME bias toward multi-star - almost never single!
  starCount: { single: 0.05, binary: 0.55, ternary: 0.40 },
  allowSubMoons: false,
  defaultPlanetGeometricP: 0.6,
  defaultMoonGeometricP: 0.5,
};

export const MULTI_STAR_HEAVY_PRESET: TopologyPreset = {
  id: 'multiStarHeavy',
  name: 'Multi-Star Heavy',
  description: '95% binary/ternary systems! Stars are the focus, fewer planets',
  grammar: MULTI_STAR_HEAVY_GRAMMAR,
  suggestedOverrides: {
    starProbabilities: [0.05, 0.55, 0.40],
    planetGeometricP: 0.6,
    moonGeometricP: 0.5,
  },
};

// ============================================================================
// Moon-Rich Grammar (EXTREME moon counts - every planet is a Jupiter)
// ============================================================================

/**
 * EXTREME moon-rich systems: Every planet has 4-25 moons!
 * Multiple planets, each surrounded by a swarm of moons.
 * Like if every planet in our solar system was Jupiter.
 * 
 * ## L-System Grammar (Formal Notation)
 * 
 * ```
 * S  →  ★{1}  ●{3-6}                  Single star, 3-6 planets
 * ★  →  ε                             Star is terminal
 * ●  →  ◦{4-25}                       EVERY planet has 4-25 moons!
 * ◦  →  ε                             Moon is terminal
 * 
 * Where:
 *   ★{1}     : Always exactly 1 star (focus on moon systems)
 *   ●{3-6}   : Uniform 3-6 planets
 *   ◦{4-25}  : Geometric(p=0.05) clamped to [4,25], expected ~20 moons!
 * ```
 * 
 * ## Production Rules (Weighted)
 * 
 * ```
 * system  → [100%: stars, planets]
 * stars   → [100%: star, maxCount=1]
 * planets → [100%: planet, uniform(3,6)]
 * planet  → [100%: moons]                   ; ALL planets have moons
 * moons   → [100%: moon, geom(0.05), min=4, max=25]  ; 4-25 moons!
 * star    → [100%: ε]
 * moon    → [100%: ε]
 * ```
 */
const MOON_RICH_GRAMMAR: GrammarDefinition = {
  axiom: ['system'],
  productions: {
    system: [
      { weight: 1.0, expand: ['stars', 'planets'] }
    ],
    stars: [
      { weight: 1.0, expand: ['star'], maxCount: 1 }  // Single star to focus on moons
    ],
    // Good number of planets - each will have tons of moons
    planets: [
      { weight: 1.0, expand: ['planet'], repeat: { type: 'uniform', min: 3, max: 6 } }
    ],
    planet: [
      { weight: 1.0, expand: ['moons'] }  // 100% have moons
    ],
    // EXTREME: Every planet has 4-25 moons!
    moons: [
      { weight: 1.0, expand: ['moon'], repeat: { type: 'geometric', p: 0.05 }, minCount: 4, maxCount: 25 }
    ],
    star: [{ weight: 1.0, expand: [] }],
    moon: [{ weight: 1.0, expand: [] }],
  },
  maxDepth: 4,
  starCount: { single: 1.0, binary: 0.0, ternary: 0.0 },
  allowSubMoons: false,
  defaultPlanetGeometricP: 0.3,
  defaultMoonGeometricP: 0.05,  // VERY low = TONS of moons
};

export const MOON_RICH_PRESET: TopologyPreset = {
  id: 'moonRich',
  name: 'Moon-Rich',
  description: 'Every planet has 4-25 moons! Systems swimming in satellites',
  grammar: MOON_RICH_GRAMMAR,
  suggestedOverrides: {
    starProbabilities: [1.0, 0.0, 0.0],
    planetGeometricP: 0.3,
    moonGeometricP: 0.05,
  },
};

// ============================================================================
// Sparse Outpost Grammar (ULTRA-MINIMAL lonely systems)
// ============================================================================

/**
 * ULTRA-SPARSE: Remote, lonely outposts at the edge of the galaxy.
 * - Always exactly 1 star
 * - Usually just 1 planet (sometimes 2, rarely 0)
 * - Most planets have NO moons at all
 * - Rare lonely moon if lucky
 * 
 * ## L-System Grammar (Formal Notation)
 * 
 * ```
 * S  →  ★{1}  ●?                      Single star, maybe planets
 * ★  →  ε                             Star is terminal
 * ●? → [15%: ε]                       15% no planets at all!
 *    | [60%: ●{1}]                    60% exactly 1 planet
 *    | [25%: ●{2}]                    25% exactly 2 planets
 * ●  →  [75%: ε]                      75% of planets are moonless
 *    |  [25%: ◦?]                     25% have moons
 * ◦? → [85%: ◦{1}]                    If moons, usually just 1
 *    | [15%: ◦{2}]                    Rarely 2 moons
 * ◦  →  ε                             Moon is terminal
 * ```
 * 
 * ## Production Rules (Weighted)
 * 
 * ```
 * system  → [100%: stars, planets]
 * stars   → [100%: star, maxCount=1]          ; always single
 * planets → [15%: ε]                          ; 15% empty!
 *         | [60%: planet, fixed(1)]           ; 60% exactly 1 planet
 *         | [25%: planet, fixed(2)]           ; 25% exactly 2 planets
 * planet  → [75%: ε]                          ; 75% moonless
 *         | [25%: moons]                      ; 25% have moons
 * moons   → [85%: moon, fixed(1)]             ; usually 1 moon
 *         | [15%: moon, fixed(2)]             ; rarely 2 moons
 * star    → [100%: ε]
 * moon    → [100%: ε]
 * ```
 */
const SPARSE_OUTPOST_GRAMMAR: GrammarDefinition = {
  axiom: ['system'],
  productions: {
    system: [
      { weight: 1.0, expand: ['stars', 'planets'] }
    ],
    stars: [
      { weight: 1.0, expand: ['star'], maxCount: 1 }  // Always exactly 1
    ],
    // Usually just 1 planet, max 2, sometimes 0!
    planets: [
      { weight: 0.15, expand: [] },  // 15% completely empty - no planets!
      { weight: 0.60, expand: ['planet'], repeat: { type: 'fixed', count: 1 } },  // 60% exactly 1 planet
      { weight: 0.25, expand: ['planet'], repeat: { type: 'fixed', count: 2 } },  // 25% exactly 2 planets
    ],
    planet: [
      { weight: 0.75, expand: [] },  // 75% have NO moons - lonely worlds
      { weight: 0.25, expand: ['moons'] }  // Only 25% have any moons
    ],
    // If moons exist, usually just 1
    moons: [
      { weight: 0.85, expand: ['moon'], repeat: { type: 'fixed', count: 1 } },  // Usually 1
      { weight: 0.15, expand: ['moon'], repeat: { type: 'fixed', count: 2 } },  // Rarely 2
    ],
    star: [{ weight: 1.0, expand: [] }],
    moon: [{ weight: 1.0, expand: [] }],
  },
  maxDepth: 3,
  starCount: { single: 1.0, binary: 0.0, ternary: 0.0 },
  allowSubMoons: false,
  defaultPlanetGeometricP: 0.95,  // Almost no planets
  defaultMoonGeometricP: 0.95,    // Almost no moons
};

export const SPARSE_OUTPOST_PRESET: TopologyPreset = {
  id: 'sparseOutpost',
  name: 'Sparse Outpost',
  description: 'Ultra-minimal: 1 star, 0-2 planets, most have no moons - lonely frontier',
  grammar: SPARSE_OUTPOST_GRAMMAR,
  suggestedOverrides: {
    starProbabilities: [1.0, 0.0, 0.0],
    planetGeometricP: 0.95,
    moonGeometricP: 0.95,
    maxDepth: 3,
  },
};

// ============================================================================
// Deep Hierarchy Grammar (NESTED - moons with sub-moons are COMMON)
// ============================================================================

/**
 * EXTREME NESTING: Moons commonly have their own sub-moons!
 * Creates complex, layered orbital structures.
 * - 50% of moons have sub-moons
 * - Sub-moons can have 1-4 mini-moons
 * - Creates beautiful nested orbital patterns
 * 
 * ## L-System Grammar (Formal Notation)
 * 
 * ```
 * S  →  ★{1}  ●{2-5}                  Single star, 2-5 planets
 * ★  →  ε                             Star is terminal
 * ●  →  ◦{2-6}                        Planet has 2-6 moons
 * ◦  →  [50%: ε]                      50% are terminal moons
 *    |  [50%: ·{1-4}]                 50% have 1-4 sub-moons!
 * ·  →  ε                             Sub-moon is terminal
 * 
 * Where:
 *   ★{1}     : Always exactly 1 star (to see hierarchy clearly)
 *   ●{2-5}   : Uniform 2-5 planets
 *   ◦{2-6}   : Uniform 2-6 moons per planet
 *   ·{1-4}   : Uniform 1-4 sub-moons (for half of moons)
 * ```
 * 
 * ## Production Rules (Weighted)
 * 
 * ```
 * system   → [100%: stars, planets]
 * stars    → [100%: star, maxCount=1]
 * planets  → [100%: planet, uniform(2,5)]
 * planet   → [100%: moons]
 * moons    → [100%: moon, uniform(2,6)]
 * moon     → [50%: ε]                      ; terminal
 *          | [50%: submoons]               ; has sub-moons!
 * submoons → [100%: submoon, uniform(1,4)]
 * submoon  → [100%: ε]
 * ```
 */
const DEEP_HIERARCHY_GRAMMAR: GrammarDefinition = {
  axiom: ['system'],
  productions: {
    system: [
      { weight: 1.0, expand: ['stars', 'planets'] }
    ],
    stars: [
      { weight: 1.0, expand: ['star'], maxCount: 1 }  // Single star to see hierarchy clearly
    ],
    // Moderate planets to showcase the hierarchy
    planets: [
      { weight: 1.0, expand: ['planet'], repeat: { type: 'uniform', min: 2, max: 5 } }
    ],
    planet: [
      { weight: 1.0, expand: ['moons'] }
    ],
    // Good number of moons
    moons: [
      { weight: 1.0, expand: ['moon'], repeat: { type: 'uniform', min: 2, max: 6 } }
    ],
    // 50% of moons have sub-moons! (was 15%)
    moon: [
      { weight: 0.50, expand: [] },           // 50% are terminal
      { weight: 0.50, expand: ['submoons'] }  // 50% have sub-moons!
    ],
    // Each moon with sub-moons has 1-4 of them
    submoons: [
      { weight: 1.0, expand: ['submoon'], repeat: { type: 'uniform', min: 1, max: 4 } }
    ],
    submoon: [
      { weight: 1.0, expand: [] }  // Terminal (no sub-sub-moons for sanity)
    ],
  },
  maxDepth: 6,
  starCount: { single: 1.0, binary: 0.0, ternary: 0.0 },
  allowSubMoons: true,
  defaultPlanetGeometricP: 0.35,
  defaultMoonGeometricP: 0.25,
};

export const DEEP_HIERARCHY_PRESET: TopologyPreset = {
  id: 'deepHierarchy',
  name: 'Deep Hierarchy',
  description: '50% of moons have sub-moons (1-4 each)! Nested orbital structures',
  grammar: DEEP_HIERARCHY_GRAMMAR,
  suggestedOverrides: {
    starProbabilities: [1.0, 0.0, 0.0],
    planetGeometricP: 0.35,
    moonGeometricP: 0.25,
    maxDepth: 6,
  },
};

// ============================================================================
// Preset Registry
// ============================================================================

/**
 * All available topology presets, keyed by ID.
 * Add new presets here to make them available in the generator.
 */
export const TOPOLOGY_PRESETS: Record<TopologyPresetId, TopologyPreset> = {
  classic: CLASSIC_PRESET,
  compact: COMPACT_PRESET,
  multiStarHeavy: MULTI_STAR_HEAVY_PRESET,
  moonRich: MOON_RICH_PRESET,
  sparseOutpost: SPARSE_OUTPOST_PRESET,
  deepHierarchy: DEEP_HIERARCHY_PRESET,
};

/**
 * Get a topology preset by ID
 */
export function getTopologyPreset(id: TopologyPresetId): TopologyPreset {
  const preset = TOPOLOGY_PRESETS[id];
  if (!preset) {
    console.warn(`Unknown topology preset: ${id}, falling back to classic`);
    return TOPOLOGY_PRESETS.classic;
  }
  return preset;
}

/**
 * Get all available topology preset IDs
 */
export function getTopologyPresetIds(): TopologyPresetId[] {
  return Object.keys(TOPOLOGY_PRESETS) as TopologyPresetId[];
}

/**
 * Get preset options for UI dropdown
 */
export function getTopologyPresetOptions(): Array<{ id: TopologyPresetId; name: string; description: string }> {
  return Object.values(TOPOLOGY_PRESETS).map(preset => ({
    id: preset.id,
    name: preset.name,
    description: preset.description,
  }));
}

/**
 * Default topology preset ID
 */
export const DEFAULT_TOPOLOGY_PRESET: TopologyPresetId = 'classic';
