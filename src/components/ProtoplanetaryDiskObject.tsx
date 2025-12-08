import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSystemStore } from '../state/systemStore';

interface ProtoplanetaryDiskObjectProps {
  diskId: string;
}

/**
 * Renders a protoplanetary disk as a GPU-efficient particle field.
 * 
 * This is a visual-only component that does not create individual Star objects.
 * The disk rotates slowly around the central star and uses particle-based rendering
 * for performance.
 */
export const ProtoplanetaryDiskObject: React.FC<ProtoplanetaryDiskObjectProps> = ({ diskId }) => {
  const pointsRef = useRef<THREE.Points>(null);
  const rotationRef = useRef<number>(0);
  
  const disk = useSystemStore((state) => state.protoplanetaryDisks[diskId]);
  const selectProtoplanetaryDisk = useSystemStore((state) => state.selectProtoplanetaryDisk);
  
  // Generate particle positions and colors using the disk's seed
  const { positions, colors, sizes } = useMemo(() => {
    if (!disk) {
      return { positions: new Float32Array(0), colors: new Float32Array(0), sizes: new Float32Array(0) };
    }
    
    // Create a seeded random number generator
    const seed = typeof disk.seed === 'number' ? disk.seed : hashString(String(disk.seed));
    const rng = createSeededRandom(seed);
    
    const count = disk.particleCount;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    const baseColor = new THREE.Color(disk.baseColor);
    const highlightColor = new THREE.Color(disk.highlightColor);
    
    for (let i = 0; i < count; i++) {
      // Distribute particles in a torus-like volume
      // Radial position: uniform between inner and outer radius
      const r = disk.innerRadius + rng() * (disk.outerRadius - disk.innerRadius);
      
      // Angular position: uniform around the circle
      const theta = rng() * Math.PI * 2;
      
      // Vertical offset: normal distribution with thickness controlling sigma
      const y = gaussianRandom(rng) * disk.thickness * 0.5;
      
      // Apply clumpiness: modulate density via noise-like clustering
      const clumpFactor = disk.clumpiness;
      const clumpNoise = (Math.sin(theta * 5 + r * 0.3) * 0.5 + 0.5) * clumpFactor;
      
      // Position in disk coordinates (will be transformed to world space)
      positions[i * 3] = r * Math.cos(theta);
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = r * Math.sin(theta);
      
      // Color: blend between base and highlight based on radial position and clumpiness
      const radialBlend = (r - disk.innerRadius) / (disk.outerRadius - disk.innerRadius);
      const colorBlend = (1 - radialBlend) * 0.7 + clumpNoise * 0.3;
      
      const color = baseColor.clone().lerp(highlightColor, colorBlend);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      // Size: slightly larger particles near inner edge (hotter, denser region)
      const baseSize = 0.03 + (1 - radialBlend) * 0.04;
      sizes[i] = baseSize * (0.8 + rng() * 0.4);
    }
    
    return { positions, colors, sizes };
  }, [disk?.particleCount, disk?.innerRadius, disk?.outerRadius, disk?.thickness, 
      disk?.baseColor, disk?.highlightColor, disk?.clumpiness, disk?.seed]);
  
  // Animate disk rotation
  // Note: Position is inherited from parent StarObject, so we only need to handle rotation
  useFrame(() => {
    if (!pointsRef.current || !disk) return;
    
    // Get current timeScale from the store for real-time updates
    const currentTimeScale = useSystemStore.getState().timeScale;
    
    // Slow rotation based on timeScale and disk's rotation multiplier
    const rotationSpeed = disk.rotationSpeedMultiplier * 0.02;
    // Use a fixed delta for smooth rotation (not frame-dependent jitter)
    rotationRef.current += 0.016 * currentTimeScale * rotationSpeed;
    
    // Update rotation
    pointsRef.current.rotation.y = rotationRef.current;
  });
  
  // Handle click for selection
  const handleClick = (event: THREE.Event) => {
    event.stopPropagation();
    selectProtoplanetaryDisk(diskId);
  };
  
  if (!disk || positions.length === 0) {
    return null;
  }
  
  // Position is inherited from parent StarObject - render at local (0,0,0)
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
            opacity: { value: disk.opacity },
            brightness: { value: disk.brightness },
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
              
              // Soft falloff
              float alpha = smoothstep(0.5, 0.0, dist);
              
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
        <ringGeometry args={[disk.innerRadius * 0.8, disk.outerRadius * 1.1, 32]} />
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
 * Create a seeded random number generator
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

