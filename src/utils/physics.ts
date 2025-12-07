import { Star } from '../types';

/**
 * Orbit descriptor for calculating elliptical 3D positions
 */
export interface OrbitParams {
  // Shape
  semiMajorAxis: number;      // a
  eccentricity: number;        // e (0 = circle, 0-1 = ellipse)
  
  // Motion
  orbitalSpeed: number;        // Angular velocity in deg/sec
  orbitalPhase: number;        // Starting phase in degrees
  
  // Offset (translation of ellipse center)
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  
  // Orientation (Euler angles in degrees)
  rotX: number;
  rotY: number;
  rotZ: number;
}

/**
 * Calculate orbital position for a star, supporting both circular and elliptical orbits.
 * 
 * For backward compatibility:
 * - If the star has no ellipse parameters, falls back to circular orbit using orbitalDistance
 * - If eccentricity is 0, produces a perfect circle
 * 
 * Algorithm:
 * 1. Compute mean anomaly from time and angular velocity
 * 2. Map to ellipse point in local 2D plane (x', y', 0)
 * 3. Apply 3D rotation (rotZ, rotY, rotX) to get oriented orbit
 * 4. Apply orbit center offset
 * 
 * @param time - Current simulation time in seconds
 * @param star - Star object with orbit parameters
 * @returns 3D position relative to parent
 */
export function calculateOrbitalPosition(
  time: number,
  star: Star | { orbitalDistance: number; orbitalSpeed: number; orbitalPhase: number; semiMajorAxis?: number; eccentricity?: number; orbitOffsetX?: number; orbitOffsetY?: number; orbitOffsetZ?: number; orbitRotX?: number; orbitRotY?: number; orbitRotZ?: number }
): { x: number; y: number; z: number } {
  // Extract orbit parameters with defaults
  const a = star.semiMajorAxis ?? star.orbitalDistance; // Semi-major axis defaults to circular radius
  const e = star.eccentricity ?? 0; // Eccentricity defaults to 0 (circle)
  const speed = star.orbitalSpeed;
  const phase = star.orbitalPhase ?? 0;
  
  const offsetX = star.orbitOffsetX ?? 0;
  const offsetY = star.orbitOffsetY ?? 0;
  const offsetZ = star.orbitOffsetZ ?? 0;
  
  const rotX = star.orbitRotX ?? 0;
  const rotY = star.orbitRotY ?? 0;
  const rotZ = star.orbitRotZ ?? 0;
  
  // If completely circular (e=0) and no rotation/offset, use fast path
  if (e === 0 && offsetX === 0 && offsetY === 0 && offsetZ === 0 && 
      rotX === 0 && rotY === 0 && rotZ === 0) {
    const angle = time * speed * (Math.PI / 180);
    const phaseRadians = phase * (Math.PI / 180);
    const totalAngle = angle + phaseRadians;
    return {
      x: Math.cos(totalAngle) * a,
      y: 0,
      z: Math.sin(totalAngle) * a,
    };
  }
  
  // Compute mean anomaly (simple parametric approach, not true Kepler)
  // For our purposes, we'll use a uniform angular parameter
  const meanAnomaly = time * speed * (Math.PI / 180) + phase * (Math.PI / 180);
  
  // Map mean anomaly to position on ellipse in local 2D plane
  // Using parametric ellipse: x' = a*cos(θ), z' = b*sin(θ)
  // where b = a*sqrt(1 - e²)
  const b = a * Math.sqrt(1 - e * e);
  
  // Local ellipse coordinates (in the ellipse's own plane, before rotation)
  let xLocal = a * Math.cos(meanAnomaly);
  let yLocal = 0;
  let zLocal = b * Math.sin(meanAnomaly);
  
  // Apply 3D rotation: order is rotZ, then rotY, then rotX
  // Convert angles to radians
  const rxRad = rotX * (Math.PI / 180);
  const ryRad = rotY * (Math.PI / 180);
  const rzRad = rotZ * (Math.PI / 180);
  
  // Rotation around Z axis
  if (rzRad !== 0) {
    const cosZ = Math.cos(rzRad);
    const sinZ = Math.sin(rzRad);
    const xTemp = xLocal * cosZ - yLocal * sinZ;
    const yTemp = xLocal * sinZ + yLocal * cosZ;
    xLocal = xTemp;
    yLocal = yTemp;
  }
  
  // Rotation around Y axis
  if (ryRad !== 0) {
    const cosY = Math.cos(ryRad);
    const sinY = Math.sin(ryRad);
    const xTemp = xLocal * cosY + zLocal * sinY;
    const zTemp = -xLocal * sinY + zLocal * cosY;
    xLocal = xTemp;
    zLocal = zTemp;
  }
  
  // Rotation around X axis
  if (rxRad !== 0) {
    const cosX = Math.cos(rxRad);
    const sinX = Math.sin(rxRad);
    const yTemp = yLocal * cosX - zLocal * sinX;
    const zTemp = yLocal * sinX + zLocal * cosX;
    yLocal = yTemp;
    zLocal = zTemp;
  }
  
  // Apply orbit center offset
  return {
    x: xLocal + offsetX,
    y: yLocal + offsetY,
    z: zLocal + offsetZ,
  };
}

