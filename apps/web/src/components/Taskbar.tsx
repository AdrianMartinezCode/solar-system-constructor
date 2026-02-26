import React from 'react';
import { useWindowStore, WindowType } from '../state/windowStore';
import './Taskbar.css';

const windowTypeLabels: Record<WindowType, string> = {
  speed: '⏱️ Speed',
  overview: '🌌 Overview',
  hierarchy: '🌳 Hierarchy',
  generator: '🌌 Generator',
  planetEditor: '🌍 Editor',
  groupEditor: '📁 Groups',
  nebulaEditor: '🌫️ Nebula',
  stats: '📊 Stats',
  starList: '⭐ Stars',
};

export const Taskbar: React.FC = () => {
  const windows = useWindowStore((state) => state.windows);
  const taskbarOrder = useWindowStore((state) => state.taskbarOrder);
  const activeWindowId = useWindowStore((state) => state.activeWindowId);
  const openWindow = useWindowStore((state) => state.openWindow);
  const restoreWindow = useWindowStore((state) => state.restoreWindow);
  const focusWindow = useWindowStore((state) => state.focusWindow);
  const closeWindow = useWindowStore((state) => state.closeWindow);
  const loadWorkspace = useWindowStore((state) => state.loadWorkspace);

  const handleTaskbarButtonClick = (windowId: string) => {
    const window = windows[windowId];
    if (!window) return;

    if (window.minimized) {
      restoreWindow(windowId);
    } else if (activeWindowId === windowId) {
      // If already active, minimize it
      useWindowStore.getState().minimizeWindow(windowId);
    } else {
      focusWindow(windowId);
    }
  };

  const handleOpenWindow = (type: WindowType) => {
    // Check if already open
    const existing = Object.values(windows).find(w => w.type === type);
    if (existing) {
      if (existing.minimized) {
        restoreWindow(existing.id);
      } else {
        focusWindow(existing.id);
      }
    } else {
      openWindow(type);
    }
  };

  const availableWindowTypes: WindowType[] = ['generator', 'overview', 'hierarchy', 'planetEditor', 'groupEditor', 'stats'];
  const openWindowTypes = new Set(Object.values(windows).map(w => w.type));

  return (
    <div className="taskbar">
      <div className="taskbar-left">
        {/* Quick open buttons for closed windows */}
        {availableWindowTypes.map(type => {
          const isOpen = openWindowTypes.has(type);
          if (isOpen) return null;
          
          return (
            <button
              key={type}
              className="taskbar-quick-btn"
              onClick={() => handleOpenWindow(type)}
              title={`Open ${windowTypeLabels[type]}`}
            >
              {windowTypeLabels[type]}
            </button>
          );
        })}
        
        {/* Workspace presets */}
        <div className="taskbar-divider" />
        <div className="workspace-selector">
          <select 
            className="workspace-select"
            onChange={(e) => loadWorkspace(e.target.value as any)}
            defaultValue="exploration"
          >
            <option value="exploration">🔭 Exploration</option>
            <option value="editing">✏️ Editing</option>
            <option value="generation">🌌 Generation</option>
            <option value="custom">💾 Custom</option>
          </select>
        </div>
      </div>

      <div className="taskbar-center">
        {/* Open window buttons */}
        {taskbarOrder.map(windowId => {
          const window = windows[windowId];
          if (!window) return null;

          const isActive = activeWindowId === windowId;
          const isMinimized = window.minimized;

          return (
            <button
              key={windowId}
              className={`taskbar-window-btn ${isActive ? 'active' : ''} ${isMinimized ? 'minimized' : ''}`}
              onClick={() => handleTaskbarButtonClick(windowId)}
              title={window.title}
            >
              <span className="taskbar-window-icon">{getWindowIcon(window.type)}</span>
              <span className="taskbar-window-label">{getShortLabel(window)}</span>
              <span
                role="button"
                tabIndex={0}
                className="taskbar-window-close"
                onClick={(e) => {
                  e.stopPropagation();
                  closeWindow(windowId);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    closeWindow(windowId);
                  }
                }}
                title="Close"
              >
                ✕
              </span>
            </button>
          );
        })}
      </div>

      <div className="taskbar-right">
        <div className="taskbar-info">
          {Object.keys(windows).length} window{Object.keys(windows).length !== 1 ? 's' : ''} open
        </div>
      </div>
    </div>
  );
};

function getWindowIcon(type: WindowType): string {
  switch (type) {
    case 'speed': return '⏱️';
    case 'overview': return '🌌';
    case 'hierarchy': return '🌳';
    case 'generator': return '🌌';
    case 'planetEditor': return '🌍';
    case 'groupEditor': return '📁';
    case 'stats': return '📊';
    case 'starList': return '⭐';
    default: return '📄';
  }
}

function getShortLabel(window: any): string {
  if (window.type === 'planetEditor' && window.data?.name) {
    return window.data.name;
  }
  return windowTypeLabels[window.type as WindowType] || window.title;
}

