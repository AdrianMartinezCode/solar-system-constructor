import React from 'react';
import { useWindowStore } from '../state/windowStore';
import { Window } from './Window';
import { SimulationSpeedControl } from '../ui/SimulationSpeedControl';
import { HierarchyTree } from '../ui/HierarchyTree';
import { UniverseGeneratorPanel } from './UniverseGeneratorPanel';
import { GroupEditorPanel } from '../ui/GroupEditorPanel';
import { StarEditorPanel } from '../ui/StarEditorPanel';
import { StarListPanel } from '../ui/StarListPanel';
import { SystemOverview } from './SystemOverview';
import { StatsPanel } from './StatsPanel';

export const WindowManager: React.FC = () => {
  const windows = useWindowStore((state) => state.windows);

  return (
    <>
      {Object.values(windows).map((window) => (
        <Window key={window.id} window={window}>
          {getWindowContent(window.type, window.data)}
        </Window>
      ))}
    </>
  );
};

function getWindowContent(type: string, data?: any): React.ReactNode {
  switch (type) {
    case 'speed':
      return <SimulationSpeedControl />;
    case 'overview':
      return <SystemOverview />;
    case 'hierarchy':
      return <HierarchyTree />;
    case 'generator':
      return <UniverseGeneratorPanel />;
    case 'planetEditor':
      return <StarEditorPanel />;
    case 'groupEditor':
      return <GroupEditorPanel />;
    case 'stats':
      return <StatsPanel />;
    case 'starList':
      return <StarListPanel />;
    default:
      return <div>Unknown window type: {type}</div>;
  }
}

