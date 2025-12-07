import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSystemStore } from '../state/systemStore';
import { calculateOrbitalPosition } from '../utils/physics';

interface AsteroidBeltObjectProps {
  beltId: string;
}

/**
 * Renders an asteroid belt using instanced meshes for performance
 */
export const AsteroidBeltObject: React.FC<AsteroidBeltObjectProps> = ({ beltId }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const belt = useSystemStore((state) => state.belts[beltId]);
  const stars = useSystemStore((state) => state.stars);
  const time = useSystemStore((state) => state.time);
  
  // Get all asteroids belonging to this belt
  const asteroids = useMemo(() => {
    if (!belt) return [];
    return belt.asteroidIds.map(id => stars[id]).filter(Boolean);
  }, [belt, stars]);
  
  // Create instance matrices and colors
  const { matrices, colors } = useMemo(() => {
    if (!belt || asteroids.length === 0) {
      return { matrices: new Float32Array(0), colors: new Float32Array(0) };
    }
    
    const matrices = new Float32Array(asteroids.length * 16);
    const colors = new Float32Array(asteroids.length * 3);
    
    return { matrices, colors };
  }, [belt, asteroids.length]);
  
  // Set up initial colors
  useMemo(() => {
    if (asteroids.length === 0) return;
    
    asteroids.forEach((asteroid, i) => {
      // Parse color
      const color = new THREE.Color(asteroid.color);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    });
    
    // Apply colors to instance mesh
    if (meshRef.current) {
      meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
    }
  }, [asteroids, colors]);
  
  // Update positions each frame
  useFrame(() => {
    if (!meshRef.current || asteroids.length === 0) return;
    
    const matrix = new THREE.Matrix4();
    const position = new THREE.Vector3();
    const scale = new THREE.Vector3();
    
    asteroids.forEach((asteroid, i) => {
      // Calculate orbital position
      const pos = calculateOrbitalPosition(time, asteroid);
      position.set(pos.x, pos.y, pos.z);
      
      // Scale based on radius (keep asteroids small)
      const scaleFactor = asteroid.radius;
      scale.set(scaleFactor, scaleFactor, scaleFactor);
      
      // Set matrix
      matrix.compose(position, new THREE.Quaternion(), scale);
      meshRef.current!.setMatrixAt(i, matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  
  if (!belt || asteroids.length === 0) {
    return null;
  }
  
  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, asteroids.length]}
      frustumCulled={false}
    >
      {/* Small sphere geometry for asteroids */}
      <sphereGeometry args={[1, 8, 8]} />
      <meshStandardMaterial />
    </instancedMesh>
  );
};

