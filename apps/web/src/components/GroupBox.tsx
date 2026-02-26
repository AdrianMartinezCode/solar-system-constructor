import React, { useRef } from 'react';
import { ThreeEvent } from '@react-three/fiber';
import { useSystemStore } from '../state/systemStore';
import { useUiStore } from '../state/uiStore';
import type { GroupChild } from '../types';
import * as THREE from 'three';
import { Text } from '@react-three/drei';
import { StarObject } from './StarObject';

interface GroupBoxProps {
  groupId: string;
  position?: [number, number, number];
  expanded?: boolean; // Whether to show contents or just a box
}

export const GroupBox: React.FC<GroupBoxProps> = ({ groupId, position = [0, 0, 0], expanded: _expanded = false }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  const group = useSystemStore((state) => state.groups[groupId]);
  const selectedGroupId = useSystemStore((state) => state.selectedGroupId);
  const selectGroup = useSystemStore((state) => state.selectGroup);
  const nestingLevel = useUiStore((state) => state.nestingLevel);
  
  const isSelected = selectedGroupId === groupId;
  
  if (!group) return null;
  
  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    selectGroup(groupId);
  };
  
  // Calculate box size based on number of children
  const baseSize = 8;
  const size = baseSize + Math.sqrt(group.children.length) * 2;
  const color = group.color || '#8B5CF6'; // Default purple for groups
  
  // If expanded (nestingLevel === 'max'), render children inside
  const shouldShowContents = nestingLevel === 'max';
  
  return (
    <group position={position}>
      {/* Main box - semi-transparent when showing contents */}
      <mesh ref={meshRef} onClick={handleClick}>
        <boxGeometry args={[size, size, size]} />
        <meshStandardMaterial 
          color={color}
          transparent
          opacity={shouldShowContents ? 0.1 : 0.3}
          wireframe={false}
        />
      </mesh>
      
      {/* Wireframe overlay */}
      <mesh>
        <boxGeometry args={[size, size, size]} />
        <meshBasicMaterial 
          color={color}
          wireframe
          transparent
          opacity={shouldShowContents ? 0.3 : 0.6}
        />
      </mesh>
      
      {/* Selection indicator */}
      {isSelected && (
        <mesh>
          <boxGeometry args={[size * 1.1, size * 1.1, size * 1.1]} />
          <meshBasicMaterial 
            color="#ffffff" 
            transparent 
            opacity={0.2}
            wireframe
          />
        </mesh>
      )}
      
      {/* Group name label */}
      <Text
        position={[0, size / 2 + 1, 0]}
        fontSize={1.5}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.1}
        outlineColor="#000000"
      >
        {group.name}
      </Text>
      
      {/* Child count badge */}
      <Text
        position={[0, -size / 2 - 0.5, 0]}
        fontSize={0.8}
        color="#cccccc"
        anchorX="center"
        anchorY="middle"
      >
        {group.children.length} {group.children.length === 1 ? 'item' : 'items'}
      </Text>
      
      {/* Render children when expanded */}
      {shouldShowContents && group.children.map((child: GroupChild, index: number) => {
        if (child.type === 'system') {
          // Position systems in a grid inside the group box
          const gridSize = Math.ceil(Math.sqrt(group.children.length));
          const spacing = (size * 0.7) / gridSize;
          const offsetX = (index % gridSize) * spacing - (size * 0.35);
          const offsetZ = Math.floor(index / gridSize) * spacing - (size * 0.35);
          
          return (
            <group key={`child-system-${child.id}`} position={[offsetX, 0, offsetZ]}>
              <StarObject starId={child.id} />
            </group>
          );
        } else if (child.type === 'group') {
          // Recursively render child groups
          const gridSize = Math.ceil(Math.sqrt(group.children.length));
          const spacing = (size * 0.7) / gridSize;
          const offsetX = (index % gridSize) * spacing - (size * 0.35);
          const offsetZ = Math.floor(index / gridSize) * spacing - (size * 0.35);
          
          return (
            <GroupBox 
              key={`child-group-${child.id}`} 
              groupId={child.id} 
              position={[offsetX, 0, offsetZ]}
              expanded={shouldShowContents}
            />
          );
        }
        return null;
      })}
    </group>
  );
};

