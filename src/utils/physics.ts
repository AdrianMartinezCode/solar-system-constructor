export function calculateOrbitalPosition(
  time: number,
  orbitalDistance: number,
  orbitalSpeed: number,
  orbitalPhase: number = 0
): { x: number; y: number; z: number } {
  const angle = time * orbitalSpeed * (Math.PI / 180); // Convert degrees/sec to radians
  const phaseRadians = orbitalPhase * (Math.PI / 180); // Convert phase to radians
  const totalAngle = angle + phaseRadians;
  return {
    x: Math.cos(totalAngle) * orbitalDistance,
    y: 0,
    z: Math.sin(totalAngle) * orbitalDistance,
  };
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

