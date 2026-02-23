import { useState } from 'react';
import type { ApiUniverse } from '../app/ports/universeApiClient';
import './UniverseBrowser.css';

interface UniverseBrowserProps {
  universes: ApiUniverse[];
  loading: boolean;
  onLoad: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
  onBack: () => void;
}

function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const UniverseBrowser = ({
  universes,
  loading,
  onLoad,
  onDelete,
  onCreate,
  onBack,
}: UniverseBrowserProps) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const handleDeleteClick = (id: string) => {
    setConfirmDeleteId(id);
  };

  const handleConfirmDelete = (id: string) => {
    onDelete(id);
    setConfirmDeleteId(null);
  };

  const handleCancelDelete = () => {
    setConfirmDeleteId(null);
  };

  return (
    <div className="universe-browser">
      {/* Header */}
      <div className="universe-browser-header">
        <h1 className="universe-browser-title">🌌 Universe Browser</h1>
        <p className="universe-browser-subtitle">
          Select a universe to explore, or create a new one
        </p>
      </div>

      {/* Actions bar */}
      <div className="universe-browser-actions">
        <button
          className="universe-browser-btn back"
          onClick={onBack}
          type="button"
        >
          ← Back to Mode Selection
        </button>
        <button
          className="universe-browser-btn primary"
          onClick={onCreate}
          type="button"
        >
          ✨ Create New Universe
        </button>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="universe-browser-loading">
          <div className="universe-browser-spinner" />
          <span>Loading universes…</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && universes.length === 0 && (
        <div className="universe-browser-empty">
          <span className="universe-browser-empty-icon">🪐</span>
          <p className="universe-browser-empty-text">No universes found</p>
          <p className="universe-browser-empty-hint">
            Create one to get started!
          </p>
        </div>
      )}

      {/* Universe list */}
      {!loading && universes.length > 0 && (
        <div className="universe-list">
          {universes.map((universe) => (
            <div key={universe.id} className="universe-card">
              <div className="universe-card-info">
                <h2 className="universe-card-name">{universe.name}</h2>
                <div className="universe-card-dates">
                  <span>
                    <span className="universe-card-date-label">Created: </span>
                    {formatDate(universe.createdAt)}
                  </span>
                  <span>
                    <span className="universe-card-date-label">Updated: </span>
                    {formatDate(universe.updatedAt)}
                  </span>
                </div>
              </div>

              {confirmDeleteId === universe.id ? (
                <div className="universe-card-confirm">
                  <span className="universe-card-confirm-text">Delete?</span>
                  <button
                    className="universe-card-btn confirm-yes"
                    onClick={() => handleConfirmDelete(universe.id)}
                    type="button"
                  >
                    Yes
                  </button>
                  <button
                    className="universe-card-btn confirm-no"
                    onClick={handleCancelDelete}
                    type="button"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="universe-card-actions">
                  <button
                    className="universe-card-btn load"
                    onClick={() => onLoad(universe.id)}
                    type="button"
                  >
                    🚀 Load
                  </button>
                  <button
                    className="universe-card-btn delete"
                    onClick={() => handleDeleteClick(universe.id)}
                    type="button"
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
