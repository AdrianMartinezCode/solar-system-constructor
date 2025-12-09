import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSystemStore } from '../state/systemStore';

interface SmallBodyFieldObjectProps {
  fieldId: string;
}

/**
 * Renders a small body field (asteroid belt or Kuiper belt) as a GPU-efficient particle field.
 * 
 * This replaces the previous system of thousands of individual Star entities with a performant
 * GPU particle field approach. The field rotates slowly and uses deterministic PRNG for
 * consistent particle distribution.
 * 
 * Visual distinctions:
 * - Main belts: Rocky brown/gray colors, moderate thickness
 * - Kuiper belts: Icy blue-gray colors, higher thickness/scatter
 */
export const SmallBodyFieldObject: React.FC<SmallBodyFieldObjectProps> = ({ fieldId }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const rotationRef = useRef<number>(0);
  
  const field = useSystemStore((state) => state.smallBodyFields[fieldId]);
  const selectSmallBodyField = useSystemStore((state) => state.selectSmallBodyField);
  
  // Generate particle positions, colors, and sizes using the field's seed
  const { positions, colors, sizes } = useMemo(() => {
    if (!field) {
      return { positions: new Float32Array(0), colors: new Float32Array(0), sizes: new Float32Array(0) };
    }
    
    // Create a seeded random number generator
    const seed = typeof field.seed === 'number' ? field.seed : hashString(String(field.seed));
    const rng = createSeededRandom(seed);
    
    const count = field.particleCount;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    const baseColor = new THREE.Color(field.baseColor);
    const highlightColor = new THREE.Color(field.highlightColor);
    
    // Calculate effective thickness including inclination sigma for Kuiper belts
    const effectiveThickness = field.thickness * (1 + (field.inclinationSigma || 0));
    
    for (let i = 0; i < count; i++) {
      // Distribute particles in a torus-like volume
      // Radial position: slightly weighted toward middle of belt
      const radialU = rng();
      const radialBlend = radialU < 0.5 
        ? 0.4 + radialU * 0.6  // Concentrate toward inner-middle
        : 0.4 + radialU * 0.6;  // Spread toward outer edge
      const r = field.innerRadius + radialBlend * (field.outerRadius - field.innerRadius);
      
      // Angular position: uniform around the circle
      const theta = rng() * Math.PI * 2;
      
      // Vertical offset: normal distribution with thickness controlling sigma
      // Kuiper belts have more vertical scatter
      const verticalScatter = field.beltType === 'kuiper' ? effectiveThickness : field.thickness;
      const y = gaussianRandom(rng) * verticalScatter * 0.5;
      
      // Apply clumpiness: modulate density via noise-like clustering
      const clumpFactor = field.clumpiness;
      // Different noise pattern for main belts vs Kuiper belts
      const noiseFreq = field.beltType === 'main' ? 8.0 : 5.0;
      const clumpNoise = (Math.sin(theta * noiseFreq + r * 0.2) * 0.5 + 0.5) * clumpFactor;
      
      // Skip fewer particles for higher density (reduced threshold)
      const densityThreshold = 1.0 - clumpFactor * 0.15;  // Reduced from 0.3 to 0.15
      if (rng() > densityThreshold + clumpNoise * 0.2) {  // Reduced from 0.3 to 0.2
        // Make this particle invisible by setting it at origin with size 0
        positions[i * 3] = 0;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = 0;
        sizes[i] = 0;
        colors[i * 3] = 0;
        colors[i * 3 + 1] = 0;
        colors[i * 3 + 2] = 0;
        continue;
      }
      
      // Position in field coordinates
      positions[i * 3] = r * Math.cos(theta);
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = r * Math.sin(theta);
      
      // Color: blend between base and highlight based on radial position and clumpiness
      const radialColorBlend = (r - field.innerRadius) / (field.outerRadius - field.innerRadius);
      const colorBlend = field.beltType === 'main'
        ? (1 - radialColorBlend) * 0.6 + clumpNoise * 0.4  // Main belts: more uniform
        : (1 - radialColorBlend) * 0.5 + clumpNoise * 0.5 + rng() * 0.3; // Kuiper: more variation
      
      const color = baseColor.clone().lerp(highlightColor, Math.min(1, colorBlend));
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      // Size: varied based on belt type (maximized for visibility)
      // Main belt asteroids are generally smaller and more uniform
      // Kuiper belt objects have more size variation
      const baseSizeRange = field.beltType === 'main' ? [0.06, 0.12] : [0.08, 0.16];
      const baseSize = baseSizeRange[0] + rng() * (baseSizeRange[1] - baseSizeRange[0]);
      
      // Slightly larger particles in clumpy regions (denser areas)
      const clumpSizeBoost = 1.0 + clumpNoise * 0.5;
      sizes[i] = baseSize * clumpSizeBoost;
    }
    
    return { positions, colors, sizes };
  }, [
    field?.particleCount, 
    field?.innerRadius, 
    field?.outerRadius, 
    field?.thickness,
    field?.inclinationSigma,
    field?.baseColor, 
    field?.highlightColor, 
    field?.clumpiness, 
    field?.seed,
    field?.beltType,
  ]);
  
  // Animate field rotation (position is inherited from parent StarObject)
  useFrame(() => {
    if (!pointsRef.current || !field) return;
    
    // Check visibility
    if (field.visible === false) {
      pointsRef.current.visible = false;
      return;
    }
    pointsRef.current.visible = true;
    
    // Get current timeScale from the store for real-time updates
    const currentTimeScale = useSystemStore.getState().timeScale;
    
    // Very slow rotation based on timeScale and field's rotation multiplier
    // Belts rotate much slower than protoplanetary disks
    const rotationSpeed = field.rotationSpeedMultiplier * 0.008;
    rotationRef.current += 0.016 * currentTimeScale * rotationSpeed;
    
    // Update rotation
    pointsRef.current.rotation.y = rotationRef.current;
  });
  
  // Handle click for selection
  const handleClick = (event: THREE.Event) => {
    event.stopPropagation();
    selectSmallBodyField(fieldId);
  };
  
  if (!field || positions.length === 0) {
    if (!field) {
      console.warn(`SmallBodyField ${fieldId} not found in store`);
    } else if (positions.length === 0) {
      console.warn(`No particles generated for field ${fieldId} (particleCount: ${field.particleCount})`);
    }
    return null;
  }
  
  console.log(`Rendering SmallBodyField ${field.name}:`, {
    particleCount: field.particleCount,
    positionCount: positions.length / 3,
    innerRadius: field.innerRadius,
    outerRadius: field.outerRadius,
    beltType: field.beltType,
    hostStarId: field.hostStarId,
    opacity: field.opacity,
    brightness: field.brightness,
  });
  
  // Position is inherited from parent StarObject, render at local (0,0,0)
  return (
    <group>
      <points ref={pointsRef} onClick={handleClick}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            array={positions}
            count={positions.length / 3}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-color"
            array={colors}
            count={colors.length / 3}
            itemSize={3}
          />
          <bufferAttribute
            attach="attributes-size"
            array={sizes}
            count={sizes.length}
            itemSize={1}
          />
        </bufferGeometry>
        <shaderMaterial
          vertexColors
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={{
            opacity: { value: Math.min(1.0, field.opacity * 1.2) }, // Boost opacity
            brightness: { value: field.brightness * 2.0 }, // Double brightness for visibility
          }}
          vertexShader={`
            attribute float size;
            varying vec3 vColor;
            void main() {
              vColor = color;
              vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
              gl_PointSize = size * (300.0 / -mvPosition.z);
              gl_Position = projectionMatrix * mvPosition;
            }
          `}
          fragmentShader={`
            uniform float opacity;
            uniform float brightness;
            varying vec3 vColor;
            void main() {
              // Circular point with soft edges
              vec2 center = gl_PointCoord - vec2(0.5);
              float dist = length(center);
              if (dist > 0.5) discard;
              
              // Soft falloff for asteroid/KBO particles
              // Less uniform than protoplanetary disk particles
              float alpha = smoothstep(0.5, 0.2, dist);
              
              // Apply brightness and opacity
              vec3 finalColor = vColor * brightness;
              gl_FragColor = vec4(finalColor, alpha * opacity);
            }
          `}
        />
      </points>
      
      {/* Invisible larger mesh for easier selection */}
      <mesh 
        onClick={handleClick}
        visible={false}
      >
        <ringGeometry args={[field.innerRadius * 0.8, field.outerRadius * 1.1, 32]} />
        <meshBasicMaterial transparent opacity={0} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Simple hash function for string to number conversion
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Create a seeded random number generator (LCG)
 */
function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (state >>> 0) / 0xFFFFFFFF;
  };
}

/**
 * Generate a Gaussian (normal) random number using Box-Muller transform
 */
function gaussianRandom(rng: () => number): number {
  const u1 = rng();
  const u2 = rng();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

