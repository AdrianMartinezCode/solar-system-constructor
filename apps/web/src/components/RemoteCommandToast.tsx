/**
 * RemoteCommandToast — displays auto-dismissing toast notifications
 * when remote commands are applied via the SSE stream.
 *
 * Renders a fixed-position container in the bottom-right corner.
 * Each toast auto-dismisses after 4 seconds.
 */

import React, { useEffect, useCallback } from 'react';
import { useRealtimeStore } from '../state/realtimeStore';
import type { RemoteCommandToast as ToastType } from '../state/realtimeStore';
import './RemoteCommandToast.css';

// ---------------------------------------------------------------------------
// Icon mapping
// ---------------------------------------------------------------------------

function commandIcon(commandType: string): string {
  switch (commandType) {
    case 'addStar':
    case 'updateStar':
    case 'removeStar':
    case 'attachStar':
    case 'detachStar':
      return '\u2B50'; // ⭐
    case 'addGroup':
    case 'updateGroup':
    case 'removeGroup':
    case 'addToGroup':
    case 'removeFromGroup':
    case 'moveToGroup':
      return '\uD83D\uDCC1'; // 📁
    case 'replaceSnapshot':
      return '\uD83D\uDD04'; // 🔄
    case 'setSmallBodyFields':
    case 'updateSmallBodyField':
    case 'removeSmallBodyField':
      return '\u2604\uFE0F'; // ☄️
    case 'setProtoplanetaryDisks':
    case 'addProtoplanetaryDisk':
    case 'updateProtoplanetaryDisk':
    case 'removeProtoplanetaryDisk':
      return '\uD83C\uDF00'; // 🌀
    case 'setNebulae':
    case 'updateNebula':
    case 'removeNebula':
      return '\uD83C\uDF0C'; // 🌌
    case 'updateRing':
    case 'removeRing':
      return '\uD83D\uDCAB'; // 💫
    default:
      return '\uD83D\uDD14'; // 🔔
  }
}

// ---------------------------------------------------------------------------
// Individual toast item
// ---------------------------------------------------------------------------

const DISMISS_DELAY_MS = 4000;

const ToastItem: React.FC<{ toast: ToastType }> = ({ toast }) => {
  const dismissToast = useRealtimeStore((state) => state.dismissToast);

  const handleDismiss = useCallback(() => {
    dismissToast(toast.id);
  }, [dismissToast, toast.id]);

  useEffect(() => {
    const timer = setTimeout(handleDismiss, DISMISS_DELAY_MS);
    return () => clearTimeout(timer);
  }, [handleDismiss]);

  const isHighlighted = toast.commandType === 'replaceSnapshot';

  return (
    <div className={`remote-toast-item ${isHighlighted ? 'remote-toast-highlighted' : ''}`}>
      <span className="remote-toast-icon">{commandIcon(toast.commandType)}</span>
      <span className="remote-toast-message">{toast.message}</span>
      <button className="remote-toast-close" onClick={handleDismiss} title="Dismiss">
        \u2715
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Container
// ---------------------------------------------------------------------------

export const RemoteCommandToast: React.FC = () => {
  const toasts = useRealtimeStore((state) => state.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="remote-toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
};
