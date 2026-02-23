/**
 * applyUniverseCommand — pure reducer for universe state transitions.
 *
 * (state, command) → { nextState, events }
 *
 * Rules:
 * - Deterministic and side-effect-free (no Math.random, Date, localStorage, console).
 * - Returns a new state object (immutable updates).
 * - Events are optional metadata for logging/debugging; always JSON-serializable.
 */

import type { Star, Group, GroupChild, PlanetaryRing, SmallBodyField, ProtoplanetaryDisk, NebulaRegion, AsteroidBelt } from '../types';
import type { UniverseState } from './state';
import type { UniverseCommand, DomainEvent } from './commands';
import { wouldCreateStarCycle, collectDescendants, wouldCreateGroupCycle } from './validate';

export interface CommandResult {
  nextState: UniverseState;
  events: DomainEvent[];
}

export function applyUniverseCommand(
  state: UniverseState,
  command: UniverseCommand,
): CommandResult {
  switch (command.type) {
    case 'tick':
      return applyTick(state, command.dt);

    case 'addStar':
      return applyAddStar(state, command.id, command.payload);

    case 'updateStar':
      return applyUpdateStar(state, command.id, command.payload);

    case 'removeStar':
      return applyRemoveStar(state, command.id);

    case 'attachStar':
      return applyAttachStar(state, command.childId, command.parentId);

    case 'detachStar':
      return applyDetachStar(state, command.childId);

    case 'addGroup':
      return applyAddGroup(state, command.id, command.payload);

    case 'updateGroup':
      return applyUpdateGroup(state, command.id, command.payload);

    case 'removeGroup':
      return applyRemoveGroup(state, command.id);

    case 'addToGroup':
      return applyAddToGroup(state, command.groupId, command.child);

    case 'removeFromGroup':
      return applyRemoveFromGroup(state, command.groupId, command.childId);

    case 'moveToGroup':
      return applyMoveToGroup(state, command.childId, command.childType, command.targetGroupId);

    case 'setSmallBodyFields':
      return { nextState: { ...state, smallBodyFields: command.fields }, events: [{ type: 'smallBodyFieldsSet' }] };

    case 'updateSmallBodyField':
      return applyUpdateSmallBodyField(state, command.id, command.patch);

    case 'removeSmallBodyField':
      return applyRemoveSmallBodyField(state, command.id);

    case 'setProtoplanetaryDisks':
      return { nextState: { ...state, protoplanetaryDisks: command.disks }, events: [{ type: 'protoplanetaryDisksSet' }] };

    case 'addProtoplanetaryDisk':
      return applyAddProtoplanetaryDisk(state, command.disk);

    case 'updateProtoplanetaryDisk':
      return applyUpdateProtoplanetaryDisk(state, command.id, command.patch);

    case 'removeProtoplanetaryDisk':
      return applyRemoveProtoplanetaryDisk(state, command.id);

    case 'setNebulae':
      return { nextState: { ...state, nebulae: command.nebulae }, events: [{ type: 'nebulaeSet' }] };

    case 'updateNebula':
      return applyUpdateNebula(state, command.id, command.patch);

    case 'removeNebula':
      return applyRemoveNebula(state, command.id);

    case 'updateRing':
      return applyUpdateRing(state, command.planetId, command.patch);

    case 'removeRing':
      return applyRemoveRing(state, command.planetId);

    case 'replaceSnapshot':
      return applyReplaceSnapshot(state, command.snapshot);

    default: {
      // Exhaustiveness check: if we reach here, a command type is unhandled.
      const _exhaustive: never = command;
      return { nextState: state, events: [{ type: 'unknownCommand', command: _exhaustive }] };
    }
  }
}

// ---------------------------------------------------------------------------
// Tick
// ---------------------------------------------------------------------------

function applyTick(state: UniverseState, dt: number): CommandResult {
  return {
    nextState: { ...state, time: state.time + dt },
    events: [],
  };
}

// ---------------------------------------------------------------------------
// Add Star
// ---------------------------------------------------------------------------

function applyAddStar(
  state: UniverseState,
  id: string,
  payload: Omit<Star, 'id' | 'children'>,
): CommandResult {
  const newStar: Star = {
    ...payload,
    id,
    children: [],
    orbitalPhase: payload.orbitalPhase ?? 0,
  };

  const newStars = { ...state.stars, [id]: newStar };

  // If the star has a parent, add it to the parent's children array
  if (newStar.parentId && newStars[newStar.parentId]) {
    newStars[newStar.parentId] = {
      ...newStars[newStar.parentId],
      children: [...newStars[newStar.parentId].children, id],
    };
  }

  // Add to rootIds if no parent
  const newRootIds = newStar.parentId === null
    ? [...state.rootIds, id]
    : state.rootIds;

  return {
    nextState: { ...state, stars: newStars, rootIds: newRootIds },
    events: [{ type: 'starAdded', id }],
  };
}

