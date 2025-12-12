import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSystemStore } from '../state/systemStore';

interface ProtoplanetaryDiskObjectProps {
  diskId: string;
}

/**
 * Renders a protoplanetary disk as a GPU-efficient shader-driven continuous disk
 * with realistic ALMA-like appearance: bright inner regions, concentric rings/gaps,
 * radial temperature gradient, and optional particle sparkle overlay.
 * 
 * This is a visual-only component that does not create individual Star objects.
 * The disk rotates slowly around the central star.
 */
export const ProtoplanetaryDiskObject: React.FC<ProtoplanetaryDiskObjectProps> = ({ diskId }) => {
  const diskMeshRef = useRef<THREE.Mesh>(null);
  const sparkleRef = useRef<THREE.Points>(null);
  const rotationRef = useRef<number>(0);
  
  const disk = useSystemStore((state) => state.protoplanetaryDisks[diskId]);
  
  // Create shader uniforms (only once, then update values in useEffect)
  const uniforms = useMemo(() => {
    if (!disk) return null;
    
    const baseColor = new THREE.Color(disk.baseColor);
    const highlightColor = new THREE.Color(disk.highlightColor);
    
    // Derive a deterministic seed value for shader noise
    const seedValue = typeof disk.seed === 'number' 
      ? disk.seed 
      : hashString(String(disk.seed));
    const normalizedSeed = (seedValue % 10000) / 10000; // 0-1 range
    
    return {
      uTime: { value: 0 },
      uInnerRadius: { value: disk.innerRadius },
      uOuterRadius: { value: disk.outerRadius },
      uThickness: { value: disk.thickness },
      uOpacity: { value: disk.opacity },
      uBrightness: { value: disk.brightness },
      uBaseColor: { value: baseColor },
      uHighlightColor: { value: highlightColor },
      uClumpiness: { value: disk.clumpiness },
      uSeed: { value: normalizedSeed },
      // New shader-specific parameters
      uBandStrength: { value: disk.bandStrength ?? 0.5 },
      uBandFrequency: { value: disk.bandFrequency ?? 5 },
      uGapSharpness: { value: disk.gapSharpness ?? 0.5 },
      uInnerGlowStrength: { value: disk.innerGlowStrength ?? 0.6 },
      uNoiseScale: { value: disk.noiseScale ?? 1.5 },
      uNoiseStrength: { value: disk.noiseStrength ?? 0.4 },
      uSpiralStrength: { value: disk.spiralStrength ?? 0.1 },
      uSpiralArmCount: { value: disk.spiralArmCount ?? 2 },
      uEdgeSoftness: { value: disk.edgeSoftness ?? 0.4 },
      uTemperatureGradient: { value: disk.temperatureGradient ?? 1.5 },
    };
  }, [diskId]); // Only recreate when diskId changes
  
  // Generate sparkle particle positions
  const sparkleData = useMemo(() => {
    if (!disk) {
      return { positions: new Float32Array(0), sizes: new Float32Array(0) };
    }
    
    const seed = typeof disk.seed === 'number' ? disk.seed : hashString(String(disk.seed));
    const rng = createSeededRandom(seed + 12345); // Different seed offset for sparkles
    
    const count = disk.particleCount;
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      // Distribute sparkles in disk volume
      const r = disk.innerRadius + rng() * (disk.outerRadius - disk.innerRadius);
      const theta = rng() * Math.PI * 2;
      const y = gaussianRandom(rng) * disk.thickness * 0.3;
      
      positions[i * 3] = r * Math.cos(theta);
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = r * Math.sin(theta);
      
      // Vary sparkle size
      sizes[i] = 0.02 + rng() * 0.04;
    }
    
    return { positions, sizes };
  }, [disk?.particleCount, disk?.innerRadius, disk?.outerRadius, disk?.thickness, disk?.seed]);
  
  // Animate disk rotation and update uniforms every frame
  useFrame((_, delta) => {
    if (!uniforms) return;
    
    // Get fresh disk data from store every frame (avoids stale closure)
    const currentDisk = useSystemStore.getState().protoplanetaryDisks[diskId];
    if (!currentDisk) return;
    
    const currentTimeScale = useSystemStore.getState().timeScale;
    const rotationSpeed = currentDisk.rotationSpeedMultiplier * 0.02;
    rotationRef.current += delta * currentTimeScale * rotationSpeed;
    
    if (diskMeshRef.current) {
      diskMeshRef.current.rotation.y = rotationRef.current;
    }
    if (sparkleRef.current) {
      sparkleRef.current.rotation.y = rotationRef.current;
    }
    
    // Update time uniform for animated effects
    uniforms.uTime.value += delta * 0.1;
    
    // Update all uniforms every frame with fresh data to ensure reactivity
    uniforms.uInnerRadius.value = currentDisk.innerRadius;
    uniforms.uOuterRadius.value = currentDisk.outerRadius;
    uniforms.uThickness.value = currentDisk.thickness;
    uniforms.uOpacity.value = currentDisk.opacity;
    uniforms.uBrightness.value = currentDisk.brightness;
    uniforms.uBaseColor.value.set(currentDisk.baseColor);
    uniforms.uHighlightColor.value.set(currentDisk.highlightColor);
    uniforms.uClumpiness.value = currentDisk.clumpiness;
    uniforms.uBandStrength.value = currentDisk.bandStrength ?? 0.5;
    uniforms.uBandFrequency.value = currentDisk.bandFrequency ?? 5;
    uniforms.uGapSharpness.value = currentDisk.gapSharpness ?? 0.5;
    uniforms.uInnerGlowStrength.value = currentDisk.innerGlowStrength ?? 0.6;
    uniforms.uNoiseScale.value = currentDisk.noiseScale ?? 1.5;
    uniforms.uNoiseStrength.value = currentDisk.noiseStrength ?? 0.4;
    uniforms.uSpiralStrength.value = currentDisk.spiralStrength ?? 0.1;
    uniforms.uSpiralArmCount.value = currentDisk.spiralArmCount ?? 2;
    uniforms.uEdgeSoftness.value = currentDisk.edgeSoftness ?? 0.4;
    uniforms.uTemperatureGradient.value = currentDisk.temperatureGradient ?? 1.5;
  });
  
  // Note: Disk editing is now done through the Star Editor panel only
  
  if (!disk || !uniforms) {
    return null;
  }
  
  // Create ring geometry with enough segments for smooth gradients
  const innerRadius = disk.innerRadius;
  const outerRadius = disk.outerRadius;
  const radialSegments = 128; // Enough for smooth bands
  const thetaSegments = 128; // Smooth circular appearance
  
  return (
    <group>
      {/* Main shader-driven disk mesh */}
      <mesh ref={diskMeshRef} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[innerRadius, outerRadius, thetaSegments, radialSegments]} />
        <shaderMaterial
          transparent
          side={THREE.DoubleSide}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          uniforms={uniforms}
          vertexShader={DISK_VERTEX_SHADER}
          fragmentShader={DISK_FRAGMENT_SHADER}
        />
      </mesh>
      
      {/* Lightweight sparkle particle overlay */}
      {sparkleData.positions.length > 0 && (
        <points ref={sparkleRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={sparkleData.positions}
              count={sparkleData.positions.length / 3}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-size"
              array={sparkleData.sizes}
              count={sparkleData.sizes.length}
              itemSize={1}
            />
          </bufferGeometry>
          <shaderMaterial
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            uniforms={{
              uOpacity: { value: disk.opacity * 0.8 },
              uBrightness: { value: disk.brightness * 1.5 },
              uBaseColor: { value: new THREE.Color(disk.highlightColor) },
            }}
            vertexShader={SPARKLE_VERTEX_SHADER}
            fragmentShader={SPARKLE_FRAGMENT_SHADER}
          />
        </points>
      )}
      
    </group>
  );
};

