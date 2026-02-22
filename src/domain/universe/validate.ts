/**
 * Validation / invariant helpers for the universe domain.
 *
 * These are pure functions — no side effects, no randomness, no browser globals.
 */

import type { Star } from '../../types';

/**
 * Check whether making `childId` a descendant of `parentId` would create a cycle.
 *
 * Walks the ancestor chain of `parentId` upward; if we encounter `childId`,
 * attaching would produce a cycle.
 *
 * @returns `true` if a cycle would be created (i.e. the operation is invalid).
 */
export function wouldCreateStarCycle(
  childId: string,
  parentId: string,
  stars: Record<string, Star>,
): boolean {
  if (childId === parentId) return true;

  let currentId: string | null = parentId;
  while (currentId !== null) {
    if (currentId === childId) return true;
    const current: Star | undefined = stars[currentId];
    if (!current) break;
    currentId = current.parentId;
  }
  return false;
}

/**
 * Collect all descendant IDs of a star (recursive), including the star itself.
 *
 * Used for recursive delete.
 */
export function collectDescendants(
  starId: string,
  stars: Record<string, Star>,
): string[] {
  const result: string[] = [starId];
  const star = stars[starId];
  if (star) {
    for (const childId of star.children) {
      result.push(...collectDescendants(childId, stars));
    }
  }
  return result;
}

/**
 * Check whether a star exists in the stars record.
 */
export function starExists(
  id: string,
  stars: Record<string, Star>,
): boolean {
  return id in stars;
}

// ---------------------------------------------------------------------------
// Group invariants
// ---------------------------------------------------------------------------

import type { Group } from '../../types';

/**
 * Check whether making `childGroupId` a child of `targetGroupId` would
 * create a cycle in the group hierarchy.
 *
 * Walks the ancestor chain of `targetGroupId`; if we encounter `childGroupId`,
 * adding it would produce a cycle.
 */
export function wouldCreateGroupCycle(
  childGroupId: string,
  targetGroupId: string,
  groups: Record<string, Group>,
): boolean {
  if (childGroupId === targetGroupId) return true;

  let currentId: string | null = targetGroupId;
  while (currentId !== null) {
    if (currentId === childGroupId) return true;
    const current: Group | undefined = groups[currentId];
    if (!current) break;
    currentId = current.parentGroupId;
  }
  return false;
}
