import React, { useState } from 'react';
import { useSystemStore } from '../state/systemStore';
import './StarEditorPanel.css';

export const StarEditorPanel: React.FC = () => {
  const selectedStarId = useSystemStore((state) => state.selectedStarId);
  const stars = useSystemStore((state) => state.stars);
  const updateStar = useSystemStore((state) => state.updateStar);
  const removeStar = useSystemStore((state) => state.removeStar);
  const addStar = useSystemStore((state) => state.addStar);
  const attachStar = useSystemStore((state) => state.attachStar);
  const detachStar = useSystemStore((state) => state.detachStar);
  const cameraMode = useSystemStore((state) => state.cameraMode);
  const cameraTargetBodyId = useSystemStore((state) => state.cameraTargetBodyId);
  const setCameraMode = useSystemStore((state) => state.setCameraMode);
  const resetCamera = useSystemStore((state) => state.resetCamera);
  
  const [showAddForm, setShowAddForm] = useState(false);
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
  
  const handleUpdate = (field: string, value: any) => {
    if (selectedStarId) {
      updateStar(selectedStarId, { [field]: value });
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

