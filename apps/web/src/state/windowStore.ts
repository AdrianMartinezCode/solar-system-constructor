import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type WindowType = 
  | 'speed' 
  | 'overview' 
  | 'hierarchy' 
  | 'generator' 
  | 'planetEditor' 
  | 'groupEditor' 
  | 'nebulaEditor'
  | 'stats'
  | 'starList';

export type DockPosition = 'left' | 'right' | 'top' | null;

export interface WindowState {
  id: string;
  type: WindowType;
  title: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  docked: DockPosition;
  minimized: boolean;
  zIndex: number;
  data?: any; // Window-specific data (e.g., which planet is being edited)
}

export type WorkspacePreset = 'exploration' | 'editing' | 'generation' | 'custom';

interface WindowManagerState {
  windows: Record<string, WindowState>;
  activeWindowId: string | null;
  taskbarOrder: string[];
  currentWorkspace: WorkspacePreset;
  maxZIndex: number;

  // Window management
  openWindow: (type: WindowType, data?: any, position?: { x: number; y: number }) => string;
  closeWindow: (id: string) => void;
  focusWindow: (id: string) => void;
  minimizeWindow: (id: string) => void;
  restoreWindow: (id: string) => void;
  setWindowPosition: (id: string, x: number, y: number) => void;
  setWindowSize: (id: string, width: number, height: number) => void;
  dockWindow: (id: string, position: DockPosition) => void;
  updateWindowData: (id: string, data: any) => void;
  
  // Workspace management
  loadWorkspace: (preset: WorkspacePreset) => void;
  saveCustomWorkspace: () => void;
  loadCustomWorkspace: () => void;
  
  // Utility
  getWindowByType: (type: WindowType) => WindowState | null;
  bringToFront: (id: string) => void;
  closeAll: () => void;
}

// Default window configurations
const windowDefaults: Record<WindowType, { width: number; height: number; title: string }> = {
  speed: { width: 400, height: 240, title: 'Simulation Speed Control' },
  overview: { width: 350, height: 500, title: 'System Overview' },
  hierarchy: { width: 280, height: 600, title: 'Hierarchy Tree' },
  generator: { width: 400, height: 700, title: 'Procedural Universe Generator' },
  planetEditor: { width: 350, height: 600, title: 'Body Inspector' },
  groupEditor: { width: 380, height: 550, title: 'Group Editor' },
  nebulaEditor: { width: 380, height: 600, title: 'Nebula Editor' },
  stats: { width: 420, height: 680, title: 'Simulation Stats & Analytics' },
  starList: { width: 300, height: 500, title: 'Star List' },
};

// Helper to get default position for a window type
const getDefaultPosition = (type: WindowType, existingWindows: Record<string, WindowState>): { x: number; y: number } => {
  // Count how many windows of this type already exist for cascading
  const sameTypeCount = Object.values(existingWindows).filter(w => w.type === type).length;
  const offset = sameTypeCount * 30;
  
  switch (type) {
    case 'hierarchy':
    case 'overview':
      return { x: 20 + offset, y: 80 + offset };
    case 'planetEditor':
    case 'groupEditor':
    case 'nebulaEditor':
    case 'starList':
      return { x: window.innerWidth - windowDefaults[type].width - 20 - offset, y: 80 + offset };
    case 'generator':
      return { x: (window.innerWidth - windowDefaults[type].width) / 2 + offset, y: 60 + offset };
    case 'stats':
      return { x: window.innerWidth - windowDefaults[type].width - 20, y: 80 };
    case 'speed':
      return { x: (window.innerWidth - windowDefaults[type].width) / 2, y: 100 };
    default:
      return { x: 100 + offset, y: 100 + offset };
  }
};

