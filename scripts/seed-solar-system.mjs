#!/usr/bin/env node

/**
 * seed-solar-system.mjs
 *
 * Sends 50 sequential UniverseCommands to the backend API, one every 250 ms,
 * constructing a full Solar System (Sol + 8 planets, moons, rings, groups,
 * asteroid/Kuiper belts, protoplanetary disk, and a nebula backdrop).
 *
 * Usage:
 *   node scripts/seed-solar-system.mjs <universeId> [apiBaseUrl]
 *
 * Examples:
 *   node scripts/seed-solar-system.mjs my-universe-123
 *   node scripts/seed-solar-system.mjs my-universe-123 http://localhost:3001
 */

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const UNIVERSE_ID = process.argv[2];
const API_BASE = (process.argv[3] ?? 'http://localhost:3001').replace(/\/+$/, '');
const DELAY_MS = 250;

if (!UNIVERSE_ID) {
  console.error('Usage: node scripts/seed-solar-system.mjs <universeId> [apiBaseUrl]');
  process.exit(1);
}

const endpoint = `${API_BASE}/universes/${encodeURIComponent(UNIVERSE_ID)}/commands`;

// ---------------------------------------------------------------------------
// Deterministic IDs (readable for debugging)
// ---------------------------------------------------------------------------

const ID = {
  sol:       'seed-sol-0001',
  mercury:   'seed-mercury-0002',
  venus:     'seed-venus-0003',
  earth:     'seed-earth-0004',
  mars:      'seed-mars-0005',
  luna:      'seed-luna-0006',
  phobos:    'seed-phobos-0007',
  deimos:    'seed-deimos-0008',
  jupiter:   'seed-jupiter-0009',
  io:        'seed-io-0010',
  europa:    'seed-europa-0011',
  ganymede:  'seed-ganymede-0012',
  callisto:  'seed-callisto-0013',
  saturn:    'seed-saturn-0014',
  titan:     'seed-titan-0015',
  enceladus: 'seed-enceladus-0016',
  uranus:    'seed-uranus-0017',
  miranda:   'seed-miranda-0018',
  neptune:   'seed-neptune-0019',
  triton:    'seed-triton-0020',
  // Groups
  grpSolarSys:    'seed-grp-solar-system',
  grpInnerPlanets: 'seed-grp-inner-planets',
  // Small body fields
  asteroidBelt: 'seed-sbf-asteroid-belt',
  kuiperBelt:   'seed-sbf-kuiper-belt',
  // Protoplanetary disk
  protoDisk: 'seed-proto-disk-001',
  // Nebula
  nebula: 'seed-nebula-001',
};

// ---------------------------------------------------------------------------
// Command sequence (50 commands)
// ---------------------------------------------------------------------------

