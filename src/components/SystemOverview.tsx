import React, { useState, useMemo } from 'react';
import { useSystemStore } from '../state/systemStore';
import { useWindowStore } from '../state/windowStore';
import { Star, Group, ProtoplanetaryDisk, SmallBodyField, NebulaRegion } from '../types';
import './SystemOverview.css';

type FilterType = 
  | 'all' 
  | 'stars' 
  | 'planets' 
  | 'moons' 
  | 'asteroids' 
  | 'comets' 
  | 'lagrangePoints'
  | 'trojans'
  | 'blackHoles'
  | 'roguePlanets'
  | 'ringed'
  | 'disks' 
  | 'smallBodyFields'
  | 'nebulae'
  | 'groups';

type SortType = 'name' | 'mass' | 'distance';

// Typed result union for type safety
type ResultItem = 
  | { type: 'star'; data: Star }
  | { type: 'planet'; data: Star }
  | { type: 'moon'; data: Star }
  | { type: 'asteroid'; data: Star }
  | { type: 'comet'; data: Star }
  | { type: 'lagrangePoint'; data: Star }
  | { type: 'trojan'; data: Star }
  | { type: 'blackHole'; data: Star }
  | { type: 'roguePlanet'; data: Star }
  | { type: 'disk'; data: ProtoplanetaryDisk }
  | { type: 'smallBodyField'; data: SmallBodyField }
  | { type: 'nebula'; data: NebulaRegion }
  | { type: 'group'; data: Group };

