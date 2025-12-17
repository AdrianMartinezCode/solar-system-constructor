import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { useSystemStore } from '../state/systemStore';
import { StarObject } from './StarObject';
import { GroupBox } from './GroupBox';
import { AsteroidBeltObject } from './AsteroidBeltObject';
import { NebulaObject } from './NebulaObject';
import { BodyCameraController } from './BodyCameraController';
import { PerformanceTelemetryCollector } from '../hooks/usePerformanceTelemetry';
import { computeVisibleItems, getGroupSystems, getGroupAndDescendants } from '../utils/groupUtils';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { Star } from '../types';

// Animation component that runs inside Canvas
const AnimationController: React.FC = () => {
  const tick = useSystemStore((state) => state.tick);
  
  useFrame((_state, delta) => {
    tick(delta);
  });
  
  return null;
};

// Debug cube to verify rendering is working
const DebugCube: React.FC = () => {
  return (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="red" />
    </mesh>
  );
};

export const Scene: React.FC = () => {
  const rootIds = useSystemStore((state) => state.rootIds);
  const stars = useSystemStore((state) => state.stars);
  const groups = useSystemStore((state) => state.groups);
  const rootGroupIds = useSystemStore((state) => state.rootGroupIds);
  const belts = useSystemStore((state) => state.belts);
  const smallBodyFields = useSystemStore((state) => state.smallBodyFields);
  const protoplanetaryDisks = useSystemStore((state) => state.protoplanetaryDisks);
  const nebulae = useSystemStore((state) => state.nebulae);
  const nestingLevel = useSystemStore((state) => state.nestingLevel);
  const isolatedGroupId = useSystemStore((state) => state.isolatedGroupId);
  const time = useSystemStore((state) => state.time);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  
  // Helper function to recursively collect all star IDs in a system tree
  const collectSystemStarIds = (rootStarId: string, starsMap: Record<string, Star>): string[] => {
    const ids: string[] = [rootStarId];
    const star = starsMap[rootStarId];
    if (star && star.children) {
      star.children.forEach((childId) => {
        ids.push(...collectSystemStarIds(childId, starsMap));
      });
    }
    return ids;
  };
  
  // Compute isolation sets when a group is isolated
  const isolationSets = useMemo(() => {
    if (!isolatedGroupId || !groups[isolatedGroupId]) {
      return null;
    }
    
    // Get all system root IDs in the isolated group and its descendants
    const allowedSystemRootIds = getGroupSystems(isolatedGroupId, groups);
    
    // Collect all star IDs in those systems (including planets, moons, etc.)
    const allowedStarIdsSet = new Set<string>();
    allowedSystemRootIds.forEach((rootId) => {
      const systemStarIds = collectSystemStarIds(rootId, stars);
      systemStarIds.forEach((id) => allowedStarIdsSet.add(id));
    });
    
    // Get all group IDs (isolated group + descendants)
    const allowedGroupIdsSet = new Set<string>(
      getGroupAndDescendants(isolatedGroupId, groups)
    );
    
    return {
      allowedSystemRootIds: new Set(allowedSystemRootIds),
      allowedStarIds: allowedStarIdsSet,
      allowedGroupIds: allowedGroupIdsSet,
    };
  }, [isolatedGroupId, groups, stars]);
  
  // Collect rogue planet IDs (planets not bound to any system)
  const roguePlanetIds = useMemo(() => {
    return Object.values(stars)
      .filter(star => star.isRoguePlanet === true)
      .map(star => star.id);
  }, [stars]);
  
  // Note: Protoplanetary disks are now rendered inside StarObject for correct positioning
  
  // Compute which items should be visible based on nesting level or isolation
  const visibleItems = useMemo(() => {
    // If a group is isolated, show only the isolated group with its contents
    // This preserves the group's spatial position and layout
    if (isolationSets && isolatedGroupId) {
      const items: typeof computeVisibleItems extends (...args: any[]) => infer R ? R : never = [];
      
      // Render the isolated group itself - this maintains its position and layout
      const isolatedGroup = groups[isolatedGroupId];
      if (isolatedGroup) {
        items.push({
          id: isolatedGroupId,
          type: 'group',
          position: isolatedGroup.position
            ? [isolatedGroup.position.x, isolatedGroup.position.y, isolatedGroup.position.z] as [number, number, number]
            : undefined,
        });
      }
      
      return items;
    }
    
    // Normal visibility based on nesting level
    return computeVisibleItems(groups, rootGroupIds, rootIds, nestingLevel);
  }, [groups, rootGroupIds, rootIds, nestingLevel, isolatedGroupId, isolationSets]);
  
  console.log('=== Scene Debug Info ===');
  console.log('Root Star IDs:', rootIds);
  console.log('Total Stars:', Object.keys(stars).length);
  console.log('Root Group IDs:', rootGroupIds);
  console.log('Total Groups:', Object.keys(groups).length);
  console.log('Total Belts (legacy):', Object.keys(belts).length);
  console.log('Total Small Body Fields:', Object.keys(smallBodyFields).length);
  if (Object.keys(smallBodyFields).length > 0) {
    console.log('Small Body Fields:', Object.values(smallBodyFields).map(f => ({
      name: f.name,
      type: f.beltType,
      particleCount: f.particleCount,
      hostStarId: f.hostStarId,
      innerRadius: f.innerRadius,
      outerRadius: f.outerRadius,
    })));
  }
  console.log('Total Protoplanetary Disks:', Object.keys(protoplanetaryDisks).length);
  console.log('Total Nebulae:', Object.keys(nebulae).length);
  console.log('Total Rogue Planets:', roguePlanetIds.length);
  console.log('Nesting Level:', nestingLevel);
  console.log('Visible Items:', visibleItems);
  console.log('Time:', time);
  console.log('=======================');
  
  return (
    <Canvas
      camera={{ position: [0, 30, 50], fov: 60, near: 0.1, far: 50000 }}
      style={{ background: '#000011', width: '100%', height: '100%' }}
      gl={{ antialias: true }}
    >
      <AnimationController />
      <BodyCameraController />
      <PerformanceTelemetryCollector />
      
      {/* Lighting - brighter for better visibility */}
      <ambientLight intensity={1} />
      <pointLight position={[50, 50, 50]} intensity={2} />
      <pointLight position={[-50, -50, -50]} intensity={1} />
      <hemisphereLight intensity={0.5} />
      
      {/* Background stars */}
      <Stars 
        radius={300} 
        depth={50} 
        count={5000} 
        factor={4} 
        saturation={0} 
        fade 
      />
      
      {/* Render visible items based on nesting level */}
      {visibleItems.length > 0 ? (
        visibleItems.map((item, index) => {
          if (item.type === 'system') {
            return <StarObject key={`system-${item.id}`} starId={item.id} />;
          } else {
            // Position groups in a grid layout if no position specified
            const position = item.position || [
              (index % 5) * 20 - 40,
              0,
              Math.floor(index / 5) * 20
            ] as [number, number, number];
            return <GroupBox key={`group-${item.id}`} groupId={item.id} position={position} />;
          }
        })
      ) : (
        // Debug: show a red cube if no items
        <DebugCube />
      )}
      
      {/* Render rogue planets (not bound to any system) - hide during isolation */}
      {!isolationSets && roguePlanetIds.map(rogueId => (
        <StarObject key={`rogue-${rogueId}`} starId={rogueId} />
      ))}
      
      {/* Render asteroid belts (legacy - kept for backwards compatibility) */}
      {Object.keys(belts)
        .filter((beltId) => {
          // When isolated, only show belts whose parent is in the allowed star set
          if (isolationSets) {
            const belt = belts[beltId];
            return belt && isolationSets.allowedStarIds.has(belt.parentId);
          }
          return true;
        })
        .map(beltId => (
          <AsteroidBeltObject key={`belt-${beltId}`} beltId={beltId} />
        ))}
      
      {/* Note: Small body fields and protoplanetary disks are rendered inside StarObject for correct positioning */}
      
      {/* Render nebulae (galaxy-scale volumetric regions) */}
      {Object.values(nebulae)
        .filter((nebula) => {
          if (nebula.visible === false) return false;
          
          // When isolated, only show nebulae associated with the isolated group or its descendants
          if (isolationSets && nebula.associatedGroupIds) {
            return nebula.associatedGroupIds.some((groupId) =>
              isolationSets.allowedGroupIds.has(groupId)
            );
          }
          
          // When isolated but nebula has no associations, hide it
          if (isolationSets) return false;
          
          return true;
        })
        .map((nebula) => (
          <NebulaObject key={nebula.id} nebula={nebula} />
        ))}
      
      <OrbitControls 
        ref={controlsRef} 
        makeDefault 
        enableZoom={true}
        enablePan={true}
        enableRotate={true}
        zoomSpeed={1.0}
      />
      
      {/* Grid helper */}
      <gridHelper args={[100, 20, '#444444', '#222222']} />
    </Canvas>
  );
};
