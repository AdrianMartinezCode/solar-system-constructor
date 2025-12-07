import React, { useMemo } from 'react';
import * as THREE from 'three';

interface OrbitRingProps {
  // Legacy mode: just a radius
  radius?: number;
  // Advanced mode: precomputed 3D points
  points?: Array<{ x: number; y: number; z: number }>;
  color?: string;
}

/**
 * OrbitRing component - renders an orbit path as a line.
 * 
 * Supports two modes:
 * 1. Simple circular: pass `radius` for a circle in the XZ plane
 * 2. Elliptical 3D: pass `points` array with precomputed orbit positions
 */
export const OrbitRing: React.FC<OrbitRingProps> = ({ radius, points, color = '#666666' }) => {
  const orbitPoints = useMemo(() => {
    // If points are provided, use them directly
    if (points && points.length > 0) {
      return points.map(p => new THREE.Vector3(p.x, p.y, p.z));
    }
    
    // Otherwise, fall back to circular orbit in XZ plane
    if (radius !== undefined && radius > 0) {
      const pts = [];
      const segments = 64;
      
      for (let i = 0; i <= segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        pts.push(
          new THREE.Vector3(
            Math.cos(angle) * radius,
            0,
            Math.sin(angle) * radius
          )
        );
      }
      
      return pts;
    }
    
    return [];
  }, [radius, points]);
  
  const lineGeometry = useMemo(() => {
    if (orbitPoints.length === 0) return null;
    return new THREE.BufferGeometry().setFromPoints(orbitPoints);
  }, [orbitPoints]);
  
  if (!lineGeometry) return null;
  
  return (
    <line geometry={lineGeometry}>
      <lineBasicMaterial 
        color={color} 
        transparent 
        opacity={0.3}
      />
    </line>
  );
};