export const SystemOverview: React.FC = () => {
  const stars = useSystemStore((state) => state.stars);
  const groups = useSystemStore((state) => state.groups);
  const protoplanetaryDisks = useSystemStore((state) => state.protoplanetaryDisks);
  const smallBodyFields = useSystemStore((state) => state.smallBodyFields);
  const nebulae = useSystemStore((state) => state.nebulae);
  const isolatedGroupId = useSystemStore((state) => state.isolatedGroupId);
  const selectStar = useSystemStore((state) => state.selectStar);
  const selectGroup = useSystemStore((state) => state.selectGroup);
  const selectProtoplanetaryDisk = useSystemStore((state) => state.selectProtoplanetaryDisk);
  const selectSmallBodyField = useSystemStore((state) => state.selectSmallBodyField);
  const selectNebula = useSystemStore((state) => state.selectNebula);
  const setCameraMode = useSystemStore((state) => state.setCameraMode);
  const toggleIsolatedGroup = useSystemStore((state) => state.toggleIsolatedGroup);
  const openWindow = useWindowStore((state) => state.openWindow);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('name');

  // Count objects
  const counts = useMemo(() => {
    const starArray = Object.values(stars);
    
    // Identify explicit stars (root stars with bodyType 'star' or legacy root stars without bodyType)
    const starsCount = starArray.filter(s => 
      s.bodyType === 'star' || (s.parentId === null && !s.bodyType && !s.isRoguePlanet)
    ).length;
    
    const planetsCount = starArray.filter(s => s.bodyType === 'planet' && !s.isRoguePlanet).length;
    const roguePlanetsCount = starArray.filter(s => s.isRoguePlanet === true).length;
    const moonsCount = starArray.filter(s => s.bodyType === 'moon').length;
    
    // Asteroids: count all asteroids, optionally separate Kuiper
    const asteroidsCount = starArray.filter(s => s.bodyType === 'asteroid').length;
    const kuiperObjectsCount = starArray.filter(s => 
      s.bodyType === 'asteroid' && s.asteroidSubType === 'kuiperBelt'
    ).length;
    const mainBeltAsteroidsCount = starArray.filter(s => 
      s.bodyType === 'asteroid' && (s.asteroidSubType === 'mainBelt' || !s.asteroidSubType)
    ).length;
    
    const cometsCount = starArray.filter(s => s.bodyType === 'comet').length;
    const lagrangePointsCount = starArray.filter(s => s.bodyType === 'lagrangePoint').length;
    
    // Trojan bodies: objects with lagrangeHostId
    const trojansCount = starArray.filter(s => s.lagrangeHostId).length;
    
    // Black holes: either bodyType === 'blackHole' or blackHole property present
    const blackHolesCount = starArray.filter(s => 
      s.bodyType === 'blackHole' || s.blackHole
    ).length;
    
    // Ringed planets: planets with ring property
    const ringedPlanetsCount = starArray.filter(s => 
      (s.bodyType === 'planet' || !s.bodyType) && s.ring
    ).length;
    
    const disksCount = Object.keys(protoplanetaryDisks).length;
    const smallBodyFieldsCount = Object.keys(smallBodyFields).length;
    const nebulaeCount = Object.keys(nebulae).length;
    const groupsCount = Object.keys(groups).length;
    
    // Total includes all star-based objects + disks + fields + nebulae
    const total = starArray.length + disksCount + smallBodyFieldsCount + nebulaeCount;
    
    return {
      stars: starsCount,
      planets: planetsCount,
      roguePlanets: roguePlanetsCount,
      moons: moonsCount,
      asteroids: asteroidsCount,
      kuiperObjects: kuiperObjectsCount,
      mainBeltAsteroids: mainBeltAsteroidsCount,
      comets: cometsCount,
      lagrangePoints: lagrangePointsCount,
      trojans: trojansCount,
      blackHoles: blackHolesCount,
      ringedPlanets: ringedPlanetsCount,
      disks: disksCount,
      smallBodyFields: smallBodyFieldsCount,
      nebulae: nebulaeCount,
      groups: groupsCount,
      total,
    };
  }, [stars, groups, protoplanetaryDisks, smallBodyFields, nebulae]);

  // Filter and search objects
  const filteredObjects = useMemo(() => {
    let results: ResultItem[] = [];

    // Helper to determine the star type for 'all' filter
    const getStarType = (star: Star): ResultItem['type'] => {
      if (star.isRoguePlanet) return 'roguePlanet';
      if (star.bodyType === 'blackHole' || star.blackHole) return 'blackHole';
      if (star.bodyType === 'lagrangePoint') return 'lagrangePoint';
      if (star.lagrangeHostId) return 'trojan';
      if (star.bodyType) return star.bodyType as ResultItem['type'];
      // Legacy: root stars without bodyType
      if (star.parentId === null) return 'star';
      return 'planet'; // fallback
    };

    // Process Star-based objects (stars, planets, moons, asteroids, comets, lagrange, trojans, black holes, rogues)
    const shouldIncludeStars = 
      filter === 'all' || 
      filter === 'stars' || 
      filter === 'planets' || 
      filter === 'moons' || 
      filter === 'asteroids' || 
      filter === 'comets' ||
      filter === 'lagrangePoints' ||
      filter === 'trojans' ||
      filter === 'blackHoles' ||
      filter === 'roguePlanets' ||
      filter === 'ringed';

    if (shouldIncludeStars) {
      Object.values(stars).forEach(star => {
        const matchesSearch = star.name.toLowerCase().includes(searchQuery.toLowerCase());
        
        if (matchesSearch) {
          // For 'all' filter, include everything
          if (filter === 'all') {
            const type = getStarType(star);
            results.push({ type, data: star } as ResultItem);
          }
          // Explicit star filter
          else if (filter === 'stars' && (star.bodyType === 'star' || (!star.bodyType && star.parentId === null && !star.isRoguePlanet))) {
            results.push({ type: 'star', data: star });
          }
          // Planet filter (non-rogue)
          else if (filter === 'planets' && star.bodyType === 'planet' && !star.isRoguePlanet) {
            results.push({ type: 'planet', data: star });
          }
          // Rogue planets filter
          else if (filter === 'roguePlanets' && star.isRoguePlanet === true) {
            results.push({ type: 'roguePlanet', data: star });
          }
          // Moons filter
          else if (filter === 'moons' && star.bodyType === 'moon') {
            results.push({ type: 'moon', data: star });
          }
          // Asteroids filter
          else if (filter === 'asteroids' && star.bodyType === 'asteroid') {
            results.push({ type: 'asteroid', data: star });
          }
          // Comets filter
          else if (filter === 'comets' && star.bodyType === 'comet') {
            results.push({ type: 'comet', data: star });
          }
          // Lagrange points filter (FIXED: was missing from the condition gate)
          else if (filter === 'lagrangePoints' && star.bodyType === 'lagrangePoint') {
            results.push({ type: 'lagrangePoint', data: star });
          }
          // Trojans filter (objects with lagrangeHostId)
          else if (filter === 'trojans' && star.lagrangeHostId) {
            results.push({ type: 'trojan', data: star });
          }
          // Black holes filter
          else if (filter === 'blackHoles' && (star.bodyType === 'blackHole' || star.blackHole)) {
            results.push({ type: 'blackHole', data: star });
          }
          // Ringed planets filter
          else if (filter === 'ringed' && star.ring) {
            results.push({ type: 'planet', data: star }); // type is planet but it's ringed
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

    // Get small body fields
    if (filter === 'all' || filter === 'smallBodyFields') {
      Object.values(smallBodyFields).forEach(field => {
        const name = field.name || field.regionLabel || 'Small Body Field';
        if (name.toLowerCase().includes(searchQuery.toLowerCase())) {
          results.push({ type: 'smallBodyField', data: field });
        }
      });
    }

    // Get nebulae
    if (filter === 'all' || filter === 'nebulae') {
      Object.values(nebulae).forEach(nebula => {
        if (nebula.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          results.push({ type: 'nebula', data: nebula });
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
        const nameA = ('name' in a.data ? a.data.name : '') || '';
        const nameB = ('name' in b.data ? b.data.name : '') || '';
        return nameA.localeCompare(nameB);
      } else if (sortBy === 'mass') {
        // Mass only applies to Star-based objects
        const massA = 'mass' in a.data ? (a.data.mass || 0) : 0;
        const massB = 'mass' in b.data ? (b.data.mass || 0) : 0;
        return massB - massA; // descending
      } else if (sortBy === 'distance') {
        // Distance applies to orbiting objects and fields/disks
        let distA = Infinity;
        let distB = Infinity;
        
        // For Star objects: use semiMajorAxis or orbitalDistance
        if ('semiMajorAxis' in a.data || 'orbitalDistance' in a.data) {
          const star = a.data as Star;
          distA = star.semiMajorAxis ?? star.orbitalDistance ?? Infinity;
        }
        // For disks: use innerRadius (or average of inner/outer)
        else if (a.type === 'disk') {
          distA = a.data.innerRadius;
        }
        // For small body fields: use innerRadius
        else if (a.type === 'smallBodyField') {
          distA = a.data.innerRadius;
        }
        
        if ('semiMajorAxis' in b.data || 'orbitalDistance' in b.data) {
          const star = b.data as Star;
          distB = star.semiMajorAxis ?? star.orbitalDistance ?? Infinity;
        }
        else if (b.type === 'disk') {
          distB = b.data.innerRadius;
        }
        else if (b.type === 'smallBodyField') {
          distB = b.data.innerRadius;
        }
        
        return distA - distB; // ascending
      }
      return 0;
    });

    return results;
  }, [stars, groups, protoplanetaryDisks, smallBodyFields, nebulae, searchQuery, filter, sortBy]);

  const handleObjectClick = (obj: ResultItem) => {
    if (obj.type === 'group') {
      selectGroup(obj.data.id);
      openWindow('groupEditor');
    } 
    else if (obj.type === 'disk') {
      // Select the disk's central star and open planet editor
      selectProtoplanetaryDisk(obj.data.id);
      if (obj.data.centralStarId && stars[obj.data.centralStarId]) {
        selectStar(obj.data.centralStarId);
      }
      openWindow('planetEditor');
    } 
    else if (obj.type === 'nebula') {
      // Select nebula and open nebula editor (pass nebulaId in window data)
      selectNebula(obj.data.id);
      openWindow('nebulaEditor', { nebulaId: obj.data.id });
    } 
    else if (obj.type === 'smallBodyField') {
      // Select the field and focus on host star
      selectSmallBodyField(obj.data.id);
      if (obj.data.hostStarId && stars[obj.data.hostStarId]) {
        selectStar(obj.data.hostStarId);
        openWindow('planetEditor');
      }
    } 
    else {
      // All Star-based objects: star, planet, moon, asteroid, comet, lagrangePoint, trojan, blackHole, roguePlanet
      selectStar(obj.data.id);
      openWindow('planetEditor');
    }
  };

  const handleFocusCamera = (obj: ResultItem) => {
    if (obj.type === 'group') {
      return; // Cannot focus on groups
    }
    else if (obj.type === 'disk') {
      // Focus on the central star of the disk
      selectProtoplanetaryDisk(obj.data.id);
      if (obj.data.centralStarId && stars[obj.data.centralStarId]) {
        setCameraMode('body', obj.data.centralStarId);
      }
    }
    else if (obj.type === 'smallBodyField') {
      // Focus on the host star of the field
      selectSmallBodyField(obj.data.id);
      if (obj.data.hostStarId && stars[obj.data.hostStarId]) {
        setCameraMode('body', obj.data.hostStarId);
      }
    }
    else if (obj.type === 'nebula') {
      // Nebulae are volumetric regions, camera focusing on them might not make sense
      // But we can select them
      selectNebula(obj.data.id);
      // Optionally: you could focus on nebula position if needed
    }
    else {
      // All Star-based objects
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
          className={`filter-btn ${filter === 'lagrangePoints' ? 'active' : ''}`}
          onClick={() => setFilter('lagrangePoints')}
          title="Lagrange Points (L1-L5 equilibrium points)"
        >
          ⚖️ Lagrange
        </button>
        <button
          className={`filter-btn ${filter === 'trojans' ? 'active' : ''}`}
          onClick={() => setFilter('trojans')}
          title="Trojan bodies (objects at Lagrange points)"
        >
          🏛️ Trojans
        </button>
        <button
          className={`filter-btn ${filter === 'blackHoles' ? 'active' : ''}`}
          onClick={() => setFilter('blackHoles')}
          title="Black Holes"
        >
          ⚫ Black Holes
        </button>
        <button
          className={`filter-btn ${filter === 'roguePlanets' ? 'active' : ''}`}
          onClick={() => setFilter('roguePlanets')}
          title="Rogue Planets (unbound wanderers)"
        >
          🧭 Rogues
        </button>
        <button
          className={`filter-btn ${filter === 'ringed' ? 'active' : ''}`}
          onClick={() => setFilter('ringed')}
          title="Ringed Planets"
        >
          💍 Ringed
        </button>
        <button
          className={`filter-btn ${filter === 'disks' ? 'active' : ''}`}
          onClick={() => setFilter('disks')}
          title="Protoplanetary Disks"
        >
          💿 Disks
        </button>
        <button
          className={`filter-btn ${filter === 'smallBodyFields' ? 'active' : ''}`}
          onClick={() => setFilter('smallBodyFields')}
          title="Small Body Fields (asteroid/Kuiper belts)"
        >
          🌌 Belts
        </button>
        <button
          className={`filter-btn ${filter === 'nebulae' ? 'active' : ''}`}
          onClick={() => setFilter('nebulae')}
          title="Nebulae (gas/dust clouds)"
        >
          🌫️ Nebulae
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
          {filteredObjects.map((obj) => {
            // Determine icon based on type
            let icon = '⭐';
            if (obj.type === 'group') icon = '📁';
            else if (obj.type === 'planet') icon = '🌍';
            else if (obj.type === 'roguePlanet') icon = '🧭';
            else if (obj.type === 'moon') icon = '🌑';
            else if (obj.type === 'asteroid') icon = '🪨';
            else if (obj.type === 'comet') icon = '☄️';
            else if (obj.type === 'lagrangePoint') icon = '⚖️';
            else if (obj.type === 'trojan') icon = '🏛️';
            else if (obj.type === 'blackHole') icon = '⚫';
            else if (obj.type === 'disk') icon = '💿';
            else if (obj.type === 'smallBodyField') icon = '🌌';
            else if (obj.type === 'nebula') icon = '🌫️';
            
            // Get name
            let name = '';
            if ('name' in obj.data) {
              name = obj.data.name || 'Unnamed';
            }
            if (obj.type === 'disk' && !name) name = 'Protoplanetary Disk';
            if (obj.type === 'smallBodyField' && !name) name = obj.data.regionLabel || 'Small Body Field';
            
            return (
            <div key={`${obj.type}-${obj.data.id}`} className="result-item">
              <div className="result-icon">
                {icon}
              </div>
              <div className="result-info">
                <div className="result-name">{name}</div>
                
                {/* Rogue planet details */}
                {obj.type === 'roguePlanet' && 'roguePlanet' in obj.data && obj.data.roguePlanet && (
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
                
                {/* Star-based object with parent (orbital info) */}
                {obj.type !== 'group' && obj.type !== 'disk' && obj.type !== 'smallBodyField' && obj.type !== 'nebula' && obj.type !== 'roguePlanet' && 'parentId' in obj.data && obj.data.parentId && (
                  <div className="result-details">
                    Parent: {stars[obj.data.parentId]?.name || 'Unknown'} | {((obj.data.semiMajorAxis ?? obj.data.orbitalDistance) || 0).toFixed(2)} AU
                    {obj.data.eccentricity && obj.data.eccentricity > 0 && (
                      <> | e={obj.data.eccentricity.toFixed(2)}</>
                    )}
                  </div>
                )}
                
                {/* Disk details */}
                {obj.type === 'disk' && (
                  <div className="result-details">
                    Center: {stars[obj.data.centralStarId]?.name || 'Unknown'} | {obj.data.particleCount?.toLocaleString()} particles | {obj.data.innerRadius.toFixed(1)}-{obj.data.outerRadius.toFixed(1)} AU
                  </div>
                )}
                
                {/* Small body field details */}
                {obj.type === 'smallBodyField' && (
                  <div className="result-details">
                    Host: {stars[obj.data.hostStarId]?.name || 'Unknown'} | {obj.data.beltType === 'kuiper' ? 'Kuiper' : 'Main'} Belt | {obj.data.innerRadius.toFixed(1)}-{obj.data.outerRadius.toFixed(1)} AU | {obj.data.particleCount?.toLocaleString()} particles
                  </div>
                )}
                
                {/* Nebula details */}
                {obj.type === 'nebula' && (
                  <div className="result-details">
                    Radius: {obj.data.radius.toFixed(1)} | Density: {obj.data.density.toFixed(2)} | Brightness: {obj.data.brightness.toFixed(2)}
                  </div>
                )}
                
                {/* Lagrange point details */}
                {obj.type === 'lagrangePoint' && 'lagrangePoint' in obj.data && obj.data.lagrangePoint && (
                  <div className="result-details">
                    L{obj.data.lagrangePoint.pointIndex} | {obj.data.lagrangePoint.pairType} | {obj.data.lagrangePoint.stable ? 'Stable' : 'Unstable'}
                  </div>
                )}
                
                {/* Trojan details */}
                {obj.type === 'trojan' && 'lagrangeHostId' in obj.data && obj.data.lagrangeHostId && (
                  <div className="result-details">
                    Trojan of {stars[obj.data.lagrangeHostId]?.name || 'Unknown'}
                  </div>
                )}
                
                {/* Black hole details */}
                {obj.type === 'blackHole' && 'blackHole' in obj.data && obj.data.blackHole && (
                  <div className="result-details">
                    Shadow: {obj.data.blackHole.shadowRadius.toFixed(2)} | {obj.data.blackHole.hasAccretionDisk ? 'Accretion Disk' : 'No Disk'} | {obj.data.blackHole.hasRelativisticJet ? 'Jets' : 'No Jets'}
                  </div>
                )}
                
                {/* Mass (for star-based objects, excluding non-physical types) */}
                {obj.type !== 'group' && obj.type !== 'disk' && obj.type !== 'smallBodyField' && obj.type !== 'nebula' && 'mass' in obj.data && obj.data.mass && (
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
                {obj.type === 'group' && (
                  <button
                    className={`result-action-btn ${isolatedGroupId === obj.data.id ? 'active' : ''}`}
                    onClick={() => toggleIsolatedGroup(obj.data.id)}
                    title={isolatedGroupId === obj.data.id ? "Exit solo mode" : "Solo in viewport"}
                    style={{
                      backgroundColor: isolatedGroupId === obj.data.id ? '#8B5CF6' : undefined,
                      color: isolatedGroupId === obj.data.id ? 'white' : undefined,
                    }}
                  >
                    {isolatedGroupId === obj.data.id ? '🔓' : '🔒'}
                  </button>
                )}
              </div>
            </div>
            );
          })}
          
          {filteredObjects.length === 0 && (
            <div className="no-results">
              No objects found{searchQuery ? ` matching "${searchQuery}"` : ''}
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
          <div className="stat-item">
            <span className="stat-icon">⚖️</span>
            <span className="stat-value">{counts.lagrangePoints}</span>
            <span className="stat-label">Lagrange</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">🏛️</span>
            <span className="stat-value">{counts.trojans}</span>
            <span className="stat-label">Trojans</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">⚫</span>
            <span className="stat-value">{counts.blackHoles}</span>
            <span className="stat-label">Black Holes</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">🧭</span>
            <span className="stat-value">{counts.roguePlanets}</span>
            <span className="stat-label">Rogues</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">💍</span>
            <span className="stat-value">{counts.ringedPlanets}</span>
            <span className="stat-label">Ringed</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">💿</span>
            <span className="stat-value">{counts.disks}</span>
            <span className="stat-label">Disks</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">🌌</span>
            <span className="stat-value">{counts.smallBodyFields}</span>
            <span className="stat-label">Belts</span>
          </div>
          <div className="stat-item">
            <span className="stat-icon">🌫️</span>
            <span className="stat-value">{counts.nebulae}</span>
            <span className="stat-label">Nebulae</span>
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

