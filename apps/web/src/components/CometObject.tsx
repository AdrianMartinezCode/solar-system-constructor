import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSystemStore } from '../state/systemStore';
import { calculateOrbitalPosition } from '../utils/physics';

interface CometObjectProps {
  cometId: string;
}

/**
 * Renders a comet with its nucleus and dynamic tail
 * The tail follows the comet's orbital path (motion trail) and varies in
 * length/opacity based on distance to the central star
 */
export const CometObject: React.FC<CometObjectProps> = ({ cometId }) => {
  const groupRef = useRef<THREE.Group>(null);
  const tailLineRef = useRef<THREE.Line>(null);
  
  const comet = useSystemStore((state) => state.stars[cometId]);
  const time = useSystemStore((state) => state.time);
  const stars = useSystemStore((state) => state.stars);
  
  // Find the central star (parent of the comet, assumed to be luminous)
  const centralStar = useMemo(() => {
    if (!comet || !comet.parentId) return null;
    return stars[comet.parentId];
  }, [comet, stars]);
  
  // Calculate current comet position
  const currentPosition = useMemo(() => {
    if (!comet) return new THREE.Vector3();
    const pos = calculateOrbitalPosition(time, comet);
    return new THREE.Vector3(pos.x, pos.y, pos.z);
  }, [time, comet]);
  
  // Update tail trail each frame
  useFrame(() => {
    if (!tailLineRef.current || !comet || !comet.comet || !comet.comet.hasTail || !centralStar) {
      return;
    }
    
    const { activityFalloffDistance, tailLengthBase, tailOpacityBase } = comet.comet;
    
    // Calculate distance to star (star is at origin)
    const distanceToStar = currentPosition.length();
    
    // Calculate activity factor
    let activityFactor = 1.0;
    let opacityFactor = 1.0;
    
    if (distanceToStar > activityFalloffDistance) {
      // Fade out as comet gets farther from star
      const fadeRange = activityFalloffDistance * 0.5;
      const excessDistance = distanceToStar - activityFalloffDistance;
      const fadeAmount = Math.min(1.0, excessDistance / fadeRange);
      activityFactor = 1.0 - fadeAmount * 0.7;
      opacityFactor = 1.0 - fadeAmount;
    } else {
      // Increase tail when closer to star
      const proximityFactor = 1.0 - (distanceToStar / activityFalloffDistance);
      activityFactor = 1.0 + proximityFactor * 0.5;
    }
    
    // Calculate number of trail segments based on activity
    const maxSegments = Math.floor(tailLengthBase * activityFactor * 10);
    const tailOpacity = Math.max(0, Math.min(1, tailOpacityBase * opacityFactor));
    
    // Generate trail points going backwards in time along the orbit
    const trailPoints: THREE.Vector3[] = [currentPosition.clone()];
    const timeStep = 0.05; // Time steps to go back
    
    for (let i = 1; i < maxSegments; i++) {
      const pastTime = time - (i * timeStep);
      const pastPos = calculateOrbitalPosition(pastTime, comet);
      trailPoints.push(new THREE.Vector3(pastPos.x, pastPos.y, pastPos.z));
    }
    
    // Update line geometry
    const geometry = tailLineRef.current.geometry as THREE.BufferGeometry;
    const positions = new Float32Array(trailPoints.length * 3);
    
    trailPoints.forEach((point, i) => {
      positions[i * 3] = point.x;
      positions[i * 3 + 1] = point.y;
      positions[i * 3 + 2] = point.z;
    });
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.computeBoundingSphere();
    
    // Update material opacity
    const material = tailLineRef.current.material as THREE.LineBasicMaterial;
    if (material) {
      material.opacity = tailOpacity;
      material.needsUpdate = true;
    }
  });
  
  if (!comet || !comet.comet) {
    return null;
  }
  
  const cometMeta = comet.comet;
  
  // Create initial geometry for the line
  const initialGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array([0, 0, 0]); // Start with a single point
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);
  
  return (
    <group ref={groupRef}>
      {/* Comet nucleus - small irregular body */}
      <mesh>
        <sphereGeometry args={[comet.radius, 8, 8]} />
        <meshStandardMaterial 
          color={comet.color}
          roughness={0.9}
          metalness={0.1}
        />
      </mesh>
      
      {/* Inner glow around nucleus when active */}
      {cometMeta.hasTail && (
        <mesh>
          <sphereGeometry args={[comet.radius * 2, 8, 8]} />
          <meshBasicMaterial
            color={cometMeta.tailColor}
            transparent
            opacity={0.2}
          />
        </mesh>
      )}
      
      {/* Comet tail - rendered as a line following the orbital path */}
      {cometMeta.hasTail && (
        <primitive
          object={new THREE.Line(
            initialGeometry,
            new THREE.LineBasicMaterial({
              color: cometMeta.tailColor,
              transparent: true,
              opacity: cometMeta.tailOpacityBase,
              linewidth: 2,
              blending: THREE.AdditiveBlending,
            })
          )}
          ref={tailLineRef}
        />
      )}
    </group>
  );
};

