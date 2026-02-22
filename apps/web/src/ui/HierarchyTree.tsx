import React, { useState } from 'react';
import { useSystemStore } from '../state/systemStore';
import './HierarchyTree.css';

interface TreeNodeProps {
  starId: string;
  level: number;
}

const TreeNode: React.FC<TreeNodeProps> = ({ starId, level }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const star = useSystemStore((state) => state.stars[starId]);
  const selectedStarId = useSystemStore((state) => state.selectedStarId);
  const selectStar = useSystemStore((state) => state.selectStar);
  
  if (!star) return null;
  
  const hasChildren = star.children.length > 0;
  const isSelected = selectedStarId === starId;
  
  return (
    <div className="tree-node">
      <div
        className={`tree-node-header ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${level * 1.5}rem` }}
      >
        {hasChildren && (
          <button
            className="expand-button"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        )}
        {!hasChildren && <span className="expand-placeholder" />}
        
        <div
          className="node-content"
          onClick={() => selectStar(starId)}
        >
          <div
            className="node-color"
            style={{ backgroundColor: star.color }}
          />
          <span className="node-name">{star.name}</span>
          <span className="node-mass">({star.mass})</span>
        </div>
      </div>
      
      {isExpanded && hasChildren && (
        <div className="tree-children">
          {star.children.map((childId) => (
            <TreeNode key={childId} starId={childId} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

export const HierarchyTree: React.FC = () => {
  const rootIds = useSystemStore((state) => state.rootIds);
  const reset = useSystemStore((state) => state.reset);
  
  const handleReset = () => {
    if (confirm('Reset to example system? This will delete all current stars.')) {
      reset();
    }
  };
  
  return (
    <div className="hierarchy-tree">
      <div className="tree-header">
        <h3>System Hierarchy</h3>
        <button className="btn-reset" onClick={handleReset}>
          Reset
        </button>
      </div>
      
      <div className="tree-content">
        {rootIds.length === 0 && (
          <div className="empty-state">
            No stars in system. Create one to get started!
          </div>
        )}
        {rootIds.map((rootId) => (
          <TreeNode key={rootId} starId={rootId} level={0} />
        ))}
      </div>
    </div>
  );
};

