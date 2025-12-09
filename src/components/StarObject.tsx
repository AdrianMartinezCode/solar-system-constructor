import React, { useRef, useMemo } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { useSystemStore } from '../state/systemStore';
import { calculateOrbitalPosition, calculateRoguePlanetPosition, generateOrbitPath, computeRogueTrajectoryPoints } from '../utils/physics';
import { OrbitRing } from './OrbitRing';
import * as THREE from 'three';
import { PlanetaryRingObject } from './PlanetaryRingObject';
import { CometObject } from './CometObject';
import { LagrangePointObject } from './LagrangePointObject';
import { ProtoplanetaryDiskObject } from './ProtoplanetaryDiskObject';
import { SmallBodyFieldObject } from './SmallBodyFieldObject';
import { RogueTrajectory } from './RogueTrajectory';
import { BlackHoleObject } from './BlackHoleObject';

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
  const protoplanetaryDisks = useSystemStore((state) => state.protoplanetaryDisks);
  const smallBodyFields = useSystemStore((state) => state.smallBodyFields);
  
  const isSelected = selectedStarId === starId;
  
  // Find if this star has an associated protoplanetary disk
  const associatedDiskId = useMemo(() => {
    return Object.keys(protoplanetaryDisks).find(
      diskId => protoplanetaryDisks[diskId].centralStarId === starId
    ) || null;
  }, [protoplanetaryDisks, starId]);
  
  // Find all belt fields hosted by this star
  const associatedBeltFieldIds = useMemo(() => {
    return Object.keys(smallBodyFields).filter(
      fieldId => smallBodyFields[fieldId].hostStarId === starId
    );
  }, [smallBodyFields, starId]);
  
  // Calculate position based on orbital parameters (now supports elliptical orbits and rogue planets)
  const position = useMemo(() => {
    if (!star) {
      return { x: 0, y: 0, z: 0 };
    }
    
    // Rogue planets use linear or curved drift motion
    if (star.isRoguePlanet && star.roguePlanet) {
      return calculateRoguePlanetPosition(
        star.roguePlanet,
        time
      );
    }
    
    // Normal bound bodies use orbital motion
    if (star.orbitalDistance === 0) {
      return { x: 0, y: 0, z: 0 };
    }
    return calculateOrbitalPosition(time, star);
  }, [time, star]);
  
  // Generate orbit path for visualization (not applicable to rogue planets)
  const orbitPath = useMemo(() => {
    if (!star || star.orbitalDistance === 0 || star.isRoguePlanet) {
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
      {/* Orbit ring - positioned at parent origin (not shown for rogue planets) */}
      {star.orbitalDistance > 0 && !star.isRoguePlanet && (
        <group position={[-position.x, -position.y, -position.z]}>
          <OrbitRing points={orbitPath} />
        </group>
      )}
      
      {/* Rogue planet trajectory visualization */}
      {star.isRoguePlanet && star.roguePlanet && (
        <RogueTrajectory 
          roguePlanetMeta={star.roguePlanet}
          currentTime={time}
          currentPosition={position}
        />
      )}
      
      {/* Comet rendering (if this is a comet) - handles its own geometry and tail */}
      {star.bodyType === 'comet' ? (
        <CometObject cometId={starId} />
      ) : star.bodyType === 'lagrangePoint' ? (
        /* Lagrange point rendering - small distinctive marker */
        <LagrangePointObject id={starId} />
      ) : star.bodyType === 'blackHole' ? (
        /* Black hole rendering - shadow, accretion disk, jets, lensing */
        <>
          <BlackHoleObject bodyId={starId} />
          
          {/* Selection indicator for black holes */}
          {isSelected && (
            <mesh>
              <sphereGeometry args={[star.radius * 3, 32, 32]} />
              <meshBasicMaterial 
                color="#ffffff" 
                transparent 
                opacity={0.2}
                wireframe
              />
            </mesh>
          )}
        </>
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
          
          {/* Protoplanetary disk (if this star has an associated disk) */}
          {associatedDiskId && (
            <ProtoplanetaryDiskObject diskId={associatedDiskId} />
          )}
          
          {/* Small body fields (asteroid/Kuiper belts hosted by this star) */}
          {associatedBeltFieldIds.map(fieldId => (
            <SmallBodyFieldObject key={fieldId} fieldId={fieldId} />
          ))}
        </>
      )}
      
      {/* Render children recursively */}
      {star.children.map((childId) => (
        <StarObject key={childId} starId={childId} />
      ))}
    </group>
  );
};

