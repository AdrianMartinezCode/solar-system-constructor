import React, { useState, useEffect } from 'react';
import { useSystemStore } from '../state/systemStore';
import { useWindowStore } from '../state/windowStore';
import { OrbitEditor } from './body-editor/OrbitEditor';
import { PlanetaryRingsEditor } from './body-editor/PlanetaryRingsEditor';
import { CometEditor } from './body-editor/CometEditor';
import { BlackHoleEditor } from './body-editor/BlackHoleEditor';
import { RoguePlanetEditor } from './body-editor/RoguePlanetEditor';
import { LagrangePointDisplay } from './body-editor/LagrangePointDisplay';
import { ProtoplanetaryDiskSection } from './body-editor/ProtoplanetaryDiskSection';
import './StarEditorPanel.css';

type EditorTab = 'basics' | 'orbit' | 'special' | 'advanced';

// Helper to get display name for body types
const getBodyTypeDisplay = (bodyType?: string): string => {
  switch (bodyType) {
    case 'star': return 'Star';
    case 'planet': return 'Planet';
    case 'moon': return 'Moon';
    case 'asteroid': return 'Asteroid';
    case 'comet': return 'Comet';
    case 'lagrangePoint': return 'Lagrange Point';
    case 'blackHole': return 'Black Hole';
    default: return 'Celestial Body';
  }
};

// Helper to get icon for body types
const getBodyTypeIcon = (bodyType?: string, isRogue?: boolean): string => {
  if (isRogue) return '🌌';
  switch (bodyType) {
    case 'star': return '⭐';
    case 'planet': return '🪐';
    case 'moon': return '🌙';
    case 'asteroid': return '🪨';
    case 'comet': return '☄️';
    case 'lagrangePoint': return '🔷';
    case 'blackHole': return '🕳️';
    default: return '🌟';
  }
};

