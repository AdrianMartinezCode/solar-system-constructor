import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { NebulaRegion } from '../types';

interface NebulaObjectProps {
  nebula: NebulaRegion;
}

/**
 * NebulaObject - renders a large-scale volumetric nebula region as a GPU particle field
 * 
 * These are visual-only, galaxy-scale clouds that sit outside star clusters.
 * They use additive blending and noise-based positioning for a volumetric appearance.
 */
export const NebulaObject: React.FC<NebulaObjectProps> = ({ nebula }) => {
  const pointsRef = useRef<THREE.Points>(null);
  
  // Generate particle positions and colors using deterministic PRNG
  const { positions, colors, alphas } = useMemo(() => {
    // Particle count scaled by nebula size (larger nebulae get more particles)
    const particleCountBase = 8000;
    const sizeScale = nebula.radius / 150; // Normalize around typical radius of 150
    const particleCount = Math.floor(particleCountBase * Math.max(0.5, Math.min(2, sizeScale)));
    
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const alphas = new Float32Array(particleCount);
    
    // Create deterministic random number generator from seed
    const seedValue = typeof nebula.seed === 'number' ? nebula.seed : 12345;
    const rng = (() => {
      let s = seedValue;
      return () => {
        s = Math.sin(s) * 10000;
        return s - Math.floor(s);
      };
    })();
    
    // Parse colors
    const baseColorRGB = new THREE.Color(nebula.baseColor);
    const accentColorRGB = new THREE.Color(nebula.accentColor);
    
    // Determine if ellipsoidal or spherical
    const dimensions = nebula.dimensions || { x: nebula.radius, y: nebula.radius, z: nebula.radius };
    
    // Simple 3D noise function (Perlin-like approximation)
    const noise3D = (x: number, y: number, z: number): number => {
      const scale = nebula.noiseScale;
      const detail = Math.floor(nebula.noiseDetail);
      
      let value = 0;
      let amplitude = 1;
      let frequency = scale;
      
      for (let i = 0; i < detail; i++) {
        const sx = x * frequency;
        const sy = y * frequency;
        const sz = z * frequency;
        
        // Simple hash-based noise
        const n = Math.sin(sx * 12.9898 + sy * 78.233 + sz * 37.719) * 43758.5453123;
        value += (n - Math.floor(n)) * amplitude;
        
        amplitude *= 0.5;
        frequency *= 2;
      }
      
      return value / 2 + 0.5; // Normalize to [0, 1]
    };
    
    for (let i = 0; i < particleCount; i++) {
      // Sample position within ellipsoid using rejection sampling
      let x, y, z, r;
      let attempts = 0;
      do {
        // Sample within bounding box
        x = (rng() - 0.5) * 2;
        y = (rng() - 0.5) * 2;
        z = (rng() - 0.5) * 2;
        
        // Check if inside ellipsoid
        r = (x * x) / 1 + (y * y) / 1 + (z * z) / 1;
        attempts++;
      } while (r > 1 && attempts < 10);
      
      // Apply power distribution for denser center
      const centerBias = Math.pow(rng(), 0.7); // Bias toward center
      
      // Scale by dimensions
      const px = nebula.position.x + x * dimensions.x * centerBias;
      const py = nebula.position.y + y * dimensions.y * centerBias;
      const pz = nebula.position.z + z * dimensions.z * centerBias;
      
      positions[i * 3] = px;
      positions[i * 3 + 1] = py;
      positions[i * 3 + 2] = pz;
      
      // Apply noise-based density modulation
      const noiseValue = noise3D(px * 0.01, py * 0.01, pz * 0.01);
      
      // Color interpolation based on noise and radial distance
      const distFromCenter = Math.sqrt(x * x + y * y + z * z);
      const t = distFromCenter * 0.5 + noiseValue * 0.5; // Mix distance and noise
      const color = baseColorRGB.clone().lerp(accentColorRGB, t);
      
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      
      // Alpha based on density, noise, and distance from center
      const densityFactor = nebula.density;
      const noiseFactor = noiseValue;
      const distanceFalloff = 1 - Math.pow(distFromCenter, 1.5); // Softer fade at edges (was ^2)
      
      // Boosted alpha for visibility at far distances
      alphas[i] = Math.min(1.0, densityFactor * noiseFactor * distanceFalloff * 1.2);
    }
    
    return { positions, colors, alphas };
  }, [nebula]);
  
  // Particle size based on nebula radius (larger nebulae = larger particles)
  const particleSize = useMemo(() => {
    return Math.max(1.5, nebula.radius * 0.02);
  }, [nebula.radius]);
  
  // Slow rotation animation (optional)
  useFrame((_state: unknown, delta: number) => {
    if (pointsRef.current) {
      // Very slow rotation for subtle movement
      pointsRef.current.rotation.y += delta * 0.01;
    }
  });
  
  if (!nebula.visible) return null;
  
  return (
    <points ref={pointsRef} frustumCulled={false} renderOrder={-1}>
      <bufferGeometry onUpdate={(self) => self.computeBoundingSphere()}>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={colors.length / 3}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-alpha"
          count={alphas.length}
          array={alphas}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={particleSize}
        vertexColors
        transparent
        opacity={Math.min(1.0, nebula.brightness * 1.2)}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation={true}
        fog={false}
      />
    </points>
  );
};

