import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useSystemStore } from '../state/systemStore';

interface BlackHoleObjectProps {
  bodyId: string;
}

/**
 * Renders a black hole with unified, cinematic visuals:
 * - Event horizon shadow (dark core)
 * - Continuous thick accretion disk with volumetric appearance
 * - Realistic photon ring tightly integrated with disk inner edge
 * - Gravitational lensing showing far-side disk warped over the top AND underside
 * - Cone-shaped relativistic jets anchored to the poles
 * 
 * All components rotate together under a unified tilted group for cohesive appearance.
 */
export const BlackHoleObject: React.FC<BlackHoleObjectProps> = ({ bodyId }) => {
  const groupRef = useRef<THREE.Group>(null);
  const diskMeshRef = useRef<THREE.Mesh>(null);
  const diskTopMeshRef = useRef<THREE.Mesh>(null);
  const diskBottomMeshRef = useRef<THREE.Mesh>(null);
  const diskMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const diskTopMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const diskBottomMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const rotationRef = useRef<number>(0);
  
  // Subscribe to store state
  const store = useSystemStore();
  const star = store.stars[bodyId];
  const timeScale = store.timeScale;
  const blackHole = star?.blackHole;
  
  // Create stable uniform objects for main disk
  const diskUniforms = useMemo(() => ({
    time: { value: 0 },
    opacity: { value: blackHole?.diskOpacity ?? 0.7 },
    brightness: { value: blackHole?.diskBrightness ?? 0.8 },
    temperature: { value: blackHole?.diskTemperature ?? 12000 },
    clumpiness: { value: blackHole?.diskClumpiness ?? 0.5 },
    dopplerStrength: { value: blackHole?.dopplerBeamingStrength ?? 0.6 },
    lensingStrength: { value: blackHole?.lensingStrength ?? 0.7 },
    shadowRadius: { value: blackHole?.shadowRadius ?? 1.0 },
    innerRadius: { value: blackHole?.accretionInnerRadius ?? 2.5 },
    outerRadius: { value: blackHole?.accretionOuterRadius ?? 8.0 },
    streakiness: { value: blackHole?.diskStreakiness ?? 0.6 },
    turbulenceScale: { value: blackHole?.diskTurbulenceScale ?? 0.5 },
    diskThickness: { value: blackHole?.diskThickness ?? 0.2 },
    diskInnerColor: { value: blackHole?.diskInnerColor ? new THREE.Color(blackHole.diskInnerColor) : new THREE.Color(0.95, 0.98, 1.0) },
    diskOuterColor: { value: blackHole?.diskOuterColor ? new THREE.Color(blackHole.diskOuterColor) : new THREE.Color(1.0, 0.4, 0.1) },
  }), []); // Create once, update via useFrame
  
  // Debug: Log when properties change
  useEffect(() => {
    if (blackHole) {
      console.log('🕳️ [BlackHoleObject] Properties updated:', {
        bodyId,
        diskBrightness: blackHole.diskBrightness,
        diskOpacity: blackHole.diskOpacity,
        lensingStrength: blackHole.lensingStrength,
        dopplerBeamingStrength: blackHole.dopplerBeamingStrength,
        diskTilt: blackHole.diskTilt,
      });
    }
  }, [bodyId, blackHole]);
  
  // Animate and update uniforms
  useFrame((state, delta) => {
    if (!blackHole) return;
    
    // Update disk rotation
    const spinFactor = 0.5 + (blackHole.spin * 1.5);
    const rotationSpeed = blackHole.rotationSpeedMultiplier * spinFactor * 0.05;
    rotationRef.current += delta * timeScale * rotationSpeed;
    
    // Apply rotation to all disk components
    if (diskMeshRef.current) {
      diskMeshRef.current.rotation.y = rotationRef.current;
    }
    if (diskTopMeshRef.current) {
      diskTopMeshRef.current.rotation.y = rotationRef.current;
    }
    if (diskBottomMeshRef.current) {
      diskBottomMeshRef.current.rotation.y = rotationRef.current;
    }
    
    // Update all disk shader uniforms
    const updateUniforms = (material: THREE.ShaderMaterial | null) => {
      if (!material) return;
      const uniforms = material.uniforms;
      uniforms.time.value = state.clock.elapsedTime;
      uniforms.opacity.value = blackHole.diskOpacity;
      uniforms.brightness.value = blackHole.diskBrightness;
      uniforms.temperature.value = blackHole.diskTemperature;
      uniforms.clumpiness.value = blackHole.diskClumpiness;
      uniforms.dopplerStrength.value = blackHole.dopplerBeamingStrength;
      uniforms.lensingStrength.value = blackHole.lensingStrength;
      uniforms.shadowRadius.value = blackHole.shadowRadius;
      uniforms.innerRadius.value = blackHole.accretionInnerRadius;
      uniforms.outerRadius.value = blackHole.accretionOuterRadius;
      uniforms.streakiness.value = blackHole.diskStreakiness ?? 0.6;
      uniforms.turbulenceScale.value = blackHole.diskTurbulenceScale ?? 0.5;
      uniforms.diskThickness.value = blackHole.diskThickness ?? 0.2;
      
      // Update colors if custom colors are provided
      if (blackHole.diskInnerColor) {
        uniforms.diskInnerColor.value.set(blackHole.diskInnerColor);
      }
      if (blackHole.diskOuterColor) {
        uniforms.diskOuterColor.value.set(blackHole.diskOuterColor);
      }
    };
    
    updateUniforms(diskMaterialRef.current);
    updateUniforms(diskTopMaterialRef.current);
    updateUniforms(diskBottomMaterialRef.current);
  });
  
  if (!star || star.bodyType !== 'blackHole' || !blackHole) {
    return null;
  }
  
  const bh = blackHole;
  
  // Calculate tilt rotation - default to slight incline for best visual
  const diskTilt = bh.diskTilt ?? (Math.PI * 0.15); // ~27 degrees default
  const tiltAxisAngle = bh.diskTiltAxisAngle ?? 0;
  
  return (
    <group
      ref={groupRef}
      rotation={[
        Math.cos(tiltAxisAngle) * diskTilt,
        0,
        Math.sin(tiltAxisAngle) * diskTilt
      ]}
    >
      {/* Event Horizon Shadow - perfectly black sphere */}
      <mesh key={`shadow-${bh.shadowRadius}`}>
        <sphereGeometry args={[bh.shadowRadius, 64, 64]} />
        <meshBasicMaterial color="#000000" depthWrite={true} />
      </mesh>
      
      {/* Photon Ring - realistic multi-image lensing, tightly hugging shadow */}
      {bh.hasPhotonRing && (
        <PhotonRingObject
          shadowRadius={bh.shadowRadius}
          lensingStrength={bh.lensingStrength}
          diskTemperature={bh.diskTemperature}
          diskBrightness={bh.diskBrightness}
          multiImageCount={bh.photonRingMultiImageCount ?? 3}
          ringWidth={bh.photonRingWidth ?? 0.15}
        />
      )}
      
      {/* Accretion Disk - continuous volumetric flow with thickness */}
      {bh.hasAccretionDisk && (
        <>
          {/* Main disk mid-plane */}
          <mesh ref={diskMeshRef} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry 
              args={[
                bh.accretionInnerRadius, 
                bh.accretionOuterRadius, 
                256, // Very high segment count for smooth appearance
                64   // Radial segments for lensing warp
              ]} 
            />
            <shaderMaterial
              ref={diskMaterialRef}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
              uniforms={diskUniforms}
              vertexShader={accretionDiskVertexShader}
              fragmentShader={accretionDiskFragmentShader}
            />
          </mesh>
          
          {/* Top half of volumetric disk */}
          <mesh ref={diskTopMeshRef} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[bh.accretionInnerRadius, bh.accretionOuterRadius, 256, 32]} />
            <shaderMaterial
              ref={diskTopMaterialRef}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
              uniforms={diskUniforms}
              vertexShader={volumetricDiskVertexShader}
              fragmentShader={volumetricDiskFragmentShader}
            />
          </mesh>
          
          {/* Bottom half of volumetric disk */}
          <mesh ref={diskBottomMeshRef} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[bh.accretionInnerRadius, bh.accretionOuterRadius, 256, 32]} />
            <shaderMaterial
              ref={diskBottomMaterialRef}
              transparent
              depthWrite={false}
              blending={THREE.AdditiveBlending}
              side={THREE.DoubleSide}
              uniforms={diskUniforms}
              vertexShader={volumetricDiskVertexShaderBottom}
              fragmentShader={volumetricDiskFragmentShader}
            />
          </mesh>
        </>
      )}
      
      {/* Lensed Far-Side Disk Images (top and bottom) */}
      {bh.hasAccretionDisk && bh.lensingStrength > 0.2 && (
        <>
          <LensedDiskImage
            innerRadius={bh.accretionInnerRadius}
            outerRadius={bh.accretionOuterRadius}
            shadowRadius={bh.shadowRadius}
            lensingStrength={bh.lensingStrength}
            diskTemperature={bh.diskTemperature}
            diskBrightness={bh.diskBrightness}
            diskOpacity={bh.diskOpacity}
            rotationRef={rotationRef}
            position="top"
          />
          <LensedDiskImage
            innerRadius={bh.accretionInnerRadius}
            outerRadius={bh.accretionOuterRadius}
            shadowRadius={bh.shadowRadius}
            lensingStrength={bh.lensingStrength}
            diskTemperature={bh.diskTemperature}
            diskBrightness={bh.diskBrightness}
            diskOpacity={bh.diskOpacity}
            rotationRef={rotationRef}
            position="bottom"
          />
        </>
      )}
      
      {/* Relativistic Jets - cone-shaped with gradients, anchored to poles */}
      {bh.hasRelativisticJet && (
        <>
          <RelativisticJet
            shadowRadius={bh.shadowRadius}
            jetLength={bh.jetLength}
            jetOpeningAngle={bh.jetOpeningAngle}
            jetBrightness={bh.jetBrightness}
            baseColor={bh.jetBaseColor ?? '#e8f4ff'}
            tipColor={bh.jetTipColor ?? '#4488ff'}
            gradientPower={bh.jetGradientPower ?? 1.8}
            direction="up"
          />
          <RelativisticJet
            shadowRadius={bh.shadowRadius}
            jetLength={bh.jetLength}
            jetOpeningAngle={bh.jetOpeningAngle}
            jetBrightness={bh.jetBrightness}
            baseColor={bh.jetBaseColor ?? '#e8f4ff'}
            tipColor={bh.jetTipColor ?? '#4488ff'}
            gradientPower={bh.jetGradientPower ?? 1.8}
            direction="down"
          />
        </>
      )}
    </group>
  );
};

