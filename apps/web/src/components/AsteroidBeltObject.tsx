import React, { useMemo, useRef, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useSystemStore } from '../state/systemStore';
import { calculateOrbitalPosition } from '../utils/physics';
import type { Star } from '../types';

interface AsteroidBeltObjectProps {
  beltId: string;
}

/**
 * LOD configuration for asteroid belt rendering.
 * Higher LOD levels = more aggressive optimization.
 */
const LOD_CONFIG = {
  /** Distance thresholds (relative to belt center) for LOD transitions */
  distances: {
    near: 50,      // Full detail
    medium: 150,   // Reduced instances
    far: 400,      // Heavily subsampled
    veryFar: 800,  // Minimal instances
  },
  /** Subsampling rates at each LOD level (1 = all, 2 = every other, etc.) */
  subsampleRates: {
    near: 1,
    medium: 2,
    far: 4,
    veryFar: 8,
  },
  /** Update throttle intervals (ms) at each LOD level */
  updateIntervals: {
    near: 0,       // Every frame
    medium: 33,    // ~30fps
    far: 66,       // ~15fps
    veryFar: 100,  // ~10fps
  },
  /** Geometry detail (sphere segments) at each LOD level */
  geometryDetail: {
    near: 8,
    medium: 6,
    far: 4,
    veryFar: 3,
  },
  /** Max instances before forcing LOD regardless of distance */
  instanceThresholds: {
    forceMediam: 500,
    forceFar: 1000,
    forceVeryFar: 1500,
  },
};

/**
 * Determine LOD level based on camera distance and instance count
 */
function determineLodLevel(
  cameraDistance: number,
  instanceCount: number
): 'near' | 'medium' | 'far' | 'veryFar' {
  // Force LOD based on instance count
  if (instanceCount > LOD_CONFIG.instanceThresholds.forceVeryFar) {
    return 'veryFar';
  }
  if (instanceCount > LOD_CONFIG.instanceThresholds.forceFar) {
    return cameraDistance > LOD_CONFIG.distances.medium ? 'far' : 'medium';
  }
  if (instanceCount > LOD_CONFIG.instanceThresholds.forceMediam) {
    if (cameraDistance > LOD_CONFIG.distances.far) return 'far';
    return 'medium';
  }
  
  // Normal distance-based LOD
  if (cameraDistance > LOD_CONFIG.distances.veryFar) return 'veryFar';
  if (cameraDistance > LOD_CONFIG.distances.far) return 'far';
  if (cameraDistance > LOD_CONFIG.distances.medium) return 'medium';
  return 'near';
}

/**
 * Subsample asteroids based on LOD level, preserving PRNG determinism
 * by using consistent index selection.
 */
function subsampleAsteroids(asteroids: Star[], rate: number): Star[] {
  if (rate <= 1) return asteroids;
  
  // Deterministic subsampling: pick every Nth asteroid
  const result: Star[] = [];
  for (let i = 0; i < asteroids.length; i += rate) {
    result.push(asteroids[i]);
  }
  return result;
}

/**
 * Renders an asteroid belt using instanced meshes for performance.
 * 
 * Performance optimizations:
 * - LOD based on camera distance and total instance count
 * - Subsampling for high-count belts
 * - Update throttling for distant belts
 * - Visibility culling support
 */
