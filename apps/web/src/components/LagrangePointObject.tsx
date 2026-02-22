import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSystemStore } from '../state/systemStore';
import { calculateOrbitalPosition } from '../utils/physics';

interface LagrangePointObjectProps {
  id: string;
}

/**
 * LagrangePointObject - Renders a Lagrange point marker (L1-L5)
 * 
 * Lagrange points are rendered as small distinctive markers that
 * co-rotate with their associated two-body system.
 */
export const LagrangePointObject: React.FC<LagrangePointObjectProps> = ({ id }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  // Get star data from store
  const star = useSystemStore((state) => state.stars[id]);
  const time = useSystemStore((state) => state.time);
  const selectedStarId = useSystemStore((state) => state.selectedStarId);
  
  // If not a Lagrange point, don't render
  if (!star || star.bodyType !== 'lagrangePoint' || !star.lagrangePoint) {
    return null;
  }
  
  const isSelected = selectedStarId === id;
  const { lagrangePoint } = star;
  
  // Calculate position based on orbital mechanics (same as other bodies)
  const position = useMemo(() => {
    const pos = calculateOrbitalPosition(time, star);
    return new THREE.Vector3(pos.x, pos.y, pos.z);
  }, [time, star]);
  
  // Update position every frame
  useFrame(() => {
    if (groupRef.current) {
      const pos = calculateOrbitalPosition(time, star);
      groupRef.current.position.set(pos.x, pos.y, pos.z);
    }
  });
  
  // Marker geometry - small tetrahedron for distinctive shape
  const geometry = useMemo(() => {
    return new THREE.TetrahedronGeometry(0.08, 0);
  }, []);
  
  // Color based on stability
  // Unstable (L1-L3): orange/red
  // Stable (L4-L5): green/blue
  const markerColor = lagrangePoint.stable ? '#5BC95B' : '#FF8C42';
  const emissiveColor = lagrangePoint.stable ? '#3A7C3A' : '#CC5500';
  
  return (
    <group ref={groupRef} position={position}>
      <mesh
        ref={meshRef}
        geometry={geometry}
        onClick={(e) => {
          e.stopPropagation();
          useSystemStore.getState().selectStar(id);
        }}
      >
        <meshStandardMaterial
          color={markerColor}
          emissive={emissiveColor}
          emissiveIntensity={0.5}
          transparent
          opacity={0.85}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Selection indicator */}
      {isSelected && (
        <mesh>
          <sphereGeometry args={[0.12, 16, 16]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.3}
            wireframe
          />
        </mesh>
      )}
      
      {/* Subtle glow for stable points */}
      {lagrangePoint.stable && (
        <mesh>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial
            color={markerColor}
            transparent
            opacity={0.15}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
};

