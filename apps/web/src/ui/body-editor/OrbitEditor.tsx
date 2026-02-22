import React, { useState, useEffect } from 'react';
import type { Star } from '../../types';

interface OrbitEditorProps {
  body: Star;
  onUpdate: (field: string, value: any) => void;
}

type OrbitMode = 'simple' | 'advanced';

export const OrbitEditor: React.FC<OrbitEditorProps> = ({ body, onUpdate }) => {
  // Determine initial mode based on whether advanced parameters exist
  const hasAdvancedOrbit = (
    (body.eccentricity !== undefined && body.eccentricity > 0) ||
    (body.orbitOffsetX !== undefined && body.orbitOffsetX !== 0) ||
    (body.orbitOffsetY !== undefined && body.orbitOffsetY !== 0) ||
    (body.orbitOffsetZ !== undefined && body.orbitOffsetZ !== 0) ||
    (body.orbitRotX !== undefined && body.orbitRotX !== 0) ||
    (body.orbitRotY !== undefined && body.orbitRotY !== 0) ||
    (body.orbitRotZ !== undefined && body.orbitRotZ !== 0)
  );
  
  const [orbitMode, setOrbitMode] = useState<OrbitMode>(hasAdvancedOrbit ? 'advanced' : 'simple');
  
  // Update mode when body changes (e.g., selection change)
  useEffect(() => {
    const newHasAdvanced = (
      (body.eccentricity !== undefined && body.eccentricity > 0) ||
      (body.orbitOffsetX !== undefined && body.orbitOffsetX !== 0) ||
      (body.orbitOffsetY !== undefined && body.orbitOffsetY !== 0) ||
      (body.orbitOffsetZ !== undefined && body.orbitOffsetZ !== 0) ||
      (body.orbitRotX !== undefined && body.orbitRotX !== 0) ||
      (body.orbitRotY !== undefined && body.orbitRotY !== 0) ||
      (body.orbitRotZ !== undefined && body.orbitRotZ !== 0)
    );
    setOrbitMode(newHasAdvanced ? 'advanced' : 'simple');
  }, [body.id, body.eccentricity, body.orbitOffsetX, body.orbitOffsetY, body.orbitOffsetZ, body.orbitRotX, body.orbitRotY, body.orbitRotZ]);
  
  const handleOrbitModeChange = (mode: OrbitMode) => {
    if (mode === 'simple' && hasAdvancedOrbit) {
      // Confirm before resetting advanced parameters
      if (!confirm('Switching to simple mode will reset advanced orbit parameters. Continue?')) {
        return;
      }
      // Reset advanced parameters in a single batch update
      onUpdate('eccentricity', 0);
      onUpdate('orbitOffsetX', 0);
      onUpdate('orbitOffsetY', 0);
      onUpdate('orbitOffsetZ', 0);
      onUpdate('orbitRotX', 0);
      onUpdate('orbitRotY', 0);
      onUpdate('orbitRotZ', 0);
    }
    setOrbitMode(mode);
  };
  
  // Don't show orbit editor if body has no parent (root) or is a rogue planet
  if (!body.parentId || body.isRoguePlanet) {
    return null;
  }
  
  return (
    <div>
      <h5 style={{ marginTop: 0, marginBottom: '10px' }}>Orbit Parameters</h5>
      
      {/* Orbit Mode Toggle */}
      <div className="form-group orbit-mode-toggle">
        <label>Orbit Mode</label>
        <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
          <button 
            className={`btn-toggle ${orbitMode === 'simple' ? 'active' : ''}`}
            onClick={() => handleOrbitModeChange('simple')}
            style={{ flex: 1 }}
          >
            Simple Circular
          </button>
          <button 
            className={`btn-toggle ${orbitMode === 'advanced' ? 'active' : ''}`}
            onClick={() => setOrbitMode('advanced')}
            style={{ flex: 1 }}
          >
            Advanced Elliptical
          </button>
        </div>
        {hasAdvancedOrbit && orbitMode === 'simple' && (
          <small style={{ color: '#ff9800' }}>⚠ This orbit has advanced parameters. Switching to simple mode will reset them.</small>
        )}
      </div>
      
      {orbitMode === 'simple' ? (
        <>
          {/* Simple Circular Orbit Controls */}
          <div className="form-group">
            <label>Orbital Distance</label>
            <input
              type="number"
              value={body.orbitalDistance}
              onChange={(e) => onUpdate('orbitalDistance', Number(e.target.value))}
              min="1"
              step="1"
            />
          </div>
          
          <div className="form-group">
            <label>Orbital Speed (deg/sec)</label>
            <input
              type="number"
              value={body.orbitalSpeed}
              onChange={(e) => onUpdate('orbitalSpeed', Number(e.target.value))}
              min="0.1"
              step="0.1"
            />
          </div>
          
          <div className="form-group">
            <label>Orbital Phase (degrees)</label>
            <input
              type="number"
              value={body.orbitalPhase}
              onChange={(e) => onUpdate('orbitalPhase', Number(e.target.value))}
              min="0"
              max="360"
              step="1"
            />
            <small>Phase offset for n-ary systems (0-360°)</small>
          </div>
        </>
      ) : (
        <>
          {/* Advanced Elliptical Orbit Controls */}
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: 'rgba(74, 144, 226, 0.1)', borderRadius: '5px' }}>
            <h6 style={{ marginTop: 0, marginBottom: '10px' }}>Orbit Shape</h6>
            
            <div className="form-group">
              <label>Semi-Major Axis (a)</label>
              <input
                type="number"
                value={body.semiMajorAxis ?? body.orbitalDistance}
                onChange={(e) => onUpdate('semiMajorAxis', Number(e.target.value))}
                min="1"
                step="1"
              />
              <small>Main orbital radius</small>
            </div>
            
            <div className="form-group">
              <label>Eccentricity (e)</label>
              <input
                type="number"
                value={body.eccentricity ?? 0}
                onChange={(e) => onUpdate('eccentricity', Number(e.target.value))}
                min="0"
                max="0.99"
                step="0.01"
              />
              <small>0 = circular, 0.99 = highly elliptical</small>
            </div>
            
            <div className="form-group">
              <label>Orbital Speed (deg/sec)</label>
              <input
                type="number"
                value={body.orbitalSpeed}
                onChange={(e) => onUpdate('orbitalSpeed', Number(e.target.value))}
                min="0.1"
                step="0.1"
              />
            </div>
            
            <div className="form-group">
              <label>Orbital Phase (degrees)</label>
              <input
                type="number"
                value={body.orbitalPhase}
                onChange={(e) => onUpdate('orbitalPhase', Number(e.target.value))}
                min="0"
                max="360"
                step="1"
              />
            </div>
          </div>
          
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: 'rgba(144, 74, 226, 0.1)', borderRadius: '5px' }}>
            <h6 style={{ marginTop: 0, marginBottom: '10px' }}>Orbit Center Offset</h6>
            
            <div className="form-group">
              <label>Offset X</label>
              <input
                type="number"
                value={body.orbitOffsetX ?? 0}
                onChange={(e) => onUpdate('orbitOffsetX', Number(e.target.value))}
                step="0.5"
              />
            </div>
            
            <div className="form-group">
              <label>Offset Y</label>
              <input
                type="number"
                value={body.orbitOffsetY ?? 0}
                onChange={(e) => onUpdate('orbitOffsetY', Number(e.target.value))}
                step="0.5"
              />
            </div>
            
            <div className="form-group">
              <label>Offset Z</label>
              <input
                type="number"
                value={body.orbitOffsetZ ?? 0}
                onChange={(e) => onUpdate('orbitOffsetZ', Number(e.target.value))}
                step="0.5"
              />
            </div>
            <small>3D translation of ellipse center</small>
          </div>
          
          <div style={{ marginTop: '10px', padding: '10px', backgroundColor: 'rgba(226, 144, 74, 0.1)', borderRadius: '5px' }}>
            <h6 style={{ marginTop: 0, marginBottom: '10px' }}>Orbit Plane Rotation</h6>
            
            <div className="form-group">
              <label>Rotation X (degrees)</label>
              <input
                type="number"
                value={body.orbitRotX ?? 0}
                onChange={(e) => onUpdate('orbitRotX', Number(e.target.value))}
                min="-180"
                max="180"
                step="1"
              />
              <small>Inclination-like tilt</small>
            </div>
            
            <div className="form-group">
              <label>Rotation Y (degrees)</label>
              <input
                type="number"
                value={body.orbitRotY ?? 0}
                onChange={(e) => onUpdate('orbitRotY', Number(e.target.value))}
                min="-180"
                max="180"
                step="1"
              />
            </div>
            
            <div className="form-group">
              <label>Rotation Z (degrees)</label>
              <input
                type="number"
                value={body.orbitRotZ ?? 0}
                onChange={(e) => onUpdate('orbitRotZ', Number(e.target.value))}
                min="-180"
                max="180"
                step="1"
              />
              <small>Ascending node-like rotation</small>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

