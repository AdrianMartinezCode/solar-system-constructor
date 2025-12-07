import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { useSystemStore } from '../state/systemStore';
import { StarObject } from './StarObject';
import { GroupBox } from './GroupBox';
import { AsteroidBeltObject } from './AsteroidBeltObject';
import { BodyCameraController } from './BodyCameraController';
import { computeVisibleItems } from '../utils/groupUtils';
import { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

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
  const nestingLevel = useSystemStore((state) => state.nestingLevel);
  const time = useSystemStore((state) => state.time);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  
  // Compute which items should be visible based on nesting level
  const visibleItems = useMemo(() => {
    return computeVisibleItems(groups, rootGroupIds, rootIds, nestingLevel);
  }, [groups, rootGroupIds, rootIds, nestingLevel]);
  
  console.log('=== Scene Debug Info ===');
  console.log('Root Star IDs:', rootIds);
  console.log('Total Stars:', Object.keys(stars).length);
  console.log('Root Group IDs:', rootGroupIds);
  console.log('Total Groups:', Object.keys(groups).length);
  console.log('Total Belts:', Object.keys(belts).length);
  console.log('Nesting Level:', nestingLevel);
  console.log('Visible Items:', visibleItems);
  console.log('Time:', time);
  console.log('=======================');
  
  return (
    <Canvas
      camera={{ position: [0, 30, 50], fov: 60 }}
      style={{ background: '#000011', width: '100%', height: '100%' }}
      gl={{ antialias: true }}
    >
      <AnimationController />
      <BodyCameraController />
      
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
      
      {/* Render asteroid belts */}
      {Object.keys(belts).map(beltId => (
        <AsteroidBeltObject key={`belt-${beltId}`} beltId={beltId} />
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