// ============================================================================
// GLSL Shaders
// ============================================================================

const DISK_VERTEX_SHADER = `
  varying vec2 vUv;
  varying vec3 vPosition;
  
  void main() {
    vUv = uv;
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const DISK_FRAGMENT_SHADER = `
  uniform float uTime;
  uniform float uInnerRadius;
  uniform float uOuterRadius;
  uniform float uThickness;
  uniform float uOpacity;
  uniform float uBrightness;
  uniform vec3 uBaseColor;
  uniform vec3 uHighlightColor;
  uniform float uClumpiness;
  uniform float uSeed;
  uniform float uBandStrength;
  uniform float uBandFrequency;
  uniform float uGapSharpness;
  uniform float uInnerGlowStrength;
  uniform float uNoiseScale;
  uniform float uNoiseStrength;
  uniform float uSpiralStrength;
  uniform float uSpiralArmCount;
  uniform float uEdgeSoftness;
  uniform float uTemperatureGradient;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  
  // =========================================================================
  // Noise Functions (deterministic, GPU-based)
  // =========================================================================
  
  // Simple hash function for noise
  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1 + uSeed * 100.0, 311.7 + uSeed * 50.0))) * 43758.5453);
  }
  
  float hash3(vec3 p) {
    return fract(sin(dot(p, vec3(127.1 + uSeed * 100.0, 311.7, 74.7 + uSeed * 30.0))) * 43758.5453);
  }
  
  // Value noise 2D
  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  
  // Fractal Brownian Motion
  float fbm(vec2 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 4; i++) {
      if (i >= octaves) break;
      value += amplitude * noise(p * frequency);
      frequency *= 2.0;
      amplitude *= 0.5;
    }
    
    return value;
  }
  
  // =========================================================================
  // Main Disk Shader
  // =========================================================================
  
  void main() {
    // Calculate polar coordinates
    vec2 centered = vPosition.xy;
    float radius = length(centered);
    float angle = atan(centered.y, centered.x);
    
    // Normalize radius to 0-1 within disk bounds
    float radiusNorm = (radius - uInnerRadius) / (uOuterRadius - uInnerRadius);
    radiusNorm = clamp(radiusNorm, 0.0, 1.0);
    
    // =====================================================================
    // Temperature / Color Gradient (hot inner -> cooler outer)
    // =====================================================================
    float tempBlend = pow(1.0 - radiusNorm, uTemperatureGradient);
    vec3 diskColor = mix(uBaseColor, uHighlightColor, tempBlend);
    
    // =====================================================================
    // Inner Glow Effect (bright emission near star)
    // =====================================================================
    float innerGlow = pow(1.0 - radiusNorm, 2.5) * uInnerGlowStrength;
    
    // =====================================================================
    // Concentric Band Structure
    // =====================================================================
    // Create periodic band pattern
    float bandPattern = radiusNorm * uBandFrequency * 3.14159 * 2.0;
    
    // Add noise to break up perfect circles
    float noiseOffset = fbm(vec2(radiusNorm * 5.0 + uSeed, angle * 0.5) * uNoiseScale, 3) * uNoiseStrength;
    bandPattern += noiseOffset * 3.0;
    
    // Create bands with adjustable sharpness
    float bands = sin(bandPattern);
    bands = mix(bands, sign(bands) * pow(abs(bands), 0.5), uGapSharpness * 0.8);
    bands = bands * 0.5 + 0.5; // Normalize to 0-1
    
    // Apply band strength
    float bandMask = mix(1.0, bands, uBandStrength);
    
    // Create darker gaps between bright rings
    float gaps = smoothstep(0.3, 0.5, bands);
    bandMask *= mix(1.0, gaps, uGapSharpness * 0.5);
    
    // =====================================================================
    // Spiral Arm Perturbation (optional)
    // =====================================================================
    float spiral = 0.0;
    if (uSpiralStrength > 0.01) {
      float spiralAngle = angle * uSpiralArmCount + radiusNorm * 8.0 + uTime * 0.2;
      spiral = sin(spiralAngle) * 0.5 + 0.5;
      spiral = pow(spiral, 1.5);
    }
    float spiralMask = mix(1.0, spiral, uSpiralStrength * 0.5);
    
    // =====================================================================
    // Clumpiness / Density Variation (noise-based)
    // =====================================================================
    vec2 noiseCoord = vec2(radiusNorm * 3.0, angle * 2.0 / 3.14159) * uNoiseScale;
    float clumpNoise = fbm(noiseCoord + vec2(uSeed * 10.0, 0.0), 3);
    float clumpMask = mix(1.0, clumpNoise * 1.5 + 0.5, uClumpiness);
    
    // =====================================================================
    // Edge Softness (outer falloff)
    // =====================================================================
    float outerFalloff = 1.0 - smoothstep(1.0 - uEdgeSoftness, 1.0, radiusNorm);
    float innerFalloff = smoothstep(0.0, 0.05, radiusNorm);
    float edgeMask = outerFalloff * innerFalloff;
    
    // =====================================================================
    // Thickness-based brightness modulation (volumetric feel)
    // =====================================================================
    // Thicker disks appear more opaque/brighter at the center
    float thicknessBoost = 1.0 + uThickness * 0.3;
    
    // =====================================================================
    // Combine All Effects
    // =====================================================================
    float combinedMask = bandMask * spiralMask * clumpMask * edgeMask;
    
    // Final brightness calculation
    float finalBrightness = uBrightness * combinedMask * thicknessBoost;
    finalBrightness += innerGlow; // Add inner glow on top
    
    // Apply color and brightness
    vec3 finalColor = diskColor * finalBrightness;
    
    // Add slight color variation in bands
    finalColor = mix(finalColor, uHighlightColor * finalBrightness * 1.2, bands * uBandStrength * 0.3);
    
    // Final opacity calculation
    float finalOpacity = uOpacity * combinedMask;
    finalOpacity = clamp(finalOpacity, 0.0, 1.0);
    
    // Output
    gl_FragColor = vec4(finalColor, finalOpacity);
  }
`;

const SPARKLE_VERTEX_SHADER = `
  attribute float size;
  varying float vSize;
  
  void main() {
    vSize = size;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const SPARKLE_FRAGMENT_SHADER = `
  uniform float uOpacity;
  uniform float uBrightness;
  uniform vec3 uBaseColor;
  
  varying float vSize;
  
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;
    
    // Soft sparkle falloff
    float alpha = smoothstep(0.5, 0.0, dist);
    alpha *= alpha; // Extra soft
    
    // Slight twinkle effect based on position
    float twinkle = 0.7 + 0.3 * sin(vSize * 1000.0);
    
    vec3 finalColor = uBaseColor * uBrightness * twinkle;
    gl_FragColor = vec4(finalColor, alpha * uOpacity);
  }
`;

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
    hash = hash & hash;
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
