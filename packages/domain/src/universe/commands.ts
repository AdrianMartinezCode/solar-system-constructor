/**
 * UniverseCommand — JSON-serializable command union for universe mutations.
 *
 * Commands are plain data objects (no class instances, no functions).
 * The initial slice covers: simulation tick, star CRUD + hierarchy,
 * and snapshot replacement.
 *
 * Later tasks will extend this with group, field, disk, and nebula commands.
 */

import type { Star, SmallBodyField, ProtoplanetaryDisk, NebulaRegion, PlanetaryRing, Group, GroupChild, AsteroidBelt } from '../types.js';

// ---------------------------------------------------------------------------
// Simulation
// ---------------------------------------------------------------------------

export interface TickCommand {
  type: 'tick';
  /** Delta time in seconds (already scaled by timeScale at the call site) */
  dt: number;
}

// ---------------------------------------------------------------------------
// Star CRUD
// ---------------------------------------------------------------------------

export interface AddStarCommand {
  type: 'addStar';
  /** Pre-generated unique ID for the new body */
  id: string;
  /** Star payload without `id` and `children` (those are managed by the domain) */
  payload: Omit<Star, 'id' | 'children'>;
}

export interface UpdateStarCommand {
  type: 'updateStar';
  id: string;
  payload: Partial<Star>;
}

export interface RemoveStarCommand {
  type: 'removeStar';
  /** ID of the star to remove (recursive: removes all descendants) */
  id: string;
}

// ---------------------------------------------------------------------------
// Star hierarchy
// ---------------------------------------------------------------------------

export interface AttachStarCommand {
  type: 'attachStar';
  childId: string;
  parentId: string;
}

export interface DetachStarCommand {
  type: 'detachStar';
  childId: string;
}

// ---------------------------------------------------------------------------
// Group CRUD
// ---------------------------------------------------------------------------

export interface AddGroupCommand {
  type: 'addGroup';
  /** Pre-generated unique ID for the new group */
  id: string;
  /** Group payload without `id` (managed by the domain) */
  payload: Omit<Group, 'id'>;
}

export interface UpdateGroupCommand {
  type: 'updateGroup';
  id: string;
  payload: Partial<Group>;
}

export interface RemoveGroupCommand {
  type: 'removeGroup';
  /** ID of the group to remove (children are promoted to parent/root) */
  id: string;
}

// ---------------------------------------------------------------------------
// Group hierarchy
// ---------------------------------------------------------------------------

export interface AddToGroupCommand {
  type: 'addToGroup';
  groupId: string;
  child: GroupChild;
}

export interface RemoveFromGroupCommand {
  type: 'removeFromGroup';
  groupId: string;
  childId: string;
}

export interface MoveToGroupCommand {
  type: 'moveToGroup';
  childId: string;
  childType: 'system' | 'group';
  targetGroupId: string | null;
}

// ---------------------------------------------------------------------------
// Small body fields
// ---------------------------------------------------------------------------

export interface SetSmallBodyFieldsCommand {
  type: 'setSmallBodyFields';
  fields: Record<string, SmallBodyField>;
}

export interface UpdateSmallBodyFieldCommand {
  type: 'updateSmallBodyField';
  id: string;
  patch: Partial<SmallBodyField>;
}

export interface RemoveSmallBodyFieldCommand {
  type: 'removeSmallBodyField';
  id: string;
}

// ---------------------------------------------------------------------------
// Protoplanetary disks
// ---------------------------------------------------------------------------

export interface SetProtoplanetaryDisksCommand {
  type: 'setProtoplanetaryDisks';
  disks: Record<string, ProtoplanetaryDisk>;
}

export interface AddProtoplanetaryDiskCommand {
  type: 'addProtoplanetaryDisk';
  disk: ProtoplanetaryDisk;
}

export interface UpdateProtoplanetaryDiskCommand {
  type: 'updateProtoplanetaryDisk';
  id: string;
  patch: Partial<ProtoplanetaryDisk>;
}

export interface RemoveProtoplanetaryDiskCommand {
  type: 'removeProtoplanetaryDisk';
  id: string;
}

// ---------------------------------------------------------------------------
// Nebulae
// ---------------------------------------------------------------------------

export interface SetNebulaeCommand {
  type: 'setNebulae';
  nebulae: Record<string, NebulaRegion>;
}

export interface UpdateNebulaCommand {
  type: 'updateNebula';
  id: string;
  patch: Partial<NebulaRegion>;
}

export interface RemoveNebulaCommand {
  type: 'removeNebula';
  id: string;
}

// ---------------------------------------------------------------------------
// Rings (star sub-entity)
// ---------------------------------------------------------------------------

export interface UpdateRingCommand {
  type: 'updateRing';
  planetId: string;
  patch: Partial<PlanetaryRing>;
}

export interface RemoveRingCommand {
  type: 'removeRing';
  planetId: string;
}

// ---------------------------------------------------------------------------
// Snapshot-level
// ---------------------------------------------------------------------------

/**
 * Wholesale replace the universe state.
 * Used by the generator to import a freshly generated universe.
 */
export interface ReplaceSnapshotCommand {
  type: 'replaceSnapshot';
  snapshot: {
    stars: Record<string, Star>;
    rootIds: string[];
    groups: Record<string, Group>;
    rootGroupIds: string[];
    belts: Record<string, AsteroidBelt>;
    smallBodyFields: Record<string, SmallBodyField>;
    protoplanetaryDisks: Record<string, ProtoplanetaryDisk>;
    nebulae: Record<string, NebulaRegion>;
  };
}

// ---------------------------------------------------------------------------
// Union
// ---------------------------------------------------------------------------

export type UniverseCommand =
  | TickCommand
  | AddStarCommand
  | UpdateStarCommand
  | RemoveStarCommand
  | AttachStarCommand
  | DetachStarCommand
  | AddGroupCommand
  | UpdateGroupCommand
  | RemoveGroupCommand
  | AddToGroupCommand
  | RemoveFromGroupCommand
  | MoveToGroupCommand
  | SetSmallBodyFieldsCommand
  | UpdateSmallBodyFieldCommand
  | RemoveSmallBodyFieldCommand
  | SetProtoplanetaryDisksCommand
  | AddProtoplanetaryDiskCommand
  | UpdateProtoplanetaryDiskCommand
  | RemoveProtoplanetaryDiskCommand
  | SetNebulaeCommand
  | UpdateNebulaCommand
  | RemoveNebulaCommand
  | UpdateRingCommand
  | RemoveRingCommand
  | ReplaceSnapshotCommand;

// ---------------------------------------------------------------------------
// Domain events (returned alongside next state)
// ---------------------------------------------------------------------------

export interface DomainEvent {
  type: string;
  [key: string]: unknown;
}