// ============================================================================
// Sub-Components
// ============================================================================

/**
 * Photon Ring - represents light that orbited the black hole multiple times
 * Shows multiple lensed images as concentric bright rings
 * Now tightly hugging the shadow and integrated with disk color
 */
interface PhotonRingObjectProps {
  shadowRadius: number;
  lensingStrength: number;
  diskTemperature: number;
  diskBrightness: number;
  multiImageCount?: number;
  ringWidth?: number;
}

const PhotonRingObject: React.FC<PhotonRingObjectProps> = ({
  shadowRadius,
  lensingStrength,
  diskTemperature,
  diskBrightness,
  multiImageCount = 3,
  ringWidth = 0.15,
}) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const uniforms = useMemo(() => ({
    lensingStrength: { value: lensingStrength },
    diskBrightness: { value: diskBrightness },
    temperature: { value: diskTemperature },
    multiImageCount: { value: multiImageCount },
    shadowRadius: { value: shadowRadius },
  }), []);
  
  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.lensingStrength.value = lensingStrength;
      materialRef.current.uniforms.diskBrightness.value = diskBrightness;
      materialRef.current.uniforms.temperature.value = diskTemperature;
      materialRef.current.uniforms.shadowRadius.value = shadowRadius;
    }
  });
  
  // Photon ring hugs the shadow very tightly - at ~1.5× the photon sphere
  const ringInner = shadowRadius * 1.01;
  const ringOuter = ringInner + shadowRadius * ringWidth;
  
  return (
    <mesh rotation={[Math.PI / 2, 0, 0]}>
      <ringGeometry args={[ringInner, ringOuter, 256]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float lensingStrength;
          uniform float diskBrightness;
          uniform float temperature;
          uniform float multiImageCount;
          uniform float shadowRadius;
          
          varying vec2 vUv;
          
          // Temperature to color conversion with proper black-body spectrum
          vec3 temperatureToColor(float temp) {
            // Normalize temperature to 0-1 range (3000K to 30000K)
            float t = clamp((temp - 3000.0) / 27000.0, 0.0, 1.0);
            
            // Black-body spectrum approximation
            vec3 cool = vec3(1.0, 0.35, 0.05);   // Deep red-orange at ~3000K
            vec3 warm = vec3(1.0, 0.7, 0.3);    // Orange-yellow at ~6000K
            vec3 white = vec3(1.0, 0.95, 0.9);   // White at ~10000K
            vec3 hot = vec3(0.8, 0.9, 1.0);      // Blue-white at ~20000K+
            
            if (t < 0.2) {
              return mix(cool, warm, t * 5.0);
            } else if (t < 0.4) {
              return mix(warm, white, (t - 0.2) * 5.0);
            } else {
              return mix(white, hot, (t - 0.4) * 1.67);
            }
          }
          
          void main() {
            // Radial coordinate (0 = inner edge, 1 = outer edge)
            float radial = vUv.y;
            
            // Multiple image rings - create distinct concentric bands
            float imagePattern = 0.0;
            for (float i = 0.0; i < 4.0; i += 1.0) {
              if (i >= multiImageCount) break;
              
              // Position rings at exponentially decreasing radii from inner edge
              float ringPos = 0.15 + i * 0.3;
              float ringWidth = 0.08 - i * 0.015; // Inner rings slightly thicker
              float ringDist = abs(radial - ringPos);
              
              // Sharp but smooth ring profile
              float ringIntensity = smoothstep(ringWidth, ringWidth * 0.2, ringDist);
              ringIntensity *= (1.0 - i * 0.2); // Outer rings dimmer (n-th image)
              imagePattern = max(imagePattern, ringIntensity);
            }
            
            // Very intense inner edge glow
            float innerGlow = pow(1.0 - radial, 4.0) * 0.8;
            imagePattern += innerGlow;
            
            // Apply lensing strength to control visibility
            float intensity = imagePattern * lensingStrength * (0.5 + diskBrightness * 0.5) * 1.5;
            
            // Photon ring is extremely hot - hotter than disk inner edge
            vec3 color = temperatureToColor(temperature * 1.3);
            
            // Very subtle angular variation to prevent perfect uniformity
            float angular = vUv.x * 6.283185;
            float angularMod = sin(angular * 3.0) * 0.03 + 0.97;
            intensity *= angularMod;
            
            // Sharp inner edge, soft outer fade
            intensity *= smoothstep(0.0, 0.08, radial);
            intensity *= smoothstep(1.0, 0.6, radial);
            
            // Tonemap to prevent harsh clipping
            color = color * intensity / (1.0 + intensity * 0.3);
            
            gl_FragColor = vec4(color, intensity * 0.85);
          }
        `}
      />
    </mesh>
  );
};

/**
 * Lensed Disk Image - represents the far side of the disk bent over the top or bottom
 * by gravitational lensing
 */
interface LensedDiskImageProps {
  innerRadius: number;
  outerRadius: number;
  shadowRadius: number;
  lensingStrength: number;
  diskTemperature: number;
  diskBrightness: number;
  diskOpacity: number;
  rotationRef: React.MutableRefObject<number>;
  position: 'top' | 'bottom';
}

const LensedDiskImage: React.FC<LensedDiskImageProps> = ({
  innerRadius,
  outerRadius,
  shadowRadius,
  lensingStrength,
  diskTemperature,
  diskBrightness,
  diskOpacity,
  rotationRef,
  position,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const uniforms = useMemo(() => ({
    lensingStrength: { value: lensingStrength },
    diskBrightness: { value: diskBrightness },
    diskOpacity: { value: diskOpacity },
    temperature: { value: diskTemperature },
    shadowRadius: { value: shadowRadius },
    isTop: { value: position === 'top' ? 1.0 : -1.0 },
  }), []);
  
  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.lensingStrength.value = lensingStrength;
      materialRef.current.uniforms.diskBrightness.value = diskBrightness;
      materialRef.current.uniforms.diskOpacity.value = diskOpacity;
      materialRef.current.uniforms.temperature.value = diskTemperature;
      materialRef.current.uniforms.shadowRadius.value = shadowRadius;
    }
    if (meshRef.current) {
      meshRef.current.rotation.y = rotationRef.current; // Match main disk rotation
    }
  });
  
  // The lensed image wraps tightly around the shadow
  const radiusScale = position === 'top' ? 0.5 : 0.4;
  const brightnessScale = position === 'top' ? 0.45 : 0.3;
  
  // Lensed ring is compact, closer to shadow
  const lensedInner = shadowRadius * 1.3;
  const lensedOuter = innerRadius + (outerRadius - innerRadius) * radiusScale;
  
  return (
    <mesh 
      ref={meshRef}
      rotation={[Math.PI / 2, 0, 0]}
    >
      <ringGeometry args={[lensedInner, lensedOuter, 128, 16]} />
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          varying vec3 vPosition;
          uniform float shadowRadius;
          uniform float lensingStrength;
          uniform float isTop;
          
          void main() {
            vUv = uv;
            vPosition = position;
            
            // Warp the geometry to wrap around the shadow (gravitational lensing)
            vec3 pos = position;
            float distFromCenter = length(pos.xy);
            
            // Stronger warp near the shadow, creating the arc over/under effect
            float warpStrength = lensingStrength * smoothstep(shadowRadius * 4.0, shadowRadius * 1.3, distFromCenter);
            
            // Lift the ring above/below the equatorial plane
            float heightOffset = warpStrength * shadowRadius * 0.8 * isTop;
            pos.z += heightOffset;
            
            // Also curve the ring to wrap around the shadow
            float curveFactor = warpStrength * 0.3;
            pos.z += curveFactor * (shadowRadius * 3.0 - distFromCenter) * isTop * 0.3;
            
            gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
          }
        `}
        fragmentShader={`
          uniform float lensingStrength;
          uniform float diskBrightness;
          uniform float diskOpacity;
          uniform float temperature;
          uniform float isTop;
          
          varying vec2 vUv;
          varying vec3 vPosition;
          
          vec3 temperatureToColor(float temp) {
            float t = clamp((temp - 3000.0) / 27000.0, 0.0, 1.0);
            vec3 cool = vec3(1.0, 0.35, 0.05);
            vec3 warm = vec3(1.0, 0.7, 0.3);
            vec3 white = vec3(1.0, 0.95, 0.9);
            vec3 hot = vec3(0.8, 0.9, 1.0);
            
            if (t < 0.2) return mix(cool, warm, t * 5.0);
            else if (t < 0.4) return mix(warm, white, (t - 0.2) * 5.0);
            else return mix(white, hot, (t - 0.4) * 1.67);
          }
          
          void main() {
            float radial = vUv.y;
            
            // Secondary lensed image is dimmer but still visible
            float brightnessScale = ${brightnessScale.toFixed(3)};
            float intensity = pow(1.0 - radial, 2.0) * lensingStrength * diskBrightness * brightnessScale;
            
            // Slightly cooler than main disk (light has traveled further)
            vec3 color = temperatureToColor(temperature * 0.85);
            float alpha = intensity * diskOpacity * 0.6;
            
            // Smooth edge fades
            alpha *= smoothstep(0.0, 0.15, radial);
            alpha *= smoothstep(1.0, 0.7, radial);
            
            // Tonemap
            color = color * intensity / (1.0 + intensity * 0.5);
            
            gl_FragColor = vec4(color, alpha);
          }
        `}
      />
    </mesh>
  );
};

