import React, { useState, useCallback, useRef } from 'react';
import { useSystemStore } from '../state/systemStore';
import { useUiStore } from '../state/uiStore';
import { useWindowStore } from '../state/windowStore';
import { useAppModeStore } from '../state/appModeStore';
import { useOnlineSessionStore } from '../state/onlineSessionStore';
import { universeApiClient } from '../infra/api/universeApiClientProvider';
import { ConnectionStatusIndicator } from './ConnectionStatusIndicator';
import './AppHeader.css';

type SaveStatus = 'idle' | 'saving' | 'saved';

export const AppHeader: React.FC = () => {
  const timeScale = useSystemStore((state) => state.timeScale);
  const setTimeScale = useSystemStore((state) => state.setTimeScale);
  const cameraMode = useUiStore((state) => state.cameraMode);
  const cameraTargetBodyId = useUiStore((state) => state.cameraTargetBodyId);
  const stars = useSystemStore((state) => state.stars);
  const resetCamera = useUiStore((state) => state.resetCamera);
  const openWindow = useWindowStore((state) => state.openWindow);
  const [showSpeedDropdown, setShowSpeedDropdown] = useState(false);

  // Online-mode state
  const mode = useAppModeStore((state) => state.mode);
  const currentUniverseId = useOnlineSessionStore((state) => state.currentUniverseId);
  const currentUniverseName = useOnlineSessionStore((state) => state.currentUniverseName);
  const exitEditor = useOnlineSessionStore((state) => state.exitEditor);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isOnline = mode === 'online';

  const targetStar = cameraTargetBodyId ? stars[cameraTargetBodyId] : null;

  const getSpeedLabel = (value: number): string => {
    if (value === 0) return 'PAUSED';
    if (value < 0.5) return 'Very Slow';
    if (value < 1) return 'Slow';
    if (value === 1) return 'NORMAL';
    if (value <= 2) return 'Fast';
    if (value <= 5) return 'Very Fast';
    if (value <= 10) return 'Ultra Fast';
    if (value <= 20) return 'Extreme';
    if (value <= 30) return 'Ludicrous';
    return 'HYPERSPEED';
  };

  const handleSpeedPreset = (value: number) => {
    setTimeScale(value);
    setShowSpeedDropdown(false);
  };

  const handleSpeedClick = () => {
    setShowSpeedDropdown(!showSpeedDropdown);
  };

  const handleSave = useCallback(async () => {
    if (!currentUniverseId || saveStatus === 'saving') return;

    // Clear any pending "saved" timer
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }

    setSaveStatus('saving');

    try {
      const state = useSystemStore.getState();
      await universeApiClient.update(currentUniverseId, {
        state: {
          stars: state.stars,
          rootIds: state.rootIds,
          groups: state.groups,
          rootGroupIds: state.rootGroupIds,
          belts: state.belts,
          smallBodyFields: state.smallBodyFields,
          protoplanetaryDisks: state.protoplanetaryDisks,
          nebulae: state.nebulae,
        } as unknown as Record<string, unknown>,
      });

      setSaveStatus('saved');
      saveTimerRef.current = setTimeout(() => {
        setSaveStatus('idle');
        saveTimerRef.current = null;
      }, 2000);
    } catch (err) {
      console.error('Failed to save universe:', err);
      setSaveStatus('idle');
    }
  }, [currentUniverseId, saveStatus]);

  const handleBackToUniverses = useCallback(() => {
    exitEditor();
  }, [exitEditor]);

  const getSaveButtonLabel = (): string => {
    switch (saveStatus) {
      case 'saving': return '⏳ Saving…';
      case 'saved': return '✅ Saved';
      default: return '💾 Save';
    }
  };

  return (
    <div className="app-header-new">
      <div className="header-left">
        {/* Online-mode: Back to Universes button */}
        {isOnline && (
          <button
            className="header-btn header-btn-back"
            onClick={handleBackToUniverses}
            title="Back to Universe Browser"
          >
            📋 Universes
          </button>
        )}

        {/* Online-mode: Universe name label */}
        {isOnline && currentUniverseName && (
          <span className="header-universe-name" title={currentUniverseName}>
            {currentUniverseName}
          </span>
        )}

        {/* Online-mode: SSE connection status indicator */}
        {isOnline && <ConnectionStatusIndicator />}

        <div className="speed-control-compact" onClick={handleSpeedClick}>
          <span className="speed-icon">⏱️</span>
          <span className="speed-value">{timeScale.toFixed(2)}x</span>
          <span className={`speed-label ${timeScale === 0 ? 'paused' : timeScale > 30 ? 'hyperspeed' : ''}`}>
            {getSpeedLabel(timeScale)}
          </span>
          <span className="speed-dropdown-arrow">▼</span>
        </div>

        {showSpeedDropdown && (
          <>
            <div className="speed-dropdown-overlay" onClick={() => setShowSpeedDropdown(false)} />
            <div className="speed-dropdown">
              <div className="speed-dropdown-header">Simulation Speed</div>
              
              <div className="speed-slider-container">
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="0.1"
                  value={timeScale}
                  onChange={(e) => setTimeScale(parseFloat(e.target.value))}
                  className="speed-slider"
                />
                <div className="speed-slider-labels">
                  <span>0</span>
                  <span>1</span>
                  <span>10</span>
                  <span>25</span>
                  <span>50</span>
                </div>
              </div>

              <div className="speed-presets">
                <button onClick={() => handleSpeedPreset(0)} className={timeScale === 0 ? 'active' : ''}>
                  ⏸️ Pause
                </button>
                <button onClick={() => handleSpeedPreset(0.5)}>0.5x</button>
                <button onClick={() => handleSpeedPreset(1)} className={timeScale === 1 ? 'active' : ''}>
                  1x
                </button>
                <button onClick={() => handleSpeedPreset(5)}>5x</button>
                <button onClick={() => handleSpeedPreset(10)}>10x</button>
                <button onClick={() => handleSpeedPreset(20)}>20x</button>
                <button onClick={() => handleSpeedPreset(50)}>50x 🚀</button>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="header-center">
        <h1 className="app-title">Nested Solar System Constructor</h1>
      </div>

      <div className="header-right">
        <button 
          className="header-btn"
          onClick={() => openWindow('generator')}
          title="Open Generator"
        >
          🌌 Generate
        </button>

        {/* Online-mode: Save button */}
        {isOnline && (
          <button
            className={`header-btn header-btn-save ${saveStatus === 'saved' ? 'saved' : ''}`}
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            title="Save universe to server"
          >
            {getSaveButtonLabel()}
          </button>
        )}
      </div>

      {/* Camera Mode Indicator */}
      {cameraMode === 'body' && targetStar && (
        <div className="camera-mode-indicator-header">
          <div className="indicator-content">
            <span className="indicator-icon">👁️</span>
            <span className="indicator-text">
              Viewing from: <strong>{targetStar.name}</strong>
            </span>
            <button className="indicator-close" onClick={resetCamera} title="Exit body view">
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
