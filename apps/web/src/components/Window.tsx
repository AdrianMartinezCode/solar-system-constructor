import React, { useRef, useState, useEffect } from 'react';
import { useWindowStore, WindowState } from '../state/windowStore';
import './Window.css';

interface WindowProps {
  window: WindowState;
  children: React.ReactNode;
}

export const Window: React.FC<WindowProps> = ({ window, children }) => {
  const dragRef = useRef<HTMLDivElement>(null);
  const windowRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const closeWindow = useWindowStore((state) => state.closeWindow);
  const minimizeWindow = useWindowStore((state) => state.minimizeWindow);
  const focusWindow = useWindowStore((state) => state.focusWindow);
  const setWindowPosition = useWindowStore((state) => state.setWindowPosition);
  const setWindowSize = useWindowStore((state) => state.setWindowSize);
  const dockWindow = useWindowStore((state) => state.dockWindow);
  const activeWindowId = useWindowStore((state) => state.activeWindowId);

  const isActive = activeWindowId === window.id;

  // Handle dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      
      const newX = window.position.x + deltaX;
      const newY = window.position.y + deltaY;
      
      setWindowPosition(window.id, newX, newY);
      setDragStart({ x: e.clientX, y: e.clientY });
      
      // Check for docking zones
      checkDockingZones(e.clientX, e.clientY);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      // Finalize docking if in zone
      finalizeDocking();
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, window.id, window.position]);

  // Handle resizing
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;
      
      const newWidth = Math.max(250, resizeStart.width + deltaX);
      const newHeight = Math.max(200, resizeStart.height + deltaY);
      
      setWindowSize(window.id, newWidth, newHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStart, window.id]);

  const handleHeaderMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click
    if ((e.target as HTMLElement).closest('.window-controls')) return; // Don't drag when clicking controls
    
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    focusWindow(window.id);
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    setResizeStart({ 
      x: e.clientX, 
      y: e.clientY, 
      width: window.size.width, 
      height: window.size.height 
    });
  };

  const checkDockingZones = (x: number, y: number) => {
    // Show visual feedback for docking zones
    const dockZoneSize = 50;
    
    if (x < dockZoneSize) {
      document.body.classList.add('dock-left-active');
    } else if (x > globalThis.innerWidth - dockZoneSize) {
      document.body.classList.add('dock-right-active');
    } else if (y < dockZoneSize + 60) {
      document.body.classList.add('dock-top-active');
    } else {
      document.body.classList.remove('dock-left-active', 'dock-right-active', 'dock-top-active');
    }
  };

  const finalizeDocking = () => {
    const hasDockClass = document.body.classList.contains('dock-left-active') ||
                        document.body.classList.contains('dock-right-active') ||
                        document.body.classList.contains('dock-top-active');
    
    if (document.body.classList.contains('dock-left-active')) {
      dockWindow(window.id, 'left');
    } else if (document.body.classList.contains('dock-right-active')) {
      dockWindow(window.id, 'right');
    } else if (document.body.classList.contains('dock-top-active')) {
      dockWindow(window.id, 'top');
    } else if (window.docked && !hasDockClass) {
      // Undock if was docked
      dockWindow(window.id, null);
    }
    
    document.body.classList.remove('dock-left-active', 'dock-right-active', 'dock-top-active');
  };

  const handleWindowClick = () => {
    if (!isActive) {
      focusWindow(window.id);
    }
  };

  if (window.minimized) {
    return null;
  }

  const style: React.CSSProperties = {
    left: window.position.x,
    top: window.position.y,
    width: window.size.width,
    height: window.size.height,
    zIndex: window.zIndex,
  };

  return (
    <div
      ref={windowRef}
      className={`window ${isActive ? 'window-active' : ''} ${window.docked ? `window-docked-${window.docked}` : ''}`}
      style={style}
      onClick={handleWindowClick}
    >
      <div 
        ref={dragRef}
        className="window-header"
        onMouseDown={handleHeaderMouseDown}
      >
        <div className="window-title">
          <span className="window-icon">{getWindowIcon(window.type)}</span>
          <span>{window.title}</span>
        </div>
        <div className="window-controls">
          <button
            className="window-control-btn minimize-btn"
            onClick={() => minimizeWindow(window.id)}
            title="Minimize"
            aria-label="Minimize window"
          >
            ━
          </button>
          <button
            className="window-control-btn close-btn"
            onClick={() => closeWindow(window.id)}
            title="Close"
            aria-label="Close window"
          >
            ✕
          </button>
        </div>
      </div>
      
      <div className="window-content">
        {children}
      </div>
      
      {!window.docked && (
        <div 
          className="window-resize-handle"
          onMouseDown={handleResizeMouseDown}
        />
      )}
    </div>
  );
};

function getWindowIcon(type: string): string {
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

