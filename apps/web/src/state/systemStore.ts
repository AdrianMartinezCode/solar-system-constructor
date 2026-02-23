import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Star, Group, GroupChild, NestingLevel, AsteroidBelt, PlanetaryRing, ProtoplanetaryDisk, SmallBodyField, NebulaRegion } from '../types';
import { createExampleSystem } from '../utils/exampleData';
import { localStorageSystemRepository } from '../infra/persistence/localStorageSystemRepository';
import { useUiStore } from './uiStore';
import { applyUniverseCommand } from '../domain/universe/applyCommand';
import type { UniverseState } from '../domain/universe/state';
import type { UniverseCommand } from '../domain/universe/commands';

// Repository adapter for persistence (replaces direct persistence imports)
const repository = localStorageSystemRepository;
import { findHeaviestStar } from '../utils/physics';

/**
 * Extract the domain-level UniverseState slice from the Zustand store.
 */
function getUniverseSlice(state: SystemStore): UniverseState {
  return {
    stars: state.stars,
    rootIds: state.rootIds,
    groups: state.groups,
    rootGroupIds: state.rootGroupIds,
    belts: state.belts,
    smallBodyFields: state.smallBodyFields,
    protoplanetaryDisks: state.protoplanetaryDisks,
    nebulae: state.nebulae,
    time: state.time,
  };
}

/**
 * Dispatch a domain command: apply the pure reducer then merge the next state
 * into the Zustand store. Returns the domain events for logging/debugging.
 */
function dispatchDomainCommand(
  get: () => SystemStore,
  set: (partial: Partial<SystemStore> | ((s: SystemStore) => Partial<SystemStore>)) => void,
  command: UniverseCommand,
) {
  const current = getUniverseSlice(get());
  const { nextState, events } = applyUniverseCommand(current, command);
  set({
    stars: nextState.stars,
    rootIds: nextState.rootIds,
    groups: nextState.groups,
    rootGroupIds: nextState.rootGroupIds,
    belts: nextState.belts,
    smallBodyFields: nextState.smallBodyFields,
    protoplanetaryDisks: nextState.protoplanetaryDisks,
    nebulae: nextState.nebulae,
    time: nextState.time,
  });
  return events;
}

interface SystemStore {
  stars: Record<string, Star>;
  rootIds: string[];
  selectedStarId: string | null;
  time: number;
  timeScale: number; // Global simulation speed multiplier (0-50)
  
  // Asteroid belt management (legacy, kept for backwards compatibility)
  belts: Record<string, AsteroidBelt>;
  selectedBeltId: string | null;
  
  // Small body particle fields (new performant representation for belts)
  smallBodyFields: Record<string, SmallBodyField>;
  selectedSmallBodyFieldId: string | null;
  
  // Protoplanetary disk management (visual-only particle fields)
  protoplanetaryDisks: Record<string, ProtoplanetaryDisk>;
  selectedProtoplanetaryDiskId: string | null;
  
  // Nebula management (galaxy-scale visual-only volumetric regions)
  nebulae: Record<string, NebulaRegion>;
  selectedNebulaId: string | null;
  
  // Group management
  groups: Record<string, Group>;
  rootGroupIds: string[]; // Top-level groups
  selectedGroupId: string | null;
  nestingLevel: NestingLevel; // View control for group expansion
  isolatedGroupId: string | null; // Group to isolate in viewport (solo mode)
  
  // Camera mode
  cameraMode: 'overview' | 'body';
  cameraTargetBodyId: string | null;
  cameraOffset: number; // Distance offset from body in body POV mode
  
  // CRUD operations for stars
  addStar: (payload: Omit<Star, 'id' | 'children'>) => string;
  updateStar: (id: string, payload: Partial<Star>) => void;
  removeStar: (id: string) => void;
  
  // Hierarchy operations for stars
  attachStar: (childId: string, parentId: string) => void;
  detachStar: (childId: string) => void;

  // Planetary ring operations (per-planet)
  updateRing: (planetId: string, payload: Partial<PlanetaryRing>) => void;
  removeRing: (planetId: string) => void;
  
