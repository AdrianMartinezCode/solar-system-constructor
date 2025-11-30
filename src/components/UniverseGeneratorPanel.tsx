import React, { useState } from 'react';
import { useSystemStore } from '../state/systemStore';
import type { GenerationConfig } from '../types/generationConfig';
import { defaultConfig, getPresetConfig, generateRandomSeed } from '../utils/generatorConfigDefaults';
import { generateUniverse } from '../utils/generatorBridge';
import './UniverseGeneratorPanel.css';

interface GenerationStats {
  totalStars: number;
  totalGroups: number;
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
      
      // Update Zustand store using the imperative API
      useSystemStore.setState({
        stars: result.stars,
        rootIds: result.rootIds,
        groups: result.groups,
        rootGroupIds: result.rootGroupIds,
        selectedStarId: null,
        selectedGroupId: null,
      });
      
      // Save to localStorage
      useSystemStore.getState().save();
      
      // Update stats
      setStats({
        totalStars: result.totalStars,
        totalGroups: result.totalGroups,
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

