import React, { useState, useMemo } from 'react';
import { useSystemStore } from '../state/systemStore';
import { useWindowStore } from '../state/windowStore';
import './SystemOverview.css';

type FilterType = 'all' | 'stars' | 'planets' | 'moons' | 'asteroids' | 'comets' | 'lagrangePoints' | 'disks' | 'groups' | 'roguePlanets';
type SortType = 'name' | 'mass' | 'distance';

export const SystemOverview: React.FC = () => {
  const stars = useSystemStore((state) => state.stars);
  const groups = useSystemStore((state) => state.groups);
  const protoplanetaryDisks = useSystemStore((state) => state.protoplanetaryDisks);
  const selectStar = useSystemStore((state) => state.selectStar);
  const selectGroup = useSystemStore((state) => state.selectGroup);
  const selectProtoplanetaryDisk = useSystemStore((state) => state.selectProtoplanetaryDisk);
  const setCameraMode = useSystemStore((state) => state.setCameraMode);
  const openWindow = useWindowStore((state) => state.openWindow);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('name');

  // Count objects
  const counts = useMemo(() => {
    const starArray = Object.values(stars);
    const starsCount = starArray.filter(s => s.bodyType === 'star' || (s.parentId === null && !s.bodyType && !s.isRoguePlanet)).length;
    const planetsCount = starArray.filter(s => s.bodyType === 'planet' && !s.isRoguePlanet).length;
    const roguePlanetsCount = starArray.filter(s => s.isRoguePlanet === true).length;
    const moonsCount = starArray.filter(s => s.bodyType === 'moon').length;
    const asteroidsCount = starArray.filter(s => s.bodyType === 'asteroid').length;
    const cometsCount = starArray.filter(s => s.bodyType === 'comet').length;
    const lagrangePointsCount = starArray.filter(s => s.bodyType === 'lagrangePoint').length;
    const disksCount = Object.keys(protoplanetaryDisks).length;
    
    return {
      stars: starsCount,
      planets: planetsCount,
      roguePlanets: roguePlanetsCount,
      moons: moonsCount,
      asteroids: asteroidsCount,
      comets: cometsCount,
      lagrangePoints: lagrangePointsCount,
      disks: disksCount,
      groups: Object.keys(groups).length,
      total: starArray.length + disksCount,
    };
  }, [stars, groups, protoplanetaryDisks]);

  // Filter and search objects
  const filteredObjects = useMemo(() => {
    let results: any[] = [];

    // Get stars/planets/moons/asteroids/comets/roguePlanets
    if (filter === 'all' || filter === 'stars' || filter === 'planets' || filter === 'moons' || filter === 'asteroids' || filter === 'comets' || filter === 'roguePlanets') {
      Object.values(stars).forEach(star => {
        const matchesSearch = star.name.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (matchesSearch) {
          if (filter === 'all') {
            results.push({ type: star.isRoguePlanet ? 'roguePlanet' : (star.bodyType || 'star'), data: star });
          } else if (filter === 'stars' && (star.bodyType === 'star' || (!star.bodyType && star.parentId === null && !star.isRoguePlanet))) {
            results.push({ type: 'star', data: star });
          } else if (filter === 'planets' && star.bodyType === 'planet' && !star.isRoguePlanet) {
            results.push({ type: 'planet', data: star });
          } else if (filter === 'roguePlanets' && star.isRoguePlanet === true) {
            results.push({ type: 'roguePlanet', data: star });
          } else if (filter === 'moons' && star.bodyType === 'moon') {
            results.push({ type: 'moon', data: star });
          } else if (filter === 'asteroids' && star.bodyType === 'asteroid') {
            results.push({ type: 'asteroid', data: star });
          } else if (filter === 'comets' && star.bodyType === 'comet') {
            results.push({ type: 'comet', data: star });
          } else if (filter === 'lagrangePoints' && star.bodyType === 'lagrangePoint') {
            results.push({ type: 'lagrangePoint', data: star });
          }
        }
      });
    }

    // Get protoplanetary disks
    if (filter === 'all' || filter === 'disks') {
      Object.values(protoplanetaryDisks).forEach(disk => {
        const name = disk.name || `Protoplanetary Disk`;
        if (name.toLowerCase().includes(searchQuery.toLowerCase())) {
          results.push({ type: 'disk', data: disk });
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
        // Use semi-major axis if available, otherwise fall back to orbitalDistance
        const distA = a.data.semiMajorAxis ?? a.data.orbitalDistance ?? 0;
        const distB = b.data.semiMajorAxis ?? b.data.orbitalDistance ?? 0;
        return distA - distB;
      }
      return 0;
    });

    return results;
  }, [stars, groups, searchQuery, filter, sortBy]);

  const handleObjectClick = (obj: any) => {
    if (obj.type === 'group') {
      selectGroup(obj.data.id);
      openWindow('groupEditor');
    } else if (obj.type === 'disk') {
      selectProtoplanetaryDisk(obj.data.id);
      // Could open a disk editor window here if one exists
    } else {
      selectStar(obj.data.id);
      openWindow('planetEditor');
    }
  };

  const handleFocusCamera = (obj: any) => {
    if (obj.type === 'group') {
      return; // Cannot focus on groups
    }
    if (obj.type === 'disk') {
      // Focus on the central star of the disk
      selectProtoplanetaryDisk(obj.data.id);
      if (obj.data.centralStarId) {
        setCameraMode('body', obj.data.centralStarId);
      }
    } else {
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
          className={`filter-btn ${filter === 'moons' ? 'active' : ''}`}
          onClick={() => setFilter('moons')}
        >
          🌑 Moons
        </button>
        <button
          className={`filter-btn ${filter === 'asteroids' ? 'active' : ''}`}
          onClick={() => setFilter('asteroids')}
        >
          🪨 Asteroids
        </button>
        <button
          className={`filter-btn ${filter === 'comets' ? 'active' : ''}`}
          onClick={() => setFilter('comets')}
        >
          ☄️ Comets
        </button>
        <button
          className={`filter-btn ${filter === 'roguePlanets' ? 'active' : ''}`}
          onClick={() => setFilter('roguePlanets')}
          title="Rogue Planets (unbound wanderers)"
        >
          🧭 Rogues
        </button>
        <button
          className={`filter-btn ${filter === 'disks' ? 'active' : ''}`}
          onClick={() => setFilter('disks')}
        >
          💿 Disks
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
          {filteredObjects.map((obj, idx) => {
            // Determine icon based on type
            let icon = '⭐';
            if (obj.type === 'group') icon = '📁';
            else if (obj.type === 'planet') icon = '🌍';
            else if (obj.type === 'roguePlanet') icon = '🧭';
            else if (obj.type === 'moon') icon = '🌑';
            else if (obj.type === 'asteroid') icon = '🪨';
            else if (obj.type === 'comet') icon = '☄️';
            else if (obj.type === 'disk') icon = '💿';
            
            return (
            <div key={`${obj.type}-${obj.data.id}`} className="result-item">
              <div className="result-icon">
                {icon}
              </div>
              <div className="result-info">
                <div className="result-name">{obj.data.name || (obj.type === 'disk' ? 'Protoplanetary Disk' : 'Unknown')}</div>
                {obj.type === 'roguePlanet' && obj.data.roguePlanet && (
                  <div className="result-details">
                    {obj.data.roguePlanet.pathCurvature && obj.data.roguePlanet.pathCurvature > 0 ? (
                      <>
                        Curved Path ({(obj.data.roguePlanet.pathCurvature * 100).toFixed(0)}%) | 
                        Speed: {Math.sqrt(
                          obj.data.roguePlanet.velocity.x ** 2 + 
                          obj.data.roguePlanet.velocity.y ** 2 + 
                          obj.data.roguePlanet.velocity.z ** 2
                        ).toFixed(3)} units/s
                        {obj.data.roguePlanet.eccentricity && (
                          <> | e={obj.data.roguePlanet.eccentricity.toFixed(2)}</>
                        )}
                      </>
                    ) : (
                      <>
                        Linear Drift | Speed: {Math.sqrt(
                      obj.data.roguePlanet.velocity.x ** 2 + 
                      obj.data.roguePlanet.velocity.y ** 2 + 
                      obj.data.roguePlanet.velocity.z ** 2
                    ).toFixed(3)} units/s
                      </>
                    )}
                  </div>
                )}
                {obj.type !== 'group' && obj.type !== 'disk' && obj.type !== 'roguePlanet' && obj.data.parentId && (
                  <div className="result-details">
                    Parent: {stars[obj.data.parentId]?.name || 'Unknown'} | {(obj.data.semiMajorAxis ?? obj.data.orbitalDistance)?.toFixed(2)} AU
                    {obj.data.eccentricity && obj.data.eccentricity > 0 && (
                      <> | e={obj.data.eccentricity.toFixed(2)}</>
                    )}
                  </div>
                )}
                {obj.type === 'disk' && (
                  <div className="result-details">
                    Center: {stars[obj.data.centralStarId]?.name || 'Unknown'} | {obj.data.particleCount?.toLocaleString()} particles
                  </div>
                )}
                {obj.type !== 'group' && obj.type !== 'disk' && obj.data.mass && (
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
            );
          })}
          
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
            <span className="stat-icon">🪨</span>
            <span className="stat-value">{counts.asteroids}</span>
            <span className="stat-label">Asteroids</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">☄️</span>
            <span className="stat-value">{counts.comets}</span>
            <span className="stat-label">Comets</span>
          </div>
          {counts.roguePlanets > 0 && (
            <div className="stat-item">
              <span className="stat-icon">🧭</span>
              <span className="stat-value">{counts.roguePlanets}</span>
              <span className="stat-label">Rogues</span>
            </div>
          )}
          {counts.disks > 0 && (
            <div className="stat-item">
              <span className="stat-icon">💿</span>
              <span className="stat-value">{counts.disks}</span>
              <span className="stat-label">Disks</span>
            </div>
          )}
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

