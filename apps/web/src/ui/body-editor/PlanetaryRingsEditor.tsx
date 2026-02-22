import React from 'react';
import type { Star, PlanetaryRing } from '../../types';

interface PlanetaryRingsEditorProps {
  body: Star;
  onUpdateRing: (patch: Partial<PlanetaryRing>) => void;
  onRemoveRing: () => void;
}

export const PlanetaryRingsEditor: React.FC<PlanetaryRingsEditorProps> = ({ 
  body, 
  onUpdateRing,
  onRemoveRing 
}) => {
  // Only show for planets
  if (body.bodyType !== 'planet') {
    return null;
  }
  
  const handleToggleRing = (hasRing: boolean) => {
    if (hasRing) {
      // Add ring with defaults
      onUpdateRing({});
    } else {
      onRemoveRing();
    }
  };
  
  return (
    <div>
      <h5 style={{ marginTop: 0, marginBottom: '10px' }}>Planetary Rings</h5>
      
      <div className="form-group">
        <label className="generator-checkbox">
          <input
            type="checkbox"
            checked={!!body.ring}
            onChange={(e) => handleToggleRing(e.target.checked)}
          />
          <span>Has Rings</span>
        </label>
      </div>
      
      {body.ring && (
        <>
          <div className="form-group">
            <label>Inner Radius (× planet radius)</label>
            <input
              type="number"
              value={body.ring.innerRadiusMultiplier}
              min={1.1}
              step={0.1}
              onChange={(e) => {
                const value = Number(e.target.value);
                onUpdateRing({
                  innerRadiusMultiplier: value,
                  outerRadiusMultiplier: Math.max(
                    body.ring!.outerRadiusMultiplier,
                    value + 0.1
                  ),
                });
              }}
            />
          </div>
          
          <div className="form-group">
            <label>Outer Radius (× planet radius)</label>
            <input
              type="number"
              value={body.ring.outerRadiusMultiplier}
              min={(body.ring.innerRadiusMultiplier ?? 1.5) + 0.1}
              step={0.1}
              onChange={(e) =>
                onUpdateRing({
                  outerRadiusMultiplier: Number(e.target.value),
                })
              }
            />
          </div>
          
          <div className="form-group">
            <label>Ring Thickness</label>
            <input
              type="number"
              value={body.ring.thickness}
              min={0}
              step={0.01}
              onChange={(e) =>
                onUpdateRing({
                  thickness: Number(e.target.value),
                })
              }
            />
            <small>Vertical half-height in world units</small>
          </div>
          
          <div className="form-group">
            <label>Opacity (0-1)</label>
            <input
              type="number"
              value={body.ring.opacity}
              min={0}
              max={1}
              step={0.05}
              onChange={(e) =>
                onUpdateRing({
                  opacity: Number(e.target.value),
                })
              }
            />
          </div>
          
          <div className="form-group">
            <label>Albedo (brightness)</label>
            <input
              type="number"
              value={body.ring.albedo}
              min={0}
              max={2}
              step={0.1}
              onChange={(e) =>
                onUpdateRing({
                  albedo: Number(e.target.value),
                })
              }
            />
          </div>
          
          <div className="form-group">
            <label>Density (0-1)</label>
            <input
              type="number"
              value={body.ring.density}
              min={0}
              max={1}
              step={0.05}
              onChange={(e) =>
                onUpdateRing({
                  density: Number(e.target.value),
                })
              }
            />
            <small>Visual indication of how solid the ring appears</small>
          </div>
          
          <div className="form-group">
            <label>Ring Color</label>
            <input
              type="color"
              value={body.ring.color}
              onChange={(e) =>
                onUpdateRing({
                  color: e.target.value,
                })
              }
            />
          </div>
        </>
      )}
    </div>
  );
};

