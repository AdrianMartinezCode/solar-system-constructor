import React from 'react';
import { useSystemStore } from '../state/systemStore';
import './StarListPanel.css';

export const StarListPanel: React.FC = () => {
  const stars = useSystemStore((state) => state.stars);
  const selectedStarId = useSystemStore((state) => state.selectedStarId);
  const selectStar = useSystemStore((state) => state.selectStar);
  
  const starArray = Object.values(stars);
  
  return (
    <div className="star-list-panel">
      <h3>All Stars</h3>
      <div className="star-list">
        {starArray.map((star) => (
          <div
            key={star.id}
            className={`star-item ${selectedStarId === star.id ? 'selected' : ''}`}
            onClick={() => selectStar(star.id)}
          >
            <div 
              className="star-color-indicator" 
              style={{ backgroundColor: star.color }}
            />
            <div className="star-info">
              <div className="star-name">{star.name}</div>
              <div className="star-details">
                Mass: {star.mass} | Radius: {star.radius}
              </div>
            </div>
          </div>
        ))}
        {starArray.length === 0 && (
          <div className="empty-state">No stars yet. Create one!</div>
        )}
      </div>
    </div>
  );
};

