import React, { useState, useMemo } from 'react';
import { useSystemStore } from '../state/systemStore';
import { useWindowStore } from '../state/windowStore';
import './SystemOverview.css';

type FilterType = 'all' | 'stars' | 'planets' | 'groups';
type SortType = 'name' | 'mass' | 'distance';

export const SystemOverview: React.FC = () => {
  const stars = useSystemStore((state) => state.stars);
  const groups = useSystemStore((state) => state.groups);
  const selectStar = useSystemStore((state) => state.selectStar);
  const selectGroup = useSystemStore((state) => state.selectGroup);
  const setCameraMode = useSystemStore((state) => state.setCameraMode);
  const openWindow = useWindowStore((state) => state.openWindow);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('name');

  // Count objects
  const counts = useMemo(() => {
    const starArray = Object.values(stars);
    const starsCount = starArray.filter(s => s.parentId === null).length;
    const planetsCount = starArray.filter(s => s.parentId !== null).length;
    const moonsCount = starArray.filter(s => {
      if (!s.parentId) return false;
      const parent = stars[s.parentId];
      return parent && parent.parentId !== null;
    }).length;
    
    return {
      stars: starsCount,
      planets: planetsCount - moonsCount,
      moons: moonsCount,
      groups: Object.keys(groups).length,
      total: starArray.length,
    };
  }, [stars, groups]);

  // Filter and search objects
  const filteredObjects = useMemo(() => {
    let results: any[] = [];

    // Get stars
    if (filter === 'all' || filter === 'stars' || filter === 'planets') {
      Object.values(stars).forEach(star => {
        const matchesSearch = star.name.toLowerCase().includes(searchQuery.toLowerCase());
        const isRoot = star.parentId === null;
        
        if (matchesSearch) {
          if (filter === 'all') {
            results.push({ type: 'star', data: star });
          } else if (filter === 'stars' && isRoot) {
            results.push({ type: 'star', data: star });
          } else if (filter === 'planets' && !isRoot) {
            results.push({ type: 'planet', data: star });
          }
        }
      });
    }

    // Get groups
    if (filter === 'all' || filter === 'groups') {
      Object.values(groups).forEach(group => {
        if (group.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          results.push({ type: 'group', data: group });
        }
      });
    }

    // Sort results
    results.sort((a, b) => {
      if (sortBy === 'name') {
        return a.data.name.localeCompare(b.data.name);
      } else if (sortBy === 'mass' && a.type !== 'group' && b.type !== 'group') {
        return (b.data.mass || 0) - (a.data.mass || 0);
      } else if (sortBy === 'distance' && a.type !== 'group' && b.type !== 'group') {
        return (a.data.orbitalDistance || 0) - (b.data.orbitalDistance || 0);
      }
      return 0;
    });

    return results;
  }, [stars, groups, searchQuery, filter, sortBy]);

  const handleObjectClick = (obj: any) => {
    if (obj.type === 'group') {
      selectGroup(obj.data.id);
      openWindow('groupEditor');
    } else {
      selectStar(obj.data.id);
      openWindow('planetEditor');
    }
  };

  const handleFocusCamera = (obj: any) => {
    if (obj.type !== 'group') {
      selectStar(obj.data.id);
      setCameraMode('body', obj.data.id);
    }
  };

  return (
    <div className="system-overview">
      <div className="overview-search">
        <input
          type="text"
          className="search-input"
          placeholder="🔍 Search objects..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        {searchQuery && (
          <button className="search-clear" onClick={() => setSearchQuery('')}>
            ✕
          </button>
        )}
      </div>

      <div className="overview-filters">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
        </button>
        <button
          className={`filter-btn ${filter === 'stars' ? 'active' : ''}`}
          onClick={() => setFilter('stars')}
        >
          ⭐ Stars
        </button>
        <button
          className={`filter-btn ${filter === 'planets' ? 'active' : ''}`}
          onClick={() => setFilter('planets')}
        >
          🌍 Planets
        </button>
        <button
          className={`filter-btn ${filter === 'groups' ? 'active' : ''}`}
          onClick={() => setFilter('groups')}
        >
          📁 Groups
        </button>
      </div>

      <div className="overview-sort">
        <label>Sort by:</label>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortType)}>
          <option value="name">Name</option>
          <option value="mass">Mass</option>
          <option value="distance">Distance</option>
        </select>
      </div>

      <div className="overview-results">
        <div className="results-header">
          {filteredObjects.length} result{filteredObjects.length !== 1 ? 's' : ''}
        </div>

        <div className="results-list">
          {filteredObjects.map((obj, idx) => (
            <div key={`${obj.type}-${obj.data.id}`} className="result-item">
              <div className="result-icon">
                {obj.type === 'group' ? '📁' : obj.data.parentId === null ? '⭐' : '🌍'}
              </div>
              <div className="result-info">
                <div className="result-name">{obj.data.name}</div>
                {obj.type !== 'group' && obj.data.parentId && (
                  <div className="result-details">
                    Parent: {stars[obj.data.parentId]?.name || 'Unknown'} | {obj.data.orbitalDistance?.toFixed(2)} AU
                  </div>
                )}
                {obj.type !== 'group' && obj.data.mass && (
                  <div className="result-details">Mass: {obj.data.mass.toFixed(2)}</div>
                )}
              </div>
              <div className="result-actions">
                <button
                  className="result-action-btn"
                  onClick={() => handleFocusCamera(obj)}
                  title="Focus camera"
                >
                  👁️
                </button>
                <button
                  className="result-action-btn"
                  onClick={() => handleObjectClick(obj)}
                  title="Edit"
                >
                  ✏️
                </button>
              </div>
            </div>
          ))}
          
          {filteredObjects.length === 0 && (
            <div className="no-results">
              No objects found matching "{searchQuery}"
            </div>
          )}
        </div>
      </div>

      <div className="overview-summary">
        <div className="summary-title">Universe Summary</div>
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-icon">⭐</span>
            <span className="stat-value">{counts.stars}</span>
            <span className="stat-label">Stars</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">🌍</span>
            <span className="stat-value">{counts.planets}</span>
            <span className="stat-label">Planets</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">🌙</span>
            <span className="stat-value">{counts.moons}</span>
            <span className="stat-label">Moons</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">📁</span>
            <span className="stat-value">{counts.groups}</span>
            <span className="stat-label">Groups</span>
          </div>
        </div>
        <div className="summary-total">
          👁️ {counts.total} Total Objects
        </div>
      </div>

      <div className="overview-actions">
        <button className="action-btn primary" onClick={() => openWindow('generator')}>
          🌌 Generate Universe
        </button>
      </div>
    </div>
  );
};