// ---------------------------------------------------------------------------
// Update Star
// ---------------------------------------------------------------------------

function applyUpdateStar(
  state: UniverseState,
  id: string,
  payload: Partial<Star>,
): CommandResult {
  if (!state.stars[id]) {
    return { nextState: state, events: [{ type: 'starNotFound', id }] };
  }

  const newStars = {
    ...state.stars,
    [id]: { ...state.stars[id], ...payload },
  };

  return {
    nextState: { ...state, stars: newStars },
    events: [{ type: 'starUpdated', id }],
  };
}

// ---------------------------------------------------------------------------
// Remove Star (recursive)
// ---------------------------------------------------------------------------

function applyRemoveStar(
  state: UniverseState,
  id: string,
): CommandResult {
  const star = state.stars[id];
  if (!star) {
    return { nextState: state, events: [{ type: 'starNotFound', id }] };
  }

  const toRemove = collectDescendants(id, state.stars);
  const toRemoveSet = new Set(toRemove);
  const newStars = { ...state.stars };

  for (const removeId of toRemove) {
    delete newStars[removeId];
  }

  // Remove from parent's children array
  if (star.parentId && newStars[star.parentId]) {
    newStars[star.parentId] = {
      ...newStars[star.parentId],
      children: newStars[star.parentId].children.filter((c) => c !== id),
    };
  }

  // Remove from rootIds
  const newRootIds = state.rootIds.filter((rootId) => !toRemoveSet.has(rootId));

  return {
    nextState: { ...state, stars: newStars, rootIds: newRootIds },
    events: [{ type: 'starRemoved', id, removedIds: toRemove }],
  };
}

// ---------------------------------------------------------------------------
// Attach Star (set parent, with cycle check)
// ---------------------------------------------------------------------------

function applyAttachStar(
  state: UniverseState,
  childId: string,
  parentId: string,
): CommandResult {
  const child = state.stars[childId];
  const parent = state.stars[parentId];

  if (!child || !parent) {
    return { nextState: state, events: [{ type: 'attachFailed', reason: 'notFound', childId, parentId }] };
  }

  if (wouldCreateStarCycle(childId, parentId, state.stars)) {
    return { nextState: state, events: [{ type: 'attachFailed', reason: 'cycle', childId, parentId }] };
  }

  const newStars = { ...state.stars };

  // Remove from old parent's children
  if (child.parentId && newStars[child.parentId]) {
    newStars[child.parentId] = {
      ...newStars[child.parentId],
      children: newStars[child.parentId].children.filter((c) => c !== childId),
    };
  }

  // Add to new parent's children
  newStars[parentId] = {
    ...newStars[parentId],
    children: [...newStars[parentId].children, childId],
  };

  // Update child's parentId
  newStars[childId] = {
    ...newStars[childId],
    parentId,
  };

  // Update rootIds: remove child if it was root
  const newRootIds = child.parentId === null
    ? state.rootIds.filter((rid) => rid !== childId)
    : state.rootIds;

  return {
    nextState: { ...state, stars: newStars, rootIds: newRootIds },
    events: [{ type: 'starAttached', childId, parentId }],
  };
}

// ---------------------------------------------------------------------------
// Detach Star (make root-level)
// ---------------------------------------------------------------------------

function applyDetachStar(
  state: UniverseState,
  childId: string,
): CommandResult {
  const child = state.stars[childId];
  if (!child || !child.parentId) {
    return { nextState: state, events: [{ type: 'detachFailed', reason: 'notAttached', childId }] };
  }

  const newStars = { ...state.stars };

  // Remove from parent's children
  if (newStars[child.parentId]) {
    newStars[child.parentId] = {
      ...newStars[child.parentId],
      children: newStars[child.parentId].children.filter((c) => c !== childId),
    };
  }

  // Update child: set parentId to null, reset orbital distance
  newStars[childId] = {
    ...newStars[childId],
    parentId: null,
    orbitalDistance: 0,
  };

  return {
    nextState: {
      ...state,
      stars: newStars,
      rootIds: [...state.rootIds, childId],
    },
    events: [{ type: 'starDetached', childId }],
  };
}

