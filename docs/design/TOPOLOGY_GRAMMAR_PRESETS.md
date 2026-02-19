# Topology Grammar Presets

## Status

Stable

## Problem / context

The generator’s “shape” (stars/planets/moons hierarchy) is driven by **pluggable topology presets**. This doc defines the grammar notation and the available presets so new presets can be added safely.

## Goals / non-goals

- **Goals**:
  - Document the topology grammar notation and preset catalog.
  - Make it easy to add/modify presets without breaking invariants.
- **Non-goals**:
  - Explain the full generator pipeline end-to-end (see `docs/design/ALGORITHM_FLOW.md`).

## Key concepts / terminology

- **Grammar definition**: axiom + productions (stochastic rules).
- **Topology generator**: interpreter that expands the grammar to a tree.

## System overview

This doc focuses on topology: the grammar layer and how preset IDs map to grammar definitions.

## Overview

The procedural generator uses a **pluggable topology system** based on stochastic L-system grammars. This allows different "presets" to dramatically alter the hierarchical structure of generated solar systems—from sparse outposts with a single lonely planet to moon-rich systems where every planet resembles Jupiter.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Topology System                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌─────────────┐    ┌─────────────────┐    ┌───────────────────┐   │
│  │  Preset ID  │───▶│ GrammarDefinition│───▶│ TopologyGenerator │   │
│  │  (config)   │    │    (axiom +      │    │   (generates      │   │
│  │             │    │   productions)   │    │    LSystemNode    │   │
│  └─────────────┘    └─────────────────┘    │       tree)       │   │
│                                            └─────────┬─────────┘   │
│                                                      │             │
│                                                      ▼             │
│                                            ┌───────────────────┐   │
│                                            │  StarDataGenerator │   │
│                                            │   (converts tree   │   │
│                                            │    to Star[])      │   │
│                                            └───────────────────┘   │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `TopologyPreset` | `src/utils/topology/types.ts` | Interface for preset definitions |
| `GrammarDefinition` | `src/utils/topology/types.ts` | Grammar structure (axiom + productions) |
| `TopologyGenerator` | `src/utils/topology/types.ts` | Interface for pluggable generators |
| `GrammarTopologyGenerator` | `src/utils/topology/generators.ts` | Interprets grammar definitions |
| `TOPOLOGY_PRESETS` | `src/utils/topology/presets.ts` | Registry of all available presets |

## L-System Grammar Notation

Each preset uses a stochastic context-free L-system grammar. The formal notation uses these symbols:

### Symbols

| Symbol | Meaning |
|--------|---------|
| **S** | System (root node) |
| **★** | Star (terminal) |
| **●** | Planet (may expand to moons) |
| **◦** | Moon (may expand to sub-moons) |
| **·** | Sub-moon (terminal) |
| **ε** | Empty (terminal, no expansion) |

### Quantifiers

| Notation | Meaning |
|----------|---------|
| `{n}` | Exactly n instances |
| `{n,m}` | Uniform random in [n,m] inclusive |
| `*` | Geometric distribution (0 or more) |
| `+` | Geometric distribution (1 or more) |
| `?` | Optional (0 or 1) |

### Weighted Rules

```
●  →  [70%: ◦*]       70% chance: planet has moons
   |  [30%: ε]        30% chance: planet is moonless
```

### Distribution Annotations

| Annotation | Meaning |
|------------|---------|
| `geom(p)` | Geometric distribution with parameter p |
| `uniform(a,b)` | Uniform distribution in [a,b] |
| `fixed(n)` | Exactly n instances |
| `min=n` | Minimum count constraint |
| `max=n` | Maximum count constraint |

## Available Presets

### 1. Classic (`classic`)

The default grammar that replicates the original generator behavior.

```
S  →  ★{1-3}  ●*                    System expands to 1-3 stars + planets
★  →  ε                             Star is terminal
●  →  ◦*                            Planet expands to moons
◦  →  ε                             Moon is terminal

Where:
  ★{1-3}  : Star count from starCount (65% single, 25% binary, 10% ternary)
  ●*      : Planets via geometric(p=0.4), expected ~1.5 planets
  ◦*      : Moons via geometric(p=0.3), expected ~2.3 moons per planet
```

