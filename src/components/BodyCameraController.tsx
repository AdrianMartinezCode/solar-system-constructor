import React, { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useSystemStore } from '../state/systemStore';
import { starRegistry } from '../utils/starRegistry';
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
  
  // Function to get world position of a star from the scene graph
  // Uses the star registry to get accurate positions including all group transformations
  const getStarWorldPosition = (starId: string): THREE.Vector3 => {
    // Try to get the world position from the registry (most accurate)
    const registryPos = starRegistry.getWorldPosition(starId);
    if (registryPos) {
      return registryPos;
    }
    
    // Fallback: return zero vector if star is not registered yet
    console.warn(`Star ${starId} not found in registry, using fallback position`);
    return new THREE.Vector3(0, 0, 0);
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
          // The sphere radius is body radius * offset multiplier
          const sphereRadius = star.radius * cameraOffset;
          
          // Calculate direction from body to current camera
          const directionToCamera = new THREE.Vector3()
            .subVectors(camera.position, bodyWorldPos)
            .normalize();
          
          // If camera is too close to body center (direction would be zero),
          // use a default direction
          if (directionToCamera.length() < 0.001) {
            directionToCamera.set(1, 0.5, 1).normalize();
          }
          
          // Position camera on the sphere surface, in the direction from body to current camera
          // This ensures a natural transition from wherever the camera currently is
          transition.endPosition.copy(bodyWorldPos).addScaledVector(directionToCamera, sphereRadius);
          
          // The target is the body center - camera always looks at the body
          transition.endTarget.copy(bodyWorldPos);
          
          // Store the offset vector for tracking body movement
          cameraOffsetRef.current.copy(directionToCamera).multiplyScalar(sphereRadius);
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
  }, [cameraMode, cameraTargetBodyId, camera, stars, cameraOffset]);
  
  // Frame update
  useFrame((_state, delta) => {
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
        // Update controls after modifying target during transition
        (controls as any).update();
      }
    }
    
    // In body POV mode, continuously update camera to follow the body
    if (cameraMode === 'body' && cameraTargetBodyId && !transition.active) {
      const star = stars[cameraTargetBodyId];
      if (star && controls) {
        const bodyWorldPos = getStarWorldPosition(cameraTargetBodyId);
        
        // Calculate how much the body has moved since last frame
        const bodyDelta = new THREE.Vector3().subVectors(bodyWorldPos, lastBodyPositionRef.current);
        
        // Always keep the OrbitControls target on the body
        // This allows dragging to rotate camera around the body on the sphere
        (controls as any).target.copy(bodyWorldPos);
        
        // If the body has moved, translate the camera by the same amount
        // This keeps the camera at the same relative position on the sphere
        if (bodyDelta.length() > 0.0001) {
          camera.position.add(bodyDelta);
        }
        
        // Ensure OrbitControls recalculates its internal state
        (controls as any).update();
        
        // Store current body position for next frame
        lastBodyPositionRef.current.copy(bodyWorldPos);
      }
    }
  });
  
  return null;
};

