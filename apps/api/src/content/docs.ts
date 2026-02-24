/**
 * Documentation Content — Solar System Constructor MCP Server
 *
 * Natural-language documentation served at /docs endpoint.
 * Content references these domain source files:
 *   - packages/domain/src/types.ts (entity type descriptions)
 *   - packages/domain/src/universe/commands.ts (command reference)
 *   - packages/domain/src/universe/state.ts (UniverseState fields)
 *   - packages/domain/src/universe/validate.ts (validation rules)
 *
 * When domain types or commands change, update the corresponding sections.
 */

import type { DocsContent } from './types.js';

export const docsContent: DocsContent = {
  title: 'Solar System Constructor — MCP Server Documentation',
  version: '0.1.0',
  sections: [
    // -----------------------------------------------------------------------
    // Section 1: System Overview
    // -----------------------------------------------------------------------
    {
      id: 'system-overview',
      heading: 'System Overview',
      body: `
The **Solar System Constructor** is a system where a generative AI model uses
an MCP (Model Context Protocol) server to build and manipulate
procedurally-generated universes.

### How it works

1. The AI sends commands through **MCP tools** exposed by the server.
2. The API receives these commands and applies them to the universe state.
3. State changes are broadcast to all connected clients via
   **Server-Sent Events (SSE)** in real time.

### Architecture

The domain is built on a **pure reducer pattern**:

\`\`\`
applyUniverseCommand(state, command) → newState
\`\`\`

The AI constructs universes by issuing a sequence of commands — each command
is a plain JSON object describing a mutation. The reducer produces a new
immutable state snapshot without side effects.

### MCP Tools

The server exposes three MCP tools:

| Tool | Purpose |
|------|---------|
| \`get_universe_state\` | Retrieve the current universe state snapshot |
| \`list_universe_commands\` | List available command types (optionally filtered by category) |
| \`send_universe_command\` | Send a command to mutate the universe |
`.trim(),
    },

    // -----------------------------------------------------------------------
    // Section 2: Universe Structure
    // -----------------------------------------------------------------------
    {
      id: 'universe-structure',
      heading: 'Universe Structure',
      body: `
The universe is represented by a single \`UniverseState\` object with nine
top-level fields:

| Field | Type | Description |
|-------|------|-------------|
| \`stars\` | \`Record<string, Star>\` | All celestial bodies keyed by ID. The \`bodyType\` field distinguishes stars, planets, moons, asteroids, comets, lagrange points, and black holes. |
| \`rootIds\` | \`string[]\` | IDs of root-level bodies (those with no parent). |
| \`groups\` | \`Record<string, Group>\` | Organizational groups that contain systems or other groups. |
| \`rootGroupIds\` | \`string[]\` | IDs of top-level groups (no parent group). |
| \`belts\` | \`Record<string, AsteroidBelt>\` | Legacy asteroid belt entities keyed by ID. |
| \`smallBodyFields\` | \`Record<string, SmallBodyField>\` | GPU particle fields for asteroid and Kuiper belts. |
| \`protoplanetaryDisks\` | \`Record<string, ProtoplanetaryDisk>\` | Shader-driven circumstellar disks of gas and dust. |
| \`nebulae\` | \`Record<string, NebulaRegion>\` | Large-scale volumetric gas/dust clouds at universe scale. |
| \`time\` | \`number\` | Simulation time in accumulated seconds. |

## Hierarchy Model

**Stars** form parent-child trees via \`parentId\` and \`children\` fields.
A root body has \`parentId: null\` and appears in \`rootIds\`. Attaching a
body as a child of another body sets \`parentId\` and appends the child's ID
to the parent's \`children\` array.

**Groups** form their own hierarchy via \`parentGroupId\`. Root groups have
\`parentGroupId: null\` and appear in \`rootGroupIds\`. Group children are
typed as either \`'system'\` (a root star) or \`'group'\` (a nested group).

## Key Entity Types

### Star

The universal body type with 57+ fields. The \`bodyType\` discriminant
identifies the kind of celestial body:

- \`star\` — stellar objects
- \`planet\` — planets orbiting a star
- \`moon\` — natural satellites
- \`asteroid\` — rocky small bodies
- \`comet\` — icy bodies with tails
- \`lagrangePoint\` — L1–L5 gravitational equilibrium markers
- \`blackHole\` — ultra-dense collapsed objects

Optional sub-metadata objects provide type-specific data:

| Field | Type | When present |
|-------|------|-------------|
| \`ring\` | \`PlanetaryRing\` | Planets with ring systems |
| \`comet\` | \`CometMeta\` | Cometary bodies |
| \`lagrangePoint\` | \`LagrangePointMeta\` | Lagrange point markers |
| \`blackHole\` | \`BlackHoleProperties\` | Black holes |
| \`roguePlanet\` | \`RoguePlanetMeta\` | Rogue (unbound) planets |

Stars support elliptical orbits via \`semiMajorAxis\`, \`eccentricity\`, and
orbit rotation angles (\`orbitRotX\`, \`orbitRotY\`, \`orbitRotZ\`).

### Group

Organizational container with:
- \`name\` — display name
- \`children\` — array of \`{ id, type: 'system' | 'group' }\`
- \`parentGroupId\` — parent group or \`null\` for root
- Optional: \`color\`, \`icon\`, \`position\`

### SmallBodyField

GPU particle field for asteroid/Kuiper belts:
- Geometry: \`innerRadius\`, \`outerRadius\`, \`thickness\`
- Visual: \`particleCount\`, \`baseColor\`, \`highlightColor\`, \`opacity\`, \`brightness\`, \`clumpiness\`
- Metadata: \`beltType\` (\`'main'\` | \`'kuiper'\`), \`regionLabel\`, \`isIcy\`
- Determinism: \`seed\`, \`style\`

### ProtoplanetaryDisk

Shader-driven circumstellar disk:
- Geometry: \`innerRadius\`, \`outerRadius\`, \`thickness\`
- Visual: \`baseColor\`, \`highlightColor\`, \`opacity\`, \`brightness\`, \`clumpiness\`
- Advanced: band structure (\`bandStrength\`, \`bandFrequency\`), noise (\`noiseScale\`, \`noiseStrength\`), spiral arms (\`spiralStrength\`, \`spiralArmCount\`)
- Determinism: \`seed\`, \`style\`

### NebulaRegion

Volumetric cloud at universe scale:
- Position: \`position\` (3D coordinates)
- Geometry: \`radius\`, optional \`dimensions\` for ellipsoid
- Visual: \`density\`, \`brightness\`, \`baseColor\`, \`accentColor\`
- Noise: \`noiseScale\`, \`noiseDetail\`
- Determinism: \`seed\`
`.trim(),
    },

    // -----------------------------------------------------------------------
    // Section 3: Commands Reference
    // -----------------------------------------------------------------------
    {
      id: 'commands-reference',
      heading: 'Commands Reference',
      body: `
All 25 command types organized by category. Each command is a plain JSON
object with a \`type\` discriminant and command-specific fields.

---

## Simulation (1 command)

| Command | Purpose | Required Fields |
|---------|---------|----------------|
| \`tick\` | Advance simulation time | \`dt\` (number — delta time in seconds) |

---

## Star CRUD (3 commands)

| Command | Purpose | Required Fields |
|---------|---------|----------------|
| \`addStar\` | Create a new celestial body | \`id\` (string), \`payload\` (star data without \`id\`/\`children\`: name, mass, radius, color, parentId, orbitalDistance, orbitalSpeed, orbitalPhase, plus many optional fields) |
| \`updateStar\` | Update properties of an existing star | \`id\` (string), \`payload\` (partial star data) |
| \`removeStar\` | Remove a star and all its descendants recursively | \`id\` (string) |

---

## Star Hierarchy (2 commands)

| Command | Purpose | Required Fields |
|---------|---------|----------------|
| \`attachStar\` | Reparent a star under a new parent | \`childId\` (string), \`parentId\` (string). Validates against cycles. |
| \`detachStar\` | Make a star a root body (remove from parent) | \`childId\` (string) |

---

## Group CRUD (3 commands)

| Command | Purpose | Required Fields |
|---------|---------|----------------|
| \`addGroup\` | Create a new organizational group | \`id\` (string), \`payload\` (name, children, parentGroupId; optional: color, icon, position) |
| \`updateGroup\` | Update properties of an existing group | \`id\` (string), \`payload\` (partial group data) |
| \`removeGroup\` | Remove a group; children promoted to parent or root | \`id\` (string) |

---

## Group Hierarchy (3 commands)

| Command | Purpose | Required Fields |
|---------|---------|----------------|
| \`addToGroup\` | Add a system or group as a child of a group | \`groupId\` (string), \`child\` (\`{ id, type: 'system' \\| 'group' }\`) |
| \`removeFromGroup\` | Remove a child from a group | \`groupId\` (string), \`childId\` (string) |
| \`moveToGroup\` | Move a child to another group (or root) | \`childId\` (string), \`childType\` (\`'system'\` \\| \`'group'\`), \`targetGroupId\` (string \\| null, null = root) |

---

## Small Body Fields (3 commands)

| Command | Purpose | Required Fields |
|---------|---------|----------------|
| \`setSmallBodyFields\` | Replace all small body fields | \`fields\` (\`Record<string, SmallBodyField>\`) |
| \`updateSmallBodyField\` | Patch one small body field | \`id\` (string), \`patch\` (partial SmallBodyField) |
| \`removeSmallBodyField\` | Remove a small body field | \`id\` (string) |

---

## Protoplanetary Disks (4 commands)

| Command | Purpose | Required Fields |
|---------|---------|----------------|
| \`setProtoplanetaryDisks\` | Replace all protoplanetary disks | \`disks\` (\`Record<string, ProtoplanetaryDisk>\`) |
| \`addProtoplanetaryDisk\` | Add a single protoplanetary disk | \`disk\` (full ProtoplanetaryDisk object) |
| \`updateProtoplanetaryDisk\` | Patch one protoplanetary disk | \`id\` (string), \`patch\` (partial ProtoplanetaryDisk) |
| \`removeProtoplanetaryDisk\` | Remove a protoplanetary disk | \`id\` (string) |

---

## Nebulae (3 commands)

| Command | Purpose | Required Fields |
|---------|---------|----------------|
| \`setNebulae\` | Replace all nebulae | \`nebulae\` (\`Record<string, NebulaRegion>\`) |
| \`updateNebula\` | Patch one nebula | \`id\` (string), \`patch\` (partial NebulaRegion) |
| \`removeNebula\` | Remove a nebula | \`id\` (string) |

---

## Rings (2 commands)

| Command | Purpose | Required Fields |
|---------|---------|----------------|
| \`updateRing\` | Patch a planetary ring on a star | \`planetId\` (string), \`patch\` (partial PlanetaryRing) |
| \`removeRing\` | Remove the ring from a star | \`planetId\` (string) |

---

## Snapshot (1 command)

| Command | Purpose | Required Fields |
|---------|---------|----------------|
| \`replaceSnapshot\` | Wholesale replace the entire universe state | \`snapshot\` (object with: \`stars\`, \`rootIds\`, \`groups\`, \`rootGroupIds\`, \`belts\`, \`smallBodyFields\`, \`protoplanetaryDisks\`, \`nebulae\`) |
`.trim(),
    },

    // -----------------------------------------------------------------------
    // Section 4: Validation Rules
    // -----------------------------------------------------------------------
    {
      id: 'validation-rules',
      heading: 'Validation Rules',
      body: `
The domain enforces several invariants to keep the universe state consistent.
Invalid operations produce \`DomainEvent\` error objects rather than throwing
exceptions — the reducer always returns a valid state.

## Star Hierarchy Cycle Detection

Before an \`attachStar\` command is applied, the system calls
\`wouldCreateStarCycle(childId, parentId, stars)\` to check whether making
\`childId\` a descendant of \`parentId\` would create a cycle. The function
walks the ancestor chain of \`parentId\` upward — if it encounters \`childId\`,
the operation is rejected with a domain error event.

\`\`\`
attachStar { childId: "moon-1", parentId: "planet-1" }
→ walk: planet-1 → star-1 → null  (no cycle → allowed)

attachStar { childId: "star-1", parentId: "moon-1" }
→ walk: moon-1 → planet-1 → star-1 = childId  (cycle detected → rejected)
\`\`\`

## Group Hierarchy Cycle Detection

Before a \`moveToGroup\` command reparents a group, the system calls
\`wouldCreateGroupCycle(childGroupId, targetGroupId, groups)\` to check
whether adding \`childGroupId\` under \`targetGroupId\` would form a cycle.
The function walks the ancestor chain of \`targetGroupId\`; if it encounters
\`childGroupId\`, the operation is rejected.

## Entity Existence Checks

Commands referencing a star or group by ID validate that the entity exists
in the current state. If the referenced entity is missing, the reducer
produces a \`DomainEvent\` error describing the issue rather than crashing.

## Idempotency Notes

- \`removeStar\` on a non-existent ID is a safe no-op.
- \`removeGroup\` on a non-existent ID is a safe no-op.
- These commands will not produce error events for missing entities.

## Error Handling

Invalid commands produce \`DomainEvent\` error objects containing a
descriptive \`type\` and relevant context. The reducer **always** returns a
valid \`UniverseState\` — it never throws. Consumers can inspect the returned
events to detect and report problems.
`.trim(),
    },

    // -----------------------------------------------------------------------
    // Section 5: Real-Time Streaming
    // -----------------------------------------------------------------------
    {
      id: 'realtime-streaming',
      heading: 'Real-Time Streaming',
      body: `
The API provides real-time streaming of universe commands via
**Server-Sent Events (SSE)**.

## SSE Endpoint

\`\`\`
GET /universes/:id/events
\`\`\`

Opens a persistent SSE connection for the specified universe.

## Event Format

Events are sent using the standard SSE wire format:

\`\`\`
event: command
data: {"type":"addStar","id":"star-1","payload":{...}}

\`\`\`

Each event contains:
- \`event: command\` — the event type
- \`data: <JSON>\` — a serialized \`UniverseCommand\` object

## Connection Lifecycle

1. **Connect** — Client opens \`GET /universes/:id/events\`.
2. **Handshake** — Server sends a \`:connected\` comment to confirm the stream is live.
3. **Streaming** — As commands are applied, each is broadcast as an SSE event.
4. **Disconnect** — Connection closes when the client disconnects.

## Command Flow

\`\`\`
POST /universes/:id/commands  →  CommandGateway  →  SSE broadcast
       (receive command)         (fan out)          (all subscribers)
\`\`\`

1. A client (or MCP tool) sends \`POST /universes/:id/commands\` with a command payload.
2. The \`CommandGateway\` applies the command and broadcasts it to all subscribers.
3. All connected SSE clients for that universe receive the event in real time.

## Multiple Consumers

The gateway supports **multiple subscribers per universe**. Each subscriber
receives all commands broadcast to that universe, enabling multiple clients
(e.g., multiple browser tabs, monitoring dashboards) to stay synchronized.
`.trim(),
    },
  ],
};