/**
 * Legacy function signature for backward compatibility.
 * Deprecated: Use calculateOrbitalPosition(time, star) instead.
 */
export function calculateOrbitalPositionLegacy(
  time: number,
  orbitalDistance: number,
  orbitalSpeed: number,
  orbitalPhase: number = 0
): { x: number; y: number; z: number } {
  const angle = time * orbitalSpeed * (Math.PI / 180);
  const phaseRadians = orbitalPhase * (Math.PI / 180);
  const totalAngle = angle + phaseRadians;
  return {
    x: Math.cos(totalAngle) * orbitalDistance,
    y: 0,
    z: Math.sin(totalAngle) * orbitalDistance,
  };
}

/**
 * Generate an array of 3D points representing an orbit path.
 * Useful for rendering orbit rings/lines.
 * 
 * @param star - Star object with orbit parameters
 * @param segments - Number of segments in the orbit path
 * @returns Array of 3D points
 */
export function generateOrbitPath(
  star: Star | OrbitParams,
  segments: number = 64
): { x: number; y: number; z: number }[] {
  const points: { x: number; y: number; z: number }[] = [];
  
  // Generate points by sampling the orbit at regular intervals
  // We sample a full period (360 degrees)
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * 360; // degrees
    const tempStar = {
      orbitalDistance: 'semiMajorAxis' in star ? (star.semiMajorAxis ?? 1) : star.orbitalDistance,
      orbitalSpeed: 1, // Speed doesn't matter for path generation
      orbitalPhase: angle,
      semiMajorAxis: 'semiMajorAxis' in star ? star.semiMajorAxis : undefined,
      eccentricity: 'eccentricity' in star ? star.eccentricity : undefined,
      orbitOffsetX: 'orbitOffsetX' in star ? star.orbitOffsetX : ('offsetX' in star ? star.offsetX : undefined),
      orbitOffsetY: 'orbitOffsetY' in star ? star.orbitOffsetY : ('offsetY' in star ? star.offsetY : undefined),
      orbitOffsetZ: 'orbitOffsetZ' in star ? star.orbitOffsetZ : ('offsetZ' in star ? star.offsetZ : undefined),
      orbitRotX: 'orbitRotX' in star ? star.orbitRotX : ('rotX' in star ? star.rotX : undefined),
      orbitRotY: 'orbitRotY' in star ? star.orbitRotY : ('rotY' in star ? star.rotY : undefined),
      orbitRotZ: 'orbitRotZ' in star ? star.orbitRotZ : ('rotZ' in star ? star.rotZ : undefined),
    };
    
    const pos = calculateOrbitalPosition(0, tempStar);
    points.push(pos);
  }
  
  return points;
}

export function findHeaviestStar(starIds: string[], starsMap: Record<string, any>): string | null {
  if (starIds.length === 0) return null;
  
  let heaviest = starIds[0];
  let maxMass = starsMap[heaviest]?.mass || 0;
  
  for (let i = 1; i < starIds.length; i++) {
    const id = starIds[i];
    const mass = starsMap[id]?.mass || 0;
    if (mass > maxMass) {
      maxMass = mass;
      heaviest = id;
    }
  }
  
  return heaviest;
}

