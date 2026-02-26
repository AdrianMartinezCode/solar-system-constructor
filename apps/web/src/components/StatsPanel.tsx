/**
 * Analytics-grade Stats Panel with comprehensive metrics and visualizations
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useSystemStore } from '../state/systemStore';
import { useUiStore } from '../state/uiStore';
import { usePerformanceTelemetry } from '../hooks/usePerformanceTelemetry';
import {
  getGlobalPerformanceBuffer,
  PerformanceSnapshot,
} from '../utils/stats/performanceTelemetry';
import {
  computePopulationCounts,
  computeBlackHoleStats,
  computeSemiMajorAxisDistribution,
  computeEccentricityDistribution,
  computeInclinationDistribution,
  computeMassDistribution,
  createOrbitalScatterData,
  computeRoguePlanetStats,
  computeGroupMetrics,
} from '../utils/stats/computeStats';
import { getGenerationMetadata } from '../utils/stats/generationMetadataCache';
import { Sparkline } from './charts/Sparkline';
import { Histogram } from './charts/Histogram';
import { DonutChart, DonutSegment } from './charts/DonutChart';
import { ScatterPlot } from './charts/ScatterPlot';
import './StatsPanel.css';

type TabType = 'overview' | 'performance' | 'population' | 'orbits' | 'specials' | 'generation';
type ContextType = 'global' | 'isolated' | 'selected';

export const StatsPanel: React.FC = () => {
  const stars = useSystemStore((state) => state.stars);
  const groups = useSystemStore((state) => state.groups);
  const protoplanetaryDisks = useSystemStore((state) => state.protoplanetaryDisks);
  const smallBodyFields = useSystemStore((state) => state.smallBodyFields);
  const nebulae = useSystemStore((state) => state.nebulae);
  const timeScale = useSystemStore((state) => state.timeScale);
  const time = useSystemStore((state) => state.time);
  const isolatedGroupId = useUiStore((state) => state.isolatedGroupId);
  const selectedStarId = useSystemStore((state) => state.selectedStarId);

  const { webglStats } = usePerformanceTelemetry();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [context, setContext] = useState<ContextType>('global');
  const [fps, setFps] = useState(60);
  const [frameTime, setFrameTime] = useState(16.7);
  const [perfHistory, setPerfHistory] = useState<PerformanceSnapshot[]>([]);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // FPS measurement
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

        // Add to performance buffer
        const buffer = getGlobalPerformanceBuffer();
        buffer.add({
          timestamp: now,
          fps: frameCount,
          frameTime: delta,
        });
      }

      requestAnimationFrame(measureFps);
    };

    const rafId = requestAnimationFrame(measureFps);
    return () => cancelAnimationFrame(rafId);
  }, []);

  // Update performance history periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const buffer = getGlobalPerformanceBuffer();
      setPerfHistory(buffer.getLast(60)); // Last 60 samples
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Compute filter set based on context
  const filterIds = useMemo(() => {
    if (context === 'global') return undefined;
    
    if (context === 'isolated' && isolatedGroupId) {
      // Get all star IDs in isolated group
      const group = groups[isolatedGroupId];
      if (!group) return undefined;

      const collectSystemStars = (rootId: string): string[] => {
        const ids = [rootId];
        const star = stars[rootId];
        if (star?.children) {
          star.children.forEach((childId: string) => {
            ids.push(...collectSystemStars(childId));
          });
        }
        return ids;
      };

      const starIds = new Set<string>();
      group.children.forEach((child: { id: string; type: string }) => {
        if (child.type === 'system') {
          collectSystemStars(child.id).forEach(id => starIds.add(id));
        }
      });
      return starIds;
    }

    if (context === 'selected' && selectedStarId) {
      // Get selected body and its hierarchy
      const selected = stars[selectedStarId];
      if (!selected) return undefined;

      // Find root of this system
      let root = selected;
      while (root.parentId && stars[root.parentId]) {
        root = stars[root.parentId];
      }

      // Collect all IDs in this system
      const collectSystemStars = (id: string): string[] => {
        const ids = [id];
        const star = stars[id];
        if (star?.children) {
          star.children.forEach((childId: string) => {
            ids.push(...collectSystemStars(childId));
          });
        }
        return ids;
      };

      return new Set(collectSystemStars(root.id));
    }

    return undefined;
  }, [context, isolatedGroupId, selectedStarId, stars, groups]);

  // Compute all stats
  const popCounts = useMemo(
    () => computePopulationCounts(stars, groups, protoplanetaryDisks, smallBodyFields, nebulae, filterIds),
    [stars, groups, protoplanetaryDisks, smallBodyFields, nebulae, filterIds]
  );

  const blackHoleStats = useMemo(
    () => computeBlackHoleStats(stars, filterIds),
    [stars, filterIds]
  );

  const semiMajorAxisDist = useMemo(
    () => computeSemiMajorAxisDistribution(stars, filterIds),
    [stars, filterIds]
  );

  const eccentricityDist = useMemo(
    () => computeEccentricityDistribution(stars, filterIds),
    [stars, filterIds]
  );

  const inclinationDist = useMemo(
    () => computeInclinationDistribution(stars, filterIds),
    [stars, filterIds]
  );

  const massDist = useMemo(
    () => computeMassDistribution(stars, filterIds),
    [stars, filterIds]
  );

  const orbitalScatter = useMemo(
    () => createOrbitalScatterData(stars, filterIds),
    [stars, filterIds]
  );

  const roguePlanetStats = useMemo(
    () => computeRoguePlanetStats(stars, filterIds),
    [stars, filterIds]
  );

  const groupMetrics = useMemo(
    () => computeGroupMetrics(groups, stars),
    [groups, stars]
  );

  const perfStats = useMemo(() => {
    const buffer = getGlobalPerformanceBuffer();
    return buffer.getStats();
  }, [perfHistory]);

  const generationMeta = getGenerationMetadata();

  // Helper functions
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

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const isSectionCollapsed = (sectionId: string) => collapsedSections.has(sectionId);

  // Export functions
  const exportJSON = () => {
    const data = {
      context,
      timestamp: new Date().toISOString(),
      performance: {
        currentFps: fps,
        currentFrameTime: frameTime,
        stats: perfStats,
        webgl: webglStats,
      },
      simulation: {
        time,
        timeScale,
      },
      population: popCounts,
      blackHoles: blackHoleStats,
      roguePlanets: roguePlanetStats,
      groups: groupMetrics,
      generation: generationMeta,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solar-system-stats-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const rows = [
      ['Metric', 'Value'],
      ['Context', context],
      ['FPS', fps.toString()],
      ['Frame Time (ms)', frameTime.toFixed(2)],
      ['Avg FPS', perfStats.avgFps.toFixed(1)],
      ['Min FPS', perfStats.minFps.toString()],
      ['Max FPS', perfStats.maxFps.toString()],
      ['P95 Frame Time', perfStats.p95FrameTime.toFixed(2)],
      ['Draw Calls', webglStats.drawCalls.toString()],
      ['Triangles', webglStats.triangles.toString()],
      ['Geometries', webglStats.geometries.toString()],
      ['Textures', webglStats.textures.toString()],
      [''],
      ['Total Objects', popCounts.total.toString()],
      ['Stars', popCounts.stars.toString()],
      ['Planets', popCounts.planets.toString()],
      ['Moons', popCounts.moons.toString()],
      ['Black Holes', popCounts.blackHoles.toString()],
      ['Rogue Planets', popCounts.roguePlanets.toString()],
      ['Groups', popCounts.groups.toString()],
    ];

    const csv = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `solar-system-stats-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    const data = {
      fps,
      frameTime,
      timeScale,
      simulationTime: time,
      population: popCounts,
      performance: perfStats,
      webgl: webglStats,
    };
    navigator.clipboard?.writeText(JSON.stringify(data, null, 2));
  };

  // Render different tabs
  const renderOverviewTab = () => (
    <div className="stats-tab-content">
      <div className="stats-section">
        <div className="stats-section-title">Quick Stats</div>
        <div className="stat-row">
          <span className="stat-label">FPS:</span>
          <span className={`stat-value ${fps < 30 ? 'warning' : fps < 50 ? 'caution' : 'good'}`}>
            {fps}
          </span>
          <span className="stat-unit">({frameTime.toFixed(1)}ms)</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Total Objects:</span>
          <span className="stat-value">{popCounts.total}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Stars:</span>
          <span className="stat-value">{popCounts.stars}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Planets:</span>
          <span className="stat-value">{popCounts.planets}</span>
        </div>
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

      {popCounts.totalParticles > 0 && (
        <div className="stats-section">
          <div className="stats-section-title">Particle Systems</div>
          <div className="stat-row">
            <span className="stat-label">Total Particles:</span>
            <span className="stat-value">{popCounts.totalParticles.toLocaleString()}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Disk Particles:</span>
            <span className="stat-value">{popCounts.totalDiskParticles.toLocaleString()}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Belt Particles:</span>
            <span className="stat-value">{popCounts.totalFieldParticles.toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );

  const renderPerformanceTab = () => (
    <div className="stats-tab-content">
      <div className="stats-section">
        <div className="stats-section-title">Real-time Performance</div>
        <div className="stat-row">
          <span className="stat-label">Current FPS:</span>
          <span className={`stat-value ${fps < 30 ? 'warning' : fps < 50 ? 'caution' : 'good'}`}>
            {fps}
          </span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Frame Time:</span>
          <span className="stat-value">{frameTime.toFixed(2)}ms</span>
        </div>
      </div>

      <div className="stats-section">
        <Sparkline
          data={perfHistory.map((s, i) => ({ x: i, y: s.fps }))}
          width={360}
          height={80}
          color="#50c878"
          title="FPS History"
          label="Last 60 seconds"
          showMinMax={true}
        />
      </div>

      <div className="stats-section">
        <Sparkline
          data={perfHistory.map((s, i) => ({ x: i, y: s.frameTime }))}
          width={360}
          height={80}
          color="#ffaa00"
          title="Frame Time History"
          label="Last 60 seconds (milliseconds)"
          showMinMax={true}
        />
      </div>

      <div className="stats-section">
        <div className="stats-section-title">Performance Statistics</div>
        <div className="stat-row">
          <span className="stat-label">Avg FPS:</span>
          <span className="stat-value">{perfStats.avgFps.toFixed(1)}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Min/Max FPS:</span>
          <span className="stat-value">{perfStats.minFps} / {perfStats.maxFps}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Avg Frame Time:</span>
          <span className="stat-value">{perfStats.avgFrameTime.toFixed(2)}ms</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">P95 Frame Time:</span>
          <span className="stat-value">{perfStats.p95FrameTime.toFixed(2)}ms</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">P99 Frame Time:</span>
          <span className="stat-value">{perfStats.p99FrameTime.toFixed(2)}ms</span>
        </div>
      </div>

      <div className="stats-section">
        <div className="stats-section-title">WebGL Renderer Stats</div>
        <div className="stat-row">
          <span className="stat-label">Draw Calls:</span>
          <span className="stat-value">{webglStats.drawCalls}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Triangles:</span>
          <span className="stat-value">{webglStats.triangles.toLocaleString()}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Geometries:</span>
          <span className="stat-value">{webglStats.geometries}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Textures:</span>
          <span className="stat-value">{webglStats.textures}</span>
        </div>
        <div className="stat-row">
          <span className="stat-label">Programs:</span>
          <span className="stat-value">{webglStats.programs}</span>
        </div>
      </div>
    </div>
  );

  const renderPopulationTab = () => {
    const bodyTypeData: DonutSegment[] = [
      { label: 'Stars', value: popCounts.stars, color: '#FFD700' },
      { label: 'Planets', value: popCounts.planets, color: '#4169E1' },
      { label: 'Moons', value: popCounts.moons, color: '#A9A9A9' },
      { label: 'Asteroids', value: popCounts.asteroids, color: '#8B7355' },
      { label: 'Comets', value: popCounts.comets, color: '#87CEEB' },
      { label: 'Black Holes', value: popCounts.blackHoles, color: '#000000' },
      { label: 'Rogues', value: popCounts.roguePlanets, color: '#9370DB' },
    ].filter(d => d.value > 0);

    const specialsData: DonutSegment[] = [
      { label: 'Rings', value: popCounts.ringedPlanets, color: '#F0E68C' },
      { label: 'Disks', value: popCounts.protoplanetaryDisks, color: '#DEB887' },
      { label: 'Belts', value: popCounts.smallBodyFields, color: '#CD853F' },
      { label: 'Nebulae', value: popCounts.nebulae, color: '#FF69B4' },
      { label: 'Lagrange', value: popCounts.lagrangePoints, color: '#20B2AA' },
      { label: 'Trojans', value: popCounts.trojans, color: '#8FBC8F' },
    ].filter(d => d.value > 0);

    return (
      <div className="stats-tab-content">
          <div className="stats-section">
            <div className="stats-section-title">Population by Type</div>
            {bodyTypeData.length > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                <DonutChart data={bodyTypeData} size={220} showLegend={true} />
              </div>
            )}
          </div>

          {specialsData.length > 0 && (
            <div className="stats-section">
              <div className="stats-section-title">Special Features</div>
              <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
                <DonutChart data={specialsData} size={220} showLegend={true} />
              </div>
            </div>
          )}

        <div className="stats-section">
          <div className="stats-section-title">Detailed Counts</div>
          <div className="stat-row">
            <span className="stat-label">Stars:</span>
            <span className="stat-value">{popCounts.stars}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Planets:</span>
            <span className="stat-value">{popCounts.planets}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Moons:</span>
            <span className="stat-value">{popCounts.moons}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Asteroids:</span>
            <span className="stat-value">{popCounts.asteroids}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Comets:</span>
            <span className="stat-value">{popCounts.comets}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Black Holes:</span>
            <span className="stat-value">{popCounts.blackHoles}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Rogue Planets:</span>
            <span className="stat-value">{popCounts.roguePlanets}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Groups:</span>
            <span className="stat-value">{popCounts.groups}</span>
          </div>
        </div>

        {popCounts.totalParticles > 0 && (
          <div className="stats-section">
            <div className="stats-section-title">Particle Totals</div>
            <div className="stat-row">
              <span className="stat-label">All Particles:</span>
              <span className="stat-value">{popCounts.totalParticles.toLocaleString()}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Disk Particles:</span>
              <span className="stat-value">{popCounts.totalDiskParticles.toLocaleString()}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Belt Particles:</span>
              <span className="stat-value">{popCounts.totalFieldParticles.toLocaleString()}</span>
            </div>
          </div>
        )}

        {groupMetrics.totalGroups > 0 && (
          <div className="stats-section">
            <div className="stats-section-title">Group Metrics</div>
            <div className="stat-row">
              <span className="stat-label">Total Groups:</span>
              <span className="stat-value">{groupMetrics.totalGroups}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Avg Systems/Group:</span>
              <span className="stat-value">{groupMetrics.avgSystemsPerGroup.toFixed(1)}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Max Depth:</span>
              <span className="stat-value">{groupMetrics.maxDepth}</span>
            </div>
            <div className="stat-row">
              <span className="stat-label">Largest Group:</span>
              <span className="stat-value">{groupMetrics.largestGroupSize} items</span>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOrbitsTab = () => (
    <div className="stats-tab-content">
      <div className="stats-section">
        <div className="stats-section-title-clickable" onClick={() => toggleSection('semiMajorAxis')}>
          Semi-Major Axis Distribution {isSectionCollapsed('semiMajorAxis') ? '▶' : '▼'}
        </div>
        {!isSectionCollapsed('semiMajorAxis') && semiMajorAxisDist.length > 0 && (
          <div style={{ padding: '10px 0' }}>
            <Histogram 
              data={semiMajorAxisDist} 
              width={380} 
              height={170} 
              title="Orbital Distance Distribution"
              xLabel="Semi-Major Axis"
              yLabel="Count"
            />
          </div>
        )}
      </div>

      <div className="stats-section">
        <div className="stats-section-title-clickable" onClick={() => toggleSection('eccentricity')}>
          Eccentricity Distribution {isSectionCollapsed('eccentricity') ? '▶' : '▼'}
        </div>
        {!isSectionCollapsed('eccentricity') && eccentricityDist.length > 0 && (
          <div style={{ padding: '10px 0' }}>
            <Histogram 
              data={eccentricityDist} 
              width={380} 
              height={170} 
              color="#ff6b9d"
              title="Orbit Shape Distribution"
              xLabel="Eccentricity (0 = circular, 1 = parabolic)"
              yLabel="Count"
            />
          </div>
        )}
      </div>

      <div className="stats-section">
        <div className="stats-section-title-clickable" onClick={() => toggleSection('inclination')}>
          Inclination Distribution {isSectionCollapsed('inclination') ? '▶' : '▼'}
        </div>
        {!isSectionCollapsed('inclination') && inclinationDist.length > 0 && (
          <div style={{ padding: '10px 0' }}>
            <Histogram 
              data={inclinationDist} 
              width={380} 
              height={170} 
              color="#50c878"
              title="Orbital Tilt Distribution"
              xLabel="Inclination (degrees)"
              yLabel="Count"
            />
          </div>
        )}
      </div>

      <div className="stats-section">
        <div className="stats-section-title-clickable" onClick={() => toggleSection('orbitalScatter')}>
          Semi-Major Axis vs Eccentricity {isSectionCollapsed('orbitalScatter') ? '▶' : '▼'}
        </div>
        {!isSectionCollapsed('orbitalScatter') && orbitalScatter.length > 0 && (
          <div style={{ padding: '10px 0' }}>
            <ScatterPlot
              data={orbitalScatter}
              width={380}
              height={220}
              title="Orbital Parameters"
              xLabel="Semi-Major Axis"
              yLabel="Eccentricity"
              showLegend={true}
              legendLabel="Orbiting Bodies"
            />
          </div>
        )}
      </div>

      <div className="stats-section">
        <div className="stats-section-title-clickable" onClick={() => toggleSection('massDistribution')}>
          Mass Distribution {isSectionCollapsed('massDistribution') ? '▶' : '▼'}
        </div>
        {!isSectionCollapsed('massDistribution') && massDist.length > 0 && (
          <div style={{ padding: '10px 0' }}>
            <Histogram 
              data={massDist} 
              width={380} 
              height={170} 
              color="#ffa500" 
              showLabels={false}
              title="Mass Distribution (Log Scale)"
              xLabel="Mass (logarithmic)"
              yLabel="Count"
            />
          </div>
        )}
      </div>
    </div>
  );

  const renderSpecialsTab = () => (
    <div className="stats-tab-content">
      {blackHoleStats.total > 0 && (
        <div className="stats-section">
          <div className="stats-section-title">Black Holes ({blackHoleStats.total})</div>
          <div className="stat-row">
            <span className="stat-label">With Disks:</span>
            <span className="stat-value">{blackHoleStats.withDisks}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">With Jets:</span>
            <span className="stat-value">{blackHoleStats.withJets}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">With Photon Rings:</span>
            <span className="stat-value">{blackHoleStats.withPhotonRings}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Avg Spin:</span>
            <span className="stat-value">{blackHoleStats.avgSpin.toFixed(3)}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Spin Range:</span>
            <span className="stat-value">
              {blackHoleStats.minSpin.toFixed(2)} - {blackHoleStats.maxSpin.toFixed(2)}
            </span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Stellar Mass:</span>
            <span className="stat-value">{blackHoleStats.stellarMass}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Intermediate Mass:</span>
            <span className="stat-value">{blackHoleStats.intermediateMass}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Supermassive:</span>
            <span className="stat-value">{blackHoleStats.supermassiveMass}</span>
          </div>
        </div>
      )}

      {popCounts.protoplanetaryDisks > 0 && (
        <div className="stats-section">
          <div className="stats-section-title">Protoplanetary Disks</div>
          <div className="stat-row">
            <span className="stat-label">Total Disks:</span>
            <span className="stat-value">{popCounts.protoplanetaryDisks}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Total Particles:</span>
            <span className="stat-value">{popCounts.totalDiskParticles.toLocaleString()}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Avg Particles/Disk:</span>
            <span className="stat-value">
              {(popCounts.totalDiskParticles / popCounts.protoplanetaryDisks).toFixed(0)}
            </span>
          </div>
        </div>
      )}

      {popCounts.smallBodyFields > 0 && (
        <div className="stats-section">
          <div className="stats-section-title">Small Body Belts</div>
          <div className="stat-row">
            <span className="stat-label">Total Belts:</span>
            <span className="stat-value">{popCounts.smallBodyFields}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Total Particles:</span>
            <span className="stat-value">{popCounts.totalFieldParticles.toLocaleString()}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Avg Particles/Belt:</span>
            <span className="stat-value">
              {(popCounts.totalFieldParticles / popCounts.smallBodyFields).toFixed(0)}
            </span>
          </div>
        </div>
      )}

      {roguePlanetStats.total > 0 && (
        <div className="stats-section">
          <div className="stats-section-title">Rogue Planets</div>
          <div className="stat-row">
            <span className="stat-label">Total Rogues:</span>
            <span className="stat-value">{roguePlanetStats.total}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Linear Paths:</span>
            <span className="stat-value">{roguePlanetStats.linearTrajectories}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Curved Paths:</span>
            <span className="stat-value">{roguePlanetStats.curvedTrajectories}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Avg Speed:</span>
            <span className="stat-value">{roguePlanetStats.avgSpeed.toFixed(3)}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Avg Curvature:</span>
            <span className="stat-value">{roguePlanetStats.avgCurvature.toFixed(3)}</span>
          </div>
        </div>
      )}

      {popCounts.comets > 0 && (
        <div className="stats-section">
          <div className="stats-section-title">Comets</div>
          <div className="stat-row">
            <span className="stat-label">Total Comets:</span>
            <span className="stat-value">{popCounts.comets}</span>
          </div>
        </div>
      )}

      {popCounts.ringedPlanets > 0 && (
        <div className="stats-section">
          <div className="stats-section-title">Planetary Rings</div>
          <div className="stat-row">
            <span className="stat-label">Ringed Planets:</span>
            <span className="stat-value">{popCounts.ringedPlanets}</span>
          </div>
        </div>
      )}

      {popCounts.nebulae > 0 && (
        <div className="stats-section">
          <div className="stats-section-title">Nebulae</div>
          <div className="stat-row">
            <span className="stat-label">Total Nebulae:</span>
            <span className="stat-value">{popCounts.nebulae}</span>
          </div>
        </div>
      )}

      {(popCounts.lagrangePoints > 0 || popCounts.trojans > 0) && (
        <div className="stats-section">
          <div className="stats-section-title">Lagrange Points & Trojans</div>
          <div className="stat-row">
            <span className="stat-label">Lagrange Points:</span>
            <span className="stat-value">{popCounts.lagrangePoints}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Trojan Bodies:</span>
            <span className="stat-value">{popCounts.trojans}</span>
          </div>
        </div>
      )}
    </div>
  );

  const renderGenerationTab = () => {
    if (!generationMeta) {
      return (
        <div className="stats-tab-content">
          <div className="stats-section">
            <div className="stats-section-title">No Generation Data</div>
            <p style={{ color: '#999', fontSize: '12px', padding: '10px' }}>
              Generate a universe using the Generator window to see generation statistics here.
            </p>
          </div>
        </div>
      );
    }

    const { config, totals, generatedAt } = generationMeta;

    return (
      <div className="stats-tab-content">
        <div className="stats-section">
          <div className="stats-section-title">Last Generation</div>
          <div className="stat-row">
            <span className="stat-label">Generated:</span>
            <span className="stat-value">{new Date(generatedAt).toLocaleString()}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Seed:</span>
            <span className="stat-value">{config.seed || 'Random'}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Max Systems:</span>
            <span className="stat-value">{config.maxSystems}</span>
          </div>
        </div>

        <div className="stats-section">
          <div className="stats-section-title">Generation Totals</div>
          <div className="stat-row">
            <span className="stat-label">Total Stars:</span>
            <span className="stat-value">{totals.totalStars}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Total Groups:</span>
            <span className="stat-value">{totals.totalGroups}</span>
          </div>
          {totals.totalBlackHoles > 0 && (
            <>
              <div className="stat-row">
                <span className="stat-label">Black Holes:</span>
                <span className="stat-value">{totals.totalBlackHoles}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">  With Disks:</span>
                <span className="stat-value">{totals.totalBlackHolesWithDisks}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">  With Jets:</span>
                <span className="stat-value">{totals.totalBlackHolesWithJets}</span>
              </div>
            </>
          )}
          {totals.totalProtoplanetaryDisks > 0 && (
            <>
              <div className="stat-row">
                <span className="stat-label">Protoplanetary Disks:</span>
                <span className="stat-value">{totals.totalProtoplanetaryDisks}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Disk Particles:</span>
                <span className="stat-value">{totals.totalProtoplanetaryDiskParticles.toLocaleString()}</span>
              </div>
            </>
          )}
          {totals.totalSmallBodyBelts > 0 && (
            <>
              <div className="stat-row">
                <span className="stat-label">Small Body Belts:</span>
                <span className="stat-value">{totals.totalSmallBodyBelts}</span>
              </div>
              <div className="stat-row">
                <span className="stat-label">Belt Particles:</span>
                <span className="stat-value">{totals.totalSmallBodyParticles.toLocaleString()}</span>
              </div>
            </>
          )}
          {totals.totalRoguePlanets > 0 && (
            <div className="stat-row">
              <span className="stat-label">Rogue Planets:</span>
              <span className="stat-value">{totals.totalRoguePlanets}</span>
            </div>
          )}
          {totals.totalNebulae > 0 && (
            <div className="stat-row">
              <span className="stat-label">Nebulae:</span>
              <span className="stat-value">{totals.totalNebulae}</span>
            </div>
          )}
        </div>

        <div className="stats-section">
          <div className="stats-section-title">Generator Config</div>
          <div className="stat-row">
            <span className="stat-label">Scale Mode:</span>
            <span className="stat-value">{config.scaleMode}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Max Depth:</span>
            <span className="stat-value">{config.maxDepth}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Planet Density:</span>
            <span className="stat-value">{(config.planetDensity * 100).toFixed(0)}%</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Moon Density:</span>
            <span className="stat-value">{(config.moonDensity * 100).toFixed(0)}%</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="stats-panel">
      {/* Context Selector */}
      <div className="stats-context-selector">
        <button
          className={`stats-context-btn ${context === 'global' ? 'active' : ''}`}
          onClick={() => setContext('global')}
        >
          Global
        </button>
        {isolatedGroupId && (
          <button
            className={`stats-context-btn ${context === 'isolated' ? 'active' : ''}`}
            onClick={() => setContext('isolated')}
          >
            Isolated
          </button>
        )}
        {selectedStarId && (
          <button
            className={`stats-context-btn ${context === 'selected' ? 'active' : ''}`}
            onClick={() => setContext('selected')}
          >
            Selected
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="stats-tabs">
        <button
          className={`stats-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`stats-tab ${activeTab === 'performance' ? 'active' : ''}`}
          onClick={() => setActiveTab('performance')}
        >
          Performance
        </button>
        <button
          className={`stats-tab ${activeTab === 'population' ? 'active' : ''}`}
          onClick={() => setActiveTab('population')}
        >
          Population
        </button>
        <button
          className={`stats-tab ${activeTab === 'orbits' ? 'active' : ''}`}
          onClick={() => setActiveTab('orbits')}
        >
          Orbits
        </button>
        <button
          className={`stats-tab ${activeTab === 'specials' ? 'active' : ''}`}
          onClick={() => setActiveTab('specials')}
        >
          Specials
        </button>
        <button
          className={`stats-tab ${activeTab === 'generation' ? 'active' : ''}`}
          onClick={() => setActiveTab('generation')}
        >
          Generation
        </button>
      </div>

      {/* Tab Content */}
      <div className="stats-content">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'performance' && renderPerformanceTab()}
        {activeTab === 'population' && renderPopulationTab()}
        {activeTab === 'orbits' && renderOrbitsTab()}
        {activeTab === 'specials' && renderSpecialsTab()}
        {activeTab === 'generation' && renderGenerationTab()}
      </div>

      {/* Actions */}
      <div className="stats-actions">
        <button className="stats-btn stats-btn-small" onClick={copyToClipboard}>
          📋 Copy
        </button>
        <button className="stats-btn stats-btn-small" onClick={exportJSON}>
          📄 JSON
        </button>
        <button className="stats-btn stats-btn-small" onClick={exportCSV}>
          📊 CSV
        </button>
      </div>
    </div>
  );
};