**Characteristics:**
- Balanced mix of single/binary/ternary stars
- Moderate planet counts (~1-4)
- Moderate moon counts (~0-5)
- No sub-moons

### 2. Compact (`compact`)

Jupiter-like systems: few planets, many moons.

```
S  →  ★{1}  ●{1,2}                  Always 1 star, 1-2 planets
★  →  ε                             Star is terminal
●  →  ◦{5-18}                       Planet has 5-18 moons!
◦  →  ε                             Moon is terminal

Where:
  ★{1}     : Always exactly 1 star
  ●{1,2}   : Uniform 1-2 planets
  ◦{5-18}  : Geometric(p=0.08) clamped to [5,18], expected ~12.5 moons
```

**Characteristics:**
- Always single star
- Only 1-2 planets
- 5-18 moons per planet (Jupiter-like)
- Focus on detailed moon systems

### 3. Multi-Star Heavy (`multiStarHeavy`)

95% binary/ternary—stars are the main attraction.

```
S  →  ★{1-3}  ●{1-4}                Stars + limited planets
★  →  ε                             Star is terminal
●  →  [70%: ◦{1-3}]                 70% of planets have 1-3 moons
   |  [30%: ε]                      30% have no moons

Where:
  ★{1-3}  : Star count (5% single, 55% binary, 40% ternary)
  ●{1-4}  : Uniform 1-4 planets
```

**Characteristics:**
- 95% binary or ternary systems
- Fewer planets (stars are the focus)
- Simple moon systems
- Dramatic multi-star orbital dances

### 4. Moon-Rich (`moonRich`)

Every planet is surrounded by a swarm of moons.

```
S  →  ★{1}  ●{3-6}                  Single star, 3-6 planets
★  →  ε                             Star is terminal
●  →  ◦{4-25}                       EVERY planet has 4-25 moons!
◦  →  ε                             Moon is terminal

Where:
  ★{1}     : Always exactly 1 star
  ●{3-6}   : Uniform 3-6 planets
  ◦{4-25}  : Geometric(p=0.05) clamped to [4,25], expected ~20 moons!
```

**Characteristics:**
- Always single star
- 3-6 planets
- 4-25 moons per planet
- Systems "swimming in satellites"

### 5. Sparse Outpost (`sparseOutpost`)

Remote, lonely frontier systems.

```
S  →  ★{1}  ●?                      Single star, maybe planets
★  →  ε                             Star is terminal
●? → [15%: ε]                       15% no planets at all!
   | [60%: ●{1}]                    60% exactly 1 planet
   | [25%: ●{2}]                    25% exactly 2 planets
●  →  [75%: ε]                      75% of planets are moonless
   |  [25%: ◦?]                     25% have moons
◦? → [85%: ◦{1}]                    If moons, usually just 1
   | [15%: ◦{2}]                    Rarely 2 moons
```

**Characteristics:**
- Always single star
- 0-2 planets (15% have none!)
- 75% of planets have no moons
- Ultra-minimal, lonely systems

### 6. Deep Hierarchy (`deepHierarchy`)

Moons have their own moons—nested orbital structures.

```
S  →  ★{1}  ●{2-5}                  Single star, 2-5 planets
★  →  ε                             Star is terminal
●  →  ◦{2-6}                        Planet has 2-6 moons
◦  →  [50%: ε]                      50% are terminal moons
   |  [50%: ·{1-4}]                 50% have 1-4 sub-moons!
·  →  ε                             Sub-moon is terminal
```

**Characteristics:**
- Always single star
- 2-5 planets
- 2-6 moons per planet
- 50% of moons have 1-4 sub-moons
- Complex nested hierarchies

## Preset Comparison

| Preset | Stars | Planets | Moons/Planet | Sub-moons | Total Bodies (typical) |
|--------|-------|---------|--------------|-----------|------------------------|
| Classic | 1-3 | 0-5 | 0-5 | ✗ | 5-15 |
| Compact | 1 | 1-2 | 5-18 | ✗ | 10-40 |
| Multi-Star Heavy | 2-3 (95%) | 1-4 | 0-3 | ✗ | 5-15 |
| Moon-Rich | 1 | 3-6 | 4-25 | ✗ | 20-150+ |
| Sparse Outpost | 1 | 0-2 | 0-2 | ✗ | 1-5 |
| Deep Hierarchy | 1 | 2-5 | 2-6 | ✓ (50%) | 15-50+ |

