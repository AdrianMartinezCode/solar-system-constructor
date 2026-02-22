import React, { useState, useEffect } from 'react';
import { useSystemStore } from '../state/systemStore';
import './StatsPanel.css';

export const StatsPanel: React.FC = () => {
  const stars = useSystemStore((state) => state.stars);
  const groups = useSystemStore((state) => state.groups);
  const protoplanetaryDisks = useSystemStore((state) => state.protoplanetaryDisks);
  const timeScale = useSystemStore((state) => state.timeScale);
  const time = useSystemStore((state) => state.time);
  
  const [fps, setFps] = useState(60);
  const [frameTime, setFrameTime] = useState(16.7);

  useEffect(() => {
    let lastTime = performance.now();
    let frameCount = 0;
    let fpsUpdateTime = lastTime;

    const measureFps = () => {
      const now = performance.now();
      const delta = now - lastTime;
      lastTime = now;
      frameCount++;

      setFrameTime(delta);

      if (now - fpsUpdateTime >= 1000) {
        setFps(frameCount);
        frameCount = 0;
        fpsUpdateTime = now;
      }

      requestAnimationFrame(measureFps);
    };

    const rafId = requestAnimationFrame(measureFps);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const starCount = Object.keys(stars).length;
  const rootStars = Object.values(stars).filter(s => !s.parentId).length;
  const planets = Object.values(stars).filter(s => s.parentId).length;
  const groupCount = Object.keys(groups).length;
  const diskCount = Object.keys(protoplanetaryDisks).length;
  const totalDiskParticles = Object.values(protoplanetaryDisks).reduce(
    (sum, disk) => sum + disk.particleCount, 0
  );

  const getTimeLabel = (scale: number): string => {
    if (scale === 0) return 'PAUSED';
    if (scale === 1) return 'NORMAL';
    if (scale > 30) return 'HYPERSPEED';
    return 'ACTIVE';
  };

  const formatSimTime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  return (
    <div className="stats-panel">
      <div className="stats-section">
        <div className="stats-section-title">Performance</div>
        <div className="stat-row">
          <span className="stat-label">FPS:</span>
          <span className={`stat-value ${fps < 30 ? 'warning' : fps < 50 ? 'caution' : 'good'}`}>
            {fps}
          </span>
          <span className="stat-unit">({frameTime.toFixed(1)}ms)</span>
        </div>
      </div>

      <div className="stats-section">
        <div className="stats-section-title">Scene</div>
        <div className="stat-row">
          <span className="stat-label">Objects:</span>
          <span className="stat-value">{starCount}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Stars:</span>
          <span className="stat-value">{rootStars}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Planets:</span>
          <span className="stat-value">{planets}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Groups:</span>
          <span className="stat-value">{groupCount}</span>
        </div>
        {diskCount > 0 && (
          <>
            <div className="stat-row">
              <span className="stat-label">💿 Disks:</span>
              <span className="stat-value">{diskCount}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Particles:</span>
              <span className="stat-value">{totalDiskParticles.toLocaleString()}</span>
            </div>
          </>
        )}
      </div>

      <div className="stats-section">
        <div className="stats-section-title">Simulation</div>
        <div className="stat-row">
          <span className="stat-label">Time:</span>
          <span className="stat-value">{timeScale.toFixed(2)}x</span>
          <span className={`stat-badge ${timeScale === 0 ? 'paused' : ''}`}>
            {getTimeLabel(timeScale)}
          </span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Elapsed:</span>
          <span className="stat-value">{formatSimTime(time)}</span>
        </div>
      </div>

      <div className="stats-actions">
        <button 
          className="stats-btn"
          onClick={() => {
            const data = {
              fps,
              frameTime,
              objects: starCount,
              stars: rootStars,
              planets,
              groups: groupCount,
              protoplanetaryDisks: diskCount,
              diskParticles: totalDiskParticles,
              timeScale,
              simulationTime: time,
            };
            console.log('Stats:', data);
            navigator.clipboard?.writeText(JSON.stringify(data, null, 2));
          }}
        >
          📋 Copy Stats
        </button>
      </div>
    </div>
  );
};

