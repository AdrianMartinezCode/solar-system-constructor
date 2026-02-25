/**
 * @solar/domain — shared universe domain package.
 *
 * Entity types, universe state, commands, reducer, and validation logic
 * shared between the web and API applications.
 */

// Entity types
export type {
  Star,
  PlanetaryRing,
  CometMeta,
  LagrangePointMeta,
  BlackHoleProperties,
  RoguePlanetMeta,
  AsteroidBelt,
  SmallBodyBelt,
  Position,
  Group,
  GroupChild,
  NestingLevel,
  ProtoplanetaryDisk,
  SmallBodyField,
  NebulaRegion,
} from './types.js';

// State
export type { UniverseState } from './universe/state.js';
export { emptyUniverseState } from './universe/state.js';

// Commands & events
export type {
  UniverseCommand,
  TickCommand,
  AddStarCommand,
  UpdateStarCommand,
  RemoveStarCommand,
  AttachStarCommand,
  DetachStarCommand,
  AddGroupCommand,
  UpdateGroupCommand,
  RemoveGroupCommand,
  AddToGroupCommand,
  RemoveFromGroupCommand,
  MoveToGroupCommand,
  SetSmallBodyFieldsCommand,
  UpdateSmallBodyFieldCommand,
  RemoveSmallBodyFieldCommand,
  SetProtoplanetaryDisksCommand,
  AddProtoplanetaryDiskCommand,
  UpdateProtoplanetaryDiskCommand,
  RemoveProtoplanetaryDiskCommand,
  SetNebulaeCommand,
  UpdateNebulaCommand,
  RemoveNebulaCommand,
  UpdateRingCommand,
  RemoveRingCommand,
  ReplaceSnapshotCommand,
  DomainEvent,
} from './universe/commands.js';

// Reducer
export type { CommandResult } from './universe/applyCommand.js';
export { applyUniverseCommand } from './universe/applyCommand.js';

// Validation helpers
export {
  wouldCreateStarCycle,
  collectDescendants,
  starExists,
  wouldCreateGroupCycle,
} from './universe/validate.js';
