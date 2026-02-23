import type { AppMode } from '../types/appMode';
import './ModeSelectionScreen.css';

interface ModeSelectionScreenProps {
  onSelect: (mode: AppMode) => void;
}

export const ModeSelectionScreen = ({ onSelect }: ModeSelectionScreenProps) => {
  return (
    <div className="mode-selection-screen">
      <div className="mode-selection-header">
        <h1 className="mode-selection-title">Solar System Constructor</h1>
        <p className="mode-selection-subtitle">Choose how you want to work</p>
      </div>

      <div className="mode-selection-cards">
        {/* Offline card */}
        <button
          className="mode-card"
          onClick={() => onSelect('offline')}
          type="button"
        >
          <span className="mode-card-icon">💾</span>
          <h2 className="mode-card-title">Offline</h2>
          <p className="mode-card-description">
            Work locally — your universe is saved in the browser. No server needed.
          </p>
        </button>

        {/* Online card */}
        <button
          className="mode-card"
          onClick={() => onSelect('online')}
          type="button"
        >
          <span className="mode-card-icon">🌐</span>
          <h2 className="mode-card-title">Online</h2>
          <p className="mode-card-description">
            Connect to a server — your universe is stored in the cloud and can be shared.
          </p>
        </button>
      </div>
    </div>
  );
};