export const useWindowStore = create<WindowManagerState>((set, get) => ({
  windows: {},
  activeWindowId: null,
  taskbarOrder: [],
  currentWorkspace: 'exploration',
  maxZIndex: 1000,

  openWindow: (type, data, position) => {
    const state = get();
    
    // Check if window of this type already exists (some windows are singletons)
    const existing = Object.values(state.windows).find(w => w.type === type);
    if (existing && ['speed', 'overview', 'hierarchy', 'generator', 'stats'].includes(type)) {
      // Just restore and focus if minimized
      if (existing.minimized) {
        get().restoreWindow(existing.id);
      }
      get().focusWindow(existing.id);
      return existing.id;
    }

    const id = uuidv4();
    const defaults = windowDefaults[type];
    const defaultPos = position || getDefaultPosition(type, state.windows);

    const newWindow: WindowState = {
      id,
      type,
      title: defaults.title,
      position: defaultPos,
      size: { width: defaults.width, height: defaults.height },
      docked: null,
      minimized: false,
      zIndex: state.maxZIndex + 1,
      data,
    };

    set({
      windows: { ...state.windows, [id]: newWindow },
      activeWindowId: id,
      taskbarOrder: [...state.taskbarOrder, id],
      maxZIndex: state.maxZIndex + 1,
    });

    return id;
  },

  closeWindow: (id) => {
    set((state) => {
      const { [id]: removed, ...remainingWindows } = state.windows;
      return {
        windows: remainingWindows,
        activeWindowId: state.activeWindowId === id ? null : state.activeWindowId,
        taskbarOrder: state.taskbarOrder.filter(wid => wid !== id),
      };
    });
  },

  focusWindow: (id) => {
    set((state) => {
      const window = state.windows[id];
      if (!window) return state;

      return {
        windows: {
          ...state.windows,
          [id]: { ...window, zIndex: state.maxZIndex + 1 },
        },
        activeWindowId: id,
        maxZIndex: state.maxZIndex + 1,
      };
    });
  },

  minimizeWindow: (id) => {
    set((state) => {
      const window = state.windows[id];
      if (!window) return state;

      return {
        windows: {
          ...state.windows,
          [id]: { ...window, minimized: true },
        },
        activeWindowId: state.activeWindowId === id ? null : state.activeWindowId,
      };
    });
  },

  restoreWindow: (id) => {
    set((state) => {
      const window = state.windows[id];
      if (!window) return state;

      return {
        windows: {
          ...state.windows,
          [id]: { ...window, minimized: false, zIndex: state.maxZIndex + 1 },
        },
        activeWindowId: id,
        maxZIndex: state.maxZIndex + 1,
      };
    });
  },

  setWindowPosition: (id, x, y) => {
    set((state) => {
      const window = state.windows[id];
      if (!window) return state;

      return {
        windows: {
          ...state.windows,
          [id]: { ...window, position: { x, y } },
        },
      };
    });
  },

  setWindowSize: (id, width, height) => {
    set((state) => {
      const window = state.windows[id];
      if (!window) return state;

      return {
        windows: {
          ...state.windows,
          [id]: { ...window, size: { width, height } },
        },
      };
    });
  },

  dockWindow: (id, position) => {
    set((state) => {
      const win = state.windows[id];
      if (!win) return state;

      const viewW = globalThis.innerWidth;
      const viewH = globalThis.innerHeight;

      let newPosition = { ...win.position };
      let newSize = { ...win.size };

      if (position === 'left') {
        newPosition = { x: 0, y: 60 };
        newSize = { width: win.size.width, height: viewH - 60 - 40 };
      } else if (position === 'right') {
        newPosition = { x: viewW - win.size.width, y: 60 };
        newSize = { width: win.size.width, height: viewH - 60 - 40 };
      } else if (position === 'top') {
        newPosition = { x: 0, y: 60 };
        newSize = { width: viewW, height: 200 };
      }

      return {
        windows: {
          ...state.windows,
          [id]: { ...win, docked: position, position: newPosition, size: newSize },
        },
      };
    });
  },

  updateWindowData: (id, data) => {
    set((state) => {
      const window = state.windows[id];
      if (!window) return state;

      return {
        windows: {
          ...state.windows,
          [id]: { ...window, data: { ...window.data, ...data } },
        },
      };
    });
  },

  loadWorkspace: (preset) => {
    // Close all windows first
    get().closeAll();

    set({ currentWorkspace: preset });

    // Load preset-specific windows
    switch (preset) {
      case 'exploration':
        get().openWindow('overview', undefined, { x: 20, y: 80 });
        get().dockWindow(get().taskbarOrder[0], 'left');
        get().openWindow('stats', undefined, { x: window.innerWidth - 240, y: 80 });
        break;

      case 'editing':
        get().openWindow('hierarchy', undefined, { x: 20, y: 80 });
        get().dockWindow(get().taskbarOrder[0], 'left');
        get().openWindow('planetEditor');
        const editorId = get().taskbarOrder[1];
        get().dockWindow(editorId, 'right');
        break;

      case 'generation':
        get().openWindow('generator', undefined, { x: 50, y: 80 });
        break;

      case 'custom':
        get().loadCustomWorkspace();
        break;
    }
  },

  saveCustomWorkspace: () => {
    const state = get();
    const workspaceData = {
      windows: state.windows,
      taskbarOrder: state.taskbarOrder,
    };
    localStorage.setItem('solarSystemCustomWorkspace', JSON.stringify(workspaceData));
  },

  loadCustomWorkspace: () => {
    const saved = localStorage.getItem('solarSystemCustomWorkspace');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        set({
          windows: data.windows || {},
          taskbarOrder: data.taskbarOrder || [],
          currentWorkspace: 'custom',
        });
      } catch (e) {
        console.error('Failed to load custom workspace:', e);
      }
    }
  },

  getWindowByType: (type) => {
    const state = get();
    return Object.values(state.windows).find(w => w.type === type) || null;
  },

  bringToFront: (id) => {
    get().focusWindow(id);
  },

  closeAll: () => {
    set({
      windows: {},
      activeWindowId: null,
      taskbarOrder: [],
    });
  },
}));

