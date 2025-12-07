export interface Star {
  id: string;
  name: string;
  mass: number;
  radius: number;
  color: string;
  children: string[];
  parentId: string | null;
  
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

