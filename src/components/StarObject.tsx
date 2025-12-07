import React, { useRef, useMemo } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { useSystemStore } from '../state/systemStore';
import { calculateOrbitalPosition, generateOrbitPath } from '../utils/physics';
import { OrbitRing } from './OrbitRing';
import * as THREE from 'three';
import { PlanetaryRingObject } from './PlanetaryRingObject';
import { CometObject } from './CometObject';
import { LagrangePointObject } from './LagrangePointObject';

interface StarObjectProps {
  starId: string;
}

export const StarObject: React.FC<StarObjectProps> = ({ starId }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  
  const star = useSystemStore((state) => state.stars[starId]);
  const time = useSystemStore((state) => state.time);
  const selectedStarId = useSystemStore((state) => state.selectedStarId);
  const selectStar = useSystemStore((state) => state.selectStar);
  
  const isSelected = selectedStarId === starId;
  
  // Calculate position based on orbital parameters (now supports elliptical orbits)
  const position = useMemo(() => {
    if (!star || star.orbitalDistance === 0) {
      return { x: 0, y: 0, z: 0 };
    }
    return calculateOrbitalPosition(time, star);
  }, [time, star]);
  
  // Generate orbit path for visualization
  const orbitPath = useMemo(() => {
    if (!star || star.orbitalDistance === 0) {
      return [];
    }
    return generateOrbitPath(star);
  }, [star]); // Only regenerate when star orbit params change, not on every frame
  
  if (!star) return null;
  
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    selectStar(starId);
  };
  
  console.log(`Rendering star: ${star.name}, position: [${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)}], radius: ${star.radius}`);
  
  return (
    <group ref={groupRef} position={[position.x, position.y, position.z]}>
      {/* Orbit ring - positioned at parent origin */}
      {star.orbitalDistance > 0 && (
        <group position={[-position.x, -position.y, -position.z]}>
          <OrbitRing points={orbitPath} />
        </group>
      )}
      
      {/* Comet rendering (if this is a comet) - handles its own geometry and tail */}
      {star.bodyType === 'comet' ? (
        <CometObject cometId={starId} />
      ) : star.bodyType === 'lagrangePoint' ? (
        /* Lagrange point rendering - small distinctive marker */
        <LagrangePointObject id={starId} />
      ) : (
        <>
          {/* Star/Planet/Moon mesh with glow */}
          <mesh ref={meshRef} onClick={handleClick}>
            <sphereGeometry args={[star.radius, 32, 32]} />
            <meshStandardMaterial 
              color={star.color}
              emissive={star.color}
              emissiveIntensity={1.5}
              metalness={0.2}
              roughness={0.4}
            />
          </mesh>
          
          {/* Outer glow layer */}
          <mesh>
            <sphereGeometry args={[star.radius * 1.1, 32, 32]} />
            <meshBasicMaterial 
              color={star.color}
              transparent
              opacity={0.3}
            />
          </mesh>
          
          {/* Selection indicator */}
          {isSelected && (
            <mesh>
              <sphereGeometry args={[star.radius * 1.3, 32, 32]} />
              <meshBasicMaterial 
                color="#ffffff" 
                transparent 
                opacity={0.3}
                wireframe
              />
            </mesh>
          )}
          
          {/* Planetary ring (if this body has a ring definition) */}
          {star.ring && star.bodyType === 'planet' && (
            <PlanetaryRingObject planetId={starId} />
          )}
        </>
      )}
      
      {/* Render children recursively */}
      {star.children.map((childId) => (
        <StarObject key={childId} starId={childId} />
      ))}
    </group>
  );
};

