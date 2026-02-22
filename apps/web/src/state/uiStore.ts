/**
 * uiStore — UI-only state that does not belong in the universe domain.
 *
 * Owns: selection, camera mode, nesting/isolation viewport controls.
 * This store is NOT persisted with the universe snapshot.
 *
 * Created as part of the UI/domain separation refactor (Task 5+).
 */

import { create } from 'zustand';
import type { NestingLevel } from '../types';

interface UiStore {
  // ---------------------------------------------------------------------------
  // Selection (mutual exclusion: only one entity selected at a time)
  // ---------------------------------------------------------------------------
  selectedStarId: string | null;
  selectedGroupId: string | null;
  selectedBeltId: string | null;
  selectedSmallBodyFieldId: string | null;
  selectedProtoplanetaryDiskId: string | null;
  selectedNebulaId: string | null;

  // Selection actions (each clears all other selections)
  selectStar: (id: string | null) => void;
  selectGroup: (id: string | null) => void;
  selectBelt: (id: string | null) => void;
  selectSmallBodyField: (id: string | null) => void;
  selectProtoplanetaryDisk: (id: string | null) => void;
  selectNebula: (id: string | null) => void;
  clearSelection: () => void;

  // ---------------------------------------------------------------------------
  // Camera (Body POV mode)
  // ---------------------------------------------------------------------------
  cameraMode: 'overview' | 'body';
  cameraTargetBodyId: string | null;
  cameraOffset: number; // Distance offset multiplier from body

  setCameraMode: (mode: 'overview' | 'body', targetBodyId?: string) => void;
  resetCamera: () => void;

  // ---------------------------------------------------------------------------
  // Viewport / nesting / group isolation
  // ---------------------------------------------------------------------------
  nestingLevel: NestingLevel;
  isolatedGroupId: string | null;

  setNestingLevel: (level: NestingLevel) => void;
  setIsolatedGroupId: (id: string | null) => void;
  toggleIsolatedGroup: (id: string) => void;
}

const EMPTY_SELECTION = {
  selectedStarId: null,
  selectedGroupId: null,
  selectedBeltId: null,
  selectedSmallBodyFieldId: null,
  selectedProtoplanetaryDiskId: null,
  selectedNebulaId: null,
} as const;

export const useUiStore = create<UiStore>((set) => ({
  ...EMPTY_SELECTION,

  selectStar: (id) => {
    set({ ...EMPTY_SELECTION, selectedStarId: id });
  },

  selectGroup: (id) => {
    set({ ...EMPTY_SELECTION, selectedGroupId: id });
  },

  selectBelt: (id) => {
    set({ ...EMPTY_SELECTION, selectedBeltId: id });
  },

  selectSmallBodyField: (id) => {
    set({ ...EMPTY_SELECTION, selectedSmallBodyFieldId: id });
  },

  selectProtoplanetaryDisk: (id) => {
    set({ ...EMPTY_SELECTION, selectedProtoplanetaryDiskId: id });
  },

  selectNebula: (id) => {
    set({ ...EMPTY_SELECTION, selectedNebulaId: id });
  },

  clearSelection: () => {
    set(EMPTY_SELECTION);
  },

  // ---------------------------------------------------------------------------
  // Camera
  // ---------------------------------------------------------------------------
  cameraMode: 'overview',
  cameraTargetBodyId: null,
  cameraOffset: 10,

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

  // ---------------------------------------------------------------------------
  // Viewport / nesting / group isolation
  // ---------------------------------------------------------------------------
  nestingLevel: 'max', // Default to showing everything
  isolatedGroupId: null,

  setNestingLevel: (level) => {
    set({ nestingLevel: level });
  },

  setIsolatedGroupId: (id) => {
    set({ isolatedGroupId: id });
  },

  toggleIsolatedGroup: (id) => {
    set((state) => ({
      isolatedGroupId: state.isolatedGroupId === id ? null : id,
    }));
  },
}));
