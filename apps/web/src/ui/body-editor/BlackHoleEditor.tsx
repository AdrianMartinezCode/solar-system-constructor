import React from 'react';
import type { Star, BlackHoleProperties } from '../../types';

interface BlackHoleEditorProps {
  body: Star;
  onUpdate: (field: string, value: any) => void;
}

export const BlackHoleEditor: React.FC<BlackHoleEditorProps> = ({ body, onUpdate }) => {
  // Only show for black holes
  if (body.bodyType !== 'blackHole' || !body.blackHole) {
    return null;
  }
  
  const bh = body.blackHole;
  
  const updateBHField = <K extends keyof BlackHoleProperties>(field: K, value: BlackHoleProperties[K]) => {
    onUpdate('blackHole', {
      ...bh,
      [field]: value,
    });
  };
  
  return (
    <div>
      <h5 style={{ marginTop: 0, marginBottom: '10px' }}>Black Hole Properties 🕳️</h5>
      
      {/* Core Presence Flags */}
      <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '4px' }}>
        <h6 style={{ marginTop: 0, marginBottom: '8px', fontSize: '0.9em' }}>Components</h6>
        
        <div className="form-group">
          <label className="generator-checkbox">
            <input
              type="checkbox"
              checked={bh.hasAccretionDisk}
              onChange={(e) => updateBHField('hasAccretionDisk', e.target.checked)}
            />
            <span>Accretion Disk</span>
          </label>
        </div>
        
        <div className="form-group">
          <label className="generator-checkbox">
            <input
              type="checkbox"
              checked={bh.hasRelativisticJet}
              onChange={(e) => updateBHField('hasRelativisticJet', e.target.checked)}
            />
            <span>Relativistic Jets</span>
          </label>
        </div>
        
        <div className="form-group">
          <label className="generator-checkbox">
            <input
              type="checkbox"
              checked={bh.hasPhotonRing}
              onChange={(e) => updateBHField('hasPhotonRing', e.target.checked)}
            />
            <span>Photon Ring</span>
          </label>
        </div>
        
        {bh.hasPhotonRing && (
          <div style={{ marginTop: '8px', marginLeft: '16px' }}>
            <div className="form-group">
              <label>Multi-Image Count (1-3)</label>
              <input
                type="number"
                value={bh.photonRingMultiImageCount ?? 3}
                onChange={(e) => updateBHField('photonRingMultiImageCount', Math.min(3, Math.max(1, Number(e.target.value))))}
                min="1"
                max="3"
                step="1"
              />
              <small>Number of lensed ring images</small>
            </div>
            <div className="form-group">
              <label>Ring Width</label>
              <input
                type="number"
                value={bh.photonRingWidth ?? 0.15}
                onChange={(e) => updateBHField('photonRingWidth', Number(e.target.value))}
                min="0.05"
                max="0.5"
                step="0.05"
              />
              <small>Width relative to shadow</small>
            </div>
          </div>
        )}
      </div>
      
      {/* Geometry Section */}
      <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'rgba(74,144,226,0.1)', borderRadius: '4px' }}>
        <h6 style={{ marginTop: 0, marginBottom: '8px', fontSize: '0.9em' }}>Geometry</h6>
        
        <div className="form-group">
          <label>Shadow Radius</label>
          <input
            type="number"
            value={bh.shadowRadius}
            onChange={(e) => updateBHField('shadowRadius', Number(e.target.value))}
            min="0.1"
            step="0.1"
          />
          <small>Event horizon visual size</small>
        </div>
        
        {bh.hasAccretionDisk && (
          <>
            <div className="form-group">
              <label>Disk Inner Radius</label>
              <input
                type="number"
                value={bh.accretionInnerRadius}
                onChange={(e) => updateBHField('accretionInnerRadius', Math.max(bh.shadowRadius * 1.1, Number(e.target.value)))}
                min={bh.shadowRadius * 1.1}
                step="0.1"
              />
              <small>Must be &gt; shadow radius</small>
            </div>
            
            <div className="form-group">
              <label>Disk Outer Radius</label>
              <input
                type="number"
                value={bh.accretionOuterRadius}
                onChange={(e) => updateBHField('accretionOuterRadius', Math.max(bh.accretionInnerRadius * 1.1, Number(e.target.value)))}
                min={bh.accretionInnerRadius * 1.1}
                step="0.5"
              />
              <small>Must be &gt; inner radius</small>
            </div>
            
            <div className="form-group">
              <label>Disk Thickness</label>
              <input
                type="number"
                value={bh.diskThickness}
                onChange={(e) => updateBHField('diskThickness', Number(e.target.value))}
                min="0"
                step="0.05"
              />
            </div>
          </>
        )}
      </div>
      
      {/* Accretion Disk Appearance */}
      {bh.hasAccretionDisk && (
        <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'rgba(226,144,74,0.1)', borderRadius: '4px' }}>
          <h6 style={{ marginTop: 0, marginBottom: '8px', fontSize: '0.9em' }}>Accretion Disk Appearance</h6>
          
          <div className="form-group">
            <label>Brightness: {bh.diskBrightness.toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={bh.diskBrightness}
              onChange={(e) => updateBHField('diskBrightness', Number(e.target.value))}
            />
          </div>
          
          <div className="form-group">
            <label>Opacity: {bh.diskOpacity.toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={bh.diskOpacity}
              onChange={(e) => updateBHField('diskOpacity', Number(e.target.value))}
            />
          </div>
          
          <div className="form-group">
            <label>Temperature (K)</label>
            <input
              type="number"
              value={Math.round(bh.diskTemperature)}
              onChange={(e) => updateBHField('diskTemperature', Number(e.target.value))}
              min="1000"
              max="50000"
              step="1000"
            />
            <small>Color temperature gradient</small>
          </div>
          
          <div className="form-group">
            <label>Clumpiness: {bh.diskClumpiness.toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={bh.diskClumpiness}
              onChange={(e) => updateBHField('diskClumpiness', Number(e.target.value))}
            />
            <small>Density variation</small>
          </div>
          
          <div className="form-group">
            <label>Streakiness: {(bh.diskStreakiness ?? 0.5).toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={bh.diskStreakiness ?? 0.5}
              onChange={(e) => updateBHField('diskStreakiness', Number(e.target.value))}
            />
            <small>Spiral pattern strength</small>
          </div>
          
          <div className="form-group">
            <label>Turbulence Scale: {(bh.diskTurbulenceScale ?? 0.5).toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={bh.diskTurbulenceScale ?? 0.5}
              onChange={(e) => updateBHField('diskTurbulenceScale', Number(e.target.value))}
            />
            <small>Noise detail level</small>
          </div>
        </div>
      )}
      
      {/* Jet Parameters */}
      {bh.hasRelativisticJet && (
        <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'rgba(144,226,74,0.1)', borderRadius: '4px' }}>
          <h6 style={{ marginTop: 0, marginBottom: '8px', fontSize: '0.9em' }}>Relativistic Jets</h6>
          
          <div className="form-group">
            <label>Jet Length</label>
            <input
              type="number"
              value={bh.jetLength}
              onChange={(e) => updateBHField('jetLength', Number(e.target.value))}
              min="5"
              step="5"
            />
          </div>
          
          <div className="form-group">
            <label>Jet Opening Angle (degrees)</label>
            <input
              type="number"
              value={bh.jetOpeningAngle}
              onChange={(e) => updateBHField('jetOpeningAngle', Number(e.target.value))}
              min="1"
              max="30"
              step="0.5"
            />
          </div>
          
          <div className="form-group">
            <label>Jet Brightness: {bh.jetBrightness.toFixed(2)}</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={bh.jetBrightness}
              onChange={(e) => updateBHField('jetBrightness', Number(e.target.value))}
            />
          </div>
          
          <div className="form-group">
            <label>Gradient Power</label>
            <input
              type="number"
              value={bh.jetGradientPower ?? 2.0}
              onChange={(e) => updateBHField('jetGradientPower', Number(e.target.value))}
              min="0.5"
              max="4"
              step="0.1"
            />
            <small>Falloff rate (lower = slower fade)</small>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Base Color</label>
              <input
                type="color"
                value={bh.jetBaseColor ?? '#e8f4ff'}
                onChange={(e) => updateBHField('jetBaseColor', e.target.value)}
              />
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Tip Color</label>
              <input
                type="color"
                value={bh.jetTipColor ?? '#4488ff'}
                onChange={(e) => updateBHField('jetTipColor', e.target.value)}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Physical Parameters */}
      <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'rgba(226,74,144,0.1)', borderRadius: '4px' }}>
        <h6 style={{ marginTop: 0, marginBottom: '8px', fontSize: '0.9em' }}>Physical Parameters</h6>
        
        <div className="form-group">
          <label>Spin Parameter: {bh.spin.toFixed(2)}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={bh.spin}
            onChange={(e) => updateBHField('spin', Number(e.target.value))}
          />
          <small>0 = Schwarzschild, 1 = extremal Kerr</small>
        </div>
      </div>
      
      {/* Relativistic Effects */}
      <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'rgba(144,74,226,0.1)', borderRadius: '4px' }}>
        <h6 style={{ marginTop: 0, marginBottom: '8px', fontSize: '0.9em' }}>Relativistic FX</h6>
        
        <div className="form-group">
          <label>Doppler Beaming: {bh.dopplerBeamingStrength.toFixed(2)}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={bh.dopplerBeamingStrength}
            onChange={(e) => updateBHField('dopplerBeamingStrength', Number(e.target.value))}
          />
        </div>
        
        <div className="form-group">
          <label>Lensing Strength: {bh.lensingStrength.toFixed(2)}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={bh.lensingStrength}
            onChange={(e) => updateBHField('lensingStrength', Number(e.target.value))}
          />
        </div>
      </div>
      
      {/* Animation */}
      <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'rgba(74,226,144,0.1)', borderRadius: '4px' }}>
        <h6 style={{ marginTop: 0, marginBottom: '8px', fontSize: '0.9em' }}>Animation</h6>
        
        <div className="form-group">
          <label>Rotation Speed Multiplier</label>
          <input
            type="number"
            value={bh.rotationSpeedMultiplier}
            onChange={(e) => updateBHField('rotationSpeedMultiplier', Number(e.target.value))}
            min="0.1"
            max="3"
            step="0.1"
          />
          <small>Disk rotation speed (scales with global time)</small>
        </div>
      </div>
      
      {/* Disk Orientation */}
      <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'rgba(226,74,144,0.1)', borderRadius: '4px' }}>
        <h6 style={{ marginTop: 0, marginBottom: '8px', fontSize: '0.9em' }}>Disk Orientation</h6>
        
        <div className="form-group">
          <label>Disk Tilt (degrees)</label>
          <input
            type="number"
            value={bh.diskTilt !== undefined ? Math.round((bh.diskTilt * 180) / Math.PI) : 0}
            onChange={(e) => updateBHField('diskTilt', (Number(e.target.value) * Math.PI) / 180)}
            min="0"
            max="90"
            step="5"
          />
          <small>0° = face-on, 90° = edge-on</small>
        </div>
        
        <div className="form-group">
          <label>Tilt Axis Angle (degrees)</label>
          <input
            type="number"
            value={bh.diskTiltAxisAngle !== undefined ? Math.round((bh.diskTiltAxisAngle * 180) / Math.PI) : 0}
            onChange={(e) => updateBHField('diskTiltAxisAngle', (Number(e.target.value) * Math.PI) / 180)}
            min="0"
            max="360"
            step="15"
          />
          <small>Direction of tilt axis (0-360°)</small>
        </div>
      </div>
      
      <div className="form-group">
        <label>Seed: {bh.seed}</label>
        <small>Deterministic noise/variation</small>
      </div>
    </div>
  );
};

