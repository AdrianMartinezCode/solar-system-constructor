import React from 'react';
import { useSystemStore } from '../state/systemStore';
import { useUiStore } from '../state/uiStore';
import './NestingLevelControl.css';

export const NestingLevelControl: React.FC = () => {
  const nestingLevel = useUiStore((state) => state.nestingLevel);
  const setNestingLevel = useUiStore((state) => state.setNestingLevel);
  const groups = useSystemStore((state) => state.groups);
  
  const hasGroups = Object.keys(groups).length > 0;
  
  if (!hasGroups) {
    return null; // Don't show control if no groups exist
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setNestingLevel(value === 'max' ? 'max' : parseInt(value, 10));
  };
  
  return (
    <div className="nesting-level-control">
      <label htmlFor="nesting-level">
        <span className="label-icon">📁</span>
        Group Nesting Level:
      </label>
      <select 
        id="nesting-level"
        value={nestingLevel} 
        onChange={handleChange}
        className="nesting-select"
      >
        <option value={0}>0 - Individual systems only</option>
        <option value={1}>1 - Top-level groups</option>
        <option value={2}>2 - Expand depth 2</option>
        <option value={3}>3 - Expand depth 3</option>
        <option value={4}>4 - Expand depth 4</option>
        <option value="max">Max - Fully expanded</option>
      </select>
      <div className="nesting-info">
        {nestingLevel === 0 && '📦 Showing ungrouped systems only'}
        {nestingLevel === 1 && '📦 Groups shown as black boxes'}
        {typeof nestingLevel === 'number' && nestingLevel > 1 && `📦 Expanding ${nestingLevel} level${nestingLevel > 1 ? 's' : ''} deep`}
        {nestingLevel === 'max' && '🌌 All groups fully expanded'}
      </div>
    </div>
  );
};

