import { useEffect, useState, useCallback } from 'react';
import { Scene } from './components/Scene';
import { AppHeader } from './components/AppHeader';
import { WindowManager } from './components/WindowManager';
import { Taskbar } from './components/Taskbar';
import { ModeSelectionScreen } from './components/ModeSelectionScreen';
import { UniverseBrowser } from './components/UniverseBrowser';
import { useSystemStore } from './state/systemStore';
import { useWindowStore } from './state/windowStore';
import { useAppModeStore } from './state/appModeStore';
import { useOnlineSessionStore } from './state/onlineSessionStore';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { useRemoteCommandStream } from './hooks/useRemoteCommandStream';
import { RemoteCommandToast } from './components/RemoteCommandToast';
import { universeApiClient } from './infra/api/universeApiClientProvider';
import { emptyUniverseState } from './domain/universe/state';
import type { ApiUniverse } from './app/ports/universeApiClient';
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

  // Connect to the SSE command stream when in online mode (editing a universe)
  const mode = useAppModeStore((state) => state.mode);
  const currentUniverseId = useOnlineSessionStore((state) => state.currentUniverseId);
  useRemoteCommandStream(mode === 'online' ? currentUniverseId : null);

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
      <RemoteCommandToast />
      <Taskbar />
    </div>
  );
}

/**
 * Online-mode universe browser — fetches universes from the mock API
 * and wires load/delete/create actions.
 */
function OnlineBrowser() {
  const [universes, setUniverses] = useState<ApiUniverse[]>([]);
  const [loading, setLoading] = useState(true);

  const clearMode = useAppModeStore((state) => state.clearMode);
  const enterEditor = useOnlineSessionStore((state) => state.enterEditor);
  const resetSession = useOnlineSessionStore((state) => state.resetSession);
  const replaceUniverseSnapshot = useSystemStore((state) => state.replaceUniverseSnapshot);

  const fetchUniverses = useCallback(async () => {
    setLoading(true);
    try {
      const list = await universeApiClient.list();
      setUniverses(list);
    } catch (err) {
      console.error('Failed to fetch universes:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUniverses();
  }, [fetchUniverses]);

  const handleLoad = useCallback(async (id: string) => {
    try {
      const universe = await universeApiClient.getById(id);
      if (!universe) {
        console.error('Universe not found:', id);
        return;
      }

      // Cast the generic state blob to the expected snapshot shape
      const state = universe.state as unknown as ReturnType<typeof emptyUniverseState>;
      replaceUniverseSnapshot({
        stars: state.stars ?? {},
        rootIds: state.rootIds ?? [],
        groups: state.groups ?? {},
        rootGroupIds: state.rootGroupIds ?? [],
        belts: state.belts ?? {},
        smallBodyFields: state.smallBodyFields ?? {},
        protoplanetaryDisks: state.protoplanetaryDisks ?? {},
        nebulae: state.nebulae ?? {},
      });

      enterEditor(universe.id, universe.name);
    } catch (err) {
      console.error('Failed to load universe:', err);
    }
  }, [replaceUniverseSnapshot, enterEditor]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await universeApiClient.delete(id);
      await fetchUniverses();
    } catch (err) {
      console.error('Failed to delete universe:', err);
    }
  }, [fetchUniverses]);

  const handleCreate = useCallback(async () => {
    const name = window.prompt('Universe name:', 'New Universe');
    if (!name) return;

    try {
      const empty = emptyUniverseState();
      const created = await universeApiClient.create({
        name,
        state: empty as unknown as Record<string, unknown>,
      });

      replaceUniverseSnapshot({
        stars: empty.stars,
        rootIds: empty.rootIds,
        groups: empty.groups,
        rootGroupIds: empty.rootGroupIds,
        belts: empty.belts,
        smallBodyFields: empty.smallBodyFields,
        protoplanetaryDisks: empty.protoplanetaryDisks,
        nebulae: empty.nebulae,
      });

      enterEditor(created.id, created.name);
    } catch (err) {
      console.error('Failed to create universe:', err);
    }
  }, [replaceUniverseSnapshot, enterEditor]);

  const handleBack = useCallback(() => {
    resetSession();
    clearMode();
  }, [resetSession, clearMode]);

  return (
    <UniverseBrowser
      universes={universes}
      loading={loading}
      onLoad={handleLoad}
      onDelete={handleDelete}
      onCreate={handleCreate}
      onBack={handleBack}
    />
  );
}

function App() {
  const mode = useAppModeStore((state) => state.mode);
  const setMode = useAppModeStore((state) => state.setMode);
  const phase = useOnlineSessionStore((state) => state.phase);

  if (mode === null) {
    return <ModeSelectionScreen onSelect={setMode} />;
  }

  if (mode === 'online' && phase === 'browsing') {
    return <OnlineBrowser />;
  }

  return <AppContent />;
}

export default App;
