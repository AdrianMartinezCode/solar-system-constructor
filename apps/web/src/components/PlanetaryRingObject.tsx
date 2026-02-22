import React from 'react';
import * as THREE from 'three';
import { useSystemStore } from '../state/systemStore';

interface PlanetaryRingObjectProps {
  planetId: string;
}

/**
 * Renders a single planetary ring as a thin, semi-transparent disk
 * around a planet. The ring is static in the planet's local space and
 * moves automatically with the planet via the parent StarObject.
 */
export const PlanetaryRingObject: React.FC<PlanetaryRingObjectProps> = ({ planetId }) => {
  const planet = useSystemStore((state) => state.stars[planetId]);

  if (!planet || !planet.ring) {
    return null;
  }

  const { ring } = planet;

  // Compute radii from planet radius and ring multipliers
  const innerRadius = planet.radius * ring.innerRadiusMultiplier;
  const outerRadius = planet.radius * ring.outerRadiusMultiplier;

  // Clamp and derive visual parameters
  const opacity = Math.max(0, Math.min(1, ring.opacity));
  const density = Math.max(0, Math.min(1, ring.density));
  const albedo = Math.max(0, ring.albedo);

  // Use density to modulate final opacity (denser rings look more solid)
  const finalOpacity = Math.max(0, Math.min(1, opacity * (0.4 + density * 0.6)));

  // Emissive intensity derived from albedo for a subtle glow
  const emissiveIntensity = Math.min(1.5, 0.2 + albedo * 0.8);

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]} // Lay ring in XZ plane around planet
    >
      {/* Thin disk ring geometry */}
      <ringGeometry args={[innerRadius, outerRadius, 96]} />
      <meshStandardMaterial
        color={ring.color}
        emissive={ring.color}
        emissiveIntensity={emissiveIntensity}
        transparent
        opacity={finalOpacity}
        metalness={0.1}
        roughness={0.6}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
};


