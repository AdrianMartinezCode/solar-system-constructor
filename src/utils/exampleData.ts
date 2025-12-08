import { v4 as uuidv4 } from 'uuid';

export const createExampleSystem = () => {
  const centralStarId = uuidv4();
  const companion1Id = uuidv4(); // First companion in binary orbit
  const companion2Id = uuidv4(); // Second companion in binary orbit (ternary system)
  const earthId = uuidv4();
  const marsId = uuidv4();
  const moonId = uuidv4();

  const stars = {
    [centralStarId]: {
      id: centralStarId,
      name: 'Alpha Centauri A',
      mass: 1000,
      radius: 3,
      color: '#FDB813',
      children: [companion1Id, companion2Id, earthId, marsId],
      parentId: null,
      orbitalDistance: 0,
      orbitalSpeed: 0,
      orbitalPhase: 0,
    },
    [companion1Id]: {
      id: companion1Id,
      name: 'Alpha Centauri B',
      mass: 800,
      radius: 2.5,
      color: '#FF8C42',
      children: [],
      parentId: centralStarId,
      orbitalDistance: 10, // Same orbit as companion2
      orbitalSpeed: 10,
      orbitalPhase: 0, // Starting at 0 degrees
    },
    [companion2Id]: {
      id: companion2Id,
      name: 'Proxima Centauri',
      mass: 600,
      radius: 2,
      color: '#E74C3C',
      children: [],
      parentId: centralStarId,
      orbitalDistance: 10, // Same orbit as companion1
      orbitalSpeed: 10,
      orbitalPhase: 120, // Starting at 120 degrees (ternary system)
    },
    [earthId]: {
      id: earthId,
      name: 'Earth',
      mass: 10,
      radius: 1.2,
      color: '#4A90E2',
      children: [moonId],
      parentId: centralStarId,
      orbitalDistance: 20,
      orbitalSpeed: 20,
      orbitalPhase: 0,
    },
    [marsId]: {
      id: marsId,
      name: 'Mars',
      mass: 8,
      radius: 0.9,
      color: '#E25822',
      children: [],
      parentId: centralStarId,
      orbitalDistance: 30,
      orbitalSpeed: 15,
      orbitalPhase: 0,
    },
    [moonId]: {
      id: moonId,
      name: 'Moon',
      mass: 1,
      radius: 0.4,
      color: '#CCCCCC',
      children: [],
      parentId: earthId,
      orbitalDistance: 3,
      orbitalSpeed: 50,
      orbitalPhase: 0,
    },
  };

  return {
    stars,
    rootIds: [centralStarId],
    groups: {}, // Empty groups by default
    rootGroupIds: [], // No root groups by default
    belts: {}, // Empty asteroid belts by default
    protoplanetaryDisks: {}, // Empty protoplanetary disks by default
  };
};

