import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Star, Group, GroupChild, NestingLevel, AsteroidBelt, PlanetaryRing, ProtoplanetaryDisk, SmallBodyField, NebulaRegion } from '../types';
import { saveSystem, loadSystem } from '../utils/persistence';
import { createExampleSystem } from '../utils/exampleData';
import { findHeaviestStar } from '../utils/physics';

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
    const newStar: Star = {
      ...payload,
      id,
      children: [],
      orbitalPhase: payload.orbitalPhase ?? 0, // Default to 0 if not provided
    };
    
    set((state) => {
      const newStars = { ...state.stars, [id]: newStar };
      const newRootIds = newStar.parentId === null 
        ? [...state.rootIds, id]
        : state.rootIds;
      
      // If has parent, add to parent's children
      if (newStar.parentId && newStars[newStar.parentId]) {
        newStars[newStar.parentId] = {
          ...newStars[newStar.parentId],
          children: [...newStars[newStar.parentId].children, id],
        };
      }
      
      return { stars: newStars, rootIds: newRootIds };
    });
    
    get().save();
    return id;
  },
  
  updateStar: (id, payload) => {
    set((state) => {
      if (!state.stars[id]) return state;
      
      return {
        stars: {
          ...state.stars,
          [id]: {
            ...state.stars[id],
            ...payload,
          },
        },
      };
    });
    
    get().save();
  },

  updateRing: (planetId, payload) => {
    set((state) => {
      const planet = state.stars[planetId];
      if (!planet) return state;

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

      const updatedRing: PlanetaryRing = {
        ...defaultRing,
        ...payload,
      };

      return {
        stars: {
          ...state.stars,
          [planetId]: {
            ...planet,
            ring: updatedRing,
          },
        },
      };
    });

    get().save();
  },

  removeRing: (planetId) => {
    set((state) => {
      const planet = state.stars[planetId];
      if (!planet || !planet.ring) return state;

      const { ring, ...rest } = planet;

      return {
        stars: {
          ...state.stars,
          [planetId]: rest,
        },
      };
    });

    get().save();
  },

  // Small body field operations
  setSmallBodyFields: (fields) => {
    set({ smallBodyFields: fields });
    get().save();
  },

  selectSmallBodyField: (id) => {
    set({
      selectedSmallBodyFieldId: id,
      selectedStarId: null,
      selectedGroupId: null,
      selectedBeltId: null,
      selectedProtoplanetaryDiskId: null,
    });
  },

  updateSmallBodyField: (id, patch) => {
    set((state) => {
      const field = state.smallBodyFields[id];
      if (!field) return state;

      return {
        smallBodyFields: {
          ...state.smallBodyFields,
          [id]: {
            ...field,
            ...patch,
          },
        },
      };
    });

    get().save();
  },

  removeSmallBodyField: (id) => {
    set((state) => {
      const newFields = { ...state.smallBodyFields };
      delete newFields[id];

      return {
        smallBodyFields: newFields,
        selectedSmallBodyFieldId:
          state.selectedSmallBodyFieldId === id ? null : state.selectedSmallBodyFieldId,
      };
    });

    get().save();
  },

  // Protoplanetary disk operations
  setProtoplanetaryDisks: (disks) => {
    set({ protoplanetaryDisks: disks });
    get().save();
  },

  selectProtoplanetaryDisk: (id) => {
    set({
      selectedProtoplanetaryDiskId: id,
      selectedStarId: null,
      selectedGroupId: null,
      selectedBeltId: null,
      selectedSmallBodyFieldId: null,
    });
  },

  updateProtoplanetaryDisk: (id, patch) => {
    set((state) => {
      const disk = state.protoplanetaryDisks[id];
      if (!disk) return state;

      return {
        protoplanetaryDisks: {
          ...state.protoplanetaryDisks,
          [id]: {
            ...disk,
            ...patch,
          },
        },
      };
    });

    get().save();
  },

  removeProtoplanetaryDisk: (id) => {
    set((state) => {
      const newDisks = { ...state.protoplanetaryDisks };
      delete newDisks[id];

      return {
        protoplanetaryDisks: newDisks,
        selectedProtoplanetaryDiskId:
          state.selectedProtoplanetaryDiskId === id ? null : state.selectedProtoplanetaryDiskId,
      };
    });

    get().save();
  },

  addProtoplanetaryDisk: (centralStarId) => {
    const diskId = `disk-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const centerStar = get().stars[centralStarId];
    
    if (!centerStar) {
      console.error(`Cannot add disk: star ${centralStarId} not found`);
      return diskId;
    }

    // Create a default disk with moderate style
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
      // Shader-specific parameters (moderate defaults)
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

    set((state) => ({
      protoplanetaryDisks: {
        ...state.protoplanetaryDisks,
        [diskId]: newDisk,
      },
    }));

    get().save();
    return diskId;
  },
  
  // Nebula operations
  setNebulae: (nebulae) => {
    set({ nebulae });
    get().save();
  },

  selectNebula: (id) => {
    set({ selectedNebulaId: id });
  },

  updateNebula: (id, patch) => {
    set((state) => {
      const nebula = state.nebulae[id];
      if (!nebula) return state;

      return {
        nebulae: {
          ...state.nebulae,
          [id]: { ...nebula, ...patch },
        },
      };
    });

    get().save();
  },

  removeNebula: (id) => {
    set((state) => {
      const newNebulae = { ...state.nebulae };
      delete newNebulae[id];

      return {
        nebulae: newNebulae,
        selectedNebulaId:
          state.selectedNebulaId === id ? null : state.selectedNebulaId,
      };
    });

    get().save();
  },
  
  removeStar: (id) => {
    const removeRecursive = (starId: string, stars: Record<string, Star>): string[] => {
      const removed = [starId];
      const star = stars[starId];
      if (star) {
        star.children.forEach((childId) => {
          removed.push(...removeRecursive(childId, stars));
        });
      }
      return removed;
    };
    
    set((state) => {
      const toRemove = removeRecursive(id, state.stars);
      const newStars = { ...state.stars };
      toRemove.forEach((starId) => delete newStars[starId]);
      
      // Remove from parent's children
      const star = state.stars[id];
      if (star?.parentId && newStars[star.parentId]) {
        newStars[star.parentId] = {
          ...newStars[star.parentId],
          children: newStars[star.parentId].children.filter((c) => c !== id),
        };
      }
      
      // Remove from rootIds if needed
      const newRootIds = state.rootIds.filter((rootId) => !toRemove.includes(rootId));
      
      return {
        stars: newStars,
        rootIds: newRootIds,
        selectedStarId: state.selectedStarId === id ? null : state.selectedStarId,
      };
    });
    
    get().save();
  },
  
  attachStar: (childId, parentId) => {
    set((state) => {
      const child = state.stars[childId];
      const parent = state.stars[parentId];
      
      if (!child || !parent || childId === parentId) return state;
      
      // Prevent circular references
      let current: Star | null = parent;
      while (current) {
        if (current.id === childId) return state; // Would create a cycle
        current = current.parentId ? state.stars[current.parentId] : null;
      }
      
      const newStars = { ...state.stars };
      
      // Remove from old parent
      if (child.parentId && newStars[child.parentId]) {
        newStars[child.parentId] = {
          ...newStars[child.parentId],
          children: newStars[child.parentId].children.filter((c) => c !== childId),
        };
      }
      
      // Add to new parent
      newStars[parentId] = {
        ...newStars[parentId],
        children: [...newStars[parentId].children, childId],
      };
      
      // Update child's parentId
      newStars[childId] = {
        ...newStars[childId],
        parentId,
      };
      
      // Update rootIds
      const newRootIds = child.parentId === null
        ? state.rootIds.filter((id) => id !== childId)
        : state.rootIds;
      
      return { stars: newStars, rootIds: newRootIds };
    });
    
    get().save();
  },
  
  detachStar: (childId) => {
    set((state) => {
      const child = state.stars[childId];
      if (!child || !child.parentId) return state;
      
      const newStars = { ...state.stars };
      
      // Remove from parent's children
      if (newStars[child.parentId]) {
        newStars[child.parentId] = {
          ...newStars[child.parentId],
          children: newStars[child.parentId].children.filter((c) => c !== childId),
        };
      }
      
      // Update child
      newStars[childId] = {
        ...newStars[childId],
        parentId: null,
        orbitalDistance: 0,
      };
      
      return {
        stars: newStars,
        rootIds: [...state.rootIds, childId],
      };
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
    set((state) => ({
      time: state.time + dt * state.timeScale,
    }));
  },
  
  selectStar: (id) => {
    set({ 
      selectedStarId: id, 
      selectedGroupId: null, 
      selectedBeltId: null,
      selectedSmallBodyFieldId: null,
      selectedProtoplanetaryDiskId: null,
    });
  },
  
  selectBelt: (id) => {
    set({ 
      selectedBeltId: id, 
      selectedStarId: null, 
      selectedGroupId: null,
      selectedSmallBodyFieldId: null,
      selectedProtoplanetaryDiskId: null,
    });
  },
  
  // Group CRUD operations
  addGroup: (payload) => {
    const id = uuidv4();
    const newGroup: Group = {
      ...payload,
      id,
    };
    
    set((state) => {
      const newGroups = { ...state.groups, [id]: newGroup };
      const newRootGroupIds = newGroup.parentGroupId === null
        ? [...state.rootGroupIds, id]
        : state.rootGroupIds;
      
      // If has parent group, add to parent's children
      if (newGroup.parentGroupId && newGroups[newGroup.parentGroupId]) {
        newGroups[newGroup.parentGroupId] = {
          ...newGroups[newGroup.parentGroupId],
          children: [
            ...newGroups[newGroup.parentGroupId].children,
            { id, type: 'group' }
          ],
        };
      }
      
      return { groups: newGroups, rootGroupIds: newRootGroupIds };
    });
    
    get().save();
    return id;
  },
  
  updateGroup: (id, payload) => {
    set((state) => {
      if (!state.groups[id]) return state;
      
      return {
        groups: {
          ...state.groups,
          [id]: {
            ...state.groups[id],
            ...payload,
          },
        },
      };
    });
    
    get().save();
  },
  
  removeGroup: (id) => {
    set((state) => {
      const group = state.groups[id];
      if (!group) return state;
      
      const newGroups = { ...state.groups };
      delete newGroups[id];
      
      // Remove from parent group's children if it has a parent
      if (group.parentGroupId && newGroups[group.parentGroupId]) {
        newGroups[group.parentGroupId] = {
          ...newGroups[group.parentGroupId],
          children: newGroups[group.parentGroupId].children.filter(c => c.id !== id),
        };
      }
      
      // Remove from rootGroupIds if needed
      const newRootGroupIds = state.rootGroupIds.filter(gid => gid !== id);
      
      // Move children to root or parent group
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
      
      // Clear isolation if this group was isolated
      const newIsolatedGroupId = state.isolatedGroupId === id ? null : state.isolatedGroupId;
      
      return {
        groups: newGroups,
        rootGroupIds: newRootGroupIds,
        selectedGroupId: state.selectedGroupId === id ? null : state.selectedGroupId,
        isolatedGroupId: newIsolatedGroupId,
      };
    });
    
    get().save();
  },
  
  addToGroup: (groupId, child) => {
    set((state) => {
      const group = state.groups[groupId];
      if (!group) return state;
      
      // Check if child already exists in group
      const exists = group.children.some(c => c.id === child.id && c.type === child.type);
      if (exists) return state;
      
      const newGroups = { ...state.groups };
      newGroups[groupId] = {
        ...group,
        children: [...group.children, child],
      };
      
      // If adding a group, update its parent
      if (child.type === 'group' && newGroups[child.id]) {
        newGroups[child.id] = {
          ...newGroups[child.id],
          parentGroupId: groupId,
        };
        
        // Remove from rootGroupIds
        const newRootGroupIds = state.rootGroupIds.filter(id => id !== child.id);
        return { groups: newGroups, rootGroupIds: newRootGroupIds };
      }
      
      return { groups: newGroups };
    });
    
    get().save();
  },
  
  removeFromGroup: (groupId, childId) => {
    set((state) => {
      const group = state.groups[groupId];
      if (!group) return state;
      
      const removedChild = group.children.find(c => c.id === childId);
      if (!removedChild) return state;
      
      const newGroups = { ...state.groups };
      newGroups[groupId] = {
        ...group,
        children: group.children.filter(c => c.id !== childId),
      };
      
      // If removing a group, update its parent and add to root
      if (removedChild.type === 'group' && newGroups[childId]) {
        newGroups[childId] = {
          ...newGroups[childId],
          parentGroupId: null,
        };
        
        return {
          groups: newGroups,
          rootGroupIds: [...state.rootGroupIds, childId],
        };
      }
      
      return { groups: newGroups };
    });
    
    get().save();
  },
  
  moveToGroup: (childId, childType, targetGroupId) => {
    set((state) => {
      const newGroups = { ...state.groups };
      let newRootGroupIds = [...state.rootGroupIds];
      
      // Remove from current group
      Object.values(newGroups).forEach(group => {
        if (group.children.some(c => c.id === childId && c.type === childType)) {
          newGroups[group.id] = {
            ...group,
            children: group.children.filter(c => !(c.id === childId && c.type === childType)),
          };
        }
      });
      
      // If moving a group, remove from root if it's there
      if (childType === 'group') {
        newRootGroupIds = newRootGroupIds.filter(id => id !== childId);
      }
      
      // Add to target group or make root
      if (targetGroupId === null) {
        // Make root
        if (childType === 'group' && newGroups[childId]) {
          newGroups[childId] = {
            ...newGroups[childId],
            parentGroupId: null,
          };
          newRootGroupIds.push(childId);
        }
      } else {
        // Add to target group
        const targetGroup = newGroups[targetGroupId];
        if (targetGroup) {
          // Prevent cycles
          if (childType === 'group') {
            let current: Group | null = targetGroup;
            while (current) {
              if (current.id === childId) return state; // Would create cycle
              current = current.parentGroupId ? newGroups[current.parentGroupId] : null;
            }
            
            // Update group's parent
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
      }
      
      return { groups: newGroups, rootGroupIds: newRootGroupIds };
    });
    
    get().save();
  },
  
  selectGroup: (id) => {
    set({ 
      selectedGroupId: id, 
      selectedStarId: null, 
      selectedBeltId: null,
      selectedSmallBodyFieldId: null,
      selectedProtoplanetaryDiskId: null,
    });
  },
  
  setNestingLevel: (level) => {
    set({ nestingLevel: level });
  },
  
  setTimeScale: (value) => {
    set({ timeScale: Math.max(0, Math.min(50, value)) }); // Clamp to [0, 50]
  },
  
  setCameraMode: (mode, targetBodyId) => {
    if (mode === 'body' && targetBodyId) {
      set({ cameraMode: 'body', cameraTargetBodyId: targetBodyId });
    } else {
      set({ cameraMode: 'overview', cameraTargetBodyId: null });
    }
  },
  
  resetCamera: () => {
    set({ cameraMode: 'overview', cameraTargetBodyId: null });
  },
  
  setIsolatedGroupId: (id) => {
    set({ isolatedGroupId: id });
  },
  
  toggleIsolatedGroup: (id) => {
    set((state) => ({
      isolatedGroupId: state.isolatedGroupId === id ? null : id,
    }));
  },
  
  save: () => {
    const state = get();
    saveSystem({
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
    const data = loadSystem();
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

