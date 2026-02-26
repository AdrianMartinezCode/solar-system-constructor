import React, { useState, useEffect } from 'react';
import { useSystemStore } from '../state/systemStore';
import type { NebulaRegion } from '../types';
import './NebulaEditorPanel.css';

interface NebulaEditorPanelProps {
  nebulaId: string;
}

export const NebulaEditorPanel: React.FC<NebulaEditorPanelProps> = ({ nebulaId }) => {
  const nebula = useSystemStore((state) => state.nebulae[nebulaId]);
  const updateNebula = useSystemStore((state) => state.updateNebula);
  
  const [localNebula, setLocalNebula] = useState<NebulaRegion | null>(null);
  const [activeTab, setActiveTab] = useState<'shape' | 'visual' | 'metadata'>('visual');
  
  useEffect(() => {
    if (nebula) {
      setLocalNebula({ ...nebula });
    }
  }, [nebula]);
  
  if (!localNebula) {
    return <div className="nebula-editor-panel">Nebula not found</div>;
  }
  
  const handleApply = () => {
    updateNebula(nebulaId, localNebula);
  };
  
  const handleReset = () => {
    if (nebula) {
      setLocalNebula({ ...nebula });
    }
  };
  
  const updateLocalField = <K extends keyof NebulaRegion>(
    field: K,
    value: NebulaRegion[K]
  ) => {
    setLocalNebula((prev: NebulaRegion | null) => prev ? { ...prev, [field]: value } : null);
  };
  
  return (
    <div className="nebula-editor-panel">
      <div className="nebula-editor-header">
        <h2>🌫 Nebula Editor</h2>
        <h3>{localNebula.name}</h3>
      </div>
      
      <div className="nebula-editor-tabs">
        <button
          className={`nebula-tab ${activeTab === 'shape' ? 'active' : ''}`}
          onClick={() => setActiveTab('shape')}
        >
          Shape
        </button>
        <button
          className={`nebula-tab ${activeTab === 'visual' ? 'active' : ''}`}
          onClick={() => setActiveTab('visual')}
        >
          Visual
        </button>
        <button
          className={`nebula-tab ${activeTab === 'metadata' ? 'active' : ''}`}
          onClick={() => setActiveTab('metadata')}
        >
          Metadata
        </button>
      </div>
      
      <div className="nebula-editor-content">
        {/* Shape Tab */}
        {activeTab === 'shape' && (
          <div className="nebula-tab-content">
            <div className="nebula-field">
              <label className="nebula-label">
                Radius
              </label>
              <input
                type="number"
                className="nebula-input"
                value={localNebula.radius}
                onChange={(e) => updateLocalField('radius', parseFloat(e.target.value))}
                step="5"
                min="10"
              />
              <small className="nebula-hint">Primary radius of the nebula region</small>
            </div>
            
            <div className="nebula-field">
              <label className="nebula-label">
                Noise Scale
              </label>
              <input
                type="number"
                className="nebula-input"
                value={localNebula.noiseScale}
                onChange={(e) => updateLocalField('noiseScale', parseFloat(e.target.value))}
                step="0.1"
                min="0.1"
                max="5"
              />
              <small className="nebula-hint">3D noise frequency (0.1-5, higher = more detail)</small>
            </div>
            
            <div className="nebula-field">
              <label className="nebula-label">
                Noise Detail
              </label>
              <input
                type="number"
                className="nebula-input"
                value={localNebula.noiseDetail}
                onChange={(e) => updateLocalField('noiseDetail', parseInt(e.target.value))}
                step="1"
                min="1"
                max="10"
              />
              <small className="nebula-hint">Noise octaves/complexity (1-10)</small>
            </div>
            
            {localNebula.dimensions && (
              <>
                <div className="nebula-field">
                  <label className="nebula-label">
                    Dimension X
                  </label>
                  <input
                    type="number"
                    className="nebula-input"
                    value={localNebula.dimensions.x}
                    onChange={(e) => updateLocalField('dimensions', {
                      ...(localNebula.dimensions || { x: 100, y: 100, z: 100 }),
                      x: parseFloat(e.target.value)
                    })}
                    step="5"
                  />
                </div>
                
                <div className="nebula-field">
                  <label className="nebula-label">
                    Dimension Y
                  </label>
                  <input
                    type="number"
                    className="nebula-input"
                    value={localNebula.dimensions.y}
                    onChange={(e) => updateLocalField('dimensions', {
                      ...(localNebula.dimensions || { x: 100, y: 100, z: 100 }),
                      y: parseFloat(e.target.value)
                    })}
                    step="5"
                  />
                </div>
                
                <div className="nebula-field">
                  <label className="nebula-label">
                    Dimension Z
                  </label>
                  <input
                    type="number"
                    className="nebula-input"
                    value={localNebula.dimensions.z}
                    onChange={(e) => updateLocalField('dimensions', {
                      ...(localNebula.dimensions || { x: 100, y: 100, z: 100 }),
                      z: parseFloat(e.target.value)
                    })}
                    step="5"
                  />
                </div>
              </>
            )}
          </div>
        )}
        
        {/* Visual Tab */}
        {activeTab === 'visual' && (
          <div className="nebula-tab-content">
            <div className="nebula-field">
              <label className="nebula-label">
                Base Color
              </label>
              <div className="nebula-color-input-wrapper">
                <input
                  type="color"
                  className="nebula-color-input"
                  value={localNebula.baseColor}
                  onChange={(e) => updateLocalField('baseColor', e.target.value)}
                />
                <input
                  type="text"
                  className="nebula-input nebula-color-text"
                  value={localNebula.baseColor}
                  onChange={(e) => updateLocalField('baseColor', e.target.value)}
                />
              </div>
              <small className="nebula-hint">Dominant color of the nebula</small>
            </div>
            
            <div className="nebula-field">
              <label className="nebula-label">
                Accent Color
              </label>
              <div className="nebula-color-input-wrapper">
                <input
                  type="color"
                  className="nebula-color-input"
                  value={localNebula.accentColor}
                  onChange={(e) => updateLocalField('accentColor', e.target.value)}
                />
                <input
                  type="text"
                  className="nebula-input nebula-color-text"
                  value={localNebula.accentColor}
                  onChange={(e) => updateLocalField('accentColor', e.target.value)}
                />
              </div>
              <small className="nebula-hint">Highlight/edge color</small>
            </div>
            
            <div className="nebula-field">
              <label className="nebula-label">
                Brightness: {Math.round(localNebula.brightness * 100)}%
              </label>
              <input
                type="range"
                className="nebula-slider"
                min="0"
                max="1"
                step="0.05"
                value={localNebula.brightness}
                onChange={(e) => updateLocalField('brightness', parseFloat(e.target.value))}
              />
              <small className="nebula-hint">Emissive intensity</small>
            </div>
            
            <div className="nebula-field">
              <label className="nebula-label">
                Density: {Math.round(localNebula.density * 100)}%
              </label>
              <input
                type="range"
                className="nebula-slider"
                min="0"
                max="1"
                step="0.05"
                value={localNebula.density}
                onChange={(e) => updateLocalField('density', parseFloat(e.target.value))}
              />
              <small className="nebula-hint">Visual opacity/thickness</small>
            </div>
          </div>
        )}
        
        {/* Metadata Tab */}
        {activeTab === 'metadata' && (
          <div className="nebula-tab-content">
            <div className="nebula-field">
              <label className="nebula-label">
                Name
              </label>
              <input
                type="text"
                className="nebula-input"
                value={localNebula.name}
                onChange={(e) => updateLocalField('name', e.target.value)}
              />
            </div>
            
            <div className="nebula-field">
              <label className="nebula-label">
                ID
              </label>
              <input
                type="text"
                className="nebula-input"
                value={localNebula.id}
                disabled
                readOnly
              />
            </div>
            
            <div className="nebula-field">
              <label className="nebula-label">
                Position
              </label>
              <div className="nebula-position">
                <div>X: {localNebula.position.x.toFixed(2)}</div>
                <div>Y: {localNebula.position.y.toFixed(2)}</div>
                <div>Z: {localNebula.position.z.toFixed(2)}</div>
              </div>
            </div>
            
            {localNebula.associatedGroupIds && localNebula.associatedGroupIds.length > 0 && (
              <div className="nebula-field">
                <label className="nebula-label">
                  Associated Groups
                </label>
                <ul className="nebula-group-list">
                  {localNebula.associatedGroupIds.map((groupId: string, idx: number) => (
                    <li key={idx}>{groupId}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="nebula-field">
              <label className="nebula-label">
                Seed
              </label>
              <input
                type="text"
                className="nebula-input"
                value={String(localNebula.seed)}
                disabled
                readOnly
              />
              <small className="nebula-hint">Deterministic seed for noise generation</small>
            </div>
          </div>
        )}
      </div>
      
      <div className="nebula-editor-actions">
        <button className="nebula-btn nebula-btn-primary" onClick={handleApply}>
          Apply Changes
        </button>
        <button className="nebula-btn nebula-btn-secondary" onClick={handleReset}>
          Reset
        </button>
      </div>
    </div>
  );
};

