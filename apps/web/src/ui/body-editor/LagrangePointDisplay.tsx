import React from 'react';
import type { Star } from '../../types';

interface LagrangePointDisplayProps {
  body: Star;
  stars: Record<string, Star>;
}

export const LagrangePointDisplay: React.FC<LagrangePointDisplayProps> = ({ body, stars }) => {
  // Only show for Lagrange points
  if (body.bodyType !== 'lagrangePoint' || !body.lagrangePoint) {
    return null;
  }
  
  const lp = body.lagrangePoint;
  
  // Get primary and secondary names
  const primary = stars[lp.primaryId];
  const secondary = stars[lp.secondaryId];
  
  const primaryName = primary?.name || `Unknown (${lp.primaryId})`;
  const secondaryName = secondary?.name || `Unknown (${lp.secondaryId})`;
  
  return (
    <div>
      <h5 style={{ marginTop: 0, marginBottom: '10px' }}>Lagrange Point Metadata 🔷</h5>
      
      <div style={{ 
        padding: '12px', 
        backgroundColor: 'rgba(74,144,226,0.15)', 
        borderRadius: '6px',
        border: '1px solid rgba(74,144,226,0.3)'
      }}>
        <p style={{ margin: '0 0 10px 0', fontSize: '0.9em', color: 'rgba(255,255,255,0.8)' }}>
          This is a Lagrange point marker, representing a gravitational equilibrium point in the {primaryName}-{secondaryName} system.
          Lagrange points are mostly read-only and calculated based on the primary and secondary bodies.
        </p>
        
        <div className="form-group">
          <label>Point Index</label>
          <input
            type="text"
            value={`L${lp.pointIndex}`}
            disabled
            readOnly
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          />
          <small>Which Lagrange point (L1-L5)</small>
        </div>
        
        <div className="form-group">
          <label>Primary Body</label>
          <input
            type="text"
            value={primaryName}
            disabled
            readOnly
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          />
        </div>
        
        <div className="form-group">
          <label>Secondary Body</label>
          <input
            type="text"
            value={secondaryName}
            disabled
            readOnly
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          />
        </div>
        
        <div className="form-group">
          <label>Pair Type</label>
          <input
            type="text"
            value={lp.pairType === 'starPlanet' ? 'Star-Planet' : 'Planet-Moon'}
            disabled
            readOnly
            style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
          />
        </div>
        
        <div className="form-group">
          <label>Stability</label>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            padding: '8px',
            backgroundColor: lp.stable ? 'rgba(76,175,80,0.2)' : 'rgba(244,67,54,0.2)',
            borderRadius: '4px',
            border: `1px solid ${lp.stable ? 'rgba(76,175,80,0.4)' : 'rgba(244,67,54,0.4)'}`,
          }}>
            <span style={{ fontSize: '1.2em' }}>{lp.stable ? '✓' : '⚠'}</span>
            <span style={{ fontSize: '0.9em' }}>
              {lp.stable ? 'Stable (L4/L5)' : 'Unstable (L1-L3)'}
            </span>
          </div>
          <small>
            {lp.stable 
              ? 'Stable Lagrange points can trap objects (e.g., Trojan asteroids)' 
              : 'Unstable points require active station-keeping'}
          </small>
        </div>
        
        {lp.label && (
          <div className="form-group">
            <label>Display Label</label>
            <input
              type="text"
              value={lp.label}
              disabled
              readOnly
              style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}
            />
          </div>
        )}
      </div>
      
      <div style={{ 
        marginTop: '12px', 
        padding: '8px', 
        backgroundColor: 'rgba(255,152,0,0.1)', 
        borderRadius: '4px',
        fontSize: '0.85em',
        color: 'rgba(255,255,255,0.7)'
      }}>
        <strong>Note:</strong> Lagrange point positions are computed dynamically based on the primary and secondary body positions.
        Editing is limited to preserve physical accuracy.
      </div>
    </div>
  );
};

