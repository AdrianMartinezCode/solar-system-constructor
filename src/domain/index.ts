/**
 * Domain public API — barrel export.
 *
 * All domain consumers should import from this module.
 */

// State
export type { UniverseState } from './universe/state';
export { emptyUniverseState } from './universe/state';

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
} from './universe/commands';

// Reducer
export type { CommandResult } from './universe/applyCommand';
export { applyUniverseCommand } from './universe/applyCommand';

// Validation helpers
export {
  wouldCreateStarCycle,
  collectDescendants,
  starExists,
  wouldCreateGroupCycle,
} from './universe/validate';

// Generation types
export type { GenerationConfig, GeneratedUniverse } from './generation';