## Using Topology Presets

### In UI

Select a preset from the "Topology / Grammar" dropdown in the Universe Generator Panel.

### Programmatically

```typescript
import { generateSolarSystem } from './utils/procedural-generator';

// Use a specific topology preset
const system = generateSolarSystem({
  topologyPresetId: 'moonRich',
  seed: 12345,
});

// The preset's suggested overrides are automatically applied
// unless you override them explicitly
```

### Getting Preset Information

```typescript
import { 
  getTopologyPreset, 
  getTopologyPresetIds, 
  getTopologyPresetOptions 
} from './utils/topology';

// Get a single preset
const moonRich = getTopologyPreset('moonRich');
console.log(moonRich.name);        // "Moon-Rich"
console.log(moonRich.description); // "Every planet has 4-25 moons!..."

// Get all preset IDs
const ids = getTopologyPresetIds();
// ['classic', 'compact', 'multiStarHeavy', 'moonRich', 'sparseOutpost', 'deepHierarchy']

// Get options for UI dropdown
const options = getTopologyPresetOptions();
// [{ id: 'classic', name: 'Classic', description: '...' }, ...]
```

## Adding a New Preset

### Step 1: Add the Preset ID

Edit `src/utils/topology/types.ts`:

```typescript
export type TopologyPresetId = 
  | 'classic'
  | 'compact'
  | 'multiStarHeavy'
  | 'moonRich'
  | 'sparseOutpost'
  | 'deepHierarchy'
  | 'myNewPreset';  // Add your ID here
```

### Step 2: Define the Grammar

Edit `src/utils/topology/presets.ts`:

```typescript
/**
 * My New Preset - description of what it does
 * 
 * ## L-System Grammar (Formal Notation)
 * 
 * ```
 * S  →  ★{1-2}  ●{2-4}
 * ★  →  ε
 * ●  →  ◦{1-3}
 * ◦  →  ε
 * ```
 */
const MY_NEW_GRAMMAR: GrammarDefinition = {
  axiom: ['system'],
  productions: {
    system: [
      { weight: 1.0, expand: ['stars', 'planets'] }
    ],
    stars: [
      { weight: 1.0, expand: ['star'], maxCount: 2 }
    ],
    planets: [
      { weight: 1.0, expand: ['planet'], repeat: { type: 'uniform', min: 2, max: 4 } }
    ],
    planet: [
      { weight: 1.0, expand: ['moons'] }
    ],
    moons: [
      { weight: 1.0, expand: ['moon'], repeat: { type: 'uniform', min: 1, max: 3 } }
    ],
    star: [{ weight: 1.0, expand: [] }],
    moon: [{ weight: 1.0, expand: [] }],
  },
  maxDepth: 4,
  starCount: { single: 0.7, binary: 0.3, ternary: 0.0 },
  allowSubMoons: false,
};

export const MY_NEW_PRESET: TopologyPreset = {
  id: 'myNewPreset',
  name: 'My New Preset',
  description: 'A custom topology with unique characteristics',
  grammar: MY_NEW_GRAMMAR,
  suggestedOverrides: {
    planetGeometricP: 0.35,
    moonGeometricP: 0.4,
  },
};
```

### Step 3: Register the Preset

Still in `src/utils/topology/presets.ts`:

```typescript
export const TOPOLOGY_PRESETS: Record<TopologyPresetId, TopologyPreset> = {
  classic: CLASSIC_PRESET,
  compact: COMPACT_PRESET,
  multiStarHeavy: MULTI_STAR_HEAVY_PRESET,
  moonRich: MOON_RICH_PRESET,
  sparseOutpost: SPARSE_OUTPOST_PRESET,
  deepHierarchy: DEEP_HIERARCHY_PRESET,
  myNewPreset: MY_NEW_PRESET,  // Add here
};
```

The preset will automatically appear in the UI dropdown.

## Grammar Definition Reference

### GrammarDefinition Interface

