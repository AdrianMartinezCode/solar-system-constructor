import React from 'react';
import type { Star, CometMeta } from '../../types';

interface CometEditorProps {
  body: Star;
  onUpdate: (field: string, value: any) => void;
}

export const CometEditor: React.FC<CometEditorProps> = ({ body, onUpdate }) => {
  // Only show for comets
  if (body.bodyType !== 'comet' || !body.comet) {
    return null;
  }
  
  const comet = body.comet;
  
  const updateCometField = <K extends keyof CometMeta>(field: K, value: CometMeta[K]) => {
    onUpdate('comet', {
      ...comet,
      [field]: value,
    });
  };
  
  return (
    <div>
      <h5 style={{ marginTop: 0, marginBottom: '10px' }}>Comet Properties ☄️</h5>
      
      {/* Orbital Characterization */}
      <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'rgba(74,144,226,0.1)', borderRadius: '4px' }}>
        <h6 style={{ marginTop: 0, marginBottom: '8px', fontSize: '0.9em' }}>Orbital Type</h6>
        
        <div className="form-group">
          <label className="generator-checkbox">
            <input
              type="checkbox"
              checked={comet.isPeriodic}
              onChange={(e) => updateCometField('isPeriodic', e.target.checked)}
            />
            <span>Periodic Comet</span>
          </label>
          <small>Short/long-period vs single-pass</small>
        </div>
        
        <div className="form-group">
          <label>Perihelion Distance</label>
          <input
            type="number"
            value={comet.perihelionDistance}
            onChange={(e) => updateCometField('perihelionDistance', Number(e.target.value))}
            min="0.1"
            step="0.5"
          />
          <small>Closest approach to parent body</small>
        </div>
        
        <div className="form-group">
          <label>Aphelion Distance</label>
          <input
            type="number"
            value={comet.aphelionDistance}
            onChange={(e) => updateCometField('aphelionDistance', Number(e.target.value))}
            min="1"
            step="1"
          />
          <small>Farthest distance from parent body</small>
        </div>
      </div>
      
      {/* Tail Visual Parameters */}
      <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'rgba(226,144,74,0.1)', borderRadius: '4px' }}>
        <h6 style={{ marginTop: 0, marginBottom: '8px', fontSize: '0.9em' }}>Tail Appearance</h6>
        
        <div className="form-group">
          <label className="generator-checkbox">
            <input
              type="checkbox"
              checked={comet.hasTail}
              onChange={(e) => updateCometField('hasTail', e.target.checked)}
            />
            <span>Has Tail</span>
          </label>
          <small>Toggle tail visibility (allow "dead" comets)</small>
        </div>
        
        {comet.hasTail && (
          <>
            <div className="form-group">
              <label>Tail Length Base</label>
              <input
                type="number"
                value={comet.tailLengthBase}
                onChange={(e) => updateCometField('tailLengthBase', Number(e.target.value))}
                min="1"
                step="1"
              />
              <small>Base scalar for tail length</small>
            </div>
            
            <div className="form-group">
              <label>Tail Width Base</label>
              <input
                type="number"
                value={comet.tailWidthBase}
                onChange={(e) => updateCometField('tailWidthBase', Number(e.target.value))}
                min="0.1"
                step="0.1"
              />
              <small>Base width / radius of tail</small>
            </div>
            
            <div className="form-group">
              <label>Tail Color</label>
              <input
                type="color"
                value={comet.tailColor}
                onChange={(e) => updateCometField('tailColor', e.target.value)}
              />
            </div>
            
            <div className="form-group">
              <label>Tail Opacity (0-1)</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={comet.tailOpacityBase}
                onChange={(e) => updateCometField('tailOpacityBase', Number(e.target.value))}
              />
              <small>{comet.tailOpacityBase.toFixed(2)} - base opacity</small>
            </div>
            
            <div className="form-group">
              <label>Activity Falloff Distance</label>
              <input
                type="number"
                value={comet.activityFalloffDistance}
                onChange={(e) => updateCometField('activityFalloffDistance', Number(e.target.value))}
                min="1"
                step="5"
              />
              <small>Distance beyond which tail fades strongly</small>
            </div>
          </>
        )}
      </div>
      
      {/* Metadata */}
      {comet.lastPerihelionTime !== undefined && (
        <div className="form-group">
          <label>Last Perihelion Time</label>
          <input
            type="number"
            value={comet.lastPerihelionTime}
            onChange={(e) => updateCometField('lastPerihelionTime', Number(e.target.value))}
            step="1"
          />
          <small>Simulation time units</small>
        </div>
      )}
      
      <div className="form-group">
        <label>Seed</label>
        <input
          type="text"
          value={String(comet.seed ?? 'N/A')}
          disabled
          readOnly
        />
        <small>Per-comet seed for determinism</small>
      </div>
    </div>
  );
};

