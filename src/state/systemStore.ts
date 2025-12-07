import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { Star, Group, GroupChild, NestingLevel, AsteroidBelt } from '../types';
import { saveSystem, loadSystem } from '../utils/persistence';
import { createExampleSystem } from '../utils/exampleData';
import { findHeaviestStar } from '../utils/physics';

interface SystemStore {
  stars: Record<string, Star>;
  rootIds: string[];
  selectedStarId: string | null;
  time: number;
  timeScale: number; // Global simulation speed multiplier (0-50)
  
  // Asteroid belt management
  belts: Record<string, AsteroidBelt>;
  selectedBeltId: string | null;
  
  // Group management
  groups: Record<string, Group>;
  rootGroupIds: string[]; // Top-level groups
  selectedGroupId: string | null;
  nestingLevel: NestingLevel; // View control for group expansion
  
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
  
  // Belt state
  belts: {},
  selectedBeltId: null,
  
  // Group state
  groups: {},
  rootGroupIds: [],
  selectedGroupId: null,
  nestingLevel: 'max', // Default to showing everything
  
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
    set({ selectedStarId: id, selectedGroupId: null, selectedBeltId: null });
  },
  
  selectBelt: (id) => {
    set({ selectedBeltId: id, selectedStarId: null, selectedGroupId: null });
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
      
      return {
        groups: newGroups,
        rootGroupIds: newRootGroupIds,
        selectedGroupId: state.selectedGroupId === id ? null : state.selectedGroupId,
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
    set({ selectedGroupId: id, selectedStarId: null, selectedBeltId: null });
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
  
  save: () => {
    const state = get();
    saveSystem({
      stars: state.stars,
      rootIds: state.rootIds,
      groups: state.groups,
      rootGroupIds: state.rootGroupIds,
      belts: state.belts,
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
        selectedStarId: null,
        selectedGroupId: null,
        selectedBeltId: null,
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
      selectedStarId: null,
      selectedGroupId: null,
      selectedBeltId: null,
      time: 0,
    });
    get().save();
  },
}));

