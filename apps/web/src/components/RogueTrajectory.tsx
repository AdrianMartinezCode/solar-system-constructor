import React, { useMemo } from 'react';
import * as THREE from 'three';
import { computeRogueTrajectoryPoints } from '../utils/physics';
import type { RoguePlanetMeta } from '../types';

interface RogueTrajectoryProps {
  roguePlanetMeta: RoguePlanetMeta;
  currentTime: number;
  currentPosition: { x: number; y: number; z: number };
}

/**
 * RogueTrajectory component - visualizes the past and future path of a rogue planet.
 * 
 * Renders two line segments in WORLD SPACE:
 * - Past path (history): dimmer, shows where the rogue has been
 * - Future path (prediction): brighter, shows where it's going
 * 
 * The trajectory is rendered as absolute world positions, offsetting back from the
 * parent StarObject's positioned group to world coordinates.
 */
export const RogueTrajectory: React.FC<RogueTrajectoryProps> = ({
  roguePlanetMeta,
  currentTime,
  currentPosition,
}) => {
  // Check if trajectory should be shown
  const showTrajectory = roguePlanetMeta.showTrajectory ?? true; // Default to true
  
  // Compute trajectory points in world space
  const { pastPoints, futurePoints } = useMemo(() => {
    if (!showTrajectory) {
      console.log('RogueTrajectory: showTrajectory is false');
      return { pastPoints: [], futurePoints: [] };
    }
    
    const result = computeRogueTrajectoryPoints(
      roguePlanetMeta,
      currentTime,
      {
        pastWindow: roguePlanetMeta.trajectoryPastWindow,
        futureWindow: roguePlanetMeta.trajectoryFutureWindow,
        sampleCount: 48, // Increased for smoother curves
      }
    );
    
    console.log('RogueTrajectory computed:', {
      currentTime,
      pastPointsCount: result.pastPoints.length,
      futurePointsCount: result.futurePoints.length,
      pastWindow: roguePlanetMeta.trajectoryPastWindow,
      futureWindow: roguePlanetMeta.trajectoryFutureWindow,
      curvature: roguePlanetMeta.pathCurvature,
      firstPastPoint: result.pastPoints[0],
      lastPastPoint: result.pastPoints[result.pastPoints.length - 1],
      firstFuturePoint: result.futurePoints[0],
      lastFuturePoint: result.futurePoints[result.futurePoints.length - 1],
    });
    
    return result;
  }, [roguePlanetMeta, currentTime, showTrajectory]);
  
  // Convert points to THREE.BufferGeometry using setFromPoints (same as OrbitRing)
  // These points are in WORLD SPACE (absolute coordinates)
  const pastGeometry = useMemo(() => {
    if (pastPoints.length === 0) return null;
    const points = pastPoints.map(p => new THREE.Vector3(p.x, p.y, p.z));
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [pastPoints]);
  
  const futureGeometry = useMemo(() => {
    if (futurePoints.length === 0) return null;
    const points = futurePoints.map(p => new THREE.Vector3(p.x, p.y, p.z));
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [futurePoints]);
  
  if (!showTrajectory || (!pastGeometry && !futureGeometry)) {
    console.log('RogueTrajectory: Not rendering - showTrajectory:', showTrajectory, 'pastGeometry:', !!pastGeometry, 'futureGeometry:', !!futureGeometry);
    return null;
  }
  
  console.log('RogueTrajectory: Rendering trajectories - past:', !!pastGeometry, 'future:', !!futureGeometry);
  
  // Color based on curvature (more curved = more distinct color)
  const curvature = roguePlanetMeta.pathCurvature ?? 0;
  const baseColor = curvature > 0.5 ? '#ff6b9d' : '#66b2ff'; // Pink for curved, blue for less curved
  
  // Render in world space by offsetting back from the parent group's position
  // The parent StarObject group is positioned at currentPosition, so we offset by -currentPosition
  return (
    <group position={[-currentPosition.x, -currentPosition.y, -currentPosition.z]}>
      {/* Past trajectory (history) - dimmer line showing where the rogue has been */}
      {pastGeometry && (
        <line geometry={pastGeometry}>
          <lineBasicMaterial
            color={baseColor}
            transparent
            opacity={0.2}
            depthTest={false}
          />
        </line>
      )}
      
      {/* Future trajectory (prediction) - slightly brighter than past but still subtle */}
      {futureGeometry && (
        <line geometry={futureGeometry}>
          <lineBasicMaterial
            color={baseColor}
            transparent
            opacity={0.35}
            depthTest={false}
          />
        </line>
      )}
    </group>
  );
};