  // Small body field operations (particle-based belts)
  setSmallBodyFields: (fields: Record<string, SmallBodyField>) => void;
  selectSmallBodyField: (id: string | null) => void;
  updateSmallBodyField: (id: string, patch: Partial<SmallBodyField>) => void;
  removeSmallBodyField: (id: string) => void;
  
  // Protoplanetary disk operations
  setProtoplanetaryDisks: (disks: Record<string, ProtoplanetaryDisk>) => void;
  selectProtoplanetaryDisk: (id: string | null) => void;
  updateProtoplanetaryDisk: (id: string, patch: Partial<ProtoplanetaryDisk>) => void;
  removeProtoplanetaryDisk: (id: string) => void;
  addProtoplanetaryDisk: (centralStarId: string) => string;
  
  // Nebula operations
  setNebulae: (nebulae: Record<string, NebulaRegion>) => void;
  selectNebula: (id: string | null) => void;
  updateNebula: (id: string, patch: Partial<NebulaRegion>) => void;
  removeNebula: (id: string) => void;
  
  // CRUD operations for groups
  addGroup: (payload: Omit<Group, 'id'>) => string;
  updateGroup: (id: string, payload: Partial<Group>) => void;
  removeGroup: (id: string) => void;
  
  // Group hierarchy operations
  addToGroup: (groupId: string, child: GroupChild) => void;
  removeFromGroup: (groupId: string, childId: string) => void;
  moveToGroup: (childId: string, childType: 'system' | 'group', targetGroupId: string | null) => void;
  
  // System operations
  computeCenters: () => void;
  tick: (dt: number) => void;
  
  // UI operations
  selectStar: (id: string | null) => void;
  selectGroup: (id: string | null) => void;
  selectBelt: (id: string | null) => void;
  setNestingLevel: (level: NestingLevel) => void;
  setTimeScale: (value: number) => void;
  
  // Group isolation operations
  setIsolatedGroupId: (id: string | null) => void;
  toggleIsolatedGroup: (id: string) => void;
  
  // Camera operations
  setCameraMode: (mode: 'overview' | 'body', targetBodyId?: string) => void;
  resetCamera: () => void;
  
  // Universe replacement (explicit API for generator panel)
  replaceUniverseSnapshot: (snapshot: {
    stars: Record<string, Star>;
    rootIds: string[];
    groups: Record<string, Group>;
    rootGroupIds: string[];
    belts: Record<string, AsteroidBelt>;
    smallBodyFields?: Record<string, SmallBodyField>;
    protoplanetaryDisks?: Record<string, ProtoplanetaryDisk>;
    nebulae?: Record<string, NebulaRegion>;
  }) => void;

  // Remote command application (no save — commands come from the backend)
  applyRemoteCommand: (command: UniverseCommand) => void;

  // Persistence
  save: () => void;
  load: () => void;
  reset: () => void;
}