/** @type {import('@solar/domain').UniverseCommand[]} */
const commands = [
  // =========================================================================
  // Phase 1 — The Sun (1 cmd)
  // =========================================================================
  {
    type: 'addStar',
    id: ID.sol,
    payload: {
      name: 'Sol',
      mass: 100,
      radius: 10,
      color: '#FDB813',
      parentId: null,
      bodyType: 'star',
      orbitalDistance: 0,
      orbitalSpeed: 0,
      orbitalPhase: 0,
    },
  },

  // =========================================================================
  // Phase 2 — Inner rocky planets (8 cmds: 4 add + 4 attach)
  // =========================================================================
  {
    type: 'addStar',
    id: ID.mercury,
    payload: {
      name: 'Mercury',
      mass: 0.06,
      radius: 0.38,
      color: '#A0522D',
      parentId: null,
      bodyType: 'planet',
      orbitalDistance: 20,
      orbitalSpeed: 4.1,
      orbitalPhase: 47,
      eccentricity: 0.206,
    },
  },
  { type: 'attachStar', childId: ID.mercury, parentId: ID.sol },

  {
    type: 'addStar',
    id: ID.venus,
    payload: {
      name: 'Venus',
      mass: 0.82,
      radius: 0.95,
      color: '#DEB887',
      parentId: null,
      bodyType: 'planet',
      orbitalDistance: 35,
      orbitalSpeed: 1.6,
      orbitalPhase: 131,
      eccentricity: 0.007,
    },
  },
  { type: 'attachStar', childId: ID.venus, parentId: ID.sol },

  {
    type: 'addStar',
    id: ID.earth,
    payload: {
      name: 'Earth',
      mass: 1.0,
      radius: 1.0,
      color: '#4169E1',
      parentId: null,
      bodyType: 'planet',
      orbitalDistance: 50,
      orbitalSpeed: 1.0,
      orbitalPhase: 0,
      eccentricity: 0.017,
    },
  },
  { type: 'attachStar', childId: ID.earth, parentId: ID.sol },

  {
    type: 'addStar',
    id: ID.mars,
    payload: {
      name: 'Mars',
      mass: 0.11,
      radius: 0.53,
      color: '#CD5C5C',
      parentId: null,
      bodyType: 'planet',
      orbitalDistance: 75,
      orbitalSpeed: 0.53,
      orbitalPhase: 211,
      eccentricity: 0.093,
    },
  },
  { type: 'attachStar', childId: ID.mars, parentId: ID.sol },

  // =========================================================================
  // Phase 3 — Earth's Moon (2 cmds)
  // =========================================================================
  {
    type: 'addStar',
    id: ID.luna,
    payload: {
      name: 'Luna',
      mass: 0.012,
      radius: 0.27,
      color: '#C0C0C0',
      parentId: null,
      bodyType: 'moon',
      orbitalDistance: 4,
      orbitalSpeed: 3.5,
      orbitalPhase: 0,
    },
  },
  { type: 'attachStar', childId: ID.luna, parentId: ID.earth },

  // =========================================================================
  // Phase 4 — Mars moons (4 cmds)
  // =========================================================================
  {
    type: 'addStar',
    id: ID.phobos,
    payload: {
      name: 'Phobos',
      mass: 0.00002,
      radius: 0.08,
      color: '#8B7D6B',
      parentId: null,
      bodyType: 'moon',
      orbitalDistance: 2,
      orbitalSpeed: 6.0,
      orbitalPhase: 0,
    },
  },
  { type: 'attachStar', childId: ID.phobos, parentId: ID.mars },

  {
    type: 'addStar',
    id: ID.deimos,
    payload: {
      name: 'Deimos',
      mass: 0.000003,
      radius: 0.05,
      color: '#9C8E7E',
      parentId: null,
      bodyType: 'moon',
      orbitalDistance: 3.5,
      orbitalSpeed: 4.0,
      orbitalPhase: 120,
    },
  },
  { type: 'attachStar', childId: ID.deimos, parentId: ID.mars },

  // =========================================================================
  // Phase 5 — Jupiter + Galilean moons (10 cmds)
  // =========================================================================
  {
    type: 'addStar',
    id: ID.jupiter,
    payload: {
      name: 'Jupiter',
      mass: 317.8,
      radius: 6.5,
      color: '#C88B3A',
      parentId: null,
      bodyType: 'planet',
      orbitalDistance: 160,
      orbitalSpeed: 0.084,
      orbitalPhase: 34,
      eccentricity: 0.049,
      semiMajorAxis: 165,
      orbitRotX: 1.3,
      orbitRotZ: -2.4,
    },
  },
  { type: 'attachStar', childId: ID.jupiter, parentId: ID.sol },

  {
    type: 'addStar',
    id: ID.io,
    payload: {
      name: 'Io',
      mass: 0.015,
      radius: 0.29,
      color: '#FFD700',
      parentId: null,
      bodyType: 'moon',
      orbitalDistance: 9,
      orbitalSpeed: 5.5,
      orbitalPhase: 0,
    },
  },
  { type: 'attachStar', childId: ID.io, parentId: ID.jupiter },

  {
    type: 'addStar',
    id: ID.europa,
    payload: {
      name: 'Europa',
      mass: 0.008,
      radius: 0.25,
      color: '#E8E4D4',
      parentId: null,
      bodyType: 'moon',
      orbitalDistance: 12,
      orbitalSpeed: 4.0,
      orbitalPhase: 90,
    },
  },
  { type: 'attachStar', childId: ID.europa, parentId: ID.jupiter },

  {
    type: 'addStar',
    id: ID.ganymede,
    payload: {
      name: 'Ganymede',
      mass: 0.025,
      radius: 0.41,
      color: '#8B8682',
      parentId: null,
      bodyType: 'moon',
      orbitalDistance: 16,
      orbitalSpeed: 2.8,
      orbitalPhase: 180,
    },
  },
  { type: 'attachStar', childId: ID.ganymede, parentId: ID.jupiter },

  {
    type: 'addStar',
    id: ID.callisto,
    payload: {
      name: 'Callisto',
      mass: 0.018,
      radius: 0.38,
      color: '#6B6660',
      parentId: null,
      bodyType: 'moon',
      orbitalDistance: 22,
      orbitalSpeed: 1.7,
      orbitalPhase: 270,
    },
  },
  { type: 'attachStar', childId: ID.callisto, parentId: ID.jupiter },

  // =========================================================================
  // Phase 6 — Saturn + ring + moons (6 cmds)
  // =========================================================================
  {
    type: 'addStar',
    id: ID.saturn,
    payload: {
      name: 'Saturn',
      mass: 95.2,
      radius: 5.5,
      color: '#EDD9A3',
      parentId: null,
      bodyType: 'planet',
      orbitalDistance: 290,
      orbitalSpeed: 0.034,
      orbitalPhase: 169,
      eccentricity: 0.056,
      semiMajorAxis: 295,
      orbitRotX: 2.5,
      orbitRotZ: 5.5,
    },
  },
  { type: 'attachStar', childId: ID.saturn, parentId: ID.sol },

  // Saturn's iconic ring system
  {
    type: 'updateRing',
    planetId: ID.saturn,
    patch: {
      innerRadiusMultiplier: 1.5,
      outerRadiusMultiplier: 3.2,
      thickness: 0.05,
      opacity: 0.75,
      albedo: 0.8,
      color: '#DAC086',
      density: 0.7,
      seed: 42,
    },
  },

  {
    type: 'addStar',
    id: ID.titan,
    payload: {
      name: 'Titan',
      mass: 0.023,
      radius: 0.40,
      color: '#E8A317',
      parentId: null,
      bodyType: 'moon',
      orbitalDistance: 14,
      orbitalSpeed: 2.2,
      orbitalPhase: 45,
    },
  },
  { type: 'attachStar', childId: ID.titan, parentId: ID.saturn },

  {
    type: 'addStar',
    id: ID.enceladus,
    payload: {
      name: 'Enceladus',
      mass: 0.00002,
      radius: 0.08,
      color: '#F0F8FF',
      parentId: null,
      bodyType: 'moon',
      orbitalDistance: 7,
      orbitalSpeed: 5.0,
      orbitalPhase: 200,
    },
  },
  { type: 'attachStar', childId: ID.enceladus, parentId: ID.saturn },

  // =========================================================================
  // Phase 7 — Uranus + ring + moon (4 cmds)
  // =========================================================================
  {
    type: 'addStar',
    id: ID.uranus,
    payload: {
      name: 'Uranus',
      mass: 14.5,
      radius: 3.2,
      color: '#73C2FB',
      parentId: null,
      bodyType: 'planet',
      orbitalDistance: 480,
      orbitalSpeed: 0.012,
      orbitalPhase: 303,
      eccentricity: 0.047,
      orbitRotX: 0.8,
    },
  },
  { type: 'attachStar', childId: ID.uranus, parentId: ID.sol },

  // Uranus has thin, dark rings
  {
    type: 'updateRing',
    planetId: ID.uranus,
    patch: {
      innerRadiusMultiplier: 1.6,
      outerRadiusMultiplier: 2.0,
      thickness: 0.01,
      opacity: 0.3,
      albedo: 0.3,
      color: '#4A6670',
      density: 0.25,
      seed: 77,
    },
  },

  {
    type: 'addStar',
    id: ID.miranda,
    payload: {
      name: 'Miranda',
      mass: 0.00011,
      radius: 0.07,
      color: '#B0B0B0',
      parentId: null,
      bodyType: 'moon',
      orbitalDistance: 6,
      orbitalSpeed: 4.5,
      orbitalPhase: 60,
    },
  },
  { type: 'attachStar', childId: ID.miranda, parentId: ID.uranus },

  // =========================================================================
  // Phase 8 — Neptune + Triton (3 cmds)
  // =========================================================================
  {
    type: 'addStar',
    id: ID.neptune,
    payload: {
      name: 'Neptune',
      mass: 17.1,
      radius: 3.1,
      color: '#4166F5',
      parentId: null,
      bodyType: 'planet',
      orbitalDistance: 700,
      orbitalSpeed: 0.006,
      orbitalPhase: 260,
      eccentricity: 0.009,
      orbitRotX: 1.8,
    },
  },
  { type: 'attachStar', childId: ID.neptune, parentId: ID.sol },

  {
    type: 'addStar',
    id: ID.triton,
    payload: {
      name: 'Triton',
      mass: 0.0036,
      radius: 0.21,
      color: '#C9E4F2',
      parentId: null,
      bodyType: 'moon',
      orbitalDistance: 10,
      orbitalSpeed: 3.0,
      orbitalPhase: 180,
    },
  },
  { type: 'attachStar', childId: ID.triton, parentId: ID.neptune },

  // =========================================================================
  // Phase 9 — Group organization (4 cmds)
  // =========================================================================
  {
    type: 'addGroup',
    id: ID.grpSolarSys,
    payload: {
      name: 'Solar System',
      children: [],
      parentGroupId: null,
      color: '#FDB813',
      icon: '☀️',
    },
  },
  {
    type: 'addToGroup',
    groupId: ID.grpSolarSys,
    child: { id: ID.sol, type: 'system' },
  },
  {
    type: 'addGroup',
    id: ID.grpInnerPlanets,
    payload: {
      name: 'Inner Planets',
      children: [],
      parentGroupId: ID.grpSolarSys,
      color: '#CD5C5C',
      icon: '🪨',
    },
  },
  {
    type: 'addToGroup',
    groupId: ID.grpSolarSys,
    child: { id: ID.grpInnerPlanets, type: 'group' },
  },

  // =========================================================================
  // Phase 10 — Small body fields: asteroid belt + Kuiper belt (1 cmd)
  // =========================================================================
  {
    type: 'setSmallBodyFields',
    fields: {
      [ID.asteroidBelt]: {
        id: ID.asteroidBelt,
        systemId: ID.sol,
        hostStarId: ID.sol,
        innerRadius: 110,
        outerRadius: 150,
        thickness: 3,
        particleCount: 4000,
        baseColor: '#8B7355',
        highlightColor: '#CDC9A5',
        opacity: 0.6,
        brightness: 0.5,
        clumpiness: 0.4,
        rotationSpeedMultiplier: 0.3,
        beltType: 'main',
        regionLabel: 'Asteroid Belt',
        isIcy: false,
        seed: 12345,
        style: 'moderate',
        name: 'Main Asteroid Belt',
      },
      [ID.kuiperBelt]: {
        id: ID.kuiperBelt,
        systemId: ID.sol,
        hostStarId: ID.sol,
        innerRadius: 750,
        outerRadius: 1100,
        thickness: 8,
        particleCount: 6000,
        baseColor: '#6C7B8B',
        highlightColor: '#B0C4DE',
        opacity: 0.4,
        brightness: 0.35,
        clumpiness: 0.55,
        rotationSpeedMultiplier: 0.08,
        beltType: 'kuiper',
        regionLabel: 'Kuiper Belt',
        isIcy: true,
        inclinationSigma: 12,
        seed: 67890,
        style: 'scattered',
        name: 'Kuiper Belt',
      },
    },
  },

  // =========================================================================
  // Phase 11 — Protoplanetary disk remnant around Sol (1 cmd)
  // =========================================================================
  {
    type: 'addProtoplanetaryDisk',
    disk: {
      id: ID.protoDisk,
      systemId: ID.sol,
      centralStarId: ID.sol,
      innerRadius: 1200,
      outerRadius: 1800,
      thickness: 15,
      particleCount: 2000,
      baseColor: '#483D3F',
      highlightColor: '#6B3A3A',
      opacity: 0.15,
      brightness: 0.2,
      clumpiness: 0.6,
      rotationSpeedMultiplier: 0.02,
      seed: 99999,
      style: 'thin',
      name: 'Oort Cloud Remnant',
      bandStrength: 0.3,
      bandFrequency: 3,
      gapSharpness: 0.2,
      innerGlowStrength: 0.1,
      noiseScale: 1.2,
      noiseStrength: 0.5,
      edgeSoftness: 0.8,
      temperatureGradient: 1.0,
    },
  },

  // =========================================================================
  // Phase 12 — Nebula backdrop (1 cmd)
  // =========================================================================
  {
    type: 'setNebulae',
    nebulae: {
      [ID.nebula]: {
        id: ID.nebula,
        name: 'Solar Nursery Remnant',
        position: { x: 500, y: 200, z: -800 },
        radius: 600,
        density: 0.15,
        brightness: 0.25,
        baseColor: '#2E1A47',
        accentColor: '#7B3F8D',
        noiseScale: 0.8,
        noiseDetail: 4,
        seed: 31415,
        visible: true,
      },
    },
  },

  // =========================================================================
  // Phase 13 — Cosmetic tweaks: updateStar commands (4 cmds)
  // =========================================================================

  // Give Earth a slightly elliptical orbit and orbital plane tilt
  {
    type: 'updateStar',
    id: ID.earth,
    payload: {
      semiMajorAxis: 51,
      orbitRotZ: 1.5,
    },
  },

  // Tweak Neptune to a richer deep blue
  {
    type: 'updateStar',
    id: ID.neptune,
    payload: {
      color: '#2B3FE0',
      semiMajorAxis: 710,
    },
  },
];