```typescript
interface GrammarDefinition {
  /** Starting symbols (always ['system']) */
  axiom: GrammarSymbol[];
  
  /** Production rules for each symbol */
  productions: Partial<Record<GrammarSymbol, ProductionRule[]>>;
  
  /** Maximum expansion depth (prevents infinite recursion) */
  maxDepth: number;
  
  /** Star count probabilities (single, binary, ternary) */
  starCount?: { single: number; binary: number; ternary: number };
  
  /** Whether this grammar allows sub-moons */
  allowSubMoons?: boolean;
  
  /** Default geometric P for planets */
  defaultPlanetGeometricP?: number;
  
  /** Default geometric P for moons */
  defaultMoonGeometricP?: number;
}
```

### ProductionRule Interface

```typescript
interface ProductionRule {
  /** Weight for stochastic selection (relative, normalized at runtime) */
  weight: number;
  
  /** Symbols to expand to (empty = terminal) */
  expand: GrammarSymbol[];
  
  /** Optional repeat distribution */
  repeat?: {
    type: 'geometric' | 'fixed' | 'uniform' | 'poisson';
    p?: number;       // For geometric
    count?: number;   // For fixed
    min?: number;     // For uniform
    max?: number;     // For uniform
    lambda?: number;  // For poisson
  };
  
  /** Optional constraint: minimum count */
  minCount?: number;
  
  /** Optional constraint: maximum count */
  maxCount?: number;
}
```

### Available Symbols

| Symbol | Type | Purpose |
|--------|------|---------|
| `system` | Root | Container for stars and planets |
| `stars` | Expansion | Expands to 1-3 star nodes |
| `star` | Terminal | Becomes an actual star body |
| `planets` | Expansion | Expands to 0-N planets |
| `planet` | Container | Contains moons expansion |
| `moons` | Expansion | Expands to 0-N moons |
| `moon` | Terminal/Container | Terminal or expands to submoons |
| `submoons` | Expansion | Expands to 0-N sub-moons |
| `submoon` | Terminal | Moon of a moon |

## Determinism

The topology system is fully deterministic:

- Same seed + same preset = identical topology
- Each preset uses the same PRNG sequence
- The `GrammarTopologyGenerator` uses forked RNGs for reproducibility

```typescript
// These will always produce identical systems
const system1 = generateSolarSystem({ seed: 42, topologyPresetId: 'moonRich' });
const system2 = generateSolarSystem({ seed: 42, topologyPresetId: 'moonRich' });
// system1 ≡ system2 (structurally identical)
```

## Testing Presets

Use the test utilities in `src/utils/generator-examples.ts`:

```typescript
import { 
  testTopologyDeterminism, 
  compareTopologyPresets 
} from './utils/generator-examples';

// Verify determinism
const deterministicResults = testTopologyDeterminism();
console.log(deterministicResults);

// Compare all presets
const comparison = compareTopologyPresets();
console.log(comparison);
```

## Data model / invariants

- A topology preset ultimately expands into a tree of conceptual nodes (system → stars/planets → moons/submoons) which is then converted into concrete bodies.
- Invariants:
  - Expansion must terminate (no infinite rewrites).
  - Generated hierarchies are acyclic.
  - Counts respect any configured min/max constraints.

## Key flows

- **Preset selection**: `topologyPresetId` → `TOPOLOGY_PRESETS` lookup → `GrammarTopologyGenerator` expansion.
- **Determinism**: seeded PRNG (and forked streams) ensures stable topology for the same seed+preset.

## Tradeoffs / alternatives

- L-system grammars are compact and expressive, but can be harder to debug than explicit procedural code.
- Presets make variety easy, but add maintenance burden (docs + tests per preset).

## Open questions

- Should we formalize a small “preset validation” suite (static checks) to catch bad productions earlier?

## Related docs

- `docs/design/PROCEDURAL_GENERATOR.md` - Main generator documentation
- `docs/guides/GENERATOR_QUICKREF.md` - Quick reference for configuration
- `docs/design/ALGORITHM_FLOW.md` - Visual end-to-end flow diagram

## References

- **L-Systems**: Lindenmayer, A. (1968). "Mathematical models for cellular interactions"
- **Stochastic Grammars**: Prusinkiewicz & Lindenmayer (1990). "The Algorithmic Beauty of Plants"