// ---------------------------------------------------------------------------
// Add Group
// ---------------------------------------------------------------------------

function applyAddGroup(
  state: UniverseState,
  id: string,
  payload: Omit<Group, 'id'>,
): CommandResult {
  const newGroup: Group = { ...payload, id };
  const newGroups = { ...state.groups, [id]: newGroup };

  // If has parent group, add to parent's children
  if (newGroup.parentGroupId && newGroups[newGroup.parentGroupId]) {
    newGroups[newGroup.parentGroupId] = {
      ...newGroups[newGroup.parentGroupId],
      children: [
        ...newGroups[newGroup.parentGroupId].children,
        { id, type: 'group' },
      ],
    };
  }

  // Add to rootGroupIds if no parent
  const newRootGroupIds = newGroup.parentGroupId === null
    ? [...state.rootGroupIds, id]
    : state.rootGroupIds;

  return {
    nextState: { ...state, groups: newGroups, rootGroupIds: newRootGroupIds },
    events: [{ type: 'groupAdded', id }],
  };
}

// ---------------------------------------------------------------------------
// Update Group
// ---------------------------------------------------------------------------

function applyUpdateGroup(
  state: UniverseState,
  id: string,
  payload: Partial<Group>,
): CommandResult {
  if (!state.groups[id]) {
    return { nextState: state, events: [{ type: 'groupNotFound', id }] };
  }

  const newGroups = {
    ...state.groups,
    [id]: { ...state.groups[id], ...payload },
  };

  return {
    nextState: { ...state, groups: newGroups },
    events: [{ type: 'groupUpdated', id }],
  };
}

// ---------------------------------------------------------------------------
// Remove Group (promote children to parent/root)
// ---------------------------------------------------------------------------

function applyRemoveGroup(
  state: UniverseState,
  id: string,
): CommandResult {
  const group = state.groups[id];
  if (!group) {
    return { nextState: state, events: [{ type: 'groupNotFound', id }] };
  }

  const newGroups = { ...state.groups };
  delete newGroups[id];

  // Remove from parent group's children
  if (group.parentGroupId && newGroups[group.parentGroupId]) {
    newGroups[group.parentGroupId] = {
      ...newGroups[group.parentGroupId],
      children: newGroups[group.parentGroupId].children.filter(c => c.id !== id),
    };
  }

  // Remove from rootGroupIds
  const newRootGroupIds = state.rootGroupIds.filter(gid => gid !== id);

  // Promote children
  group.children.forEach(child => {
    if (child.type === 'group' && newGroups[child.id]) {
      newGroups[child.id] = {
        ...newGroups[child.id],
        parentGroupId: group.parentGroupId,
      };
      if (group.parentGroupId === null) {
        newRootGroupIds.push(child.id);
      }
    }
    // Systems just become ungrouped (remain in rootIds)
  });

  return {
    nextState: { ...state, groups: newGroups, rootGroupIds: newRootGroupIds },
    events: [{ type: 'groupRemoved', id }],
  };
}

// ---------------------------------------------------------------------------
// Add to Group
// ---------------------------------------------------------------------------

function applyAddToGroup(
  state: UniverseState,
  groupId: string,
  child: GroupChild,
): CommandResult {
  const group = state.groups[groupId];
  if (!group) {
    return { nextState: state, events: [{ type: 'groupNotFound', id: groupId }] };
  }

  // Check if child already exists in group
  const exists = group.children.some(c => c.id === child.id && c.type === child.type);
  if (exists) {
    return { nextState: state, events: [{ type: 'childAlreadyInGroup', groupId, childId: child.id }] };
  }

  const newGroups = { ...state.groups };
  newGroups[groupId] = {
    ...group,
    children: [...group.children, child],
  };

  let newRootGroupIds = state.rootGroupIds;

  // If adding a group, update its parent and remove from root
  if (child.type === 'group' && newGroups[child.id]) {
    newGroups[child.id] = {
      ...newGroups[child.id],
      parentGroupId: groupId,
    };
    newRootGroupIds = newRootGroupIds.filter(gid => gid !== child.id);
  }

  return {
    nextState: { ...state, groups: newGroups, rootGroupIds: newRootGroupIds },
    events: [{ type: 'childAddedToGroup', groupId, childId: child.id }],
  };
}

// ---------------------------------------------------------------------------
// Remove from Group
// ---------------------------------------------------------------------------