// ---------------------------------------------------------------------------
// Sanity check
// ---------------------------------------------------------------------------

if (commands.length !== 50) {
  console.error(
    `⚠️  Expected exactly 50 commands but got ${commands.length}. ` +
    'Adjust the command list before running.',
  );
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Sender
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function sendCommand(index, command) {
  const label = `[${String(index + 1).padStart(2, '0')}/50]`;
  const tag = command.type + (command.id ? ` (${command.id})` : command.planetId ? ` (${command.planetId})` : command.childId ? ` (${command.childId})` : '');

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(command),
  });

  if (!res.ok) {
    const body = await res.text();
    console.error(`${label} ❌ ${tag}  →  HTTP ${res.status}: ${body}`);
  } else {
    console.log(`${label} ✅ ${tag}`);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('');
  console.log('🌌 Solar System Seeder');
  console.log(`   Universe : ${UNIVERSE_ID}`);
  console.log(`   Endpoint : ${endpoint}`);
  console.log(`   Commands : ${commands.length}`);
  console.log(`   Interval : ${DELAY_MS}ms`);
  console.log(`   ETA      : ~${((commands.length * DELAY_MS) / 1000).toFixed(1)}s`);
  console.log('');

  for (let i = 0; i < commands.length; i++) {
    await sendCommand(i, commands[i]);
    if (i < commands.length - 1) {
      await sleep(DELAY_MS);
    }
  }

  console.log('');
  console.log('🎉 Done! All 50 commands sent.');
  console.log('   Open the frontend connected to this universe to see the result.');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
