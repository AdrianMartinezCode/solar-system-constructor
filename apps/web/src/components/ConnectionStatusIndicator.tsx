/**
 * ConnectionStatusIndicator — small color-coded pill showing
 * the SSE connection status in the AppHeader.
 *
 * Visible only in online mode.
 */

import { useRealtimeStore } from '../state/realtimeStore';
import type { ConnectionStatus } from '../state/realtimeStore';
import './ConnectionStatusIndicator.css';

const STATUS_CONFIG: Record<ConnectionStatus, { label: string; className: string } | null> = {
  idle: null, // hidden when idle
  connecting: { label: 'Connecting\u2026', className: 'status-connecting' },
  connected:  { label: 'Live',            className: 'status-connected' },
  error:      { label: 'Reconnecting\u2026', className: 'status-error' },
};

export function ConnectionStatusIndicator() {
  const connectionStatus = useRealtimeStore((state) => state.connectionStatus);

  const config = STATUS_CONFIG[connectionStatus];
  if (!config) return null;

  return (
    <span className={`connection-status-pill ${config.className}`} title={`SSE: ${connectionStatus}`}>
      <span className="connection-status-dot" />
      <span className="connection-status-label">{config.label}</span>
    </span>
  );
}
