import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useSystemStore } from '../state/systemStore';
import { calculateOrbitalPosition } from '../utils/physics';
import * as THREE from 'three';

/**
 * BodyCameraController
 * 
 * Handles camera positioning in two modes:
 * 1. Overview mode: Standard orbit camera around the scene center
 * 2. Body POV mode: Camera attached to a specific star/planet with smooth transitions
 */
export const BodyCameraController: React.FC = () => {
  const { camera, controls } = useThree();
  
  // Store state
  const cameraMode = useSystemStore((state) => state.cameraMode);
  const cameraTargetBodyId = useSystemStore((state) => state.cameraTargetBodyId);
  const cameraOffset = useSystemStore((state) => state.cameraOffset);
  const stars = useSystemStore((state) => state.stars);
  const time = useSystemStore((state) => state.time);
  
  // Transition state
  const transitionRef = useRef({
    active: false,
    progress: 0,
    startPosition: new THREE.Vector3(),
    startTarget: new THREE.Vector3(),
    endPosition: new THREE.Vector3(),
    endTarget: new THREE.Vector3(),
    duration: 1.0, // seconds
  });
  
  // Store the camera offset in body's local space (relative to body position)
  const cameraOffsetRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const lastBodyPositionRef = useRef<THREE.Vector3>(new THREE.Vector3());
  
  // Previous mode to detect changes
  const prevModeRef = useRef<'overview' | 'body'>(cameraMode);
  const prevBodyIdRef = useRef<string | null>(cameraTargetBodyId);
  
  // Function to get world position of a star (including all parent transformations)
  const getStarWorldPosition = (starId: string): THREE.Vector3 => {
    const worldPos = new THREE.Vector3();
    const positions: THREE.Vector3[] = [];
    
    // Walk up the parent chain and collect positions
    let currentId: string | null = starId;
    while (currentId) {
      const star = stars[currentId];
      if (!star) break;
      
      if (star.orbitalDistance > 0) {
        // Use the new elliptical orbit calculation
        const pos = calculateOrbitalPosition(time, star);
        positions.unshift(new THREE.Vector3(pos.x, pos.y, pos.z));
      } else {
        positions.unshift(new THREE.Vector3(0, 0, 0));
      }
      
      currentId = star.parentId;
    }
    
    // Sum all positions to get world position
    positions.forEach(pos => worldPos.add(pos));
    
    return worldPos;
  };
  
  // Detect mode or body changes and start transition
  useEffect(() => {
    const modeChanged = cameraMode !== prevModeRef.current;
    const bodyChanged = cameraTargetBodyId !== prevBodyIdRef.current;
    
    if (modeChanged || bodyChanged) {
      const transition = transitionRef.current;
      
      // Save current camera state as start
      transition.startPosition.copy(camera.position);
      
      // Get the current controls target if available
      if (controls) {
        transition.startTarget.copy((controls as any).target || new THREE.Vector3(0, 0, 0));
      } else {
        transition.startTarget.set(0, 0, 0);
      }
      
      // Calculate end state based on new mode
      if (cameraMode === 'body' && cameraTargetBodyId) {
        const star = stars[cameraTargetBodyId];
        if (star) {
          const bodyWorldPos = getStarWorldPosition(cameraTargetBodyId);
          const offsetDistance = star.radius * cameraOffset;
          
          // Position camera offset from body
          transition.endTarget.copy(bodyWorldPos);
          transition.endPosition.copy(bodyWorldPos);
          transition.endPosition.x += offsetDistance;
          transition.endPosition.y += offsetDistance * 0.5;
          
          // Store the initial offset from body position
          cameraOffsetRef.current.set(offsetDistance, offsetDistance * 0.5, 0);
          lastBodyPositionRef.current.copy(bodyWorldPos);
        }
      } else {
        // Return to overview
        transition.endPosition.set(0, 30, 50);
        transition.endTarget.set(0, 0, 0);
      }
      
      // Start transition
      transition.active = true;
      transition.progress = 0;
      
      prevModeRef.current = cameraMode;
      prevBodyIdRef.current = cameraTargetBodyId;
    }
  }, [cameraMode, cameraTargetBodyId, camera, stars, time, cameraOffset]);
  
  // Frame update
  useFrame((state, delta) => {
    const transition = transitionRef.current;
    
    // Handle smooth transition
    if (transition.active) {
      transition.progress += delta / transition.duration;
      
      if (transition.progress >= 1.0) {
        // Transition complete
        transition.active = false;
        transition.progress = 1.0;
      }
      
      // Smooth easing function (ease-in-out)
      const t = transition.progress;
      const eased = t < 0.5 
        ? 2 * t * t 
        : 1 - Math.pow(-2 * t + 2, 2) / 2;
      
      // Interpolate camera position and target
      camera.position.lerpVectors(
        transition.startPosition,
        transition.endPosition,
        eased
      );
      
      if (controls) {
        const newTarget = new THREE.Vector3().lerpVectors(
          transition.startTarget,
          transition.endTarget,
          eased
        );
        (controls as any).target.copy(newTarget);
      }
    }
    
    // In body POV mode, continuously update camera to follow the body
    if (cameraMode === 'body' && cameraTargetBodyId && !transition.active) {
      const star = stars[cameraTargetBodyId];
      if (star) {
        const bodyWorldPos = getStarWorldPosition(cameraTargetBodyId);
        
        // Calculate how much the body has moved since last frame
        const bodyDelta = new THREE.Vector3().subVectors(bodyWorldPos, lastBodyPositionRef.current);
        
        // Update the camera offset based on user's control inputs
        // (OrbitControls will modify camera.position, we need to track that)
        if (controls && bodyDelta.length() > 0.0001) {
          // Body has moved - update camera position by the same delta
          camera.position.add(bodyDelta);
          
          // Update controls target
          (controls as any).target.copy(bodyWorldPos);
        } else {
          // Body hasn't moved, just ensure controls target is correct
          if (controls) {
            (controls as any).target.copy(bodyWorldPos);
          }
        }
        
        // Store current body position for next frame
        lastBodyPositionRef.current.copy(bodyWorldPos);
      }
    }
  });
  
  return null;
};

