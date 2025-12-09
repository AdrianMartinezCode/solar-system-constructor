import React, { useState } from 'react';
import { useSystemStore } from '../state/systemStore';
import './StarEditorPanel.css';

type OrbitMode = 'simple' | 'advanced';

export const StarEditorPanel: React.FC = () => {
  const selectedStarId = useSystemStore((state) => state.selectedStarId);
  const stars = useSystemStore((state) => state.stars);
  const updateStar = useSystemStore((state) => state.updateStar);
  const removeStar = useSystemStore((state) => state.removeStar);
  const addStar = useSystemStore((state) => state.addStar);
  const attachStar = useSystemStore((state) => state.attachStar);
  const detachStar = useSystemStore((state) => state.detachStar);
  const updateRing = useSystemStore((state) => state.updateRing);
  const removeRing = useSystemStore((state) => state.removeRing);
  const cameraMode = useSystemStore((state) => state.cameraMode);
  const cameraTargetBodyId = useSystemStore((state) => state.cameraTargetBodyId);
  const setCameraMode = useSystemStore((state) => state.setCameraMode);
  const resetCamera = useSystemStore((state) => state.resetCamera);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [orbitMode, setOrbitMode] = useState<OrbitMode>('simple');
  const [newStarForm, setNewStarForm] = useState({
    name: '',
    mass: 10,
    radius: 1,
    color: '#4A90E2',
    parentId: null as string | null,
    orbitalDistance: 10,
    orbitalSpeed: 20,
    orbitalPhase: 0,
  });
  
  const selectedStar = selectedStarId ? stars[selectedStarId] : null;
  
  // Determine if the selected star has advanced orbit parameters
  const hasAdvancedOrbit = selectedStar && (
    (selectedStar.eccentricity !== undefined && selectedStar.eccentricity > 0) ||
    (selectedStar.orbitOffsetX !== undefined && selectedStar.orbitOffsetX !== 0) ||
    (selectedStar.orbitOffsetY !== undefined && selectedStar.orbitOffsetY !== 0) ||
    (selectedStar.orbitOffsetZ !== undefined && selectedStar.orbitOffsetZ !== 0) ||
    (selectedStar.orbitRotX !== undefined && selectedStar.orbitRotX !== 0) ||
    (selectedStar.orbitRotY !== undefined && selectedStar.orbitRotY !== 0) ||
    (selectedStar.orbitRotZ !== undefined && selectedStar.orbitRotZ !== 0)
  );
  
  const handleUpdate = (field: string, value: any) => {
    if (selectedStarId) {
      console.log(`[StarEditorPanel] Updating ${field} for ${selectedStarId}:`, value);
      updateStar(selectedStarId, { [field]: value });
      
      // Verify the update was applied
      setTimeout(() => {
        const updated = useSystemStore.getState().stars[selectedStarId];
        if (field === 'blackHole' && updated?.blackHole) {
          console.log('[StarEditorPanel] Verified blackHole update:', {
            diskBrightness: updated.blackHole.diskBrightness,
            diskOpacity: updated.blackHole.diskOpacity,
            dopplerBeamingStrength: updated.blackHole.dopplerBeamingStrength,
          });
        }
      }, 50);
    }
  };
  
  const handleDelete = () => {
    if (selectedStarId && confirm(`Delete ${selectedStar?.name}?`)) {
      removeStar(selectedStarId);
    }
  };
  
  const handleAddStar = () => {
    if (newStarForm.name.trim()) {
      addStar(newStarForm);
      setNewStarForm({
        name: '',
        mass: 10,
        radius: 1,
        color: '#4A90E2',
        parentId: null,
        orbitalDistance: 10,
        orbitalSpeed: 20,
        orbitalPhase: 0,
      });
      setShowAddForm(false);
    }
  };
  
  const handleSetParent = (parentId: string | null) => {
    if (selectedStarId) {
      if (parentId === null) {
        detachStar(selectedStarId);
      } else if (parentId !== selectedStar?.parentId) {
        attachStar(selectedStarId, parentId);
      }
    }
  };
  
  const handleViewFromHere = () => {
    if (selectedStarId) {
      setCameraMode('body', selectedStarId);
    }
  };
  
  const handleResetCamera = () => {
    resetCamera();
  };
  
  const handleOrbitModeChange = (mode: OrbitMode) => {
    setOrbitMode(mode);
    if (mode === 'simple' && selectedStar) {
      // Reset to simple circular orbit
      handleUpdate('eccentricity', 0);
      handleUpdate('orbitOffsetX', 0);
      handleUpdate('orbitOffsetY', 0);
      handleUpdate('orbitOffsetZ', 0);
      handleUpdate('orbitRotX', 0);
      handleUpdate('orbitRotY', 0);
      handleUpdate('orbitRotZ', 0);
    }
  };
  
  const isViewingFromThisStar = cameraMode === 'body' && cameraTargetBodyId === selectedStarId;
  
  return (
    <div className="star-editor-panel">
      <div className="editor-header">
        <h3>Star Editor</h3>
        <button 
          className="btn-add" 
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ Add Star'}
        </button>
      </div>
      
      {showAddForm && (
        <div className="add-form">
          <h4>Create New Star</h4>
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={newStarForm.name}
              onChange={(e) => setNewStarForm({ ...newStarForm, name: e.target.value })}
              placeholder="Star name"
            />
          </div>
          <div className="form-group">
            <label>Mass</label>
            <input
              type="number"
              value={newStarForm.mass}
              onChange={(e) => setNewStarForm({ ...newStarForm, mass: Number(e.target.value) })}
              min="0.1"
              step="0.1"
            />
          </div>
          <div className="form-group">
            <label>Radius</label>
            <input
              type="number"
              value={newStarForm.radius}
              onChange={(e) => setNewStarForm({ ...newStarForm, radius: Number(e.target.value) })}
              min="0.1"
              step="0.1"
            />
          </div>
          <div className="form-group">
            <label>Color</label>
            <input
              type="color"
              value={newStarForm.color}
              onChange={(e) => setNewStarForm({ ...newStarForm, color: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Parent Star (optional)</label>
            <select
              value={newStarForm.parentId || ''}
              onChange={(e) => setNewStarForm({ 
                ...newStarForm, 
                parentId: e.target.value || null 
              })}
            >
              <option value="">None (Root star)</option>
              {Object.values(stars).map((star) => (
                <option key={star.id} value={star.id}>
                  {star.name}
                </option>
              ))}
            </select>
          </div>
          {newStarForm.parentId && (
            <>
              <div className="form-group">
                <label>Orbital Distance</label>
                <input
                  type="number"
                  value={newStarForm.orbitalDistance}
                  onChange={(e) => setNewStarForm({ 
                    ...newStarForm, 
                    orbitalDistance: Number(e.target.value) 
                  })}
                  min="1"
                  step="1"
                />
              </div>
              <div className="form-group">
                <label>Orbital Speed (deg/sec)</label>
                <input
                  type="number"
                  value={newStarForm.orbitalSpeed}
                  onChange={(e) => setNewStarForm({ 
                    ...newStarForm, 
                    orbitalSpeed: Number(e.target.value) 
                  })}
                  min="0.1"
                  step="0.1"
                />
              </div>
              <div className="form-group">
                <label>Orbital Phase (degrees)</label>
                <input
                  type="number"
                  value={newStarForm.orbitalPhase}
                  onChange={(e) => setNewStarForm({ 
                    ...newStarForm, 
                    orbitalPhase: Number(e.target.value) 
                  })}
                  min="0"
                  max="360"
                  step="1"
                />
                <small>Phase offset for n-ary systems (0-360°)</small>
              </div>
            </>
          )}
          <button className="btn-primary" onClick={handleAddStar}>
            Create Star
          </button>
        </div>
      )}
      
      {selectedStar && !showAddForm && (
        <div className="edit-form">
          <h4>Editing: {selectedStar.name}</h4>
          
          {/* Camera View Controls */}
          <div className="form-group camera-controls">
            {isViewingFromThisStar ? (
              <button 
                className="btn-secondary" 
                onClick={handleResetCamera}
                style={{ width: '100%', marginBottom: '10px' }}
              >
                📷 Exit Body View
              </button>
            ) : (
              <button 
                className="btn-primary" 
                onClick={handleViewFromHere}
                style={{ width: '100%', marginBottom: '10px' }}
              >
                👁️ View from Here
              </button>
            )}
          </div>
          
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={selectedStar.name}
              onChange={(e) => handleUpdate('name', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>Mass</label>
            <input
              type="number"
              value={selectedStar.mass}
              onChange={(e) => handleUpdate('mass', Number(e.target.value))}
              min="0.1"
              step="0.1"
            />
          </div>
          
          <div className="form-group">
            <label>Radius</label>
            <input
              type="number"
              value={selectedStar.radius}
              onChange={(e) => handleUpdate('radius', Number(e.target.value))}
              min="0.1"
              step="0.1"
            />
          </div>
          
          <div className="form-group">
            <label>Color</label>
            <input
              type="color"
              value={selectedStar.color}
              onChange={(e) => handleUpdate('color', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>Parent Star</label>
            <select
              value={selectedStar.parentId || ''}
              onChange={(e) => handleSetParent(e.target.value || null)}
            >
              <option value="">None (Root star)</option>
              {Object.values(stars)
                .filter((s) => s.id !== selectedStarId)
                .map((star) => (
                  <option key={star.id} value={star.id}>
                    {star.name}
                  </option>
                ))}
            </select>
          </div>
          
          {selectedStar.parentId && (
            <>
              {/* Orbit Mode Toggle */}
              <div className="form-group orbit-mode-toggle">
                <label>Orbit Mode</label>
                <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                  <button 
                    className={`btn-toggle ${orbitMode === 'simple' ? 'active' : ''}`}
                    onClick={() => handleOrbitModeChange('simple')}
                    style={{ flex: 1 }}
                  >
                    Simple Circular
                  </button>
                  <button 
                    className={`btn-toggle ${orbitMode === 'advanced' ? 'active' : ''}`}
                    onClick={() => setOrbitMode('advanced')}
                    style={{ flex: 1 }}
                  >
                    Advanced Elliptical
                  </button>
                </div>
                {hasAdvancedOrbit && orbitMode === 'simple' && (
                  <small style={{ color: '#ff9800' }}>⚠ This orbit has advanced parameters. Switching to simple mode will reset them.</small>
                )}
              </div>
              
              {orbitMode === 'simple' ? (
                <>
                  {/* Simple Circular Orbit Controls */}
                  <div className="form-group">
                    <label>Orbital Distance</label>
                    <input
                      type="number"
                      value={selectedStar.orbitalDistance}
                      onChange={(e) => handleUpdate('orbitalDistance', Number(e.target.value))}
                      min="1"
                      step="1"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Orbital Speed (deg/sec)</label>
                    <input
                      type="number"
                      value={selectedStar.orbitalSpeed}
                      onChange={(e) => handleUpdate('orbitalSpeed', Number(e.target.value))}
                      min="0.1"
                      step="0.1"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Orbital Phase (degrees)</label>
                    <input
                      type="number"
                      value={selectedStar.orbitalPhase}
                      onChange={(e) => handleUpdate('orbitalPhase', Number(e.target.value))}
                      min="0"
                      max="360"
                      step="1"
                    />
                    <small>Phase offset for n-ary systems (0-360°)</small>
                  </div>
                </>
              ) : (
                <>
                  {/* Advanced Elliptical Orbit Controls */}
                  <div style={{ marginTop: '10px', padding: '10px', backgroundColor: 'rgba(74, 144, 226, 0.1)', borderRadius: '5px' }}>
                    <h5 style={{ marginTop: 0, marginBottom: '10px' }}>Orbit Shape</h5>
                    
                    <div className="form-group">
                      <label>Semi-Major Axis (a)</label>
                      <input
                        type="number"
                        value={selectedStar.semiMajorAxis ?? selectedStar.orbitalDistance}
                        onChange={(e) => handleUpdate('semiMajorAxis', Number(e.target.value))}
                        min="1"
                        step="1"
                      />
                      <small>Main orbital radius</small>
                    </div>
                    
                    <div className="form-group">
                      <label>Eccentricity (e)</label>
                      <input
                        type="number"
                        value={selectedStar.eccentricity ?? 0}
                        onChange={(e) => handleUpdate('eccentricity', Number(e.target.value))}
                        min="0"
                        max="0.99"
                        step="0.01"
                      />
                      <small>0 = circular, 0.99 = highly elliptical</small>
                    </div>
                    
                    <div className="form-group">
                      <label>Orbital Speed (deg/sec)</label>
                      <input
                        type="number"
                        value={selectedStar.orbitalSpeed}
                        onChange={(e) => handleUpdate('orbitalSpeed', Number(e.target.value))}
                        min="0.1"
                        step="0.1"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Orbital Phase (degrees)</label>
                      <input
                        type="number"
                        value={selectedStar.orbitalPhase}
                        onChange={(e) => handleUpdate('orbitalPhase', Number(e.target.value))}
                        min="0"
                        max="360"
                        step="1"
                      />
                    </div>
                  </div>
                  
                  <div style={{ marginTop: '10px', padding: '10px', backgroundColor: 'rgba(144, 74, 226, 0.1)', borderRadius: '5px' }}>
                    <h5 style={{ marginTop: 0, marginBottom: '10px' }}>Orbit Center Offset</h5>
                    
                    <div className="form-group">
                      <label>Offset X</label>
                      <input
                        type="number"
                        value={selectedStar.orbitOffsetX ?? 0}
                        onChange={(e) => handleUpdate('orbitOffsetX', Number(e.target.value))}
                        step="0.5"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Offset Y</label>
                      <input
                        type="number"
                        value={selectedStar.orbitOffsetY ?? 0}
                        onChange={(e) => handleUpdate('orbitOffsetY', Number(e.target.value))}
                        step="0.5"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Offset Z</label>
                      <input
                        type="number"
                        value={selectedStar.orbitOffsetZ ?? 0}
                        onChange={(e) => handleUpdate('orbitOffsetZ', Number(e.target.value))}
                        step="0.5"
                      />
                    </div>
                    <small>3D translation of ellipse center</small>
                  </div>
                  
                  <div style={{ marginTop: '10px', padding: '10px', backgroundColor: 'rgba(226, 144, 74, 0.1)', borderRadius: '5px' }}>
                    <h5 style={{ marginTop: 0, marginBottom: '10px' }}>Orbit Plane Rotation</h5>
                    
                    <div className="form-group">
                      <label>Rotation X (degrees)</label>
                      <input
                        type="number"
                        value={selectedStar.orbitRotX ?? 0}
                        onChange={(e) => handleUpdate('orbitRotX', Number(e.target.value))}
                        min="-180"
                        max="180"
                        step="1"
                      />
                      <small>Inclination-like tilt</small>
                    </div>
                    
                    <div className="form-group">
                      <label>Rotation Y (degrees)</label>
                      <input
                        type="number"
                        value={selectedStar.orbitRotY ?? 0}
                        onChange={(e) => handleUpdate('orbitRotY', Number(e.target.value))}
                        min="-180"
                        max="180"
                        step="1"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Rotation Z (degrees)</label>
                      <input
                        type="number"
                        value={selectedStar.orbitRotZ ?? 0}
                        onChange={(e) => handleUpdate('orbitRotZ', Number(e.target.value))}
                        min="-180"
                        max="180"
                        step="1"
                      />
                      <small>Ascending node-like rotation</small>
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {/* Rogue Planet Trajectory - only for rogue planets */}
          {selectedStar.isRoguePlanet && selectedStar.roguePlanet && (
            <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <h5 style={{ marginTop: 0, marginBottom: '8px' }}>Rogue Trajectory</h5>
              
              {/* Velocity Components */}
              <div className="form-group">
                <label>Velocity X</label>
                <input
                  type="number"
                  value={selectedStar.roguePlanet.velocity.x}
                  onChange={(e) => handleUpdate('roguePlanet', {
                    ...selectedStar.roguePlanet,
                    velocity: { ...selectedStar.roguePlanet.velocity, x: Number(e.target.value) }
                  })}
                  step="0.001"
                />
              </div>
              
              <div className="form-group">
                <label>Velocity Y</label>
                <input
                  type="number"
                  value={selectedStar.roguePlanet.velocity.y}
                  onChange={(e) => handleUpdate('roguePlanet', {
                    ...selectedStar.roguePlanet,
                    velocity: { ...selectedStar.roguePlanet.velocity, y: Number(e.target.value) }
                  })}
                  step="0.001"
                />
              </div>
              
              <div className="form-group">
                <label>Velocity Z</label>
                <input
                  type="number"
                  value={selectedStar.roguePlanet.velocity.z}
                  onChange={(e) => handleUpdate('roguePlanet', {
                    ...selectedStar.roguePlanet,
                    velocity: { ...selectedStar.roguePlanet.velocity, z: Number(e.target.value) }
                  })}
                  step="0.001"
                />
              </div>
              
              {/* Path Curvature */}
              <div className="form-group">
                <label>Path Curvature (0=linear, 1=curved)</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={selectedStar.roguePlanet.pathCurvature || 0}
                  onChange={(e) => handleUpdate('roguePlanet', {
                    ...selectedStar.roguePlanet,
                    pathCurvature: Number(e.target.value)
                  })}
                />
                <small>{((selectedStar.roguePlanet.pathCurvature || 0) * 100).toFixed(0)}%</small>
              </div>
              
              {/* Curved Path Parameters (only shown if curvature > 0) */}
              {(selectedStar.roguePlanet.pathCurvature || 0) > 0 && (
                <>
                  <div className="form-group">
                    <label>Semi-Major Axis</label>
                    <input
                      type="number"
                      value={selectedStar.roguePlanet.semiMajorAxis || 100}
                      onChange={(e) => handleUpdate('roguePlanet', {
                        ...selectedStar.roguePlanet,
                        semiMajorAxis: Number(e.target.value)
                      })}
                      min="10"
                      step="10"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Eccentricity (0-0.99)</label>
                    <input
                      type="number"
                      value={selectedStar.roguePlanet.eccentricity || 0}
                      onChange={(e) => handleUpdate('roguePlanet', {
                        ...selectedStar.roguePlanet,
                        eccentricity: Math.min(0.99, Math.max(0, Number(e.target.value)))
                      })}
                      min="0"
                      max="0.99"
                      step="0.01"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Inclination (X rotation, degrees)</label>
                    <input
                      type="number"
                      value={selectedStar.roguePlanet.orbitRotX || 0}
                      onChange={(e) => handleUpdate('roguePlanet', {
                        ...selectedStar.roguePlanet,
                        orbitRotX: Number(e.target.value)
                      })}
                      min="0"
                      max="90"
                      step="1"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Path Period (seconds)</label>
                    <input
                      type="number"
                      value={selectedStar.roguePlanet.pathPeriod || 500}
                      onChange={(e) => handleUpdate('roguePlanet', {
                        ...selectedStar.roguePlanet,
                        pathPeriod: Number(e.target.value)
                      })}
                      min="100"
                      step="50"
                    />
                  </div>
                </>
              )}
              
              {/* Trajectory Visualization */}
              <div className="form-group">
                <label className="generator-checkbox">
                  <input
                    type="checkbox"
                    checked={selectedStar.roguePlanet.showTrajectory ?? true}
                    onChange={(e) => handleUpdate('roguePlanet', {
                      ...selectedStar.roguePlanet,
                      showTrajectory: e.target.checked
                    })}
                  />
                  <span>Show Trajectory</span>
                </label>
              </div>
            </div>
          )}

          {/* Black Hole Properties - only for black holes */}
          {selectedStar.bodyType === 'blackHole' && selectedStar.blackHole && (
            <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <h5 style={{ marginTop: 0, marginBottom: '8px' }}>Black Hole Properties 🕳️</h5>
              
              {/* Core Presence Flags */}
              <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '4px' }}>
                <div className="form-group">
                  <label className="generator-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedStar.blackHole.hasAccretionDisk}
                      onChange={(e) => handleUpdate('blackHole', {
                        ...selectedStar.blackHole,
                        hasAccretionDisk: e.target.checked
                      })}
                    />
                    <span>Accretion Disk</span>
                  </label>
                </div>
                
                <div className="form-group">
                  <label className="generator-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedStar.blackHole.hasRelativisticJet}
                      onChange={(e) => handleUpdate('blackHole', {
                        ...selectedStar.blackHole,
                        hasRelativisticJet: e.target.checked
                      })}
                    />
                    <span>Relativistic Jets</span>
                  </label>
                </div>
                
                <div className="form-group">
                  <label className="generator-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedStar.blackHole.hasPhotonRing}
                      onChange={(e) => handleUpdate('blackHole', {
                        ...selectedStar.blackHole,
                        hasPhotonRing: e.target.checked
                      })}
                    />
                    <span>Photon Ring</span>
                  </label>
                </div>
              </div>
              
              {/* Geometry Section */}
              <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'rgba(74,144,226,0.1)', borderRadius: '4px' }}>
                <h6 style={{ marginTop: 0, marginBottom: '8px', fontSize: '0.9em' }}>Geometry</h6>
                
                <div className="form-group">
                  <label>Shadow Radius</label>
                  <input
                    type="number"
                    value={selectedStar.blackHole.shadowRadius}
                    onChange={(e) => handleUpdate('blackHole', {
                      ...selectedStar.blackHole,
                      shadowRadius: Number(e.target.value)
                    })}
                    min="0.1"
                    step="0.1"
                  />
                  <small>Event horizon visual size</small>
                </div>
                
                {selectedStar.blackHole.hasAccretionDisk && (
                  <>
                    <div className="form-group">
                      <label>Disk Inner Radius</label>
                      <input
                        type="number"
                        value={selectedStar.blackHole.accretionInnerRadius}
                        onChange={(e) => handleUpdate('blackHole', {
                          ...selectedStar.blackHole,
                          accretionInnerRadius: Math.max(selectedStar.blackHole.shadowRadius * 1.1, Number(e.target.value))
                        })}
                        min={selectedStar.blackHole.shadowRadius * 1.1}
                        step="0.1"
                      />
                      <small>Must be &gt; shadow radius</small>
                    </div>
                    
                    <div className="form-group">
                      <label>Disk Outer Radius</label>
                      <input
                        type="number"
                        value={selectedStar.blackHole.accretionOuterRadius}
                        onChange={(e) => handleUpdate('blackHole', {
                          ...selectedStar.blackHole,
                          accretionOuterRadius: Math.max(selectedStar.blackHole.accretionInnerRadius * 1.1, Number(e.target.value))
                        })}
                        min={selectedStar.blackHole.accretionInnerRadius * 1.1}
                        step="0.5"
                      />
                      <small>Must be &gt; inner radius</small>
                    </div>
                    
                    <div className="form-group">
                      <label>Disk Thickness</label>
                      <input
                        type="number"
                        value={selectedStar.blackHole.diskThickness}
                        onChange={(e) => handleUpdate('blackHole', {
                          ...selectedStar.blackHole,
                          diskThickness: Number(e.target.value)
                        })}
                        min="0"
                        step="0.05"
                      />
                    </div>
                  </>
                )}
              </div>
              
              {/* Accretion Disk Appearance */}
              {selectedStar.blackHole.hasAccretionDisk && (
                <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'rgba(226,144,74,0.1)', borderRadius: '4px' }}>
                  <h6 style={{ marginTop: 0, marginBottom: '8px', fontSize: '0.9em' }}>Accretion Disk Appearance</h6>
                  
                  <div className="form-group">
                    <label>Brightness (0-1)</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={selectedStar.blackHole.diskBrightness}
                      onChange={(e) => handleUpdate('blackHole', {
                        ...selectedStar.blackHole,
                        diskBrightness: Number(e.target.value)
                      })}
                    />
                    <small>{selectedStar.blackHole.diskBrightness.toFixed(2)}</small>
                  </div>
                  
                  <div className="form-group">
                    <label>Opacity (0-1)</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={selectedStar.blackHole.diskOpacity}
                      onChange={(e) => handleUpdate('blackHole', {
                        ...selectedStar.blackHole,
                        diskOpacity: Number(e.target.value)
                      })}
                    />
                    <small>{selectedStar.blackHole.diskOpacity.toFixed(2)}</small>
                  </div>
                  
                  <div className="form-group">
                    <label>Temperature (K)</label>
                    <input
                      type="number"
                      value={Math.round(selectedStar.blackHole.diskTemperature)}
                      onChange={(e) => handleUpdate('blackHole', {
                        ...selectedStar.blackHole,
                        diskTemperature: Number(e.target.value)
                      })}
                      min="1000"
                      max="50000"
                      step="1000"
                    />
                    <small>Color temperature gradient</small>
                  </div>
                  
                  <div className="form-group">
                    <label>Clumpiness (0-1)</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={selectedStar.blackHole.diskClumpiness}
                      onChange={(e) => handleUpdate('blackHole', {
                        ...selectedStar.blackHole,
                        diskClumpiness: Number(e.target.value)
                      })}
                    />
                    <small>{selectedStar.blackHole.diskClumpiness.toFixed(2)} - density variation</small>
                  </div>
                </div>
              )}
              
              {/* Jet Parameters */}
              {selectedStar.blackHole.hasRelativisticJet && (
                <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'rgba(144,226,74,0.1)', borderRadius: '4px' }}>
                  <h6 style={{ marginTop: 0, marginBottom: '8px', fontSize: '0.9em' }}>Relativistic Jets</h6>
                  
                  <div className="form-group">
                    <label>Jet Length</label>
                    <input
                      type="number"
                      value={selectedStar.blackHole.jetLength}
                      onChange={(e) => handleUpdate('blackHole', {
                        ...selectedStar.blackHole,
                        jetLength: Number(e.target.value)
                      })}
                      min="5"
                      step="5"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Jet Opening Angle (degrees)</label>
                    <input
                      type="number"
                      value={selectedStar.blackHole.jetOpeningAngle}
                      onChange={(e) => handleUpdate('blackHole', {
                        ...selectedStar.blackHole,
                        jetOpeningAngle: Number(e.target.value)
                      })}
                      min="1"
                      max="30"
                      step="0.5"
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Jet Brightness (0-1)</label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={selectedStar.blackHole.jetBrightness}
                      onChange={(e) => handleUpdate('blackHole', {
                        ...selectedStar.blackHole,
                        jetBrightness: Number(e.target.value)
                      })}
                    />
                    <small>{selectedStar.blackHole.jetBrightness.toFixed(2)}</small>
                  </div>
                </div>
              )}
              
              {/* Physical Parameters */}
              <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'rgba(226,74,144,0.1)', borderRadius: '4px' }}>
                <h6 style={{ marginTop: 0, marginBottom: '8px', fontSize: '0.9em' }}>Physical Parameters</h6>
                
                <div className="form-group">
                  <label>Spin Parameter (0-1)</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={selectedStar.blackHole.spin}
                    onChange={(e) => handleUpdate('blackHole', {
                      ...selectedStar.blackHole,
                      spin: Number(e.target.value)
                    })}
                  />
                  <small>{selectedStar.blackHole.spin.toFixed(2)} (0=Schwarzschild, 1=extremal Kerr)</small>
                </div>
              </div>
              
              {/* Relativistic Effects */}
              <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'rgba(144,74,226,0.1)', borderRadius: '4px' }}>
                <h6 style={{ marginTop: 0, marginBottom: '8px', fontSize: '0.9em' }}>Relativistic FX</h6>
                
                <div className="form-group">
                  <label>Doppler Beaming (0-1)</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={selectedStar.blackHole.dopplerBeamingStrength}
                    onChange={(e) => handleUpdate('blackHole', {
                      ...selectedStar.blackHole,
                      dopplerBeamingStrength: Number(e.target.value)
                    })}
                  />
                  <small>{selectedStar.blackHole.dopplerBeamingStrength.toFixed(2)}</small>
                </div>
                
                <div className="form-group">
                  <label>Lensing Strength (0-1)</label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={selectedStar.blackHole.lensingStrength}
                    onChange={(e) => handleUpdate('blackHole', {
                      ...selectedStar.blackHole,
                      lensingStrength: Number(e.target.value)
                    })}
                  />
                  <small>{selectedStar.blackHole.lensingStrength.toFixed(2)}</small>
                </div>
              </div>
              
              {/* Animation */}
              <div style={{ marginBottom: '12px', padding: '8px', backgroundColor: 'rgba(74,226,144,0.1)', borderRadius: '4px' }}>
                <h6 style={{ marginTop: 0, marginBottom: '8px', fontSize: '0.9em' }}>Animation</h6>
                
                <div className="form-group">
                  <label>Rotation Speed Multiplier</label>
                  <input
                    type="number"
                    value={selectedStar.blackHole.rotationSpeedMultiplier}
                    onChange={(e) => handleUpdate('blackHole', {
                      ...selectedStar.blackHole,
                      rotationSpeedMultiplier: Number(e.target.value)
                    })}
                    min="0.1"
                    max="3"
                    step="0.1"
                  />
                  <small>Disk rotation speed (scales with global time)</small>
                </div>
                
                <div className="form-group" style={{ marginTop: '8px' }}>
                  <label style={{ fontSize: '0.85em', color: '#aaa' }}>Seed: {selectedStar.blackHole.seed}</label>
                  <br />
                  <small style={{ fontSize: '0.75em' }}>Deterministic noise/variation</small>
                </div>
              </div>
            </div>
          )}

          {/* Planetary Rings - only for planets */}
          {selectedStar.bodyType === 'planet' && (
            <div style={{ marginTop: '15px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <h5 style={{ marginTop: 0, marginBottom: '8px' }}>Planetary Rings</h5>
              
              <div className="form-group">
                <label className="generator-checkbox">
                  <input
                    type="checkbox"
                    checked={!!selectedStar.ring}
                    onChange={(e) => {
                      if (e.target.checked) {
                        updateRing(selectedStar.id, {});
                      } else {
                        removeRing(selectedStar.id);
                      }
                    }}
                  />
                  <span>Has Rings</span>
                </label>
              </div>
              
              {selectedStar.ring && (
                <>
                  <div className="form-group">
                    <label>Inner Radius (× planet radius)</label>
                    <input
                      type="number"
                      value={selectedStar.ring.innerRadiusMultiplier}
                      min={1.1}
                      step={0.1}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        updateRing(selectedStar.id, {
                          innerRadiusMultiplier: value,
                          outerRadiusMultiplier: Math.max(
                            selectedStar.ring.outerRadiusMultiplier,
                            value + 0.1
                          ),
                        });
                      }}
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Outer Radius (× planet radius)</label>
                    <input
                      type="number"
                      value={selectedStar.ring.outerRadiusMultiplier}
                      min={
                        (selectedStar.ring.innerRadiusMultiplier ?? 1.5) + 0.1
                      }
                      step={0.1}
                      onChange={(e) =>
                        updateRing(selectedStar.id, {
                          outerRadiusMultiplier: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Ring Thickness</label>
                    <input
                      type="number"
                      value={selectedStar.ring.thickness}
                      min={0}
                      step={0.01}
                      onChange={(e) =>
                        updateRing(selectedStar.id, {
                          thickness: Number(e.target.value),
                        })
                      }
                    />
                    <small>Vertical half-height in world units</small>
                  </div>
                  
                  <div className="form-group">
                    <label>Opacity</label>
                    <input
                      type="number"
                      value={selectedStar.ring.opacity}
                      min={0}
                      max={1}
                      step={0.05}
                      onChange={(e) =>
                        updateRing(selectedStar.id, {
                          opacity: Number(e.target.value),
                        })
                      }
                    />
                  </div>
                  
                  <div className="form-group">
                    <label>Density</label>
                    <input
                      type="number"
                      value={selectedStar.ring.density}
                      min={0}
                      max={1}
                      step={0.05}
                      onChange={(e) =>
                        updateRing(selectedStar.id, {
                          density: Number(e.target.value),
                        })
                      }
                    />
                    <small>Visual indication of how solid the ring appears</small>
                  </div>
                  
                  <div className="form-group">
                    <label>Ring Color</label>
                    <input
                      type="color"
                      value={selectedStar.ring.color}
                      onChange={(e) =>
                        updateRing(selectedStar.id, {
                          color: e.target.value,
                        })
                      }
                    />
                  </div>
                </>
              )}
            </div>
          )}
          
          <button className="btn-danger" onClick={handleDelete}>
            Delete Star
          </button>
        </div>
      )}
      
      {!selectedStar && !showAddForm && (
        <div className="empty-state">
          Select a star to edit or create a new one
        </div>
      )}
    </div>
  );
};