export const AsteroidBeltObject: React.FC<AsteroidBeltObjectProps> = ({ beltId }) => {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const belt = useSystemStore((state) => state.belts[beltId]);
  const stars = useSystemStore((state) => state.stars);
  const time = useSystemStore((state) => state.time);
  const { camera } = useThree();
  
  // Track last update time for throttling
  const lastUpdateRef = useRef<number>(0);
  const currentLodRef = useRef<'near' | 'medium' | 'far' | 'veryFar'>('near');
  
  // Pre-allocated objects for matrix composition (avoid per-frame allocation)
  const matrixRef = useRef(new THREE.Matrix4());
  const positionRef = useRef(new THREE.Vector3());
  const scaleRef = useRef(new THREE.Vector3());
  const quaternionRef = useRef(new THREE.Quaternion());
  const beltCenterRef = useRef(new THREE.Vector3());
  
  // Get all asteroids belonging to this belt
  const allAsteroids = useMemo(() => {
    if (!belt) return [];
    return belt.asteroidIds.map((id: string) => stars[id]).filter(Boolean);
  }, [belt, stars]);
  
  // Calculate belt center for LOD distance calculations
  const beltCenter = useMemo(() => {
    if (!belt || allAsteroids.length === 0) return new THREE.Vector3();
    
    // Approximate belt center as average of inner/outer radius along orbital plane
    // For simplicity, we use the parent's position (usually origin) plus belt radius
    const avgRadius = (belt.innerRadius + belt.outerRadius) / 2;
    return new THREE.Vector3(avgRadius, 0, 0);
  }, [belt, allAsteroids.length]);
  
  // Get geometry detail based on initial asteroid count
  const geometryDetail = useMemo(() => {
    const count = allAsteroids.length;
    if (count > LOD_CONFIG.instanceThresholds.forceVeryFar) return LOD_CONFIG.geometryDetail.veryFar;
    if (count > LOD_CONFIG.instanceThresholds.forceFar) return LOD_CONFIG.geometryDetail.far;
    if (count > LOD_CONFIG.instanceThresholds.forceMediam) return LOD_CONFIG.geometryDetail.medium;
    return LOD_CONFIG.geometryDetail.near;
  }, [allAsteroids.length]);
  
  // Calculate visible asteroids based on LOD
  const getVisibleAsteroids = useCallback((lodLevel: 'near' | 'medium' | 'far' | 'veryFar') => {
    const rate = LOD_CONFIG.subsampleRates[lodLevel];
    return subsampleAsteroids(allAsteroids, rate);
  }, [allAsteroids]);
  
  // Create colors buffer (computed once)
  const colorsBuffer = useMemo(() => {
    if (allAsteroids.length === 0) return new Float32Array(0);
    
    const colors = new Float32Array(allAsteroids.length * 3);
    allAsteroids.forEach((asteroid: Star, i: number) => {
      const color = new THREE.Color(asteroid.color);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    });
    return colors;
  }, [allAsteroids]);
  
  // Apply colors to mesh when colors change
  useMemo(() => {
    if (!meshRef.current || colorsBuffer.length === 0) return;
    meshRef.current.instanceColor = new THREE.InstancedBufferAttribute(colorsBuffer, 3);
  }, [colorsBuffer]);
  
  // Update positions each frame (with throttling)
  useFrame((_, _delta) => {
    if (!meshRef.current || allAsteroids.length === 0) return;
    
    // Check visibility toggle
    if (belt?.visible === false) {
      meshRef.current.visible = false;
      return;
    }
    meshRef.current.visible = true;
    
    // Calculate distance to belt center
    beltCenterRef.current.copy(beltCenter);
    const cameraDistance = camera.position.distanceTo(beltCenterRef.current);
    
    // Determine LOD level
    const lodLevel = determineLodLevel(cameraDistance, allAsteroids.length);
    currentLodRef.current = lodLevel;
    
    // Check throttle interval
    const now = performance.now();
    const throttleInterval = LOD_CONFIG.updateIntervals[lodLevel];
    if (throttleInterval > 0 && (now - lastUpdateRef.current) < throttleInterval) {
      return; // Skip this update
    }
    lastUpdateRef.current = now;
    
    // Get visible asteroids for current LOD
    const visibleAsteroids = getVisibleAsteroids(lodLevel);
    
    // Update instance count if needed
    const targetCount = visibleAsteroids.length;
    if (meshRef.current.count !== targetCount) {
      meshRef.current.count = targetCount;
    }
    
    // Update positions
    const matrix = matrixRef.current;
    const position = positionRef.current;
    const scale = scaleRef.current;
    const quaternion = quaternionRef.current;
    
    visibleAsteroids.forEach((asteroid, i) => {
      // Calculate orbital position
      const pos = calculateOrbitalPosition(time, asteroid);
      position.set(pos.x, pos.y, pos.z);
      
      // Scale based on radius (keep asteroids small)
      // At lower LOD, slightly increase scale to compensate for fewer instances
      const lodScaleFactor = lodLevel === 'veryFar' ? 1.5 : lodLevel === 'far' ? 1.25 : 1.0;
      const scaleFactor = asteroid.radius * lodScaleFactor;
      scale.set(scaleFactor, scaleFactor, scaleFactor);
      
      // Set matrix
      matrix.compose(position, quaternion, scale);
      meshRef.current!.setMatrixAt(i, matrix);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  
  if (!belt || allAsteroids.length === 0) {
    return null;
  }
  
  return (
    <instancedMesh
      ref={meshRef}
      args={[undefined, undefined, allAsteroids.length]}
      frustumCulled={false}
    >
      {/* Sphere geometry with detail level based on belt size */}
      <sphereGeometry args={[1, geometryDetail, geometryDetail]} />
      <meshStandardMaterial />
    </instancedMesh>
  );
};

