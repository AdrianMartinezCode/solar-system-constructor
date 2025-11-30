export interface Star {
  id: string;
  name: string;
  mass: number;
  radius: number;
  color: string;
  children: string[];
  parentId: string | null;
  orbitalDistance: number;
  orbitalSpeed: number;
  orbitalPhase: number; // Phase offset in degrees (0-360) for n-ary systems
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

