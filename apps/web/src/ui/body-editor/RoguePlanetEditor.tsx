import React from 'react';
import type { Star, RoguePlanetMeta } from '../../types';

interface RoguePlanetEditorProps {
  body: Star;
  onUpdate: (field: string, value: any) => void;
}

export const RoguePlanetEditor: React.FC<RoguePlanetEditorProps> = ({ body, onUpdate }) => {
  // Only show for rogue planets
  if (!body.isRoguePlanet || !body.roguePlanet) {
    return null;
  }
  
  const rogue = body.roguePlanet;
  
  const updateRogueField = <K extends keyof RoguePlanetMeta>(field: K, value: RoguePlanetMeta[K]) => {
    onUpdate('roguePlanet', {
      ...rogue,
      [field]: value,
    });
  };
  
  return (
    <div>
      <h5 style={{ marginTop: 0, marginBottom: '10px' }}>Rogue Trajectory 🌌</h5>
      
      {/* Velocity Components */}
      <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'rgba(74,144,226,0.1)', borderRadius: '4px' }}>
        <h6 style={{ marginTop: 0, marginBottom: '8px', fontSize: '0.9em' }}>Linear Velocity</h6>
        
        <div className="form-group">
          <label>Velocity X</label>
          <input
            type="number"
            value={rogue.velocity.x}
            onChange={(e) => updateRogueField('velocity', {
              ...rogue.velocity,
              x: Number(e.target.value)
            })}
            step="0.001"
          />
        </div>
        
        <div className="form-group">
          <label>Velocity Y</label>
          <input
            type="number"
            value={rogue.velocity.y}
            onChange={(e) => updateRogueField('velocity', {
              ...rogue.velocity,
              y: Number(e.target.value)
            })}
            step="0.001"
          />
        </div>
        
        <div className="form-group">
          <label>Velocity Z</label>
          <input
            type="number"
            value={rogue.velocity.z}
            onChange={(e) => updateRogueField('velocity', {
              ...rogue.velocity,
              z: Number(e.target.value)
            })}
            step="0.001"
          />
        </div>
      </div>
      
      {/* Path Curvature */}
      <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'rgba(226,144,74,0.1)', borderRadius: '4px' }}>
        <h6 style={{ marginTop: 0, marginBottom: '8px', fontSize: '0.9em' }}>Path Curvature</h6>
        
        <div className="form-group">
          <label>Curvature: {((rogue.pathCurvature || 0) * 100).toFixed(0)}%</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={rogue.pathCurvature || 0}
            onChange={(e) => updateRogueField('pathCurvature', Number(e.target.value))}
          />
          <small>0 = linear, 1 = strongly curved</small>
        </div>
        
        {/* Curved Path Parameters (only shown if curvature > 0) */}
        {(rogue.pathCurvature || 0) > 0 && (
          <>
            <div className="form-group">
              <label>Semi-Major Axis</label>
              <input
                type="number"
                value={rogue.semiMajorAxis || 100}
                onChange={(e) => updateRogueField('semiMajorAxis', Number(e.target.value))}
                min="10"
                step="10"
              />
              <small>Size of curved path</small>
            </div>
            
            <div className="form-group">
              <label>Eccentricity (0-0.99)</label>
              <input
                type="number"
                value={rogue.eccentricity || 0}
                onChange={(e) => updateRogueField('eccentricity', Math.min(0.99, Math.max(0, Number(e.target.value))))}
                min="0"
                max="0.99"
                step="0.01"
              />
            </div>
            
            <div className="form-group">
              <label>Path Period (seconds)</label>
              <input
                type="number"
                value={rogue.pathPeriod || 500}
                onChange={(e) => updateRogueField('pathPeriod', Number(e.target.value))}
                min="100"
                step="50"
              />
              <small>Time to complete one loop</small>
            </div>
            
            <h6 style={{ marginTop: '10px', marginBottom: '5px', fontSize: '0.85em' }}>Path Orientation</h6>
            
            <div className="form-group">
              <label>Inclination (X rotation, degrees)</label>
              <input
                type="number"
                value={rogue.orbitRotX || 0}
                onChange={(e) => updateRogueField('orbitRotX', Number(e.target.value))}
                min="0"
                max="90"
                step="1"
              />
            </div>
            
            <div className="form-group">
              <label>Y Rotation (degrees)</label>
              <input
                type="number"
                value={rogue.orbitRotY || 0}
                onChange={(e) => updateRogueField('orbitRotY', Number(e.target.value))}
                min="-180"
                max="180"
                step="1"
              />
            </div>
            
            <div className="form-group">
              <label>Z Rotation (degrees)</label>
              <input
                type="number"
                value={rogue.orbitRotZ || 0}
                onChange={(e) => updateRogueField('orbitRotZ', Number(e.target.value))}
                min="-180"
                max="180"
                step="1"
              />
            </div>
            
            <h6 style={{ marginTop: '10px', marginBottom: '5px', fontSize: '0.85em' }}>Path Center Offset</h6>
            
            <div className="form-group">
              <label>Offset X</label>
              <input
                type="number"
                value={rogue.pathOffsetX || 0}
                onChange={(e) => updateRogueField('pathOffsetX', Number(e.target.value))}
                step="5"
              />
            </div>
            
            <div className="form-group">
              <label>Offset Y</label>
              <input
                type="number"
                value={rogue.pathOffsetY || 0}
                onChange={(e) => updateRogueField('pathOffsetY', Number(e.target.value))}
                step="5"
              />
            </div>
            
            <div className="form-group">
              <label>Offset Z</label>
              <input
                type="number"
                value={rogue.pathOffsetZ || 0}
                onChange={(e) => updateRogueField('pathOffsetZ', Number(e.target.value))}
                step="5"
              />
            </div>
          </>
        )}
      </div>
      
      {/* Trajectory Visualization */}
      <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'rgba(144,74,226,0.1)', borderRadius: '4px' }}>
        <h6 style={{ marginTop: 0, marginBottom: '8px', fontSize: '0.9em' }}>Trajectory Visualization</h6>
        
        <div className="form-group">
          <label className="generator-checkbox">
            <input
              type="checkbox"
              checked={rogue.showTrajectory ?? true}
              onChange={(e) => updateRogueField('showTrajectory', e.target.checked)}
            />
            <span>Show Trajectory</span>
          </label>
        </div>
        
        {(rogue.showTrajectory ?? true) && (
          <>
            <div className="form-group">
              <label>Past Window</label>
              <input
                type="number"
                value={rogue.trajectoryPastWindow || 100}
                onChange={(e) => updateRogueField('trajectoryPastWindow', Number(e.target.value))}
                min="10"
                step="10"
              />
              <small>Length of past trajectory (seconds)</small>
            </div>
            
            <div className="form-group">
              <label>Future Window</label>
              <input
                type="number"
                value={rogue.trajectoryFutureWindow || 100}
                onChange={(e) => updateRogueField('trajectoryFutureWindow', Number(e.target.value))}
                min="10"
                step="10"
              />
              <small>Length of future trajectory (seconds)</small>
            </div>
          </>
        )}
      </div>
      
      {/* Initial Position (read-only for now) */}
      <div className="form-group">
        <label>Initial Position</label>
        <div style={{ display: 'flex', gap: '5px', fontSize: '0.85em', color: 'rgba(255,255,255,0.6)' }}>
          <span>X: {rogue.initialPosition.x.toFixed(2)}</span>
          <span>Y: {rogue.initialPosition.y.toFixed(2)}</span>
          <span>Z: {rogue.initialPosition.z.toFixed(2)}</span>
        </div>
        <small>World-space position at t=0 (read-only)</small>
      </div>
      
      {rogue.colorOverride && (
        <div className="form-group">
          <label>Color Override</label>
          <input
            type="color"
            value={rogue.colorOverride}
            onChange={(e) => updateRogueField('colorOverride', e.target.value)}
          />
        </div>
      )}
      
      <div className="form-group">
        <label>Seed: {rogue.seed}</label>
        <small>Deterministic per-rogue RNG seed</small>
      </div>
    </div>
  );
};

