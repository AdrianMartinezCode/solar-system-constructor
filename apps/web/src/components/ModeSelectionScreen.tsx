import { useState } from 'react';
import type { AppMode } from '../types/appMode';
import { useHostConfigStore } from '../state/hostConfigStore';
import { useHealthCheck } from '../hooks/useHealthCheck';
import type { HealthStatus } from '../hooks/useHealthCheck';
import './ModeSelectionScreen.css';

interface ModeSelectionScreenProps {
  onSelect: (mode: AppMode) => void;
}

const HEALTH_DOT_CLASS: Record<HealthStatus, string> = {
  idle: 'health-dot-idle',
  checking: 'health-dot-checking',
  healthy: 'health-dot-healthy',
  error: 'health-dot-error',
};

const HEALTH_LABEL: Record<HealthStatus, string> = {
  idle: '',
  checking: 'Checking\u2026',
  healthy: 'Healthy',
  error: 'Unreachable',
};

export const ModeSelectionScreen = ({ onSelect }: ModeSelectionScreenProps) => {
  const { apiHost, setApiHost } = useHostConfigStore();

  // Resolve the base URL: host set → use directly, empty → "/api" (Vite proxy).
  const apiBaseUrl = apiHost ? apiHost.replace(/\/+$/, '') : '/api';
  const { status, error } = useHealthCheck(apiBaseUrl);
  const [showError, setShowError] = useState(false);

  return (
    <div className="mode-selection-screen">
      <div className="mode-selection-header">
        <h1 className="mode-selection-title">Solar System Constructor</h1>
        <p className="mode-selection-subtitle">Choose how you want to work</p>
      </div>

      <div className="server-config-section">
        <div className="server-config-row">
          <label className="server-config-label">Server</label>
          <input
            type="text"
            className="server-config-input"
            value={apiHost}
            placeholder="http://localhost:3001"
            onChange={(e) => setApiHost(e.target.value)}
          />
          <div className="health-semaphore">
            <span className={`health-dot ${HEALTH_DOT_CLASS[status]}`} />
            <span className={`health-label health-label-${status}`}>
              {HEALTH_LABEL[status]}
            </span>
            {status === 'error' && (
              <button
                className="health-error-btn"
                type="button"
                onClick={() => setShowError(true)}
              >
                View Error
              </button>
            )}
          </div>
        </div>
        {showError && status === 'error' && (
          <div className="health-error-detail">
            <p>{error}</p>
            <button type="button" onClick={() => setShowError(false)}>
              Dismiss
            </button>
          </div>
        )}
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
          className={`mode-card${status !== 'healthy' ? ' mode-card-disabled' : ''}`}
          onClick={() => status === 'healthy' && onSelect('online')}
          disabled={status !== 'healthy'}
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
