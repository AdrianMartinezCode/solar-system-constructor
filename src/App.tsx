import React, { useEffect } from 'react';
import { Scene } from './components/Scene';
import { AppHeader } from './components/AppHeader';
import { WindowManager } from './components/WindowManager';
import { Taskbar } from './components/Taskbar';
import { useSystemStore } from './state/systemStore';
import { useWindowStore } from './state/windowStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import './App.css';

function App() {
  const load = useSystemStore((state) => state.load);
  const loadWorkspace = useWindowStore((state) => state.loadWorkspace);
  
  // Initialize keyboard shortcuts
  useKeyboardShortcuts();
  
  useEffect(() => {
    // Load system on mount
    load();
    
    // Load default workspace
    loadWorkspace('exploration');
  }, [load, loadWorkspace]);
  
  return (
    <div className="app-windowed">
      <AppHeader />
      
      <div className="scene-container-windowed">
        <Scene />
        
        <div className="controls-hint-windowed">
          <div className="hint-item">🖱️ Left Click + Drag: Rotate</div>
          <div className="hint-item">🖱️ Right Click + Drag: Pan</div>
          <div className="hint-item">🖱️ Scroll: Zoom</div>
          <div className="hint-item">🖱️ Click Object: Select</div>
        </div>
      </div>
      
      <WindowManager />
      <Taskbar />
    </div>
  );
}

export default App;
