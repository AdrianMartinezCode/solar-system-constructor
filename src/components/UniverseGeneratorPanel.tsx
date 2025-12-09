import React, { useState } from 'react';
import { useSystemStore } from '../state/systemStore';
import type { GenerationConfig } from '../types/generationConfig';
import { defaultConfig, getPresetConfig, generateRandomSeed } from '../utils/generatorConfigDefaults';
import { generateUniverse, getSmallBodyDetailLabel } from '../utils/generatorBridge';
import './UniverseGeneratorPanel.css';

interface GenerationStats {
  totalStars: number;
  totalGroups: number;
  totalBelts: number;
  totalAsteroids: number;
  totalRingedPlanets: number;
  totalRings: number;
  totalComets: number;
  totalLagrangePoints?: number;
  totalTrojanBodies?: number;
  totalKuiperObjects?: number;
  // Unified small body stats
  totalSmallBodyBelts?: number;
  totalSmallBodies?: number;
  totalMainBelts?: number;
  totalKuiperBelts?: number;
  totalMainBeltAsteroids?: number;
  // Protoplanetary disk stats
  totalProtoplanetaryDisks?: number;
  totalProtoplanetaryDiskParticles?: number;
  // Nebula stats
  totalNebulae?: number;
  // Rogue planet stats
  totalRoguePlanets?: number;
  generatedAt: string;
}

