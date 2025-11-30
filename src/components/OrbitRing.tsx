import React, { useMemo } from 'react';
import * as THREE from 'three';

interface OrbitRingProps {
  radius: number;
  color?: string;
}

export const OrbitRing: React.FC<OrbitRingProps> = ({ radius, color = '#666666' }) => {
  const points = useMemo(() => {
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
  }, [radius]);
  
  const lineGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);
  
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

