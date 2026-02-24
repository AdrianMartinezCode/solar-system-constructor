/**
 * MCP Tool Specifications — Solar System Constructor
 *
 * Machine-readable tool definitions in MCP Protocol tools/list format.
 * JSON Schemas are hand-authored from these domain source files:
 *   - packages/domain/src/types.ts (Star, PlanetaryRing, CometMeta, etc.)
 *   - packages/domain/src/universe/commands.ts (25 UniverseCommand variants)
 *   - packages/domain/src/universe/state.ts (UniverseState)
 *
 * When domain types change, update the corresponding $defs and oneOf schemas.
 */

import type { McpToolDefinition } from './types.js';

export const MCP_TOOLS_VERSION = '0.1.0';

export const mcpTools: McpToolDefinition[] = [
  {
    name: 'get_universe_state',
    description:
      'Retrieve the current state snapshot of a universe, including all stars, groups, belts, small body fields, protoplanetary disks, nebulae, and simulation time.',
    inputSchema: {
      type: 'object',
      properties: {
        universeId: {
          type: 'string',
          description: 'Unique identifier of the universe to retrieve',
        },
      },
      required: ['universeId'],
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  {
    name: 'list_universe_commands',
    description:
      'List the available command types that can be sent to a universe via send_universe_command. Returns the 25 command types organized by category with descriptions and required fields.',
    inputSchema: {
      type: 'object',
      properties: {
        universeId: {
          type: 'string',
          description: 'Unique identifier of the target universe',
        },
        category: {
          type: 'string',
          enum: [
            'simulation',
            'star-crud',
            'star-hierarchy',
            'group-crud',
            'group-hierarchy',
            'small-body-fields',
            'protoplanetary-disks',
            'nebulae',
            'rings',
            'snapshot',
          ],
          description:
            'Optional filter to list commands from a specific category only',
        },
      },
      required: ['universeId'],
    },
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false,
    },
  },
  {
    name: 'send_universe_command',
    description:
      "Send a command to mutate a universe. The command object uses a discriminated union on the 'type' field, supporting 25 command types across 10 categories: simulation, star CRUD, star hierarchy, group CRUD, group hierarchy, small body fields, protoplanetary disks, nebulae, rings, and snapshot replacement.",
    inputSchema: {
      type: 'object',
      properties: {
        universeId: {
          type: 'string',
          description: 'Unique identifier of the target universe',
        },
        command: {
          oneOf: [
            // ── Simulation ──
            {
              type: 'object',
              properties: {
                type: { const: 'tick' },
                dt: { type: 'number', description: 'Delta time in seconds' },
              },
              required: ['type', 'dt'],
              additionalProperties: false,
            },
            // ── Star CRUD ──
            {
              type: 'object',
              properties: {
                type: { const: 'addStar' },
                id: { type: 'string' },
                payload: { $ref: '#/$defs/StarPayload' },
              },
              required: ['type', 'id', 'payload'],
              additionalProperties: false,
            },
            {
              type: 'object',
              properties: {
                type: { const: 'updateStar' },
                id: { type: 'string' },
                payload: { $ref: '#/$defs/PartialStar' },
              },
              required: ['type', 'id', 'payload'],
              additionalProperties: false,
            },
            {
              type: 'object',
              properties: {
                type: { const: 'removeStar' },
                id: { type: 'string' },
              },
              required: ['type', 'id'],
              additionalProperties: false,
            },
            // ── Star hierarchy ──
            {
              type: 'object',
              properties: {
                type: { const: 'attachStar' },
                childId: { type: 'string' },
                parentId: { type: 'string' },
              },
              required: ['type', 'childId', 'parentId'],
              additionalProperties: false,
            },
            {
              type: 'object',
              properties: {
                type: { const: 'detachStar' },
                childId: { type: 'string' },
              },
              required: ['type', 'childId'],
              additionalProperties: false,
            },
            // ── Group CRUD ──
            {
              type: 'object',
              properties: {
                type: { const: 'addGroup' },
                id: { type: 'string' },
                payload: { $ref: '#/$defs/GroupPayload' },
              },
              required: ['type', 'id', 'payload'],
              additionalProperties: false,
            },
            {
              type: 'object',
              properties: {
                type: { const: 'updateGroup' },
                id: { type: 'string' },
                payload: { $ref: '#/$defs/PartialGroup' },
              },
              required: ['type', 'id', 'payload'],
              additionalProperties: false,
            },
            {
              type: 'object',
              properties: {
                type: { const: 'removeGroup' },
                id: { type: 'string' },
              },
              required: ['type', 'id'],
              additionalProperties: false,
            },
            // ── Group hierarchy ──
            {
              type: 'object',
              properties: {
                type: { const: 'addToGroup' },
                groupId: { type: 'string' },
                child: { $ref: '#/$defs/GroupChild' },
              },
              required: ['type', 'groupId', 'child'],
              additionalProperties: false,
            },
            {
              type: 'object',
              properties: {
                type: { const: 'removeFromGroup' },
                groupId: { type: 'string' },
                childId: { type: 'string' },
              },
              required: ['type', 'groupId', 'childId'],
              additionalProperties: false,
            },
            {
              type: 'object',
              properties: {
                type: { const: 'moveToGroup' },
                childId: { type: 'string' },
                childType: {
                  type: 'string',
                  enum: ['system', 'group'],
                },
                targetGroupId: { type: ['string', 'null'] },
              },
              required: ['type', 'childId', 'childType', 'targetGroupId'],
              additionalProperties: false,
            },
            // ── Small body fields ──
            {
              type: 'object',
              properties: {
                type: { const: 'setSmallBodyFields' },
                fields: {
                  type: 'object',
                  additionalProperties: { $ref: '#/$defs/SmallBodyField' },
                },
              },
              required: ['type', 'fields'],
              additionalProperties: false,
            },
            {
              type: 'object',
              properties: {
                type: { const: 'updateSmallBodyField' },
                id: { type: 'string' },
                patch: {
                  type: 'object',
                  description:
                    'Partial SmallBodyField — any subset of fields',
                },
              },
              required: ['type', 'id', 'patch'],
              additionalProperties: false,
            },
            {
              type: 'object',
              properties: {
                type: { const: 'removeSmallBodyField' },
                id: { type: 'string' },
              },
              required: ['type', 'id'],
              additionalProperties: false,
            },
            // ── Protoplanetary disks ──
            {
              type: 'object',
              properties: {
                type: { const: 'setProtoplanetaryDisks' },
                disks: {
                  type: 'object',
                  additionalProperties: {
                    $ref: '#/$defs/ProtoplanetaryDisk',
                  },
                },
              },
              required: ['type', 'disks'],
              additionalProperties: false,
            },
            {
              type: 'object',
              properties: {
                type: { const: 'addProtoplanetaryDisk' },
                disk: { $ref: '#/$defs/ProtoplanetaryDisk' },
              },
              required: ['type', 'disk'],
              additionalProperties: false,
            },
            {
              type: 'object',
              properties: {
                type: { const: 'updateProtoplanetaryDisk' },
                id: { type: 'string' },
                patch: {
                  type: 'object',
                  description:
                    'Partial ProtoplanetaryDisk — any subset of fields',
                },
              },
              required: ['type', 'id', 'patch'],
              additionalProperties: false,
            },
            {
              type: 'object',
              properties: {
                type: { const: 'removeProtoplanetaryDisk' },
                id: { type: 'string' },
              },
              required: ['type', 'id'],
              additionalProperties: false,
            },
            // ── Nebulae ──
            {
              type: 'object',
              properties: {
                type: { const: 'setNebulae' },
                nebulae: {
                  type: 'object',
                  additionalProperties: { $ref: '#/$defs/NebulaRegion' },
                },
              },
              required: ['type', 'nebulae'],
              additionalProperties: false,
            },
            {
              type: 'object',
              properties: {
                type: { const: 'updateNebula' },
                id: { type: 'string' },
                patch: {
                  type: 'object',
                  description:
                    'Partial NebulaRegion — any subset of fields',
                },
              },
              required: ['type', 'id', 'patch'],
              additionalProperties: false,
            },
            {
              type: 'object',
              properties: {
                type: { const: 'removeNebula' },
                id: { type: 'string' },
              },
              required: ['type', 'id'],
              additionalProperties: false,
            },
            // ── Rings ──
            {
              type: 'object',
              properties: {
                type: { const: 'updateRing' },
                planetId: { type: 'string' },
                patch: {
                  type: 'object',
                  description:
                    'Partial PlanetaryRing — any subset of fields',
                },
              },
              required: ['type', 'planetId', 'patch'],
              additionalProperties: false,
            },
            {
              type: 'object',
              properties: {
                type: { const: 'removeRing' },
                planetId: { type: 'string' },
              },
              required: ['type', 'planetId'],
              additionalProperties: false,
            },
            // ── Snapshot ──
            {
              type: 'object',
              properties: {
                type: { const: 'replaceSnapshot' },
                snapshot: { $ref: '#/$defs/UniverseSnapshot' },
              },
              required: ['type', 'snapshot'],
              additionalProperties: false,
            },
          ],
          discriminator: { propertyName: 'type' },
        },
      },
      required: ['universeId', 'command'],
      $defs: {
        Position: {
          type: 'object',
          description:
            '3D position vector. Maps to Position from packages/domain/src/types.ts',
          properties: {
            x: { type: 'number' },
            y: { type: 'number' },
            z: { type: 'number' },
          },
          required: ['x', 'y', 'z'],
        },
        PlanetaryRing: {
          type: 'object',
          description:
            'Per-planet ring system (Saturn-like). Maps to PlanetaryRing from packages/domain/src/types.ts',
          properties: {
            innerRadiusMultiplier: { type: 'number' },
            outerRadiusMultiplier: { type: 'number' },
            thickness: { type: 'number' },
            opacity: { type: 'number' },
            albedo: { type: 'number' },
            color: { type: 'string' },
            density: { type: 'number' },
            warpFactor: { type: 'number' },
            seed: { type: ['string', 'number'] },
          },
          required: [
            'innerRadiusMultiplier',
            'outerRadiusMultiplier',
            'thickness',
            'opacity',
            'albedo',
            'color',
            'density',
          ],
        },
        CometMeta: {
          type: 'object',
          description:
            'Comet-specific metadata for cometary bodies. Maps to CometMeta from packages/domain/src/types.ts',
          properties: {
            isPeriodic: { type: 'boolean' },
            perihelionDistance: { type: 'number' },
            aphelionDistance: { type: 'number' },
            lastPerihelionTime: { type: 'number' },
            hasTail: { type: 'boolean' },
            tailLengthBase: { type: 'number' },
            tailWidthBase: { type: 'number' },
            tailColor: { type: 'string' },
            tailOpacityBase: { type: 'number' },
            activityFalloffDistance: { type: 'number' },
            seed: { type: ['string', 'number'] },
          },
          required: [
            'isPeriodic',
            'perihelionDistance',
            'aphelionDistance',
            'hasTail',
            'tailLengthBase',
            'tailWidthBase',
            'tailColor',
            'tailOpacityBase',
            'activityFalloffDistance',
          ],
        },
        LagrangePointMeta: {
          type: 'object',
          description:
            'Lagrange point metadata for L1–L5 markers. Maps to LagrangePointMeta from packages/domain/src/types.ts',
          properties: {
            primaryId: { type: 'string' },
            secondaryId: { type: 'string' },
            pointIndex: { type: 'integer', enum: [1, 2, 3, 4, 5] },
            stable: { type: 'boolean' },
            pairType: {
              type: 'string',
              enum: ['starPlanet', 'planetMoon'],
            },
            label: { type: 'string' },
          },
          required: [
            'primaryId',
            'secondaryId',
            'pointIndex',
            'stable',
            'pairType',
          ],
        },
        BlackHoleProperties: {
          type: 'object',
          description:
            'Black hole visual and physical metadata. Maps to BlackHoleProperties from packages/domain/src/types.ts',
          properties: {
            hasAccretionDisk: { type: 'boolean' },
            hasRelativisticJet: { type: 'boolean' },
            hasPhotonRing: { type: 'boolean' },
            spin: { type: 'number' },
            shadowRadius: { type: 'number' },
            accretionInnerRadius: { type: 'number' },
            accretionOuterRadius: { type: 'number' },
            diskThickness: { type: 'number' },
            diskBrightness: { type: 'number' },
            diskOpacity: { type: 'number' },
            diskTemperature: { type: 'number' },
            diskClumpiness: { type: 'number' },
            jetLength: { type: 'number' },
            jetOpeningAngle: { type: 'number' },
            jetBrightness: { type: 'number' },
            dopplerBeamingStrength: { type: 'number' },
            lensingStrength: { type: 'number' },
            rotationSpeedMultiplier: { type: 'number' },
            seed: { type: ['string', 'number'] },
            diskTurbulenceScale: { type: 'number' },
            diskInnerColor: { type: 'string' },
            diskOuterColor: { type: 'string' },
            diskStreakiness: { type: 'number' },
            jetBaseColor: { type: 'string' },
            jetTipColor: { type: 'string' },
            jetGradientPower: { type: 'number' },
            photonRingMultiImageCount: { type: 'number' },
            photonRingWidth: { type: 'number' },
            diskTilt: { type: 'number' },
            diskTiltAxisAngle: { type: 'number' },
          },
          required: [
            'hasAccretionDisk',
            'hasRelativisticJet',
            'hasPhotonRing',
            'spin',
            'shadowRadius',
            'accretionInnerRadius',
            'accretionOuterRadius',
            'diskThickness',
            'diskBrightness',
            'diskOpacity',
            'diskTemperature',
            'diskClumpiness',
            'jetLength',
            'jetOpeningAngle',
            'jetBrightness',
            'dopplerBeamingStrength',
            'lensingStrength',
            'rotationSpeedMultiplier',
            'seed',
          ],
        },
        RoguePlanetMeta: {
          type: 'object',
          description:
            'Rogue planet motion and style metadata. Maps to RoguePlanetMeta from packages/domain/src/types.ts',
          properties: {
            seed: { type: ['string', 'number'] },
            initialPosition: { $ref: '#/$defs/Position' },
            velocity: { $ref: '#/$defs/Position' },
            colorOverride: { type: 'string' },
            pathCurvature: { type: 'number' },
            semiMajorAxis: { type: 'number' },
            eccentricity: { type: 'number' },
            pathOffsetX: { type: 'number' },
            pathOffsetY: { type: 'number' },
            pathOffsetZ: { type: 'number' },
            orbitRotX: { type: 'number' },
            orbitRotY: { type: 'number' },
            orbitRotZ: { type: 'number' },
            pathPeriod: { type: 'number' },
            showTrajectory: { type: 'boolean' },
            trajectoryPastWindow: { type: 'number' },
            trajectoryFutureWindow: { type: 'number' },
          },
          required: ['seed', 'initialPosition', 'velocity'],
        },
        GroupChild: {
          type: 'object',
          description:
            'Child reference within a group. Maps to GroupChild from packages/domain/src/types.ts',
          properties: {
            id: { type: 'string' },
            type: { type: 'string', enum: ['system', 'group'] },
          },
          required: ['id', 'type'],
        },
        StarPayload: {
          type: 'object',
          description:
            'Star creation payload. Maps to Omit<Star, "id" | "children"> from packages/domain/src/types.ts',
          properties: {
            name: { type: 'string' },
            mass: { type: 'number' },
            radius: { type: 'number' },
            color: { type: 'string' },
            parentId: { type: ['string', 'null'] },
            orbitalDistance: { type: 'number' },
            orbitalSpeed: { type: 'number' },
            orbitalPhase: { type: 'number' },
            bodyType: {
              type: 'string',
              enum: [
                'star',
                'planet',
                'moon',
                'asteroid',
                'comet',
                'lagrangePoint',
                'blackHole',
              ],
            },
            ring: { $ref: '#/$defs/PlanetaryRing' },
            parentBeltId: { type: 'string' },
            asteroidSubType: {
              type: 'string',
              enum: ['mainBelt', 'kuiperBelt', 'generic'],
            },
            comet: { $ref: '#/$defs/CometMeta' },
            lagrangePoint: { $ref: '#/$defs/LagrangePointMeta' },
            lagrangeHostId: { type: 'string' },
            blackHole: { $ref: '#/$defs/BlackHoleProperties' },
            isRoguePlanet: { type: 'boolean' },
            roguePlanet: { $ref: '#/$defs/RoguePlanetMeta' },
            semiMajorAxis: { type: 'number' },
            eccentricity: { type: 'number' },
            orbitOffsetX: { type: 'number' },
            orbitOffsetY: { type: 'number' },
            orbitOffsetZ: { type: 'number' },
            orbitRotX: { type: 'number' },
            orbitRotY: { type: 'number' },
            orbitRotZ: { type: 'number' },
          },
          required: [
            'name',
            'mass',
            'radius',
            'color',
            'parentId',
            'orbitalDistance',
            'orbitalSpeed',
            'orbitalPhase',
          ],
        },
        PartialStar: {
          type: 'object',
          description:
            'Partial star update payload. Maps to Partial<Omit<Star, "id" | "children">> from packages/domain/src/types.ts',
          properties: {
            name: { type: 'string' },
            mass: { type: 'number' },
            radius: { type: 'number' },
            color: { type: 'string' },
            parentId: { type: ['string', 'null'] },
            orbitalDistance: { type: 'number' },
            orbitalSpeed: { type: 'number' },
            orbitalPhase: { type: 'number' },
            bodyType: {
              type: 'string',
              enum: [
                'star',
                'planet',
                'moon',
                'asteroid',
                'comet',
                'lagrangePoint',
                'blackHole',
              ],
            },
            ring: { $ref: '#/$defs/PlanetaryRing' },
            parentBeltId: { type: 'string' },
            asteroidSubType: {
              type: 'string',
              enum: ['mainBelt', 'kuiperBelt', 'generic'],
            },
            comet: { $ref: '#/$defs/CometMeta' },
            lagrangePoint: { $ref: '#/$defs/LagrangePointMeta' },
            lagrangeHostId: { type: 'string' },
            blackHole: { $ref: '#/$defs/BlackHoleProperties' },
            isRoguePlanet: { type: 'boolean' },
            roguePlanet: { $ref: '#/$defs/RoguePlanetMeta' },
            semiMajorAxis: { type: 'number' },
            eccentricity: { type: 'number' },
            orbitOffsetX: { type: 'number' },
            orbitOffsetY: { type: 'number' },
            orbitOffsetZ: { type: 'number' },
            orbitRotX: { type: 'number' },
            orbitRotY: { type: 'number' },
            orbitRotZ: { type: 'number' },
          },
          required: [],
        },
        GroupPayload: {
          type: 'object',
          description:
            'Group creation payload. Maps to Omit<Group, "id"> from packages/domain/src/types.ts',
          properties: {
            name: { type: 'string' },
            children: {
              type: 'array',
              items: { $ref: '#/$defs/GroupChild' },
            },
            parentGroupId: { type: ['string', 'null'] },
            color: { type: 'string' },
            icon: { type: 'string' },
            position: { $ref: '#/$defs/Position' },
          },
          required: ['name', 'children', 'parentGroupId'],
        },
        PartialGroup: {
          type: 'object',
          description:
            'Partial group update payload. Maps to Partial<Omit<Group, "id">> from packages/domain/src/types.ts',
          properties: {
            name: { type: 'string' },
            children: {
              type: 'array',
              items: { $ref: '#/$defs/GroupChild' },
            },
            parentGroupId: { type: ['string', 'null'] },
            color: { type: 'string' },
            icon: { type: 'string' },
            position: { $ref: '#/$defs/Position' },
          },
          required: [],
        },
        SmallBodyField: {
          type: 'object',
          description:
            'GPU particle field for small body belts. Maps to SmallBodyField from packages/domain/src/types.ts',
          properties: {
            id: { type: 'string' },
            systemId: { type: 'string' },
            hostStarId: { type: 'string' },
            innerRadius: { type: 'number' },
            outerRadius: { type: 'number' },
            thickness: { type: 'number' },
            particleCount: { type: 'number' },
            baseColor: { type: 'string' },
            highlightColor: { type: 'string' },
            opacity: { type: 'number' },
            brightness: { type: 'number' },
            clumpiness: { type: 'number' },
            rotationSpeedMultiplier: { type: 'number' },
            beltType: { type: 'string', enum: ['main', 'kuiper'] },
            regionLabel: { type: 'string' },
            isIcy: { type: 'boolean' },
            seed: { type: ['string', 'number'] },
            style: {
              type: 'string',
              enum: ['thin', 'moderate', 'thick', 'scattered'],
            },
            inclinationSigma: { type: 'number' },
            name: { type: 'string' },
            visible: { type: 'boolean' },
          },
          required: [
            'id',
            'systemId',
            'hostStarId',
            'innerRadius',
            'outerRadius',
            'thickness',
            'particleCount',
            'baseColor',
            'highlightColor',
            'opacity',
            'brightness',
            'clumpiness',
            'rotationSpeedMultiplier',
            'beltType',
            'regionLabel',
            'isIcy',
            'seed',
            'style',
          ],
        },
        ProtoplanetaryDisk: {
          type: 'object',
          description:
            'Shader-driven circumstellar disk of gas and dust. Maps to ProtoplanetaryDisk from packages/domain/src/types.ts',
          properties: {
            id: { type: 'string' },
            systemId: { type: 'string' },
            centralStarId: { type: 'string' },
            innerRadius: { type: 'number' },
            outerRadius: { type: 'number' },
            thickness: { type: 'number' },
            particleCount: { type: 'number' },
            baseColor: { type: 'string' },
            highlightColor: { type: 'string' },
            opacity: { type: 'number' },
            brightness: { type: 'number' },
            clumpiness: { type: 'number' },
            rotationSpeedMultiplier: { type: 'number' },
            seed: { type: ['string', 'number'] },
            style: {
              type: 'string',
              enum: ['thin', 'moderate', 'thick', 'extreme'],
            },
            name: { type: 'string' },
            bandStrength: { type: 'number' },
            bandFrequency: { type: 'number' },
            gapSharpness: { type: 'number' },
            innerGlowStrength: { type: 'number' },
            noiseScale: { type: 'number' },
            noiseStrength: { type: 'number' },
            spiralStrength: { type: 'number' },
            spiralArmCount: { type: 'number' },
            edgeSoftness: { type: 'number' },
            temperatureGradient: { type: 'number' },
          },
          required: [
            'id',
            'systemId',
            'centralStarId',
            'innerRadius',
            'outerRadius',
            'thickness',
            'particleCount',
            'baseColor',
            'highlightColor',
            'opacity',
            'brightness',
            'clumpiness',
            'rotationSpeedMultiplier',
            'seed',
            'style',
          ],
        },
        NebulaRegion: {
          type: 'object',
          description:
            'Large-scale volumetric gas/dust cloud. Maps to NebulaRegion from packages/domain/src/types.ts',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            position: { $ref: '#/$defs/Position' },
            radius: { type: 'number' },
            density: { type: 'number' },
            brightness: { type: 'number' },
            baseColor: { type: 'string' },
            accentColor: { type: 'string' },
            noiseScale: { type: 'number' },
            noiseDetail: { type: 'number' },
            seed: { type: ['string', 'number'] },
            dimensions: { $ref: '#/$defs/Position' },
            associatedGroupIds: {
              type: 'array',
              items: { type: 'string' },
            },
            visible: { type: 'boolean' },
          },
          required: [
            'id',
            'name',
            'position',
            'radius',
            'density',
            'brightness',
            'baseColor',
            'accentColor',
            'noiseScale',
            'noiseDetail',
            'seed',
          ],
        },
        AsteroidBelt: {
          type: 'object',
          description:
            'Asteroid/Kuiper belt entity. Maps to AsteroidBelt from packages/domain/src/types.ts',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            parentId: { type: 'string' },
            innerRadius: { type: 'number' },
            outerRadius: { type: 'number' },
            thickness: { type: 'number' },
            eccentricity: { type: 'number' },
            inclination: { type: 'number' },
            asteroidCount: { type: 'number' },
            asteroidIds: { type: 'array', items: { type: 'string' } },
            color: { type: 'string' },
            beltType: { type: 'string', enum: ['main', 'kuiper'] },
            regionLabel: { type: 'string' },
            isIcy: { type: 'boolean' },
            inclinationSigma: { type: 'number' },
            radialRangeHint: {
              type: 'array',
              items: { type: 'number' },
              minItems: 2,
              maxItems: 2,
            },
            lodLevel: { type: 'number' },
            visible: { type: 'boolean' },
            seed: { type: ['string', 'number'] },
          },
          required: [
            'id',
            'name',
            'parentId',
            'innerRadius',
            'outerRadius',
            'thickness',
            'eccentricity',
            'inclination',
            'asteroidCount',
            'asteroidIds',
          ],
        },
        UniverseSnapshot: {
          type: 'object',
          description:
            'Complete universe state for wholesale replacement. Maps to ReplaceSnapshotCommand.snapshot from packages/domain/src/universe/commands.ts',
          properties: {
            stars: {
              type: 'object',
              description:
                'Record<string, Star> — full Star objects keyed by id',
              additionalProperties: true,
            },
            rootIds: { type: 'array', items: { type: 'string' } },
            groups: {
              type: 'object',
              description:
                'Record<string, Group> — full Group objects keyed by id',
              additionalProperties: true,
            },
            rootGroupIds: { type: 'array', items: { type: 'string' } },
            belts: {
              type: 'object',
              additionalProperties: { $ref: '#/$defs/AsteroidBelt' },
            },
            smallBodyFields: {
              type: 'object',
              additionalProperties: { $ref: '#/$defs/SmallBodyField' },
            },
            protoplanetaryDisks: {
              type: 'object',
              additionalProperties: {
                $ref: '#/$defs/ProtoplanetaryDisk',
              },
            },
            nebulae: {
              type: 'object',
              additionalProperties: { $ref: '#/$defs/NebulaRegion' },
            },
          },
          required: [
            'stars',
            'rootIds',
            'groups',
            'rootGroupIds',
            'belts',
            'smallBodyFields',
            'protoplanetaryDisks',
            'nebulae',
          ],
        },
      },
    },
    annotations: {
      readOnlyHint: false,
      destructiveHint: true,
      idempotentHint: false,
      openWorldHint: false,
    },
  },
];