export const useSystemStore = create<SystemStore>((set, get) => ({
  stars: {},
  rootIds: [],
  selectedStarId: null,
  time: 0,
  timeScale: 1.0, // Default to normal speed (1x)
  
  nebulae: {},
  selectedNebulaId: null,
  
  // Belt state (legacy)
  belts: {},
  selectedBeltId: null,
  
  // Small body fields state (new particle-based representation)
  smallBodyFields: {},
  selectedSmallBodyFieldId: null,
  
  // Protoplanetary disk state
  protoplanetaryDisks: {},
  selectedProtoplanetaryDiskId: null,
  
  // Group state
  groups: {},
  rootGroupIds: [],
  selectedGroupId: null,
  nestingLevel: 'max', // Default to showing everything
  isolatedGroupId: null, // No isolation by default
  
  // Camera state
  cameraMode: 'overview',
  cameraTargetBodyId: null,
  cameraOffset: 10, // Default offset multiplier (will be multiplied by body radius)
  
  addStar: (payload) => {
    const id = uuidv4();
    dispatchDomainCommand(get, set, {
      type: 'addStar',
      id,
      payload,
    });
    get().save();
    return id;
  },
  
  updateStar: (id, payload) => {
    dispatchDomainCommand(get, set, {
      type: 'updateStar',
      id,
      payload,
    });
    get().save();
  },

  updateRing: (planetId, payload) => {
    dispatchDomainCommand(get, set, {
      type: 'updateRing',
      planetId,
      patch: payload,
    });
    get().save();
  },

  removeRing: (planetId) => {
    dispatchDomainCommand(get, set, {
      type: 'removeRing',
      planetId,
    });
    get().save();
  },

  // Small body field operations — delegated to domain reducer
  setSmallBodyFields: (fields) => {
    dispatchDomainCommand(get, set, { type: 'setSmallBodyFields', fields });
    get().save();
  },

  // @deprecated — selection is now owned by uiStore; these delegate for compat
  selectSmallBodyField: (id) => {
    useUiStore.getState().selectSmallBodyField(id);
    set({
      selectedSmallBodyFieldId: id,
      selectedStarId: null,
      selectedGroupId: null,
      selectedBeltId: null,
      selectedProtoplanetaryDiskId: null,
    });
  },

  updateSmallBodyField: (id, patch) => {
    dispatchDomainCommand(get, set, { type: 'updateSmallBodyField', id, patch });
    get().save();
  },

  removeSmallBodyField: (id) => {
    dispatchDomainCommand(get, set, { type: 'removeSmallBodyField', id });
    get().save();
  },

  // Protoplanetary disk operations — delegated to domain reducer
  setProtoplanetaryDisks: (disks) => {
    dispatchDomainCommand(get, set, { type: 'setProtoplanetaryDisks', disks });
    get().save();
  },

  // @deprecated — selection is now owned by uiStore; these delegate for compat
  selectProtoplanetaryDisk: (id) => {
    useUiStore.getState().selectProtoplanetaryDisk(id);
    set({
      selectedProtoplanetaryDiskId: id,
      selectedStarId: null,
      selectedGroupId: null,
      selectedBeltId: null,
      selectedSmallBodyFieldId: null,
    });
  },

  updateProtoplanetaryDisk: (id, patch) => {
    dispatchDomainCommand(get, set, { type: 'updateProtoplanetaryDisk', id, patch });
    get().save();
  },

  removeProtoplanetaryDisk: (id) => {
    dispatchDomainCommand(get, set, { type: 'removeProtoplanetaryDisk', id });
    get().save();
  },

  addProtoplanetaryDisk: (centralStarId) => {
    const diskId = `disk-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const centerStar = get().stars[centralStarId];
    
    if (!centerStar) {
      console.error(`Cannot add disk: star ${centralStarId} not found`);
      return diskId;
    }

    // Create a default disk with moderate style (app-layer defaults, not domain)
    const newDisk: ProtoplanetaryDisk = {
      id: diskId,
      systemId: centralStarId,
      centralStarId: centralStarId,
      innerRadius: 1.0,
      outerRadius: 5.0,
      thickness: 0.3,
      particleCount: 5000,
      baseColor: '#D4A574',
      highlightColor: '#FFD700',
      opacity: 0.5,
      brightness: 0.5,
      clumpiness: 0.3,
      rotationSpeedMultiplier: 0.3,
      seed: Math.floor(Math.random() * 2147483647),
      style: 'moderate',
      name: `${centerStar.name} Protoplanetary Disk`,
      bandStrength: 0.5,
      bandFrequency: 5,
      gapSharpness: 0.5,
      innerGlowStrength: 0.6,
      noiseScale: 1.5,
      noiseStrength: 0.4,
      spiralStrength: 0.1,
      spiralArmCount: 2,
      edgeSoftness: 0.4,
      temperatureGradient: 1.5,
    };

    dispatchDomainCommand(get, set, { type: 'addProtoplanetaryDisk', disk: newDisk });
    get().save();
    return diskId;
  },
  
  // Nebula operations — delegated to domain reducer
  setNebulae: (nebulae) => {
    dispatchDomainCommand(get, set, { type: 'setNebulae', nebulae });
    get().save();
  },

  // @deprecated — selection is now owned by uiStore; these delegate for compat
  selectNebula: (id) => {
    useUiStore.getState().selectNebula(id);
    set({ selectedNebulaId: id });
  },

  updateNebula: (id, patch) => {
    dispatchDomainCommand(get, set, { type: 'updateNebula', id, patch });
    get().save();
  },

  removeNebula: (id) => {
    dispatchDomainCommand(get, set, { type: 'removeNebula', id });
    get().save();
  },
  
  removeStar: (id) => {
    dispatchDomainCommand(get, set, {
      type: 'removeStar',
      id,
    });
    get().save();
  },
  
  attachStar: (childId, parentId) => {
    dispatchDomainCommand(get, set, {
      type: 'attachStar',
      childId,
      parentId,
    });
    get().save();
  },
  
  detachStar: (childId) => {
    dispatchDomainCommand(get, set, {
      type: 'detachStar',
      childId,
    });
    get().save();
  },
  
  computeCenters: () => {
    // For each star with children, determine if it should be the center
    // or if one of its children should be (based on mass)
    set((state) => {
      const newStars = { ...state.stars };
      
      Object.values(newStars).forEach((star) => {
        if (star.children.length > 0) {
          const allInSystem = [star.id, ...star.children];
          findHeaviestStar(allInSystem, newStars);
          
          // If heaviest is not the parent itself, we'd need to restructure
          // For simplicity, we just note this information
          // A full implementation would reorganize the hierarchy
        }
      });
      
      return { stars: newStars };
    });
  },
  
  tick: (dt) => {
    const scaledDt = dt * get().timeScale;
    dispatchDomainCommand(get, set, {
      type: 'tick',
      dt: scaledDt,
    });
  },
  
  // @deprecated — selection is now owned by uiStore; these delegate for compat
  selectStar: (id) => {
    useUiStore.getState().selectStar(id);
    set({ 
      selectedStarId: id, 
      selectedGroupId: null, 
      selectedBeltId: null,
      selectedSmallBodyFieldId: null,
      selectedProtoplanetaryDiskId: null,
    });
  },
  
  // @deprecated — selection is now owned by uiStore; these delegate for compat
  selectBelt: (id) => {
    useUiStore.getState().selectBelt(id);
    set({ 
      selectedBeltId: id, 
      selectedStarId: null, 
      selectedGroupId: null,
      selectedSmallBodyFieldId: null,
      selectedProtoplanetaryDiskId: null,
    });
  },
  
  // Group CRUD operations — delegated to domain reducer
  addGroup: (payload) => {
    const id = uuidv4();
    dispatchDomainCommand(get, set, {
      type: 'addGroup',
      id,
      payload,
    });
    get().save();
    return id;
  },
  
  updateGroup: (id, payload) => {
    dispatchDomainCommand(get, set, {
      type: 'updateGroup',
      id,
      payload,
    });
    get().save();
  },
  
  removeGroup: (id) => {
    // Clear isolation if this group was isolated (UI concern)
    const wasIsolated = get().isolatedGroupId === id;
    if (wasIsolated) {
      useUiStore.getState().setIsolatedGroupId(null);
      set({ isolatedGroupId: null });
    }

    dispatchDomainCommand(get, set, {
      type: 'removeGroup',
      id,
    });
    get().save();
  },
  
  addToGroup: (groupId, child) => {
    dispatchDomainCommand(get, set, {
      type: 'addToGroup',
      groupId,
      child,
    });
    get().save();
  },
  
  removeFromGroup: (groupId, childId) => {
    dispatchDomainCommand(get, set, {
      type: 'removeFromGroup',
      groupId,
      childId,
    });
    get().save();
  },
  
  moveToGroup: (childId, childType, targetGroupId) => {
    dispatchDomainCommand(get, set, {
      type: 'moveToGroup',
      childId,
      childType,
      targetGroupId,
    });
    get().save();
  },
  
  // @deprecated — selection is now owned by uiStore; these delegate for compat
  selectGroup: (id) => {
    useUiStore.getState().selectGroup(id);
    set({ 
      selectedGroupId: id, 
      selectedStarId: null, 
      selectedBeltId: null,
      selectedSmallBodyFieldId: null,
      selectedProtoplanetaryDiskId: null,
    });
  },
  
  // @deprecated — nesting is now owned by uiStore; delegates for compat
  setNestingLevel: (level) => {
    useUiStore.getState().setNestingLevel(level);
    set({ nestingLevel: level });
  },
  
  setTimeScale: (value) => {
    set({ timeScale: Math.max(0, Math.min(50, value)) }); // Clamp to [0, 50]
  },
  
  // @deprecated — camera is now owned by uiStore; these delegate for compat
  setCameraMode: (mode, targetBodyId) => {
    useUiStore.getState().setCameraMode(mode, targetBodyId);
    if (mode === 'body' && targetBodyId) {
      set({ cameraMode: 'body', cameraTargetBodyId: targetBodyId });
    } else {
      set({ cameraMode: 'overview', cameraTargetBodyId: null });
    }
  },
  
  // @deprecated — camera is now owned by uiStore; these delegate for compat
  resetCamera: () => {
    useUiStore.getState().resetCamera();
    set({ cameraMode: 'overview', cameraTargetBodyId: null });
  },
  
  // @deprecated — isolation is now owned by uiStore; delegates for compat
  setIsolatedGroupId: (id) => {
    useUiStore.getState().setIsolatedGroupId(id);
    set({ isolatedGroupId: id });
  },

  // @deprecated — isolation is now owned by uiStore; delegates for compat
  toggleIsolatedGroup: (id) => {
    useUiStore.getState().toggleIsolatedGroup(id);
    set((state) => ({
      isolatedGroupId: state.isolatedGroupId === id ? null : id,
    }));
  },
  
  replaceUniverseSnapshot: (snapshot) => {
    set({
      stars: snapshot.stars,
      rootIds: snapshot.rootIds,
      groups: snapshot.groups,
      rootGroupIds: snapshot.rootGroupIds,
      belts: snapshot.belts,
      smallBodyFields: snapshot.smallBodyFields ?? {},
      protoplanetaryDisks: snapshot.protoplanetaryDisks ?? {},
      nebulae: snapshot.nebulae ?? {},
      // @deprecated compat — also clear local selection fields
      selectedStarId: null,
      selectedGroupId: null,
      selectedBeltId: null,
      selectedSmallBodyFieldId: null,
      selectedProtoplanetaryDiskId: null,
      selectedNebulaId: null,
    });
    // Clear selection in the canonical uiStore
    useUiStore.getState().clearSelection();
    get().save();
  },

  applyRemoteCommand: (command) => {
    // Apply the command to the universe state via the domain reducer.
    // Intentionally does NOT call save() — remote commands come from the
    // backend and should not be re-persisted to localStorage.
    dispatchDomainCommand(get, set, command);
  },

  save: () => {
    const state = get();
    repository.save({
      stars: state.stars,
      rootIds: state.rootIds,
      groups: state.groups,
      rootGroupIds: state.rootGroupIds,
      belts: state.belts,
      smallBodyFields: state.smallBodyFields,
      protoplanetaryDisks: state.protoplanetaryDisks,
    });
  },
  
  load: () => {
    const data = repository.load();
    if (data) {
      set({
        stars: data.stars,
        rootIds: data.rootIds,
        groups: data.groups || {},
        rootGroupIds: data.rootGroupIds || [],
        belts: data.belts || {},
        smallBodyFields: data.smallBodyFields || {},
        protoplanetaryDisks: data.protoplanetaryDisks || {},
        selectedStarId: null,
        selectedGroupId: null,
        selectedBeltId: null,
        selectedSmallBodyFieldId: null,
        selectedProtoplanetaryDiskId: null,
        time: 0,
      });
    } else {
      // Load example system
      get().reset();
    }
  },
  
  reset: () => {
    const example = createExampleSystem();
    set({
      stars: example.stars,
      rootIds: example.rootIds,
      groups: example.groups || {},
      rootGroupIds: example.rootGroupIds || [],
      belts: example.belts || {},
      smallBodyFields: example.smallBodyFields || {},
      protoplanetaryDisks: example.protoplanetaryDisks || {},
      nebulae: {},
      selectedStarId: null,
      selectedGroupId: null,
      selectedBeltId: null,
      selectedSmallBodyFieldId: null,
      selectedProtoplanetaryDiskId: null,
      selectedNebulaId: null,
      time: 0,
    });
    get().save();
  },
}));