export const BodyEditorPanel: React.FC = () => {
  const selectedStarId = useSystemStore((state) => state.selectedStarId);
  const selectedGroupId = useSystemStore((state) => state.selectedGroupId);
  const selectedNebulaId = useSystemStore((state) => state.selectedNebulaId);
  const selectedProtoplanetaryDiskId = useSystemStore((state) => state.selectedProtoplanetaryDiskId);
  const selectedSmallBodyFieldId = useSystemStore((state) => state.selectedSmallBodyFieldId);
  const selectedBeltId = useSystemStore((state) => state.selectedBeltId);
  
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
  const protoplanetaryDisks = useSystemStore((state) => state.protoplanetaryDisks);
  const addProtoplanetaryDisk = useSystemStore((state) => state.addProtoplanetaryDisk);
  const updateProtoplanetaryDisk = useSystemStore((state) => state.updateProtoplanetaryDisk);
  const removeProtoplanetaryDisk = useSystemStore((state) => state.removeProtoplanetaryDisk);
  
  const openWindow = useWindowStore((state) => state.openWindow);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>('basics');
  const [newStarForm, setNewStarForm] = useState({
    name: '',
    mass: 10,
    radius: 1,
    color: '#4A90E2',
    parentId: null as string | null,
    orbitalDistance: 10,
    orbitalSpeed: 20,
    orbitalPhase: 0,
    bodyType: 'planet' as const,
  });
  
  const selectedStar = selectedStarId ? stars[selectedStarId] : null;
  
  // Reset to basics tab when selection changes
  useEffect(() => {
    setActiveTab('basics');
  }, [selectedStarId]);
  
  const handleUpdate = (field: string, value: any) => {
    if (selectedStarId) {
      updateStar(selectedStarId, { [field]: value });
    }
  };
  
  const handleDelete = () => {
    if (selectedStarId && confirm(`Delete ${selectedStar?.name}? This will also delete all children.`)) {
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
        bodyType: 'planet',
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
  
  const isViewingFromThisBody = cameraMode === 'body' && cameraTargetBodyId === selectedStarId;
  
  // Determine if we have a wrong selection type
  const hasWrongSelection = !selectedStarId && (
    selectedGroupId || selectedNebulaId || selectedProtoplanetaryDiskId || 
    selectedSmallBodyFieldId || selectedBeltId
  );
  
  // Handle non-star selections
  if (hasWrongSelection) {
    let selectionType = '';
    let editorType = '';
    
    if (selectedGroupId) {
      selectionType = 'Group';
      editorType = 'groupEditor';
    } else if (selectedNebulaId) {
      selectionType = 'Nebula';
      editorType = 'nebulaEditor';
    } else if (selectedProtoplanetaryDiskId) {
      selectionType = 'Protoplanetary Disk';
      editorType = 'overview';
    } else if (selectedSmallBodyFieldId) {
      selectionType = 'Small Body Field';
      editorType = 'overview';
    } else if (selectedBeltId) {
      selectionType = 'Belt';
      editorType = 'overview';
    }
    
    return (
      <div className="star-editor-panel">
        <div className="editor-header">
          <h3>Body Inspector</h3>
        </div>
        
        <div style={{
          padding: '2rem 1rem',
          textAlign: 'center',
          backgroundColor: 'rgba(255,152,0,0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(255,152,0,0.3)',
          margin: '1rem 0'
        }}>
          <p style={{ margin: '0 0 1rem 0', fontSize: '2rem' }}>ℹ️</p>
          <p style={{ margin: '0 0 0.5rem 0', color: 'rgba(255,255,255,0.9)' }}>
            <strong>{selectionType} Selected</strong>
          </p>
          <p style={{ margin: '0 0 1rem 0', color: 'rgba(255,255,255,0.7)', fontSize: '0.9em' }}>
            This editor is for celestial bodies (stars, planets, moons, comets, etc.).
            {editorType && (
              <>
                <br />To edit the selected {selectionType.toLowerCase()}, please use the appropriate editor.
              </>
            )}
          </p>
          
          {editorType && (
            <button
              className="btn-primary"
              onClick={() => {
                if (editorType === 'groupEditor') {
                  openWindow('groupEditor');
                } else if (editorType === 'nebulaEditor' && selectedNebulaId) {
                  openWindow('nebulaEditor', { nebulaId: selectedNebulaId });
                } else {
                  openWindow(editorType as any);
                }
              }}
              style={{ marginTop: '0.5rem' }}
            >
              Open {selectionType} Editor
            </button>
          )}
        </div>
        
        <div style={{ padding: '1rem', color: 'rgba(255,255,255,0.6)', fontSize: '0.85em', textAlign: 'center' }}>
          Select a celestial body from the hierarchy or viewport to edit it here.
        </div>
      </div>
    );
  }
  
  return (
    <div className="star-editor-panel">
      <div className="editor-header">
        <h3>Body Inspector</h3>
        <button 
          className="btn-add" 
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ Add Body'}
        </button>
      </div>
      
      {showAddForm && (
        <div className="add-form">
          <h4>Create New Body</h4>
          
          <div className="form-group">
            <label>Body Type</label>
            <select
              value={newStarForm.bodyType}
              onChange={(e) => setNewStarForm({ 
                ...newStarForm, 
                bodyType: e.target.value as any
              })}
            >
              <option value="star">Star</option>
              <option value="planet">Planet</option>
              <option value="moon">Moon</option>
              <option value="asteroid">Asteroid</option>
              <option value="comet">Comet</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Name</label>
            <input
              type="text"
              value={newStarForm.name}
              onChange={(e) => setNewStarForm({ ...newStarForm, name: e.target.value })}
              placeholder="Body name"
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
            <label>Parent Body (optional)</label>
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
                  {star.name} ({getBodyTypeDisplay(star.bodyType)})
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
            Create {getBodyTypeDisplay(newStarForm.bodyType)}
          </button>
        </div>
      )}
      
      {selectedStar && !showAddForm && (
        <div className="edit-form">
          {/* Header with name, icon, and type badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '15px' }}>
            <span style={{ fontSize: '2rem' }}>
              {getBodyTypeIcon(selectedStar.bodyType, selectedStar.isRoguePlanet)}
            </span>
            <div style={{ flex: 1 }}>
              <h4 style={{ margin: '0 0 4px 0' }}>{selectedStar.name}</h4>
              <div style={{ 
                display: 'inline-block',
                padding: '2px 8px',
                backgroundColor: 'rgba(74,144,226,0.2)',
                borderRadius: '4px',
                fontSize: '0.75em',
                color: '#4A90E2',
                border: '1px solid rgba(74,144,226,0.3)'
              }}>
                {getBodyTypeDisplay(selectedStar.bodyType)}
                {selectedStar.isRoguePlanet && ' (Rogue)'}
              </div>
            </div>
          </div>
          
          {/* Camera View Controls */}
          <div className="form-group camera-controls">
            {isViewingFromThisBody ? (
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
          
          {/* Tab Navigation */}
          <div style={{ 
            display: 'flex', 
            gap: '5px', 
            marginBottom: '15px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            paddingBottom: '5px'
          }}>
            <button
              className={`btn-toggle ${activeTab === 'basics' ? 'active' : ''}`}
              onClick={() => setActiveTab('basics')}
              style={{ flex: 1, fontSize: '0.8em' }}
            >
              Basics
            </button>
            
            {selectedStar.parentId && !selectedStar.isRoguePlanet && (
              <button
                className={`btn-toggle ${activeTab === 'orbit' ? 'active' : ''}`}
                onClick={() => setActiveTab('orbit')}
                style={{ flex: 1, fontSize: '0.8em' }}
              >
                Orbit
              </button>
            )}
            
            <button
              className={`btn-toggle ${activeTab === 'special' ? 'active' : ''}`}
              onClick={() => setActiveTab('special')}
              style={{ flex: 1, fontSize: '0.8em' }}
            >
              Special
            </button>
            
            <button
              className={`btn-toggle ${activeTab === 'advanced' ? 'active' : ''}`}
              onClick={() => setActiveTab('advanced')}
              style={{ flex: 1, fontSize: '0.8em' }}
            >
              Advanced
            </button>
          </div>
          
          {/* Tab Content */}
          {activeTab === 'basics' && (
            <div>
              <div className="form-group">
                <label>Name</label>
                <input
                  type="text"
                  value={selectedStar.name}
                  onChange={(e) => handleUpdate('name', e.target.value)}
                />
              </div>
              
              <div className="form-group">
                <label>Body Type</label>
                <input
                  type="text"
                  value={getBodyTypeDisplay(selectedStar.bodyType)}
                  disabled
                  readOnly
                  style={{ backgroundColor: 'rgba(0,0,0,0.3)', cursor: 'not-allowed' }}
                />
                <small>Body type cannot be changed after creation</small>
              </div>
              
              <div className="form-group">
                <label>ID</label>
                <input
                  type="text"
                  value={selectedStar.id}
                  disabled
                  readOnly
                  style={{ 
                    backgroundColor: 'rgba(0,0,0,0.3)', 
                    fontSize: '0.75em',
                    fontFamily: 'monospace',
                    cursor: 'not-allowed'
                  }}
                />
              </div>
              
              <div className="form-group">
                <label>Parent Body</label>
                <select
                  value={selectedStar.parentId || ''}
                  onChange={(e) => handleSetParent(e.target.value || null)}
                >
                  <option value="">None (Root star)</option>
                  {Object.values(stars)
                    .filter((s) => s.id !== selectedStarId)
                    .map((star) => (
                      <option key={star.id} value={star.id}>
                        {star.name} ({getBodyTypeDisplay(star.bodyType)})
                      </option>
                    ))}
                </select>
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
            </div>
          )}
          
          {activeTab === 'orbit' && (
            <div>
              <OrbitEditor body={selectedStar} onUpdate={handleUpdate} />
            </div>
          )}
          
          {activeTab === 'special' && (
            <div>
              {/* Planetary Rings */}
              <PlanetaryRingsEditor
                body={selectedStar}
                onUpdateRing={(patch) => updateRing(selectedStar.id, patch)}
                onRemoveRing={() => removeRing(selectedStar.id)}
              />
              
              {/* Comet Properties */}
              <CometEditor body={selectedStar} onUpdate={handleUpdate} />
              
              {/* Black Hole Properties */}
              <BlackHoleEditor body={selectedStar} onUpdate={handleUpdate} />
              
              {/* Rogue Planet Trajectory */}
              <RoguePlanetEditor body={selectedStar} onUpdate={handleUpdate} />
              
              {/* Lagrange Point Display */}
              <LagrangePointDisplay body={selectedStar} stars={stars} />
              
              {/* Protoplanetary Disk (for root stars) */}
              <ProtoplanetaryDiskSection
                body={selectedStar}
                protoplanetaryDisks={protoplanetaryDisks}
                onAddDisk={addProtoplanetaryDisk}
                onRemoveDisk={removeProtoplanetaryDisk}
                onUpdateDisk={updateProtoplanetaryDisk}
              />
              
              {/* Show message if no special features apply */}
              {!selectedStar.ring && 
               selectedStar.bodyType !== 'planet' &&
               selectedStar.bodyType !== 'comet' && 
               selectedStar.bodyType !== 'blackHole' && 
               !selectedStar.isRoguePlanet &&
               selectedStar.bodyType !== 'lagrangePoint' &&
               (selectedStar.parentId || selectedStar.bodyType === 'blackHole') && (
                <div style={{ 
                  padding: '2rem 1rem', 
                  textAlign: 'center',
                  color: 'rgba(255,255,255,0.5)',
                  fontStyle: 'italic'
                }}>
                  No special features available for this body type.
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'advanced' && (
            <div>
              <h5 style={{ marginTop: 0, marginBottom: '10px' }}>Debug Information</h5>
              
              <div style={{ 
                padding: '10px', 
                backgroundColor: 'rgba(0,0,0,0.3)', 
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '0.8em',
                maxHeight: '400px',
                overflowY: 'auto'
              }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                  {JSON.stringify(selectedStar, null, 2)}
                </pre>
              </div>
            </div>
          )}
          
          <button className="btn-danger" onClick={handleDelete}>
            Delete {getBodyTypeDisplay(selectedStar.bodyType)}
          </button>
        </div>
      )}
      
      {!selectedStar && !showAddForm && (
        <div className="empty-state">
          Select a celestial body to inspect or create a new one
        </div>
      )}
    </div>
  );
};