function applyRemoveFromGroup(
  state: UniverseState,
  groupId: string,
  childId: string,
): CommandResult {
  const group = state.groups[groupId];
  if (!group) {
    return { nextState: state, events: [{ type: 'groupNotFound', id: groupId }] };
  }

  const removedChild = group.children.find(c => c.id === childId);
  if (!removedChild) {
    return { nextState: state, events: [{ type: 'childNotInGroup', groupId, childId }] };
  }

  const newGroups = { ...state.groups };
  newGroups[groupId] = {
    ...group,
    children: group.children.filter(c => c.id !== childId),
  };

  let newRootGroupIds = state.rootGroupIds;

  // If removing a group child, update its parent and add to root
  if (removedChild.type === 'group' && newGroups[childId]) {
    newGroups[childId] = {
      ...newGroups[childId],
      parentGroupId: null,
    };
    newRootGroupIds = [...newRootGroupIds, childId];
  }

  return {
    nextState: { ...state, groups: newGroups, rootGroupIds: newRootGroupIds },
    events: [{ type: 'childRemovedFromGroup', groupId, childId }],
  };
}

// ---------------------------------------------------------------------------
// Move to Group (with cycle prevention for group-typed children)
// ---------------------------------------------------------------------------

function applyMoveToGroup(
  state: UniverseState,
  childId: string,
  childType: 'system' | 'group',
  targetGroupId: string | null,
): CommandResult {
  const newGroups = { ...state.groups };
  let newRootGroupIds = [...state.rootGroupIds];

  // Remove from current group
  for (const group of Object.values(newGroups)) {
    if (group.children.some(c => c.id === childId && c.type === childType)) {
      newGroups[group.id] = {
        ...group,
        children: group.children.filter(c => !(c.id === childId && c.type === childType)),
      };
    }
  }

  // If moving a group, remove from root
  if (childType === 'group') {
    newRootGroupIds = newRootGroupIds.filter(gid => gid !== childId);
  }

  // Add to target group or make root
  if (targetGroupId === null) {
    if (childType === 'group' && newGroups[childId]) {
      newGroups[childId] = {
        ...newGroups[childId],
        parentGroupId: null,
      };
      newRootGroupIds.push(childId);
    }
  } else {
    const targetGroup = newGroups[targetGroupId];
    if (!targetGroup) {
      return { nextState: state, events: [{ type: 'groupNotFound', id: targetGroupId }] };
    }

    // Prevent cycles when moving a group
    if (childType === 'group') {
      if (wouldCreateGroupCycle(childId, targetGroupId, newGroups)) {
        return { nextState: state, events: [{ type: 'moveToGroupFailed', reason: 'cycle', childId, targetGroupId }] };
      }

      if (newGroups[childId]) {
        newGroups[childId] = {
          ...newGroups[childId],
          parentGroupId: targetGroupId,
        };
      }
    }

    newGroups[targetGroupId] = {
      ...targetGroup,
      children: [...targetGroup.children, { id: childId, type: childType }],
    };
  }

  return {
    nextState: { ...state, groups: newGroups, rootGroupIds: newRootGroupIds },
    events: [{ type: 'movedToGroup', childId, targetGroupId }],
  };
}

// ---------------------------------------------------------------------------
// Small Body Field operations
// ---------------------------------------------------------------------------

function applyUpdateSmallBodyField(
  state: UniverseState,
  id: string,
  patch: Partial<SmallBodyField>,
): CommandResult {
  const field = state.smallBodyFields[id];
  if (!field) {
    return { nextState: state, events: [{ type: 'smallBodyFieldNotFound', id }] };
  }
  return {
    nextState: {
      ...state,
      smallBodyFields: { ...state.smallBodyFields, [id]: { ...field, ...patch } },
    },
    events: [{ type: 'smallBodyFieldUpdated', id }],
  };
}

function applyRemoveSmallBodyField(
  state: UniverseState,
  id: string,
): CommandResult {
  const newFields = { ...state.smallBodyFields };
  delete newFields[id];
  return {
    nextState: { ...state, smallBodyFields: newFields },
    events: [{ type: 'smallBodyFieldRemoved', id }],
  };
}

// ---------------------------------------------------------------------------
// Protoplanetary Disk operations
// ---------------------------------------------------------------------------

function applyAddProtoplanetaryDisk(
  state: UniverseState,
  disk: ProtoplanetaryDisk,
): CommandResult {
  return {
    nextState: {
      ...state,
      protoplanetaryDisks: { ...state.protoplanetaryDisks, [disk.id]: disk },
    },
    events: [{ type: 'protoplanetaryDiskAdded', id: disk.id }],
  };
}

