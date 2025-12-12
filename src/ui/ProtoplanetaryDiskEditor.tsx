import React, { useState } from 'react';
import type { ProtoplanetaryDisk } from '../types';
import './StarEditorPanel.css';

interface ProtoplanetaryDiskEditorProps {
  disk: ProtoplanetaryDisk;
  onUpdate: <K extends keyof ProtoplanetaryDisk>(field: K, value: ProtoplanetaryDisk[K]) => void;
  compact?: boolean; // For inline display in StarEditorPanel
}

/**
 * Reusable protoplanetary disk editor component.
 * Can be used standalone or embedded in other editors.
 */
export const ProtoplanetaryDiskEditor: React.FC<ProtoplanetaryDiskEditorProps> = ({
  disk,
  onUpdate,
  compact = false,
}) => {
  const [activeTab, setActiveTab] = useState<'color' | 'bands' | 'effects' | 'metadata'>('color');
  
  return (
    <div className="edit-form" style={{ marginTop: 0 }}>
      {!compact && (
        <div style={{ marginBottom: '1rem' }}>
          <h4 style={{ margin: 0, fontSize: '1rem' }}>💿 {disk.name || 'Protoplanetary Disk'}</h4>
        </div>
      )}
      
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
        <button
          className={`btn-toggle ${activeTab === 'color' ? 'active' : ''}`}
          onClick={() => setActiveTab('color')}
        >
          Colors
        </button>
        <button
          className={`btn-toggle ${activeTab === 'bands' ? 'active' : ''}`}
          onClick={() => setActiveTab('bands')}
        >
          Bands
        </button>
        <button
          className={`btn-toggle ${activeTab === 'effects' ? 'active' : ''}`}
          onClick={() => setActiveTab('effects')}
        >
          Effects
        </button>
        {!compact && (
          <button
            className={`btn-toggle ${activeTab === 'metadata' ? 'active' : ''}`}
            onClick={() => setActiveTab('metadata')}
          >
            Info
          </button>
        )}
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Colors Tab */}
        {activeTab === 'color' && (
          <>
            <div className="form-group">
              <label>Base Color (Outer, Cooler)</label>
              <input
                type="color"
                value={disk.baseColor}
                onChange={(e) => onUpdate('baseColor', e.target.value)}
              />
              <small>Dusty color for outer disk regions</small>
            </div>
            
            <div className="form-group">
              <label>Highlight Color (Inner, Hotter)</label>
              <input
                type="color"
                value={disk.highlightColor}
                onChange={(e) => onUpdate('highlightColor', e.target.value)}
              />
              <small>Hot emission color near the star</small>
            </div>
            
            <div className="form-group">
              <label>Brightness: {Math.round((disk.brightness ?? 0.5) * 100)}%</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={disk.brightness ?? 0.5}
                onChange={(e) => onUpdate('brightness', parseFloat(e.target.value))}
              />
              <small>Overall emissive intensity</small>
            </div>
            
            <div className="form-group">
              <label>Opacity: {Math.round((disk.opacity ?? 0.5) * 100)}%</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={disk.opacity ?? 0.5}
                onChange={(e) => onUpdate('opacity', parseFloat(e.target.value))}
              />
              <small>Transparency of the disk</small>
            </div>
            
            <div className="form-group">
              <label>Temperature Gradient: {(disk.temperatureGradient ?? 1.5).toFixed(1)}</label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={disk.temperatureGradient ?? 1.5}
                onChange={(e) => onUpdate('temperatureGradient', parseFloat(e.target.value))}
              />
              <small>How quickly color changes from inner to outer</small>
            </div>
            
            <div className="form-group">
              <label>Inner Glow: {Math.round((disk.innerGlowStrength ?? 0.6) * 100)}%</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={disk.innerGlowStrength ?? 0.6}
                onChange={(e) => onUpdate('innerGlowStrength', parseFloat(e.target.value))}
              />
              <small>Extra brightness at inner edge</small>
            </div>
          </>
        )}
        
        {/* Bands Tab */}
        {activeTab === 'bands' && (
          <>
            <div className="form-group">
              <label>Inner Radius: {disk.innerRadius.toFixed(2)}</label>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.1"
                value={disk.innerRadius}
                onChange={(e) => onUpdate('innerRadius', parseFloat(e.target.value))}
              />
              <small>Distance from star to inner edge</small>
            </div>
            
            <div className="form-group">
              <label>Outer Radius: {disk.outerRadius.toFixed(2)}</label>
              <input
                type="range"
                min="2"
                max="20"
                step="0.5"
                value={disk.outerRadius}
                onChange={(e) => onUpdate('outerRadius', parseFloat(e.target.value))}
              />
              <small>Distance from star to outer edge</small>
            </div>
            
            <div className="form-group">
              <label>Thickness: {disk.thickness.toFixed(2)}</label>
              <input
                type="range"
                min="0.1"
                max="2"
                step="0.05"
                value={disk.thickness}
                onChange={(e) => onUpdate('thickness', parseFloat(e.target.value))}
              />
              <small>Vertical thickness of the disk</small>
            </div>
            
            <div className="form-group">
              <label>Band Strength: {Math.round((disk.bandStrength ?? 0.5) * 100)}%</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={disk.bandStrength ?? 0.5}
                onChange={(e) => onUpdate('bandStrength', parseFloat(e.target.value))}
              />
              <small>How prominent the concentric rings are</small>
            </div>
            
            <div className="form-group">
              <label>Band Frequency: {disk.bandFrequency ?? 5}</label>
              <input
                type="range"
                min="2"
                max="12"
                step="1"
                value={disk.bandFrequency ?? 5}
                onChange={(e) => onUpdate('bandFrequency', parseInt(e.target.value))}
              />
              <small>Number of visible bright/dark rings</small>
            </div>
            
            <div className="form-group">
              <label>Gap Sharpness: {Math.round((disk.gapSharpness ?? 0.5) * 100)}%</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={disk.gapSharpness ?? 0.5}
                onChange={(e) => onUpdate('gapSharpness', parseFloat(e.target.value))}
              />
              <small>How sharp the dark gaps between rings are</small>
            </div>
            
            <div className="form-group">
              <label>Edge Softness: {Math.round((disk.edgeSoftness ?? 0.4) * 100)}%</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={disk.edgeSoftness ?? 0.4}
                onChange={(e) => onUpdate('edgeSoftness', parseFloat(e.target.value))}
              />
              <small>How soft/diffuse the outer edge is</small>
            </div>
          </>
        )}
        
        {/* Effects Tab */}
        {activeTab === 'effects' && (
          <>
            <div className="form-group">
              <label>Clumpiness: {Math.round((disk.clumpiness ?? 0.3) * 100)}%</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={disk.clumpiness ?? 0.3}
                onChange={(e) => onUpdate('clumpiness', parseFloat(e.target.value))}
              />
              <small>Density variation / turbulence</small>
            </div>
            
            <div className="form-group">
              <label>Noise Scale: {(disk.noiseScale ?? 1.5).toFixed(1)}</label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={disk.noiseScale ?? 1.5}
                onChange={(e) => onUpdate('noiseScale', parseFloat(e.target.value))}
              />
              <small>Scale of noise patterns</small>
            </div>
            
            <div className="form-group">
              <label>Noise Strength: {Math.round((disk.noiseStrength ?? 0.4) * 100)}%</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={disk.noiseStrength ?? 0.4}
                onChange={(e) => onUpdate('noiseStrength', parseFloat(e.target.value))}
              />
              <small>How much noise affects appearance</small>
            </div>
            
            <div className="form-group">
              <label>Spiral Strength: {Math.round((disk.spiralStrength ?? 0.1) * 100)}%</label>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.05"
                value={disk.spiralStrength ?? 0.1}
                onChange={(e) => onUpdate('spiralStrength', parseFloat(e.target.value))}
              />
              <small>Subtle spiral arm perturbation</small>
            </div>
            
            {(disk.spiralStrength ?? 0) > 0.05 && (
              <div className="form-group">
                <label>Spiral Arms: {disk.spiralArmCount ?? 2}</label>
                <input
                  type="range"
                  min="1"
                  max="4"
                  step="1"
                  value={disk.spiralArmCount ?? 2}
                  onChange={(e) => onUpdate('spiralArmCount', parseInt(e.target.value))}
                />
                <small>Number of spiral arms</small>
              </div>
            )}
            
            <div className="form-group">
              <label>Rotation Speed: {(disk.rotationSpeedMultiplier ?? 0.3).toFixed(2)}</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={disk.rotationSpeedMultiplier ?? 0.3}
                onChange={(e) => onUpdate('rotationSpeedMultiplier', parseFloat(e.target.value))}
              />
              <small>Visual rotation speed</small>
            </div>
          </>
        )}
        
        {/* Metadata Tab */}
        {!compact && activeTab === 'metadata' && (
          <>
            <div className="form-group">
              <label>Name</label>
              <input
                type="text"
                value={disk.name || ''}
                onChange={(e) => onUpdate('name', e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label>Style</label>
              <select
                value={disk.style}
                onChange={(e) => onUpdate('style', e.target.value as ProtoplanetaryDisk['style'])}
              >
                <option value="thin">Thin</option>
                <option value="moderate">Moderate</option>
                <option value="thick">Thick</option>
                <option value="extreme">Extreme</option>
              </select>
              <small>Overall disk style preset</small>
            </div>
            
            <div className="form-group">
              <label>Geometry (editable in Bands tab)</label>
              <div style={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem' }}>
                <div>Inner Radius: {disk.innerRadius.toFixed(2)}</div>
                <div>Outer Radius: {disk.outerRadius.toFixed(2)}</div>
                <div>Thickness: {disk.thickness.toFixed(2)}</div>
              </div>
            </div>
            
            <div className="form-group">
              <label>ID</label>
              <input
                type="text"
                value={disk.id}
                disabled
                readOnly
              />
            </div>
            
            <div className="form-group">
              <label>Central Star ID</label>
              <input
                type="text"
                value={disk.centralStarId}
                disabled
                readOnly
              />
            </div>
            
            <div className="form-group">
              <label>Seed</label>
              <input
                type="text"
                value={String(disk.seed)}
                disabled
                readOnly
              />
              <small>Deterministic seed for noise generation</small>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

