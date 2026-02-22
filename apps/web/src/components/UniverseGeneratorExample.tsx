/**
 * Example of how to integrate UniverseGeneratorPanel into your main layout
 */

import React from 'react';
import { UniverseGeneratorPanel } from './UniverseGeneratorPanel';
// Your existing components
// import { Scene } from './Scene';
// import { HierarchyPanel } from './HierarchyPanel';

/**
 * Example layout with generator panel on the right
 */
export const AppLayoutExample: React.FC = () => {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Main 3D viewport (existing) */}
      <div style={{ flex: 1, position: 'relative' }}>
        {/* <Scene /> */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100%',
          background: '#0a0a0a',
          color: '#666'
        }}>
          [Your existing 3D Scene component goes here]
        </div>
      </div>
      
      {/* Generator panel on the right */}
      <div style={{ 
        width: '400px', 
        height: '100vh',
        borderLeft: '1px solid #333',
        background: '#1a1a1a'
      }}>
        <UniverseGeneratorPanel />
      </div>
    </div>
  );
};

/**
 * Alternative: Generator panel on the left
 */
export const AppLayoutLeftPanel: React.FC = () => {
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Generator panel on the left */}
      <div style={{ 
        width: '400px', 
        height: '100vh',
        borderRight: '1px solid #333',
        background: '#1a1a1a'
      }}>
        <UniverseGeneratorPanel />
      </div>
      
      {/* Main 3D viewport (existing) */}
      <div style={{ flex: 1, position: 'relative' }}>
        {/* <Scene /> */}
      </div>
    </div>
  );
};

/**
 * Alternative: Collapsible side panel
 */
export const AppLayoutCollapsible: React.FC = () => {
  const [isPanelOpen, setIsPanelOpen] = React.useState(true);
  
  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
      {/* Main 3D viewport */}
      <div style={{ flex: 1, position: 'relative' }}>
        {/* <Scene /> */}
        
        {/* Toggle button */}
        <button
          onClick={() => setIsPanelOpen(!isPanelOpen)}
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            padding: '0.5rem 1rem',
            background: '#2a2a2a',
            color: '#fff',
            border: '1px solid #3a3a3a',
            borderRadius: '4px',
            cursor: 'pointer',
            zIndex: 100,
          }}
        >
          {isPanelOpen ? '➡️ Hide Generator' : '⬅️ Show Generator'}
        </button>
      </div>
      
      {/* Collapsible generator panel */}
      {isPanelOpen && (
        <div style={{ 
          width: '400px', 
          height: '100vh',
          borderLeft: '1px solid #333',
          background: '#1a1a1a',
          transition: 'transform 0.3s ease',
        }}>
          <UniverseGeneratorPanel />
        </div>
      )}
    </div>
  );
};