function applyUpdateProtoplanetaryDisk(
  state: UniverseState,
  id: string,
  patch: Partial<ProtoplanetaryDisk>,
): CommandResult {
  const disk = state.protoplanetaryDisks[id];
  if (!disk) {
    return { nextState: state, events: [{ type: 'protoplanetaryDiskNotFound', id }] };
  }
  return {
    nextState: {
      ...state,
      protoplanetaryDisks: { ...state.protoplanetaryDisks, [id]: { ...disk, ...patch } },
    },
    events: [{ type: 'protoplanetaryDiskUpdated', id }],
  };
}

function applyRemoveProtoplanetaryDisk(
  state: UniverseState,
  id: string,
): CommandResult {
  const newDisks = { ...state.protoplanetaryDisks };
  delete newDisks[id];
  return {
    nextState: { ...state, protoplanetaryDisks: newDisks },
    events: [{ type: 'protoplanetaryDiskRemoved', id }],
  };
}

// ---------------------------------------------------------------------------
// Nebula operations
// ---------------------------------------------------------------------------

function applyUpdateNebula(
  state: UniverseState,
  id: string,
  patch: Partial<NebulaRegion>,
): CommandResult {
  const nebula = state.nebulae[id];
  if (!nebula) {
    return { nextState: state, events: [{ type: 'nebulaNotFound', id }] };
  }
  return {
    nextState: {
      ...state,
      nebulae: { ...state.nebulae, [id]: { ...nebula, ...patch } },
    },
    events: [{ type: 'nebulaUpdated', id }],
  };
}

function applyRemoveNebula(
  state: UniverseState,
  id: string,
): CommandResult {
  const newNebulae = { ...state.nebulae };
  delete newNebulae[id];
  return {
    nextState: { ...state, nebulae: newNebulae },
    events: [{ type: 'nebulaRemoved', id }],
  };
}

// ---------------------------------------------------------------------------
// Ring operations (star sub-entity)
// ---------------------------------------------------------------------------

function applyUpdateRing(
  state: UniverseState,
  planetId: string,
  patch: Partial<PlanetaryRing>,
): CommandResult {
  const planet = state.stars[planetId];
  if (!planet) {
    return { nextState: state, events: [{ type: 'starNotFound', id: planetId }] };
  }

  const existingRing: PlanetaryRing | undefined = planet.ring;
  const defaultRing: PlanetaryRing = existingRing ?? {
    innerRadiusMultiplier: 1.5,
    outerRadiusMultiplier: 3.0,
    thickness: planet.radius * 0.1,
    opacity: 0.6,
    albedo: 0.8,
    color: planet.color,
    density: 0.6,
  };

  const updatedRing: PlanetaryRing = { ...defaultRing, ...patch };

  return {
    nextState: {
      ...state,
      stars: { ...state.stars, [planetId]: { ...planet, ring: updatedRing } },
    },
    events: [{ type: 'ringUpdated', planetId }],
  };
}

function applyRemoveRing(
  state: UniverseState,
  planetId: string,
): CommandResult {
  const planet = state.stars[planetId];
  if (!planet || !planet.ring) {
    return { nextState: state, events: [{ type: 'ringNotFound', planetId }] };
  }

  const { ring: _removed, ...rest } = planet;
  return {
    nextState: {
      ...state,
      stars: { ...state.stars, [planetId]: rest as Star },
    },
    events: [{ type: 'ringRemoved', planetId }],
  };
}

// ---------------------------------------------------------------------------
// Replace Snapshot (wholesale replace)
// ---------------------------------------------------------------------------

function applyReplaceSnapshot(
  state: UniverseState,
  snapshot: {
    stars: Record<string, Star>;
    rootIds: string[];
    groups: Record<string, Group>;
    rootGroupIds: string[];
    belts: Record<string, AsteroidBelt>;
    smallBodyFields: Record<string, SmallBodyField>;
    protoplanetaryDisks: Record<string, ProtoplanetaryDisk>;
    nebulae: Record<string, NebulaRegion>;
  },
): CommandResult {
  return {
    nextState: {
      stars: snapshot.stars,
      rootIds: snapshot.rootIds,
      groups: snapshot.groups ?? {},
      rootGroupIds: snapshot.rootGroupIds ?? [],
      belts: snapshot.belts ?? {},
      smallBodyFields: snapshot.smallBodyFields ?? {},
      protoplanetaryDisks: snapshot.protoplanetaryDisks ?? {},
      nebulae: snapshot.nebulae ?? {},
      time: state.time, // Preserve simulation time across replacements
    },
    events: [{ type: 'snapshotReplaced' }],
  };
}
