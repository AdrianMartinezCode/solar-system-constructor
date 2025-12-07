export interface Star {
  id: string;
  name: string;
  mass: number;
  radius: number;
  color: string;
  children: string[];
  parentId: string | null;
  
  // Body type discriminant for identifying different celestial body types
  bodyType?: 'star' | 'planet' | 'moon' | 'asteroid';
  
  // Reference to parent asteroid belt (if this is an asteroid)
  parentBeltId?: string;
  
  // Legacy circular orbit parameters (maintained for backward compatibility)
  orbitalDistance: number;
  orbitalSpeed: number;
  orbitalPhase: number; // Phase offset in degrees (0-360) for n-ary systems
  
  // Elliptical orbit shape parameters
  semiMajorAxis?: number;        // a - semi-major axis (if undefined, derived from orbitalDistance)
  eccentricity?: number;          // e - eccentricity (0 = circular, 0-1 = ellipse)
  
  // Orbit center offset (3D translation of the ellipse center relative to parent)
  orbitOffsetX?: number;
  orbitOffsetY?: number;
  orbitOffsetZ?: number;
  
  // Orbit plane orientation (Euler angles in degrees)
  // Applied in order: rotZ, then rotY, then rotX
  orbitRotX?: number;  // Rotation around X axis (inclination-like)
  orbitRotY?: number;  // Rotation around Y axis
  orbitRotZ?: number;  // Rotation around Z axis (longitude of ascending node-like)
}

// Asteroid belt entity representing a collection of many small bodies
export interface AsteroidBelt {
  id: string;
  name: string;
  parentId: string; // The star or planet this belt orbits
  
  // Belt geometry
  innerRadius: number;     // Inner edge of the belt
  outerRadius: number;     // Outer edge of the belt
  thickness: number;       // Vertical spread (standard deviation for Y offsets)
  
  // Belt orbital parameters (shared by all asteroids in the belt)
  eccentricity: number;    // 0 for circular, >0 for elliptical belts
  inclination: number;     // Degrees of tilt from parent's orbital plane
  
  // Asteroid population
  asteroidCount: number;   // Number of asteroids in this belt
  asteroidIds: string[];   // IDs of all asteroids belonging to this belt
  
  // Visual properties
  color?: string;          // Optional belt color hint
  
  // Generation seed (for reproducible belt generation)
  seed?: string | number;
}

export interface Position {
  x: number;
  y: number;
  z: number;
}

// Group entity for organizing solar systems
export interface Group {
  id: string;
  name: string;
  children: GroupChild[]; // Can contain solar systems (root star IDs) or other groups
  parentGroupId: string | null; // Parent group ID (null for top-level groups)
  color?: string; // Optional color for visualization
  icon?: string; // Optional icon/symbol
  position?: Position; // Optional position for spatial layout
}

// Union type for group children
export interface GroupChild {
  id: string;
  type: 'system' | 'group'; // Either a root solar system or another group
}

// Type for nesting level control
export type NestingLevel = number | 'max';