/**
 * Relativistic Jet - cone-shaped beam with color and brightness gradients
 * Properly anchored at the poles with realistic core/sheath structure
 */
interface RelativisticJetProps {
  shadowRadius: number;
  jetLength: number;
  jetOpeningAngle: number;
  jetBrightness: number;
  baseColor: string;
  tipColor: string;
  gradientPower: number;
  direction: 'up' | 'down';
}

const RelativisticJet: React.FC<RelativisticJetProps> = ({
  shadowRadius,
  jetLength,
  jetOpeningAngle,
  jetBrightness,
  baseColor,
  tipColor,
  gradientPower,
  direction,
}) => {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const uniforms = useMemo(() => ({
    jetBrightness: { value: jetBrightness },
    baseColor: { value: new THREE.Color(baseColor) },
    tipColor: { value: new THREE.Color(tipColor) },
    gradientPower: { value: gradientPower },
  }), []);
  
  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.jetBrightness.value = jetBrightness;
      materialRef.current.uniforms.baseColor.value.set(baseColor);
      materialRef.current.uniforms.tipColor.value.set(tipColor);
      materialRef.current.uniforms.gradientPower.value = gradientPower;
    }
  });
  
  // Calculate cone dimensions - narrow at black hole, expanding outward
  const angleRad = (jetOpeningAngle * Math.PI) / 180;
  const baseRadius = shadowRadius * 0.5; // Narrow anchor near the shadow
  const tipRadius = baseRadius + jetLength * Math.tan(angleRad); // Wider at the far end
  
  // Position starts just above/below the disk
  const baseOffset = shadowRadius * 0.3;
  const yPosition = direction === 'up' 
    ? baseOffset + jetLength / 2 
    : -(baseOffset + jetLength / 2);
  
  // Create cone geometry with proper orientation
  // For BOTH directions, the narrow end should be at the black hole
  const coneGeometry = useMemo(() => {
    // CylinderGeometry: radiusTop is at +Y, radiusBottom is at -Y
    // For "up" jet: narrow at bottom (near BH), wide at top (away from BH)
    // For "down" jet: narrow at top (near BH), wide at bottom (away from BH)
    const geometry = direction === 'up'
      ? new THREE.CylinderGeometry(
          tipRadius,    // radiusTop (wide, far from BH)
          baseRadius,   // radiusBottom (narrow, near BH)
          jetLength,
          48,           // radialSegments
          32,           // heightSegments
          true          // Open-ended for better blending
        )
      : new THREE.CylinderGeometry(
          baseRadius,   // radiusTop (narrow, near BH) 
          tipRadius,    // radiusBottom (wide, far from BH)
          jetLength,
          48,
          32,
          true
        );
    
    // Set up UVs so v=0 is at black hole (base), v=1 is at tip (far end)
    const uvs = geometry.attributes.uv;
    for (let i = 0; i < uvs.count; i++) {
      const v = uvs.getY(i);
      // For "up" jet: v=0 at bottom (BH), v=1 at top (tip) - natural
      // For "down" jet: v=0 at top (BH), v=1 at bottom (tip) - need to flip
      uvs.setY(i, direction === 'up' ? v : 1 - v);
    }
    
    return geometry;
  }, [baseRadius, tipRadius, jetLength, direction]);
  
  return (
    <mesh position={[0, yPosition, 0]} geometry={coneGeometry}>
      <shaderMaterial
        ref={materialRef}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        side={THREE.DoubleSide}
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          varying vec3 vPosition;
          varying vec3 vNormal;
          
          void main() {
            vUv = uv;
            vPosition = position;
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float jetBrightness;
          uniform vec3 baseColor;
          uniform vec3 tipColor;
          uniform float gradientPower;
          
          varying vec2 vUv;
          varying vec3 vPosition;
          varying vec3 vNormal;
          
          void main() {
            // Distance from base (0) to tip (1)
            float dist = vUv.y;
            
            // Apply power curve for gradient falloff - brighter at base
            float falloff = pow(1.0 - dist, gradientPower);
            
            // Color gradient from base to tip
            vec3 color = mix(baseColor, tipColor, pow(dist, 0.7));
            
            // Radial structure: bright core, dimmer sheath
            float radialDist = abs(vUv.x - 0.5) * 2.0;
            
            // Sharp bright core in the center
            float coreIntensity = 1.0 - smoothstep(0.0, 0.3, radialDist);
            coreIntensity = pow(coreIntensity, 0.5); // Soft core falloff
            
            // Wider, dimmer sheath/halo
            float sheathIntensity = (1.0 - smoothstep(0.2, 1.0, radialDist)) * 0.4;
            
            float radialFalloff = coreIntensity + sheathIntensity;
            
            // Combine falloffs
            float intensity = falloff * radialFalloff * jetBrightness * 1.2;
            
            // Very smooth fade at tip
            intensity *= smoothstep(1.0, 0.6, dist);
            
            // Softer fade at base for smooth anchor
            intensity *= smoothstep(0.0, 0.08, dist);
            
            // Edge transparency based on normal
            float edgeFade = abs(dot(vNormal, vec3(0.0, 0.0, 1.0)));
            edgeFade = 0.5 + edgeFade * 0.5;
            intensity *= edgeFade;
            
            gl_FragColor = vec4(color * intensity, intensity * 0.8);
          }
        `}
      />
    </mesh>
  );
};

// ============================================================================
// Shaders for Main Accretion Disk
// ============================================================================

const accretionDiskVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying float vDistFromCenter;
  
  uniform float shadowRadius;
  uniform float lensingStrength;
  uniform float innerRadius;
  uniform float outerRadius;
  
  void main() {
    vUv = uv;
    vPosition = position;
    
    // World position for Doppler calculation
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    
    // Distance from center for radial effects
    float distFromCenter = length(position.xy);
    vDistFromCenter = distFromCenter;
    
    // Gravitational lensing: warp vertices near the black hole
    vec3 pos = position;
    
    // Normalized distance (0 at inner, 1 at outer)
    float normalizedDist = (distFromCenter - innerRadius) / (outerRadius - innerRadius);
    normalizedDist = clamp(normalizedDist, 0.0, 1.0);
    
    // Strong lensing warp near inner edge, fading quickly outward
    float lensingFactor = lensingStrength * pow(1.0 - normalizedDist, 3.0);
    
    // Bend light paths upward near the black hole (creates the arc effect)
    float bendAmount = lensingFactor * shadowRadius * 0.5;
    pos.z += bendAmount;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const accretionDiskFragmentShader = `
  uniform float time;
  uniform float opacity;
  uniform float brightness;
  uniform float temperature;
  uniform float clumpiness;
  uniform float dopplerStrength;
  uniform float lensingStrength;
  uniform float shadowRadius;
  uniform float innerRadius;
  uniform float outerRadius;
  uniform float streakiness;
  uniform float turbulenceScale;
  uniform float diskThickness;
  uniform vec3 diskInnerColor;
  uniform vec3 diskOuterColor;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying float vDistFromCenter;
  
  // Improved 3D noise function
  float hash(vec3 p) {
    p = fract(p * vec3(443.897, 441.423, 437.195));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
  }
  
  float noise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float n000 = hash(i);
    float n100 = hash(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash(i + vec3(1.0, 1.0, 1.0));
    
    float nx00 = mix(n000, n100, f.x);
    float nx10 = mix(n010, n110, f.x);
    float nx01 = mix(n001, n101, f.x);
    float nx11 = mix(n011, n111, f.x);
    
    float nxy0 = mix(nx00, nx10, f.y);
    float nxy1 = mix(nx01, nx11, f.y);
    
    return mix(nxy0, nxy1, f.z);
  }
  
  // Fractal Brownian Motion for richer turbulence
  float fbm(vec3 p, int octaves) {
    float value = 0.0;
    float amplitude = 0.5;
    float frequency = 1.0;
    
    for (int i = 0; i < 6; i++) {
      if (i >= octaves) break;
      value += amplitude * noise3D(p * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }
    return value;
  }
  
  // Temperature to color - realistic black-body spectrum
  vec3 temperatureToColor(float temp) {
    // Normalize temperature (3000K - 30000K range)
    float t = clamp((temp - 3000.0) / 27000.0, 0.0, 1.0);
    
    // Smooth black-body color ramp
    vec3 cool = vec3(1.0, 0.25, 0.02);    // Deep red at ~3000K
    vec3 orange = vec3(1.0, 0.55, 0.1);   // Orange at ~5000K
    vec3 yellow = vec3(1.0, 0.85, 0.4);   // Yellow at ~7000K
    vec3 white = vec3(1.0, 0.97, 0.95);   // White at ~10000K
    vec3 blue = vec3(0.85, 0.92, 1.0);    // Blue-white at ~20000K+
    
    if (t < 0.15) {
      return mix(cool, orange, t / 0.15);
    } else if (t < 0.3) {
      return mix(orange, yellow, (t - 0.15) / 0.15);
    } else if (t < 0.5) {
      return mix(yellow, white, (t - 0.3) / 0.2);
    } else {
      return mix(white, blue, (t - 0.5) / 0.5);
    }
  }
  
  // ACES tonemapping for cinematic HDR
  vec3 ACESFilm(vec3 x) {
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
  }
  
  void main() {
    // Normalized radial position (0 = inner edge, 1 = outer edge)
    float radial = (vDistFromCenter - innerRadius) / (outerRadius - innerRadius);
    radial = clamp(radial, 0.0, 1.0);
    
    // Angular position in disk
    float angle = atan(vPosition.y, vPosition.x);
    
    // ========================================================================
    // Radial Intensity Gradient - very hot inner edge, cooler outer
    // ========================================================================
    // Steep falloff: inner edge is dramatically brighter
    float radialIntensity = pow(1.0 - radial, 2.5);
    // Ensure outer edge is visible but much dimmer
    radialIntensity = radialIntensity * 0.85 + 0.15;
    
    // ========================================================================
    // Temperature Gradient - inner is white-hot, outer is orange-red
    // ========================================================================
    // Inner regions are 3-4× hotter than base temperature
    float tempMultiplier = 1.0 + (1.0 - radial) * 2.5;
    float localTemp = temperature * tempMultiplier;
    vec3 tempColor = temperatureToColor(localTemp);
    
    // Blend temperature color with custom gradient colors
    vec3 customGradient = mix(diskInnerColor, diskOuterColor, pow(radial, 0.7));
    vec3 baseColor = mix(tempColor, customGradient, 0.35);
    
    // ========================================================================
    // Azimuthal Streaking - spiral gas streams being dragged inward
    // ========================================================================
    // Logarithmic spiral pattern (material spirals in as it loses angular momentum)
    float spiralPhase = radial * 8.0 - angle * 2.5 - time * 0.4;
    float streaks = sin(spiralPhase) * 0.5 + 0.5;
    streaks = pow(streaks, 1.5); // Sharpen streaks
    
    // Multiple spiral arms
    float streaks2 = sin(spiralPhase * 0.7 + 1.5) * 0.5 + 0.5;
    streaks = mix(streaks, streaks2, 0.3);
    
    // Apply streakiness control
    streaks = mix(1.0, 0.5 + streaks * 0.5, streakiness);
    
    // ========================================================================
    // Multi-scale Turbulence - density variations and hot clumps
    // ========================================================================
    vec3 noiseCoord = vec3(
      vWorldPosition.x * 0.3,
      vWorldPosition.z * 0.3,
      time * 0.08
    ) * turbulenceScale;
    
    // FBM for rich turbulent structure
    float turbulence = fbm(noiseCoord, 4);
    
    // Radially varying turbulence (stronger in middle regions)
    float turbulenceWeight = 1.0 - abs(radial - 0.4) * 1.5;
    turbulenceWeight = max(0.3, turbulenceWeight);
    
    float clumpFactor = mix(1.0, 0.6 + turbulence * 0.8, clumpiness * turbulenceWeight);
    
    // ========================================================================
    // Doppler Beaming - relativistic brightness/color asymmetry
    // ========================================================================
    float velocityFactor = cos(angle + time * 0.3);
    float dopplerBrightness = 1.0 + dopplerStrength * velocityFactor * 0.6;
    
    vec3 dopplerShift = baseColor;
    float dopplerColorStrength = dopplerStrength * abs(velocityFactor) * 0.15;
    if (velocityFactor > 0.0) {
      // Approaching side: blue shift
      dopplerShift.b += dopplerColorStrength;
      dopplerShift.r -= dopplerColorStrength * 0.5;
    } else {
      // Receding side: red shift
      dopplerShift.r += dopplerColorStrength;
      dopplerShift.b -= dopplerColorStrength * 0.5;
    }
    
    // ========================================================================
    // Combine All Factors
    // ========================================================================
    float combinedIntensity = radialIntensity * streaks * clumpFactor * dopplerBrightness;
    vec3 finalColor = dopplerShift * combinedIntensity * brightness * 2.0;
    
    // Apply ACES tonemapping for cinematic look (preserves color in highlights)
    finalColor = ACESFilm(finalColor);
    
    // Alpha calculation
    float alpha = combinedIntensity * opacity;
    
    // Soft inner edge (prevent harsh cutoff at inner radius)
    alpha *= smoothstep(0.0, 0.08, radial);
    
    // Gradual outer fade
    alpha *= smoothstep(1.0, 0.75, radial);
    
    // Boost alpha slightly for visibility
    alpha = clamp(alpha * 1.2, 0.0, 1.0);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// ============================================================================
// Volumetric Disk Shaders (for top/bottom layers to create thickness)
// ============================================================================

const volumetricDiskVertexShader = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying float vDistFromCenter;
  
  uniform float shadowRadius;
  uniform float lensingStrength;
  uniform float innerRadius;
  uniform float outerRadius;
  uniform float diskThickness;
  
  void main() {
    vUv = uv;
    vPosition = position;
    
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    
    vec3 pos = position;
    float distFromCenter = length(pos.xy);
    vDistFromCenter = distFromCenter;
    
    // Normalized distance
    float normalizedDist = (distFromCenter - innerRadius) / (outerRadius - innerRadius);
    normalizedDist = clamp(normalizedDist, 0.0, 1.0);
    
    // Thickness profile - thicker in middle, thinner at edges
    float thicknessFactor = sin(normalizedDist * 3.14159);
    float heightOffset = diskThickness * thicknessFactor * 0.4;
    
    // Top layer - offset upward
    pos.z += heightOffset;
    
    // Apply lensing warp
    float lensingFactor = lensingStrength * pow(1.0 - normalizedDist, 3.0);
    pos.z += lensingFactor * shadowRadius * 0.4;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const volumetricDiskVertexShaderBottom = `
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying float vDistFromCenter;
  
  uniform float shadowRadius;
  uniform float lensingStrength;
  uniform float innerRadius;
  uniform float outerRadius;
  uniform float diskThickness;
  
  void main() {
    vUv = uv;
    vPosition = position;
    
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPos.xyz;
    
    vec3 pos = position;
    float distFromCenter = length(pos.xy);
    vDistFromCenter = distFromCenter;
    
    // Normalized distance
    float normalizedDist = (distFromCenter - innerRadius) / (outerRadius - innerRadius);
    normalizedDist = clamp(normalizedDist, 0.0, 1.0);
    
    // Thickness profile
    float thicknessFactor = sin(normalizedDist * 3.14159);
    float heightOffset = diskThickness * thicknessFactor * 0.4;
    
    // Bottom layer - offset downward
    pos.z -= heightOffset;
    
    // Apply lensing warp (less for bottom layer)
    float lensingFactor = lensingStrength * pow(1.0 - normalizedDist, 3.0);
    pos.z += lensingFactor * shadowRadius * 0.2;
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const volumetricDiskFragmentShader = `
  uniform float time;
  uniform float opacity;
  uniform float brightness;
  uniform float temperature;
  uniform float clumpiness;
  uniform float dopplerStrength;
  uniform float innerRadius;
  uniform float outerRadius;
  uniform float streakiness;
  uniform float turbulenceScale;
  uniform vec3 diskInnerColor;
  uniform vec3 diskOuterColor;
  
  varying vec2 vUv;
  varying vec3 vPosition;
  varying vec3 vWorldPosition;
  varying float vDistFromCenter;
  
  float hash(vec3 p) {
    p = fract(p * vec3(443.897, 441.423, 437.195));
    p += dot(p, p.yzx + 19.19);
    return fract((p.x + p.y) * p.z);
  }
  
  float noise3D(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    
    float n000 = hash(i);
    float n100 = hash(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash(i + vec3(1.0, 1.0, 1.0));
    
    float nx00 = mix(n000, n100, f.x);
    float nx10 = mix(n010, n110, f.x);
    float nx01 = mix(n001, n101, f.x);
    float nx11 = mix(n011, n111, f.x);
    
    float nxy0 = mix(nx00, nx10, f.y);
    float nxy1 = mix(nx01, nx11, f.y);
    
    return mix(nxy0, nxy1, f.z);
  }
  
  vec3 temperatureToColor(float temp) {
    float t = clamp((temp - 3000.0) / 27000.0, 0.0, 1.0);
    vec3 cool = vec3(1.0, 0.25, 0.02);
    vec3 orange = vec3(1.0, 0.55, 0.1);
    vec3 yellow = vec3(1.0, 0.85, 0.4);
    vec3 white = vec3(1.0, 0.97, 0.95);
    vec3 blue = vec3(0.85, 0.92, 1.0);
    
    if (t < 0.15) return mix(cool, orange, t / 0.15);
    else if (t < 0.3) return mix(orange, yellow, (t - 0.15) / 0.15);
    else if (t < 0.5) return mix(yellow, white, (t - 0.3) / 0.2);
    else return mix(white, blue, (t - 0.5) / 0.5);
  }
  
  vec3 ACESFilm(vec3 x) {
    float a = 2.51;
    float b = 0.03;
    float c = 2.43;
    float d = 0.59;
    float e = 0.14;
    return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0);
  }
  
  void main() {
    float radial = (vDistFromCenter - innerRadius) / (outerRadius - innerRadius);
    radial = clamp(radial, 0.0, 1.0);
    float angle = atan(vPosition.y, vPosition.x);
    
    // Volumetric layers are dimmer than main disk
    float radialIntensity = pow(1.0 - radial, 2.0) * 0.6 + 0.1;
    
    // Temperature and color (same logic as main disk)
    float localTemp = temperature * (1.0 + (1.0 - radial) * 2.0);
    vec3 tempColor = temperatureToColor(localTemp);
    vec3 customGradient = mix(diskInnerColor, diskOuterColor, pow(radial, 0.7));
    vec3 baseColor = mix(tempColor, customGradient, 0.35);
    
    // Streaking
    float spiralPhase = radial * 8.0 - angle * 2.5 - time * 0.4;
    float streaks = sin(spiralPhase) * 0.5 + 0.5;
    streaks = mix(1.0, 0.5 + streaks * 0.5, streakiness);
    
    // Turbulence
    vec3 noiseCoord = vec3(vWorldPosition.x * 0.3, vWorldPosition.z * 0.3, time * 0.08) * turbulenceScale;
    float turbulence = noise3D(noiseCoord) + noise3D(noiseCoord * 2.5) * 0.5;
    turbulence /= 1.5;
    float clumpFactor = mix(1.0, 0.6 + turbulence * 0.8, clumpiness);
    
    // Doppler
    float velocityFactor = cos(angle + time * 0.3);
    float dopplerBrightness = 1.0 + dopplerStrength * velocityFactor * 0.4;
    
    // Combine
    vec3 finalColor = baseColor * radialIntensity * streaks * clumpFactor * dopplerBrightness * brightness * 1.2;
    finalColor = ACESFilm(finalColor);
    
    // Lower opacity for volumetric atmosphere
    float alpha = radialIntensity * opacity * clumpFactor * 0.35;
    alpha *= smoothstep(0.0, 0.1, radial);
    alpha *= smoothstep(1.0, 0.75, radial);
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`;

// ============================================================================
// No additional helper functions needed - all logic is GPU-based in shaders
// ============================================================================
