import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSystemStore } from '../state/systemStore';

interface BlackHoleObjectProps {
  bodyId: string;
}

/**
 * Renders a black hole with:
 * - Event horizon shadow (dark core)
 * - Photon ring (bright ring just outside shadow)
 * - Accretion disk with gravitational lensing approximation
 * - Doppler beaming (disk appears brighter on approaching side)
 * - Relativistic jets (optional, collimated beams)
 * 
 * This is a GPU-efficient particle/shader-based implementation that approximates
 * relativistic effects without full GR simulation.
 */
export const BlackHoleObject: React.FC<BlackHoleObjectProps> = ({ bodyId }) => {
  const diskPointsRef = useRef<THREE.Points>(null);
  const rotationRef = useRef<number>(0);
  const shaderMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const jetTopMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const jetBottomMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const jetCoreTopMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const jetCoreBottomMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const secondaryRingMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  
  // NUCLEAR OPTION: Subscribe to the entire store state
  // This guarantees we catch every update, even nested ones
  const store = useSystemStore();
  const star = store.stars[bodyId];
  const timeScale = store.timeScale;
  const blackHole = star?.blackHole;
  
  // Create a version string for dependency tracking
  const starsVersion = blackHole ? JSON.stringify(blackHole) : '';
  
  // Create stable uniform objects that persist across renders
  // useFrame will update the .value properties, but the object references stay the same
  const shaderUniforms = useMemo(() => ({
    opacity: { value: blackHole?.diskOpacity ?? 0.5 },
    brightness: { value: blackHole?.diskBrightness ?? 0.5 },
    dopplerStrength: { value: blackHole?.dopplerBeamingStrength ?? 0.5 },
    lensingStrength: { value: blackHole?.lensingStrength ?? 0.5 },
    shadowRadius: { value: blackHole?.shadowRadius ?? 1.0 },
    time: { value: 0 },
  }), []); // Empty deps - create once, update via useFrame
  
  // Debug: Log when black hole properties change
  useEffect(() => {
    if (blackHole) {
      console.log('🕳️ [BlackHoleObject] Properties updated:', {
        bodyId,
        diskBrightness: blackHole.diskBrightness,
        diskOpacity: blackHole.diskOpacity,
        diskTemperature: blackHole.diskTemperature,
        diskClumpiness: blackHole.diskClumpiness,
        dopplerBeamingStrength: blackHole.dopplerBeamingStrength,
        lensingStrength: blackHole.lensingStrength,
        spin: blackHole.spin,
        rotationSpeedMultiplier: blackHole.rotationSpeedMultiplier,
      });
      
      // Immediately update shader uniforms when properties change
      // Use setTimeout to ensure ref is assigned on first render
      setTimeout(() => {
        if (shaderMaterialRef.current) {
          console.log('  ✅ Updating shader uniforms NOW');
          const uniforms = shaderMaterialRef.current.uniforms;
          uniforms.opacity.value = blackHole.diskOpacity;
          uniforms.brightness.value = blackHole.diskBrightness;
          uniforms.dopplerStrength.value = blackHole.dopplerBeamingStrength;
          uniforms.lensingStrength.value = blackHole.lensingStrength;
          uniforms.shadowRadius.value = blackHole.shadowRadius;
          shaderMaterialRef.current.needsUpdate = true;
        } else {
          console.log('  ⚠️ Shader material ref STILL not available');
        }
      }, 0);
    } else {
      console.log('  ⚠️ No blackHole data');
    }
  }, [
    starsVersion, // This forces update when any blackHole property changes
    bodyId,
  ]);
  
  // Generate accretion disk particles
  const diskGeometry = useMemo(() => {
    if (!blackHole || !blackHole.hasAccretionDisk) {
      return { positions: new Float32Array(0), colors: new Float32Array(0), sizes: new Float32Array(0) };
    }
    
    const bh = blackHole;
    const seed = typeof bh.seed === 'number' ? bh.seed : hashString(String(bh.seed));
    const rng = createSeededRandom(seed);
    
    // Particle count based on disk size (more particles for larger disks)
    const diskArea = Math.PI * (bh.accretionOuterRadius ** 2 - bh.accretionInnerRadius ** 2);
    const baseCount = 3000;
    let count = Math.floor(baseCount * Math.min(diskArea / 100, 2.0));
    
    // Safety check: ensure count is valid and reasonable
    if (!Number.isFinite(count) || count < 0 || count > 10000) {
      console.warn(`[BlackHoleObject] Invalid particle count (${count}), using safe default`, { bh });
      count = 3000;
    }
    
    console.log(`[BlackHoleObject] Generating disk geometry with ${count} particles`, {
      innerRadius: bh.accretionInnerRadius,
      outerRadius: bh.accretionOuterRadius,
      thickness: bh.diskThickness,
      temperature: bh.diskTemperature,
      clumpiness: bh.diskClumpiness,
    });
    
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    
    for (let i = 0; i < count; i++) {
      // Radial position: non-uniform distribution (denser near inner edge)
      const u = rng();
      const r = bh.accretionInnerRadius + (bh.accretionOuterRadius - bh.accretionInnerRadius) * Math.sqrt(u);
      
      // Angular position
      const theta = rng() * Math.PI * 2;
      
      // Vertical offset: Gaussian distribution with disk thickness
      const y = gaussianRandom(rng) * bh.diskThickness * 0.5;
      
      // Clumpiness: density variations
      const clumpNoise = (Math.sin(theta * 7 + r * 0.5) * 0.5 + 0.5) * bh.diskClumpiness;
      
      positions[i * 3] = r * Math.cos(theta);
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = r * Math.sin(theta);
      
      // Color: temperature gradient (inner = hot/blue-white, outer = cooler/red-orange)
      const radialBlend = (r - bh.accretionInnerRadius) / (bh.accretionOuterRadius - bh.accretionInnerRadius);
      const temp = bh.diskTemperature * (1 - radialBlend * 0.7); // Inner hotter
      
      // Map temperature to color (simplified black-body)
      const color = temperatureToColor(temp);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      // Size: larger particles near inner edge
      const baseSize = 0.04 + (1 - radialBlend) * 0.06;
      sizes[i] = baseSize * (0.7 + rng() * 0.6) * (1 + clumpNoise * 0.3);
    }
    
    return { positions, colors, sizes };
  }, [
    starsVersion, // Force regeneration when any property changes
  ]);
  
  // Animate disk rotation and update shader uniforms
  useFrame(() => {
    if (!blackHole) return;
    
    // Update disk rotation
    // Spin parameter affects rotation speed (higher spin = faster rotation)
    if (diskPointsRef.current) {
      const spinFactor = 0.5 + (blackHole.spin * 1.5); // 0.5x to 2x based on spin
      const rotationSpeed = blackHole.rotationSpeedMultiplier * spinFactor * 0.03;
      rotationRef.current += 0.016 * timeScale * rotationSpeed;
      diskPointsRef.current.rotation.y = rotationRef.current;
    }
    
    // Update shader uniforms dynamically when properties change
    if (shaderMaterialRef.current) {
      const uniforms = shaderMaterialRef.current.uniforms;
      uniforms.opacity.value = blackHole.diskOpacity;
      uniforms.brightness.value = blackHole.diskBrightness;
      uniforms.dopplerStrength.value = blackHole.dopplerBeamingStrength;
      uniforms.lensingStrength.value = blackHole.lensingStrength;
      uniforms.shadowRadius.value = blackHole.shadowRadius;
      // Note: uniforms are automatically uploaded each frame in Three.js
    }
    
    // Update jet materials dynamically
    if (jetTopMaterialRef.current) {
      jetTopMaterialRef.current.opacity = blackHole.jetBrightness * 0.7;
      jetTopMaterialRef.current.needsUpdate = true;
    }
    if (jetBottomMaterialRef.current) {
      jetBottomMaterialRef.current.opacity = blackHole.jetBrightness * 0.7;
      jetBottomMaterialRef.current.needsUpdate = true;
    }
    if (jetCoreTopMaterialRef.current) {
      jetCoreTopMaterialRef.current.opacity = blackHole.jetBrightness;
      jetCoreTopMaterialRef.current.needsUpdate = true;
    }
    if (jetCoreBottomMaterialRef.current) {
      jetCoreBottomMaterialRef.current.opacity = blackHole.jetBrightness;
      jetCoreBottomMaterialRef.current.needsUpdate = true;
    }
    
    // Update secondary ring material
    if (secondaryRingMaterialRef.current) {
      secondaryRingMaterialRef.current.opacity = 0.2 * blackHole.lensingStrength;
      secondaryRingMaterialRef.current.needsUpdate = true;
    }
  });
  
  if (!star || star.bodyType !== 'blackHole' || !blackHole) {
    return null;
  }
  
  const bh = blackHole;
  
  return (
    <group>
      {/* Event Horizon Shadow - dark sphere at center */}
      <mesh key={`shadow-${bh.shadowRadius}`}>
        <sphereGeometry args={[bh.shadowRadius, 32, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      
      {/* Photon Ring - bright ring just outside shadow */}
      {bh.hasPhotonRing && (
        <mesh rotation={[Math.PI / 2, 0, 0]} key={`photon-ring-${bh.shadowRadius}`}>
          <ringGeometry args={[bh.shadowRadius * 1.8, bh.shadowRadius * 2.2, 64]} />
          <meshBasicMaterial
            color="#ffffff"
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
      
      {/* Accretion Disk */}
      {bh.hasAccretionDisk && diskGeometry.positions.length > 0 && (
        <points ref={diskPointsRef}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              array={diskGeometry.positions}
              count={diskGeometry.positions.length / 3}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-color"
              array={diskGeometry.colors}
              count={diskGeometry.colors.length / 3}
              itemSize={3}
            />
            <bufferAttribute
              attach="attributes-size"
              array={diskGeometry.sizes}
              count={diskGeometry.sizes.length}
              itemSize={1}
            />
          </bufferGeometry>
          <shaderMaterial
            ref={shaderMaterialRef}
            vertexColors
            transparent
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            uniforms={shaderUniforms}
            vertexShader={`
              attribute float size;
              varying vec3 vColor;
              varying vec3 vPosition;
              
              uniform float lensingStrength;
              uniform float shadowRadius;
              
              void main() {
                vColor = color;
                vPosition = position;
                
                // Approximate gravitational lensing by warping positions near black hole
                vec3 pos = position;
                float distFromCenter = length(pos.xz);
                float lensingFactor = lensingStrength * smoothstep(shadowRadius * 5.0, shadowRadius * 2.0, distFromCenter);
                
                // Bend light paths near the black hole (simplified)
                // This creates the visual effect of seeing the far side of the disk "wrapped" above
                if (distFromCenter < shadowRadius * 4.0) {
                  float bendAmount = lensingFactor * 0.3;
                  pos.y += bendAmount * shadowRadius * (1.0 - distFromCenter / (shadowRadius * 4.0));
                }
                
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_PointSize = size * (300.0 / -mvPosition.z);
                gl_Position = projectionMatrix * mvPosition;
              }
            `}
            fragmentShader={`
              uniform float opacity;
              uniform float brightness;
              uniform float dopplerStrength;
              varying vec3 vColor;
              varying vec3 vPosition;
              
              void main() {
                // Circular particle with soft edges
                vec2 center = gl_PointCoord - vec2(0.5);
                float dist = length(center);
                if (dist > 0.5) discard;
                
                float alpha = smoothstep(0.5, 0.0, dist);
                
                // Doppler beaming approximation
                // Side of disk moving toward camera appears brighter and bluer
                // Side moving away appears dimmer and redder
                float angle = atan(vPosition.z, vPosition.x);
                float velocityFactor = cos(angle); // Positive = toward camera, negative = away
                
                // Amplified Doppler effect for better visibility (1.0 instead of 0.5)
                float dopplerBrightness = 1.0 + dopplerStrength * velocityFactor * 1.0;
                vec3 dopplerShift = vColor;
                
                if (velocityFactor > 0.0) {
                  // Approaching side: blue shift (increase blue, slight decrease red)
                  // Amplified color shift (0.3 and 0.4 instead of 0.1 and 0.2)
                  dopplerShift = vColor + vec3(-0.3, 0.0, 0.4) * dopplerStrength * velocityFactor;
                } else {
                  // Receding side: red shift (increase red, decrease blue)
                  // Amplified color shift (0.4 and 0.3 instead of 0.2 and 0.1)
                  dopplerShift = vColor + vec3(0.4, 0.0, -0.3) * dopplerStrength * abs(velocityFactor);
                }
                
                // Apply brightness with stronger effect (multiply by 2 for more dramatic changes)
                vec3 finalColor = dopplerShift * (brightness * 2.0) * dopplerBrightness;
                finalColor = clamp(finalColor, 0.0, 1.5); // Allow slight overbright
                
                // Apply opacity with stronger effect
                gl_FragColor = vec4(finalColor, alpha * opacity);
              }
            `}
          />
        </points>
      )}
      
      {/* Relativistic Jets (if present) */}
      {bh.hasRelativisticJet && (
        <>
          {/* Top jet */}
          <mesh position={[0, bh.jetLength / 2, 0]} key={`jet-top-${bh.jetLength}-${bh.jetOpeningAngle}`}>
            <cylinderGeometry 
              args={[
                bh.shadowRadius * Math.tan(bh.jetOpeningAngle * Math.PI / 180) * 0.5,
                bh.shadowRadius * Math.tan(bh.jetOpeningAngle * Math.PI / 180),
                bh.jetLength,
                16
              ]} 
            />
            <meshBasicMaterial
              ref={jetTopMaterialRef}
              color="#66ccff"
              transparent
              opacity={bh.jetBrightness * 0.7}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          
          {/* Bottom jet */}
          <mesh position={[0, -bh.jetLength / 2, 0]} key={`jet-bottom-${bh.jetLength}-${bh.jetOpeningAngle}`}>
            <cylinderGeometry 
              args={[
                bh.shadowRadius * Math.tan(bh.jetOpeningAngle * Math.PI / 180) * 0.5,
                bh.shadowRadius * Math.tan(bh.jetOpeningAngle * Math.PI / 180),
                bh.jetLength,
                16
              ]} 
            />
            <meshBasicMaterial
              ref={jetBottomMaterialRef}
              color="#66ccff"
              transparent
              opacity={bh.jetBrightness * 0.7}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          
          {/* Jet core glow */}
          <mesh position={[0, bh.jetLength / 2, 0]} key={`jet-core-top-${bh.jetLength}`}>
            <cylinderGeometry args={[0.05, 0.05, bh.jetLength, 8]} />
            <meshBasicMaterial
              ref={jetCoreTopMaterialRef}
              color="#ffffff"
              transparent
              opacity={bh.jetBrightness}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
          <mesh position={[0, -bh.jetLength / 2, 0]} key={`jet-core-bottom-${bh.jetLength}`}>
            <cylinderGeometry args={[0.05, 0.05, bh.jetLength, 8]} />
            <meshBasicMaterial
              ref={jetCoreBottomMaterialRef}
              color="#ffffff"
              transparent
              opacity={bh.jetBrightness}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        </>
      )}
      
      {/* Gravitational lensing ring effect (secondary image) */}
      {bh.hasAccretionDisk && bh.lensingStrength > 0.5 && (
        <mesh rotation={[Math.PI / 2, 0, 0]} key={`secondary-ring-${bh.shadowRadius}`}>
          <ringGeometry args={[bh.shadowRadius * 2.5, bh.shadowRadius * 3.5, 32]} />
          <meshBasicMaterial
            ref={secondaryRingMaterialRef}
            color="#ff8844"
            transparent
            opacity={0.2 * bh.lensingStrength}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      )}
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

/**
 * Convert temperature (Kelvin) to RGB color (simplified black-body approximation)
 */
function temperatureToColor(temp: number): THREE.Color {
  // Simplified black-body radiation color
  // Cool: red-orange (~5000K), Hot: blue-white (~20000K+)
  
  const t = Math.max(1000, Math.min(40000, temp));
  const normalized = (t - 1000) / (40000 - 1000);
  
  let r, g, b;
  
  if (normalized < 0.33) {
    // Cool: red-orange
    r = 1.0;
    g = 0.3 + normalized * 2.0;
    b = 0.1 + normalized * 0.5;
  } else if (normalized < 0.66) {
    // Medium: orange-yellow
    const t2 = (normalized - 0.33) / 0.33;
    r = 1.0;
    g = 0.6 + t2 * 0.4;
    b = 0.3 + t2 * 0.4;
  } else {
    // Hot: white-blue
    const t3 = (normalized - 0.66) / 0.34;
    r = 1.0 - t3 * 0.2;
    g = 0.9 + t3 * 0.1;
    b = 0.7 + t3 * 0.3;
  }
  
  return new THREE.Color(r, g, b);
}

