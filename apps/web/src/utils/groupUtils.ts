import { Group, GroupChild, NestingLevel } from '../types';

export interface VisibleItem {
  id: string;
  type: 'system' | 'group';
  position?: [number, number, number];
}

/**
 * Compute which items should be visible based on the current nesting level
 * @param groups - All groups in the system
 * @param rootGroupIds - Top-level group IDs
 * @param rootSystemIds - Root solar system IDs (ungrouped)
 * @param nestingLevel - Current nesting level to display
 * @returns Array of items that should be visible
 */
export function computeVisibleItems(
  groups: Record<string, Group>,
  rootGroupIds: string[],
  rootSystemIds: string[],
  nestingLevel: NestingLevel
): VisibleItem[] {
  const visible: VisibleItem[] = [];
  
  // Level 0: Show only ungrouped solar systems
  if (nestingLevel === 0) {
    rootSystemIds.forEach(id => {
      // Only show systems that aren't in any group
      const isInGroup = Object.values(groups).some(g =>
        g.children.some((c: GroupChild) => c.type === 'system' && c.id === id)
      );
      if (!isInGroup) {
        visible.push({ id, type: 'system' });
      }
    });
    return visible;
  }

  // Max: Show everything expanded with spatial distribution
  if (nestingLevel === 'max') {
    // Show all ungrouped systems
    rootSystemIds.forEach(id => {
      const isInGroup = Object.values(groups).some(g =>
        g.children.some((c: GroupChild) => c.type === 'system' && c.id === id)
      );
      if (!isInGroup) {
        visible.push({ id, type: 'system' });
      }
    });
    
    // For groups, show them as collapsed boxes with their systems inside
    // This way each group maintains its spatial position
    rootGroupIds.forEach(groupId => {
      const group = groups[groupId];
      if (group) {
        visible.push({ 
          id: groupId, 
          type: 'group',
          position: group.position ? [group.position.x, group.position.y, group.position.z] : undefined
        });
      }
    });
    
    return visible;
  }
  
  // Level N: Show groups and expand to depth N
  const processLevel = (
    itemId: string,
    itemType: 'system' | 'group',
    currentDepth: number
  ) => {
    if (itemType === 'system') {
      visible.push({ id: itemId, type: 'system' });
      return;
    }
    
    const group = groups[itemId];
    if (!group) return;
    
    if (currentDepth >= nestingLevel) {
      // Show as collapsed group
      visible.push({ 
        id: itemId, 
        type: 'group',
        position: group.position ? [group.position.x, group.position.y, group.position.z] : undefined
      });
    } else {
      // Expand this level
      group.children.forEach((child: GroupChild) => {
        processLevel(child.id, child.type, currentDepth + 1);
      });
    }
  };
  
  // Start with root items
  rootSystemIds.forEach(id => {
    const isInGroup = Object.values(groups).some(g =>
      g.children.some((c: GroupChild) => c.type === 'system' && c.id === id)
    );
    if (!isInGroup) {
      visible.push({ id, type: 'system' });
    }
  });

  rootGroupIds.forEach(groupId => {
    processLevel(groupId, 'group', 1);
  });
  
  return visible;
}

/**
 * Get the depth of a group in the hierarchy
 */
export function getGroupDepth(groupId: string, groups: Record<string, Group>): number {
  const group = groups[groupId];
  if (!group || !group.parentGroupId) return 0;
  return 1 + getGroupDepth(group.parentGroupId, groups);
}

/**
 * Check if adding a child to a parent would create a cycle
 */
export function wouldCreateCycle(
  childId: string,
  parentId: string,
  groups: Record<string, Group>
): boolean {
  let current = groups[parentId];
  while (current) {
    if (current.id === childId) return true;
    current = (current.parentGroupId ? groups[current.parentGroupId] : null) as Group;
  }
  return false;
}

/**
 * Get all descendant systems of a group (recursively)
 */
export function getGroupSystems(groupId: string, groups: Record<string, Group>): string[] {
  const group = groups[groupId];
  if (!group) return [];
  
  const systems: string[] = [];
  
  group.children.forEach((child: GroupChild) => {
    if (child.type === 'system') {
      systems.push(child.id);
    } else {
      systems.push(...getGroupSystems(child.id, groups));
    }
  });
  
  return systems;
}

/**
 * Get all descendant group IDs of a group (recursively), including the group itself
 */
export function getGroupAndDescendants(groupId: string, groups: Record<string, Group>): string[] {
  const group = groups[groupId];
  if (!group) return [];
  
  const groupIds: string[] = [groupId];
  
  group.children.forEach((child: GroupChild) => {
    if (child.type === 'group') {
      groupIds.push(...getGroupAndDescendants(child.id, groups));
    }
  });
  
  return groupIds;
}