export const UniverseGeneratorPanel: React.FC = () => {
  const [config, setConfig] = useState<GenerationConfig>(defaultConfig);
  const [isGenerating, setIsGenerating] = useState(false);
  const [stats, setStats] = useState<GenerationStats | null>(null);
  
  // Update a single config field
  const updateConfig = <K extends keyof GenerationConfig>(
    key: K,
    value: GenerationConfig[K]
  ) => {
    setConfig(prev => ({ ...prev, [key]: value }));
  };
  
  // Handle preset change
  const handlePresetChange = (preset: GenerationConfig["stylePreset"]) => {
    setConfig(getPresetConfig(preset));
  };
  
  // Generate universe
  const handleGenerate = () => {
    setIsGenerating(true);
    
    try {
      const result = generateUniverse(config);
      
      console.log('[UniverseGeneratorPanel] Generation result:', {
        totalStars: Object.keys(result.stars).length,
        totalBelts: Object.keys(result.belts || {}).length,
        totalSmallBodyFields: Object.keys(result.smallBodyFields || {}).length,
        totalProtoplanetaryDisks: Object.keys(result.protoplanetaryDisks || {}).length,
      });
      
      if (result.smallBodyFields) {
        console.log('[UniverseGeneratorPanel] Small body fields:', Object.values(result.smallBodyFields).map(f => ({
          id: f.id,
          name: f.name,
          type: f.beltType,
          particleCount: f.particleCount,
          hostStarId: f.hostStarId,
        })));
      }
      
      // Update Zustand store using the imperative API
      useSystemStore.setState({
        stars: result.stars,
        rootIds: result.rootIds,
        groups: result.groups,
        rootGroupIds: result.rootGroupIds,
        belts: result.belts,
        smallBodyFields: result.smallBodyFields || {},
        protoplanetaryDisks: result.protoplanetaryDisks || {},
        nebulae: result.nebulae || {},
        selectedStarId: null,
        selectedGroupId: null,
        selectedBeltId: null,
        selectedSmallBodyFieldId: null,
        selectedProtoplanetaryDiskId: null,
        selectedNebulaId: null,
      });
      
      console.log('[UniverseGeneratorPanel] Store updated. Current smallBodyFields:', Object.keys(useSystemStore.getState().smallBodyFields).length);
      
      // Save to localStorage
      useSystemStore.getState().save();
      
      // Update stats
      setStats({
        totalStars: result.totalStars,
        totalGroups: result.totalGroups,
        totalBelts: result.totalBelts,
        totalAsteroids: result.totalAsteroids,
        totalRingedPlanets: result.totalRingedPlanets,
        totalRings: result.totalRings,
        totalComets: result.totalComets,
        totalLagrangePoints: result.totalLagrangePoints || 0,
        totalTrojanBodies: result.totalTrojanBodies || 0,
        totalKuiperObjects: result.totalKuiperObjects || 0,
        // Unified small body stats
        totalSmallBodyBelts: result.totalSmallBodyBelts || 0,
        totalSmallBodies: result.totalSmallBodies || 0,
        totalMainBelts: result.totalMainBelts || 0,
        totalKuiperBelts: result.totalKuiperBelts || 0,
        totalMainBeltAsteroids: result.totalMainBeltAsteroids || 0,
        // Protoplanetary disk stats
        totalProtoplanetaryDisks: result.totalProtoplanetaryDisks || 0,
        totalProtoplanetaryDiskParticles: result.totalProtoplanetaryDiskParticles || 0,
        // Nebula stats
        totalNebulae: result.totalNebulae || 0,
        // Rogue planet stats
        totalRoguePlanets: result.totalRoguePlanets || 0,
        generatedAt: result.generatedAt.toLocaleTimeString(),
      });
    } catch (error) {
      console.error('Generation failed:', error);
      alert('Generation failed. Check console for details.');
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Reset to defaults
  const handleReset = () => {
    setConfig(defaultConfig);
    setStats(null);
  };
  
  // Clear universe
  const handleClear = () => {
    if (confirm('Clear all stars and groups?')) {
      useSystemStore.setState({
        stars: {},
        rootIds: [],
        groups: {},
        rootGroupIds: [],
        selectedStarId: null,
        selectedGroupId: null,
      });
      useSystemStore.getState().save();
      setStats(null);
    }
  };
  
  // Randomize seed
  const handleRandomizeSeed = () => {
    updateConfig('seed', generateRandomSeed());
  };
  
  return (
    <div className="generator-panel">
      {/* Header */}
      <div className="generator-header">
        <h2>Procedural Generator</h2>
        <p className="generator-description">
          Generate hierarchical solar systems using L-System algorithms and Kepler-inspired orbital mechanics.
        </p>
      </div>
      
      {/* Preset Selector */}
      <div className="generator-section">
        <label className="generator-label">Style Preset</label>
        <select
          className="generator-select"
          value={config.stylePreset}
          onChange={(e) => handlePresetChange(e.target.value as GenerationConfig["stylePreset"])}
        >
          <option value="sparse">Sparse (minimal systems)</option>
          <option value="solarLike">Solar-like (realistic)</option>
          <option value="crowded">Crowded (many systems)</option>
          <option value="superDenseExperimental">Super Dense (experimental)</option>
        </select>
      </div>
      
      {/* Basic Controls */}
      <div className="generator-section">
        <h3 className="generator-section-title">Basic Settings</h3>
        
        {/* Seed */}
        <div className="generator-field">
          <label className="generator-label">
            Seed
            <span className="generator-label-hint">(optional, for reproducible generation)</span>
          </label>
          <div className="generator-input-group">
            <input
              type="text"
              className="generator-input"
              placeholder="Random"
              value={config.seed ?? ''}
              onChange={(e) => updateConfig('seed', e.target.value || undefined)}
            />
            <button
              className="generator-button-secondary"
              onClick={handleRandomizeSeed}
              title="Generate random seed"
            >
              🎲
            </button>
          </div>
        </div>
        
        {/* Max Systems */}
        <div className="generator-field">
          <label className="generator-label">
            Max Systems
            <span className="generator-value">{config.maxSystems}</span>
          </label>
          <input
            type="range"
            className="generator-slider"
            min="1"
            max="100"
            value={config.maxSystems}
            onChange={(e) => updateConfig('maxSystems', parseInt(e.target.value))}
          />
          <div className="generator-slider-labels">
            <span>1</span>
            <span>100</span>
          </div>
        </div>
        
        {/* Max Stars Per System */}
        <div className="generator-field">
          <label className="generator-label">
            Max Stars Per System
            <span className="generator-value">{config.maxStarsPerSystem}</span>
          </label>
          <input
            type="range"
            className="generator-slider"
            min="1"
            max="3"
            value={config.maxStarsPerSystem}
            onChange={(e) => updateConfig('maxStarsPerSystem', parseInt(e.target.value))}
          />
          <div className="generator-slider-labels">
            <span>1</span>
            <span>2</span>
            <span>3</span>
          </div>
        </div>
        
        {/* Max Depth */}
        <div className="generator-field">
          <label className="generator-label">
            Max Depth
            <span className="generator-value">{config.maxDepth}</span>
          </label>
          <input
            type="range"
            className="generator-slider"
            min="1"
            max="5"
            value={config.maxDepth}
            onChange={(e) => updateConfig('maxDepth', parseInt(e.target.value))}
          />
          <div className="generator-slider-labels">
            <span>1</span>
            <span>5</span>
          </div>
        </div>
        
        {/* Enable N-ary Systems */}
        <div className="generator-field">
          <label className="generator-checkbox">
            <input
              type="checkbox"
              checked={config.enableNarySystems}
              onChange={(e) => updateConfig('enableNarySystems', e.target.checked)}
            />
            <span>Enable Binary/Ternary Systems</span>
          </label>
        </div>
        
        {/* Scale Mode */}
        <div className="generator-field">
          <label className="generator-label">Scale Mode</label>
          <select
            className="generator-select"
            value={config.scaleMode}
            onChange={(e) => updateConfig('scaleMode', e.target.value as GenerationConfig["scaleMode"])}
          >
            <option value="toy">Toy (compact)</option>
            <option value="compressed">Compressed</option>
            <option value="realistic">Realistic</option>
          </select>
        </div>
      </div>
      
      {/* Distribution Controls */}
      <div className="generator-section">
        <h3 className="generator-section-title">Body Distribution</h3>
        
        {/* Planet Density */}
        <div className="generator-field">
          <label className="generator-label">
            Planet Density
            <span className="generator-value">{(config.planetDensity * 100).toFixed(0)}%</span>
          </label>
          <input
            type="range"
            className="generator-slider"
            min="0"
            max="1"
            step="0.01"
            value={config.planetDensity}
            onChange={(e) => updateConfig('planetDensity', parseFloat(e.target.value))}
          />
          <div className="generator-slider-labels">
            <span>Sparse</span>
            <span>Dense</span>
          </div>
        </div>
        
        {/* Moon Density */}
        <div className="generator-field">
          <label className="generator-label">
            Moon Density
            <span className="generator-value">{(config.moonDensity * 100).toFixed(0)}%</span>
          </label>
          <input
            type="range"
            className="generator-slider"
            min="0"
            max="1"
            step="0.01"
            value={config.moonDensity}
            onChange={(e) => updateConfig('moonDensity', parseFloat(e.target.value))}
          />
          <div className="generator-slider-labels">
            <span>Sparse</span>
            <span>Dense</span>
          </div>
        </div>
      </div>
      
      {/* Orbit Style Controls */}
      <div className="generator-section">
        <h3 className="generator-section-title">Orbit Styles</h3>
        
        {/* Orbit Eccentricity Style */}
        <div className="generator-field">
          <label className="generator-label">Eccentricity Style</label>
          <select
            className="generator-select"
            value={config.orbitEccentricityStyle ?? "circular"}
            onChange={(e) => updateConfig('orbitEccentricityStyle', e.target.value as GenerationConfig["orbitEccentricityStyle"])}
          >
            <option value="circular">Circular (e = 0)</option>
            <option value="mixed">Mixed (e = 0-0.3)</option>
            <option value="eccentric">Eccentric (e = 0.1-0.7)</option>
          </select>
          <small className="generator-hint">Controls how elliptical orbits are</small>
        </div>
        
        {/* Orbit Inclination Max */}
        <div className="generator-field">
          <label className="generator-label">
            Max Inclination
            <span className="generator-value">{config.orbitInclinationMax ?? 0}°</span>
          </label>
          <input
            type="range"
            className="generator-slider"
            min="0"
            max="90"
            step="5"
            value={config.orbitInclinationMax ?? 0}
            onChange={(e) => updateConfig('orbitInclinationMax', parseInt(e.target.value))}
          />
          <div className="generator-slider-labels">
            <span>0° (flat)</span>
            <span>90° (wild)</span>
          </div>
          <small className="generator-hint">Maximum tilt of orbit planes in 3D</small>
        </div>
        
        {/* Orbit Offset Enabled */}
        <div className="generator-field">
          <label className="generator-checkbox">
            <input
              type="checkbox"
              checked={config.orbitOffsetEnabled ?? false}
              onChange={(e) => updateConfig('orbitOffsetEnabled', e.target.checked)}
            />
            <span>Enable Orbit Center Offsets</span>
          </label>
          <small className="generator-hint">Allows ellipse centers to be displaced from parent</small>
        </div>
      </div>
      
      {/* Grouping Controls */}
      <div className="generator-section">
        <h3 className="generator-section-title">Grouping</h3>
        
        {/* Enable Groups */}
        <div className="generator-field">
          <label className="generator-checkbox">
            <input
              type="checkbox"
              checked={config.enableGroups}
              onChange={(e) => updateConfig('enableGroups', e.target.checked)}
            />
            <span>Enable Hierarchical Groups</span>
          </label>
        </div>
        
        {config.enableGroups && (
          <>
            {/* Target Galaxy Count */}
            <div className="generator-field">
              <label className="generator-label">
                Target Galaxy Count
                <span className="generator-value">{config.targetGalaxyCount}</span>
              </label>
              <input
                type="range"
                className="generator-slider"
                min="1"
                max="20"
                value={config.targetGalaxyCount}
                onChange={(e) => updateConfig('targetGalaxyCount', parseInt(e.target.value))}
              />
              <div className="generator-slider-labels">
                <span>1</span>
                <span>20</span>
              </div>
            </div>
            
            {/* Group Structure Mode */}
            <div className="generator-field">
              <label className="generator-label">Group Structure</label>
              <select
                className="generator-select"
                value={config.groupStructureMode}
                onChange={(e) => updateConfig('groupStructureMode', e.target.value as GenerationConfig["groupStructureMode"])}
              >
                <option value="flat">Flat (no nesting)</option>
                <option value="galaxyCluster">Galaxy Cluster (some nesting)</option>
                <option value="deepHierarchy">Deep Hierarchy (max nesting)</option>
              </select>
            </div>
          </>
        )}
      </div>
      
      {/* Small Body Belts & Fields (Unified section for Asteroid Belts + Kuiper Belt) */}
      <div className="generator-section">
        <h3 className="generator-section-title">🪨 Small Body Belts & Fields</h3>
        <small className="generator-hint">Asteroid belts and Kuiper belt objects - unified debris system</small>
        
        {/* Small Body Detail (Global Quality Control) */}
        <div className="generator-field" style={{ marginTop: '12px' }}>
          <label className="generator-label">
            Small Body Detail
            <span className="generator-value" style={{ 
              color: config.smallBodyDetail === 'ultra' ? '#ff9500' : undefined 
            }}>
              {getSmallBodyDetailLabel(config.smallBodyDetail)}
            </span>
          </label>
          <select
            className="generator-select"
            value={config.smallBodyDetail}
            onChange={(e) => updateConfig('smallBodyDetail', e.target.value as GenerationConfig["smallBodyDetail"])}
          >
            <option value="low">Low (fast rendering)</option>
            <option value="medium">Medium (balanced)</option>
            <option value="high">High (detailed)</option>
            <option value="ultra">Ultra (expensive ⚠️)</option>
          </select>
          <small className="generator-hint">Controls object count and rendering quality for all belts</small>
        </div>
        
        {/* Divider for Main Asteroid Belts */}
        <div style={{ borderTop: '1px solid #3a3a3a', margin: '16px 0', paddingTop: '12px' }}>
          <label className="generator-checkbox">
            <input
              type="checkbox"
              checked={config.enableAsteroidBelts}
              onChange={(e) => updateConfig('enableAsteroidBelts', e.target.checked)}
            />
            <span>🪨 Main Asteroid Belts (inner, rocky)</span>
          </label>
        </div>
        
        {config.enableAsteroidBelts && (
          <>
            {/* Belt Density */}
            <div className="generator-field">
              <label className="generator-label">
                Main Belt Density
                <span className="generator-value">{(config.beltDensity * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                className="generator-slider"
                min="0"
                max="1"
                step="0.1"
                value={config.beltDensity}
                onChange={(e) => updateConfig('beltDensity', parseFloat(e.target.value))}
              />
              <div className="generator-slider-labels">
                <span>Sparse</span>
                <span>Debris Field</span>
              </div>
            </div>
            
            {/* Max Belts Per System */}
            <div className="generator-field">
              <label className="generator-label">
                Max Belts Per System
                <span className="generator-value">{config.maxBeltsPerSystem}</span>
              </label>
              <input
                type="range"
                className="generator-slider"
                min="0"
                max="5"
                value={config.maxBeltsPerSystem}
                onChange={(e) => updateConfig('maxBeltsPerSystem', parseInt(e.target.value))}
              />
              <div className="generator-slider-labels">
                <span>0</span>
                <span>5</span>
              </div>
            </div>
            
            {/* Belt Placement Mode */}
            <div className="generator-field">
              <label className="generator-label">Placement</label>
              <select
                className="generator-select"
                value={config.beltPlacementMode}
                onChange={(e) => updateConfig('beltPlacementMode', e.target.value as GenerationConfig["beltPlacementMode"])}
              >
                <option value="none">None</option>
                <option value="betweenPlanets">Between Planets</option>
                <option value="outerBelt">Outer Belt</option>
                <option value="both">Both</option>
              </select>
            </div>
          </>
        )}
        
        {/* Divider for Kuiper Belt */}
        <div style={{ borderTop: '1px solid #3a3a3a', margin: '16px 0', paddingTop: '12px' }}>
          <label className="generator-checkbox">
            <input
              type="checkbox"
              checked={config.enableKuiperBelt}
              onChange={(e) => updateConfig('enableKuiperBelt', e.target.checked)}
            />
            <span>❄️ Kuiper Belt Objects (outer, icy)</span>
          </label>
        </div>
        
        {config.enableKuiperBelt && (
          <>
            {/* Kuiper Density */}
            <div className="generator-field">
              <label className="generator-label">
                Kuiper Belt Density
                <span className="generator-value">{(config.kuiperBeltDensity * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                className="generator-slider"
                min="0"
                max="1"
                step="0.1"
                value={config.kuiperBeltDensity}
                onChange={(e) => updateConfig('kuiperBeltDensity', parseFloat(e.target.value))}
              />
              <div className="generator-slider-labels">
                <span>Few Icy Objects</span>
                <span>Dense Belt</span>
              </div>
            </div>
            
            {/* Distance Style */}
            <div className="generator-field">
              <label className="generator-label">Distance Style</label>
              <select
                className="generator-select"
                value={config.kuiperBeltDistanceStyle}
                onChange={(e) => updateConfig('kuiperBeltDistanceStyle', e.target.value as GenerationConfig["kuiperBeltDistanceStyle"])}
              >
                <option value="tight">Tight (near outer planets)</option>
                <option value="classical">Classical Kuiper Belt</option>
                <option value="wide">Wide / Scattered Disk</option>
              </select>
            </div>
            
            {/* Kuiper Inclination */}
            <div className="generator-field">
              <label className="generator-label">
                Inclination / Thickness
                <span className="generator-value">{(config.kuiperBeltInclination * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                className="generator-slider"
                min="0"
                max="1"
                step="0.1"
                value={config.kuiperBeltInclination}
                onChange={(e) => updateConfig('kuiperBeltInclination', parseFloat(e.target.value))}
              />
              <div className="generator-slider-labels">
                <span>Thin Disc</span>
                <span>Highly Scattered</span>
              </div>
            </div>
          </>
        )}
        
        {/* Divider for Protoplanetary Disks */}
        <div style={{ borderTop: '1px solid #3a3a3a', margin: '16px 0', paddingTop: '12px' }}>
          <label className="generator-checkbox">
            <input
              type="checkbox"
              checked={config.enableProtoplanetaryDisks}
              onChange={(e) => updateConfig('enableProtoplanetaryDisks', e.target.checked)}
            />
            <span>💿 Protoplanetary Disks (visual, young systems)</span>
          </label>
          <small className="generator-hint" style={{ display: 'block', marginTop: '4px' }}>
            GPU particle fields representing gas/dust around young stars
          </small>
        </div>
        
        {config.enableProtoplanetaryDisks && (
          <>
            {/* Disk Presence */}
            <div className="generator-field">
              <label className="generator-label">
                Disk Presence
                <span className="generator-value">{(config.protoplanetaryDiskPresence * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                className="generator-slider"
                min="0"
                max="1"
                step="0.05"
                value={config.protoplanetaryDiskPresence}
                onChange={(e) => updateConfig('protoplanetaryDiskPresence', parseFloat(e.target.value))}
              />
              <div className="generator-slider-labels">
                <span>None</span>
                <span>Frequent Young Disks</span>
              </div>
              <small className="generator-hint">How often systems have a protoplanetary disk</small>
            </div>
            
            {/* Disk Density */}
            <div className="generator-field">
              <label className="generator-label">
                Disk Density
                <span className="generator-value">{(config.protoplanetaryDiskDensity * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                className="generator-slider"
                min="0"
                max="1"
                step="0.05"
                value={config.protoplanetaryDiskDensity}
                onChange={(e) => updateConfig('protoplanetaryDiskDensity', parseFloat(e.target.value))}
              />
              <div className="generator-slider-labels">
                <span>Sparse</span>
                <span>Very Dense</span>
              </div>
              <small className="generator-hint">Number of disk particles (affects performance)</small>
            </div>
            
            {/* Disk Prominence */}
            <div className="generator-field">
              <label className="generator-label">
                Disk Prominence
                <span className="generator-value">{(config.protoplanetaryDiskProminence * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                className="generator-slider"
                min="0"
                max="1"
                step="0.05"
                value={config.protoplanetaryDiskProminence}
                onChange={(e) => updateConfig('protoplanetaryDiskProminence', parseFloat(e.target.value))}
              />
              <div className="generator-slider-labels">
                <span>Subtle Haze</span>
                <span>Bright, Thick Disk</span>
              </div>
              <small className="generator-hint">Brightness and thickness of the disk</small>
            </div>
          </>
        )}
      </div>

      {/* Nebulae Region Controls */}
      <div className="generator-section">
        <h3 className="generator-section-title">🌫 Interstellar Nebulae (Visual Fields)</h3>
        
        {/* Divider for Nebulae */}
        <div style={{ borderTop: '1px solid #3a3a3a', margin: '16px 0', paddingTop: '12px' }}>
          <label className="generator-checkbox">
            <input
              type="checkbox"
              checked={config.enableNebulae}
              onChange={(e) => updateConfig('enableNebulae', e.target.checked)}
            />
            <span>🌫 Nebulae Regions (galaxy-scale clouds)</span>
          </label>
          <small className="generator-hint" style={{ display: 'block', marginTop: '4px' }}>
            Large volumetric gas/dust clouds at universe scale for dramatic visual effect
          </small>
        </div>
        
        {config.enableNebulae && (
          <>
            {/* Nebula Density */}
            <div className="generator-field">
              <label className="generator-label">
                Nebula Density
                <span className="generator-value">{(config.nebulaDensity * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                className="generator-slider"
                min="0"
                max="1"
                step="0.05"
                value={config.nebulaDensity}
                onChange={(e) => updateConfig('nebulaDensity', parseFloat(e.target.value))}
              />
              <div className="generator-slider-labels">
                <span>Few Large Clouds</span>
                <span>Many Overlapping Regions</span>
              </div>
              <small className="generator-hint">Number of nebula regions in the universe</small>
            </div>
            
            {/* Nebula Color Style */}
            <div className="generator-field">
              <label className="generator-label">
                Color Style
              </label>
              <select
                className="generator-select"
                value={config.nebulaColorStyle || 'random'}
                onChange={(e) => updateConfig('nebulaColorStyle', e.target.value as any)}
              >
                <option value="random">Random (All Types)</option>
                <option value="warm">Warm (HII Regions)</option>
                <option value="cool">Cool (Reflection Nebulae)</option>
                <option value="mixed">Mixed Palette</option>
              </select>
              <small className="generator-hint">Color palette for nebula generation</small>
            </div>
            
            {/* Nebula Size Bias */}
            <div className="generator-field">
              <label className="generator-label">
                Typical Size
              </label>
              <select
                className="generator-select"
                value={config.nebulaSizeBias || 'medium'}
                onChange={(e) => updateConfig('nebulaSizeBias', e.target.value as any)}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="giant">Giant</option>
              </select>
              <small className="generator-hint">Typical radius of generated nebulae</small>
            </div>
            
            {/* Nebula Brightness */}
            <div className="generator-field">
              <label className="generator-label">
                Brightness
                <span className="generator-value">{((config.nebulaBrightness || 0.7) * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                className="generator-slider"
                min="0"
                max="1"
                step="0.05"
                value={config.nebulaBrightness || 0.7}
                onChange={(e) => updateConfig('nebulaBrightness', parseFloat(e.target.value))}
              />
              <div className="generator-slider-labels">
                <span>Subtle Glow</span>
                <span>Bright & Vivid</span>
              </div>
              <small className="generator-hint">Emissive intensity of nebulae</small>
            </div>
          </>
        )}
      </div>

      {/* Rogue Planet Controls */}
      <div className="generator-section">
        <h3 className="generator-section-title">Rogue Planets 🧭</h3>
        
        {/* Enable Rogue Planets */}
        <div className="generator-field">
          <label className="generator-checkbox">
            <input
              type="checkbox"
              checked={config.enableRoguePlanets}
              onChange={(e) => updateConfig('enableRoguePlanets', e.target.checked)}
            />
            <span>Enable Rogue Planets</span>
          </label>
          <small className="generator-hint">
            Unbound planets freely drifting through the universe
          </small>
        </div>
        
        {config.enableRoguePlanets && (
          <>
            {/* Rogue Planet Frequency */}
            <div className="generator-field">
              <label className="generator-label">
                Rogue Planet Frequency
                <span className="generator-value">{(config.roguePlanetFrequency * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                className="generator-slider"
                min="0"
                max="1"
                step="0.05"
                value={config.roguePlanetFrequency}
                onChange={(e) => updateConfig('roguePlanetFrequency', parseFloat(e.target.value))}
              />
              <div className="generator-slider-labels">
                <span>None</span>
                <span>Many Drifters</span>
              </div>
              <small className="generator-hint">Number of rogue planets in the universe</small>
            </div>
            
            {/* Trajectory Style */}
            <div className="generator-field">
              <label className="generator-label">
                Trajectory Style
              </label>
              <select
                className="generator-select"
                value={config.roguePlanetOrbitStyle || 'mixed'}
                onChange={(e) => updateConfig('roguePlanetOrbitStyle', e.target.value as any)}
              >
                <option value="slowDrifters">Slow Drifters</option>
                <option value="mixed">Mixed</option>
                <option value="fastIntruders">Fast Intruders</option>
              </select>
              <small className="generator-hint">Movement speed and inclination style</small>
            </div>
            
            {/* Visual Emphasis */}
            <div className="generator-field">
              <label className="generator-label">
                Visual Emphasis
                <span className="generator-value">{((config.roguePlanetVisibility || 0.5) * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                className="generator-slider"
                min="0"
                max="1"
                step="0.05"
                value={config.roguePlanetVisibility || 0.5}
                onChange={(e) => updateConfig('roguePlanetVisibility', parseFloat(e.target.value))}
              />
              <div className="generator-slider-labels">
                <span>Subtle</span>
                <span>Highly Distinct</span>
              </div>
              <small className="generator-hint">Color variation and visual prominence</small>
            </div>
            
            {/* Rogue Trajectory Mode */}
            <div className="generator-field">
              <label className="generator-label">
                Rogue Trajectory Mode
              </label>
              <select
                className="generator-select"
                value={config.rogueTrajectoryMode || 'linearOnly'}
                onChange={(e) => updateConfig('rogueTrajectoryMode', e.target.value as any)}
              >
                <option value="linearOnly">Linear Only</option>
                <option value="mixed">Mixed</option>
                <option value="curved">Curved</option>
              </select>
              <small className="generator-hint">Path shape: straight lines vs curved/elliptical</small>
            </div>
            
            {/* Rogue Path Curvature Range */}
            {(config.rogueTrajectoryMode === 'mixed' || config.rogueTrajectoryMode === 'curved') && (
              <>
                <div className="generator-field">
                  <label className="generator-label">
                    Min Path Curvature
                    <span className="generator-value">{((config.rogueCurvatureMin || 0) * 100).toFixed(0)}%</span>
                  </label>
                  <input
                    type="range"
                    className="generator-slider"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.rogueCurvatureMin || 0}
                    onChange={(e) => updateConfig('rogueCurvatureMin', parseFloat(e.target.value))}
                  />
                  <div className="generator-slider-labels">
                    <span>Straight</span>
                    <span>Curved</span>
                  </div>
                  <small className="generator-hint">Minimum curvature for rogue paths</small>
                </div>
                
                <div className="generator-field">
                  <label className="generator-label">
                    Max Path Curvature
                    <span className="generator-value">{((config.rogueCurvatureMax || 0) * 100).toFixed(0)}%</span>
                  </label>
                  <input
                    type="range"
                    className="generator-slider"
                    min="0"
                    max="1"
                    step="0.05"
                    value={config.rogueCurvatureMax || 0}
                    onChange={(e) => updateConfig('rogueCurvatureMax', parseFloat(e.target.value))}
                  />
                  <div className="generator-slider-labels">
                    <span>Straight</span>
                    <span>Strongly Curved</span>
                  </div>
                  <small className="generator-hint">Maximum curvature for rogue paths</small>
                </div>
              </>
            )}
            
            {/* Show Rogue Trajectories */}
            <div className="generator-field">
              <label className="generator-checkbox">
                <input
                  type="checkbox"
                  checked={config.rogueTrajectoryShow ?? true}
                  onChange={(e) => updateConfig('rogueTrajectoryShow', e.target.checked)}
                />
                <span>Show Rogue Trajectories</span>
              </label>
              <small className="generator-hint">
                Visualize past and future path segments
              </small>
            </div>
            
            {/* Trajectory Preview Length */}
            {(config.rogueTrajectoryShow ?? true) && (
              <div className="generator-field">
                <label className="generator-label">
                  Trajectory Length
                  <span className="generator-value">{((config.rogueTrajectoryPreviewLength || 0.5) * 100).toFixed(0)}%</span>
                </label>
                <input
                  type="range"
                  className="generator-slider"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.rogueTrajectoryPreviewLength || 0.5}
                  onChange={(e) => updateConfig('rogueTrajectoryPreviewLength', parseFloat(e.target.value))}
                />
                <div className="generator-slider-labels">
                  <span>Short</span>
                  <span>Long</span>
                </div>
                <small className="generator-hint">Length of visible path segments</small>
              </div>
            )}
          </>
        )}
      </div>

      {/* Planetary Ring Controls */}
      <div className="generator-section">
        <h3 className="generator-section-title">Planetary Rings</h3>
        
        {/* Enable Planetary Rings */}
        <div className="generator-field">
          <label className="generator-checkbox">
            <input
              type="checkbox"
              checked={config.enablePlanetaryRings}
              onChange={(e) => updateConfig('enablePlanetaryRings', e.target.checked)}
            />
            <span>Enable Planetary Rings</span>
          </label>
        </div>
        
        {config.enablePlanetaryRings && (
          <>
            {/* Ring Frequency */}
            <div className="generator-field">
              <label className="generator-label">
                Ring Frequency
                <span className="generator-value">{(config.ringFrequency * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                className="generator-slider"
                min="0"
                max="1"
                step="0.01"
                value={config.ringFrequency}
                onChange={(e) => updateConfig('ringFrequency', parseFloat(e.target.value))}
              />
              <div className="generator-slider-labels">
                <span>None</span>
                <span>Many Ringed Worlds</span>
              </div>
            </div>
            
            {/* Ring Prominence */}
            <div className="generator-field">
              <label className="generator-label">
                Ring Prominence
                <span className="generator-value">{(config.ringProminence * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                className="generator-slider"
                min="0"
                max="1"
                step="0.01"
                value={config.ringProminence}
                onChange={(e) => updateConfig('ringProminence', parseFloat(e.target.value))}
              />
              <div className="generator-slider-labels">
                <span>Subtle</span>
                <span>Dramatic</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Comet Controls */}
      <div className="generator-section">
        <h3 className="generator-section-title">Comets ☄️</h3>
        
        {/* Enable Comets */}
        <div className="generator-field">
          <label className="generator-checkbox">
            <input
              type="checkbox"
              checked={config.enableComets}
              onChange={(e) => updateConfig('enableComets', e.target.checked)}
            />
            <span>Enable Comets</span>
          </label>
        </div>
        
        {config.enableComets && (
          <>
            {/* Comet Frequency */}
            <div className="generator-field">
              <label className="generator-label">
                Comet Frequency
                <span className="generator-value">{(config.cometFrequency * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                className="generator-slider"
                min="0"
                max="1"
                step="0.01"
                value={config.cometFrequency}
                onChange={(e) => updateConfig('cometFrequency', parseFloat(e.target.value))}
              />
              <div className="generator-slider-labels">
                <span>Rare Visitors</span>
                <span>Many Visitors</span>
              </div>
            </div>
            
            {/* Orbit Style */}
            <div className="generator-field">
              <label className="generator-label">Orbit Style</label>
              <select
                className="generator-select"
                value={config.cometOrbitStyle}
                onChange={(e) => updateConfig('cometOrbitStyle', e.target.value as GenerationConfig["cometOrbitStyle"])}
              >
                <option value="rareLong">Rare Long-Period (Kuiper/Oort-like)</option>
                <option value="mixed">Mixed</option>
                <option value="manyShort">Many Short-Period</option>
              </select>
              <small className="generator-hint">Controls eccentricity and semi-major axis distribution</small>
            </div>
            
            {/* Comet Activity */}
            <div className="generator-field">
              <label className="generator-label">
                Comet Activity
                <span className="generator-value">{(config.cometActivity * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                className="generator-slider"
                min="0"
                max="1"
                step="0.01"
                value={config.cometActivity}
                onChange={(e) => updateConfig('cometActivity', parseFloat(e.target.value))}
              />
              <div className="generator-slider-labels">
                <span>Dormant</span>
                <span>Very Active Tails</span>
              </div>
              <small className="generator-hint">Controls tail length and brightness</small>
            </div>
          </>
        )}
      </div>


      {/* Lagrange Points / Trojans Controls */}
      <div className="generator-section">
        <h3 className="generator-section-title">Lagrange Points / Trojans 🔺</h3>
        
        {/* Enable Lagrange Points */}
        <div className="generator-field">
          <label className="generator-checkbox">
            <input
              type="checkbox"
              checked={config.enableLagrangePoints}
              onChange={(e) => updateConfig('enableLagrangePoints', e.target.checked)}
            />
            <span>Enable Lagrange Points</span>
          </label>
        </div>
        
        {config.enableLagrangePoints && (
          <>
            {/* Lagrange Markers */}
            <div className="generator-field">
              <label className="generator-label">Lagrange Markers</label>
              <select
                className="generator-select"
                value={config.lagrangeMarkerMode}
                onChange={(e) => updateConfig('lagrangeMarkerMode', e.target.value as GenerationConfig["lagrangeMarkerMode"])}
              >
                <option value="none">None</option>
                <option value="stableOnly">Stable Only (L4/L5)</option>
                <option value="all">All (L1-L5)</option>
              </select>
              <small className="generator-hint">Which Lagrange point markers to display</small>
            </div>
            
            {/* Trojan Frequency */}
            <div className="generator-field">
              <label className="generator-label">
                Trojan Frequency
                <span className="generator-value">{(config.trojanFrequency * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                className="generator-slider"
                min="0"
                max="1"
                step="0.01"
                value={config.trojanFrequency}
                onChange={(e) => updateConfig('trojanFrequency', parseFloat(e.target.value))}
              />
              <div className="generator-slider-labels">
                <span>Rare Trojans</span>
                <span>Many Trojans</span>
              </div>
              <small className="generator-hint">How often Trojan bodies appear at L4/L5</small>
            </div>
            
            {/* Trojan Richness */}
            <div className="generator-field">
              <label className="generator-label">
                Trojan Richness
                <span className="generator-value">{(config.trojanRichness * 100).toFixed(0)}%</span>
              </label>
              <input
                type="range"
                className="generator-slider"
                min="0"
                max="1"
                step="0.01"
                value={config.trojanRichness}
                onChange={(e) => updateConfig('trojanRichness', parseFloat(e.target.value))}
              />
              <div className="generator-slider-labels">
                <span>Few Per Point</span>
                <span>Many Per Point</span>
              </div>
              <small className="generator-hint">Number and prominence of Trojans per L4/L5</small>
            </div>
            
            {/* Pair Scope */}
            <div className="generator-field">
              <label className="generator-label">Pair Scope</label>
              <select
                className="generator-select"
                value={config.lagrangePairScope}
                onChange={(e) => updateConfig('lagrangePairScope', e.target.value as GenerationConfig["lagrangePairScope"])}
              >
                <option value="starPlanet">Star-Planet</option>
                <option value="planetMoon">Planet-Moon</option>
                <option value="both">Both</option>
              </select>
              <small className="generator-hint">Which two-body pairs to consider for Lagrange points</small>
            </div>
          </>
        )}
      </div>
      
      {/* Actions */}
      <div className="generator-actions">
        <button
          className="generator-button-primary"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : '🌌 Generate Universe'}
        </button>
        
        <div className="generator-actions-secondary">
          <button
            className="generator-button-secondary"
            onClick={handleReset}
          >
            Reset to Defaults
          </button>
          <button
            className="generator-button-danger"
            onClick={handleClear}
          >
            Clear Universe
          </button>
        </div>
      </div>
      
      {/* Status Display */}
      {stats && (
        <div className="generator-status">
          <h3 className="generator-section-title">Last Generation</h3>
          <div className="generator-stats">
            <div className="generator-stat">
              <span className="generator-stat-label">Total Stars</span>
              <span className="generator-stat-value">{stats.totalStars}</span>
            </div>
            <div className="generator-stat">
              <span className="generator-stat-label">Total Groups</span>
              <span className="generator-stat-value">{stats.totalGroups}</span>
            </div>
            
            {/* Unified Small Bodies Stats */}
            {((stats.totalSmallBodies ?? 0) > 0 || (stats.totalSmallBodyBelts ?? 0) > 0) && (
              <>
                <div className="generator-stat" style={{ borderTop: '1px solid #3a3a3a', paddingTop: '8px', marginTop: '8px' }}>
                  <span className="generator-stat-label">🪨 Small Body Belts</span>
                  <span className="generator-stat-value">{stats.totalSmallBodyBelts ?? 0}</span>
                </div>
                <div className="generator-stat">
                  <span className="generator-stat-label">Small Bodies (total)</span>
                  <span className="generator-stat-value">{stats.totalSmallBodies ?? 0}</span>
                </div>
                {(stats.totalMainBeltAsteroids ?? 0) > 0 && (
                  <div className="generator-stat" style={{ paddingLeft: '12px' }}>
                    <span className="generator-stat-label" style={{ fontSize: '0.85em', color: '#888' }}>
                      ↳ Main Belt
                    </span>
                    <span className="generator-stat-value" style={{ fontSize: '0.9em' }}>
                      {stats.totalMainBeltAsteroids}
                    </span>
                  </div>
                )}
                {(stats.totalKuiperObjects ?? 0) > 0 && (
                  <div className="generator-stat" style={{ paddingLeft: '12px' }}>
                    <span className="generator-stat-label" style={{ fontSize: '0.85em', color: '#88ccff' }}>
                      ↳ Kuiper Belt ❄️
                    </span>
                    <span className="generator-stat-value" style={{ fontSize: '0.9em' }}>
                      {stats.totalKuiperObjects}
                    </span>
                  </div>
                )}
              </>
            )}
            
            <div className="generator-stat">
              <span className="generator-stat-label">Ringed Planets</span>
              <span className="generator-stat-value">{stats.totalRingedPlanets}</span>
            </div>
            <div className="generator-stat">
              <span className="generator-stat-label">Comets</span>
              <span className="generator-stat-value">{stats.totalComets}</span>
            </div>
            {(stats.totalLagrangePoints ?? 0) > 0 && (
              <div className="generator-stat">
                <span className="generator-stat-label">Lagrange Points</span>
                <span className="generator-stat-value">{stats.totalLagrangePoints}</span>
              </div>
            )}
            {(stats.totalTrojanBodies ?? 0) > 0 && (
              <div className="generator-stat">
                <span className="generator-stat-label">Trojan Bodies</span>
                <span className="generator-stat-value">{stats.totalTrojanBodies}</span>
              </div>
            )}
            {(stats.totalProtoplanetaryDisks ?? 0) > 0 && (
              <>
                <div className="generator-stat" style={{ borderTop: '1px solid #3a3a3a', paddingTop: '8px', marginTop: '8px' }}>
                  <span className="generator-stat-label">💿 Protoplanetary Disks</span>
                  <span className="generator-stat-value">{stats.totalProtoplanetaryDisks}</span>
                </div>
                <div className="generator-stat" style={{ paddingLeft: '12px' }}>
                  <span className="generator-stat-label" style={{ fontSize: '0.85em', color: '#e6be8a' }}>
                    ↳ Disk Particles (approx)
                  </span>
                  <span className="generator-stat-value" style={{ fontSize: '0.9em' }}>
                    {(stats.totalProtoplanetaryDiskParticles ?? 0).toLocaleString()}
                  </span>
                </div>
              </>
            )}
            
            {/* Nebulae Stats */}
            {(stats.totalNebulae ?? 0) > 0 && (
              <div className="generator-stat">
                <span className="generator-stat-label">🌫 Nebulae Regions</span>
                <span className="generator-stat-value">{stats.totalNebulae}</span>
              </div>
            )}
            
            {/* Rogue Planet Stats */}
            {(stats.totalRoguePlanets ?? 0) > 0 && (
              <div className="generator-stat">
                <span className="generator-stat-label">🧭 Rogue Planets</span>
                <span className="generator-stat-value">{stats.totalRoguePlanets}</span>
              </div>
            )}
            
            <div className="generator-stat">
              <span className="generator-stat-label">Generated At</span>
              <span className="generator-stat-value">{stats.generatedAt}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

