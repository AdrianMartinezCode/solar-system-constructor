import { useEffect } from 'react';
import { Scene } from './components/Scene';
import { AppHeader } from './components/AppHeader';
import { WindowManager } from './components/WindowManager';
import { Taskbar } from './components/Taskbar';
import { ModeSelectionScreen } from './components/ModeSelectionScreen';
import { useSystemStore } from './state/systemStore';
import { useWindowStore } from './state/windowStore';
import { useAppModeStore } from './state/appModeStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import './App.css';

/**
 * Main app content — only mounted after the user has selected a mode.
 * This ensures hooks (keyboard shortcuts, data loading) only activate
 * once the mode selection gate has been passed.
 */
function AppContent() {
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

function App() {
  const mode = useAppModeStore((state) => state.mode);
  const setMode = useAppModeStore((state) => state.setMode);

  if (mode === null) {
    return <ModeSelectionScreen onSelect={setMode} />;
  }

  return <AppContent />;
}

export default App;
