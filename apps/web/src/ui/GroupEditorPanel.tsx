import React, { useState } from 'react';
import { useSystemStore } from '../state/systemStore';
import { useUiStore } from '../state/uiStore';
import type { GroupChild } from '../types';
import './GroupEditorPanel.css';

export const GroupEditorPanel: React.FC = () => {
  const selectedGroupId = useSystemStore((state) => state.selectedGroupId);
  const groups = useSystemStore((state) => state.groups);
  const rootIds = useSystemStore((state) => state.rootIds);
  const stars = useSystemStore((state) => state.stars);
  const isolatedGroupId = useUiStore((state) => state.isolatedGroupId);
  const updateGroup = useSystemStore((state) => state.updateGroup);
  const removeGroup = useSystemStore((state) => state.removeGroup);
  const addGroup = useSystemStore((state) => state.addGroup);
  const addToGroup = useSystemStore((state) => state.addToGroup);
  const removeFromGroup = useSystemStore((state) => state.removeFromGroup);
  const moveToGroup = useSystemStore((state) => state.moveToGroup);
  const toggleIsolatedGroup = useUiStore((state) => state.toggleIsolatedGroup);
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [newGroupForm, setNewGroupForm] = useState({
    name: '',
    color: '#8B5CF6',
    parentGroupId: null as string | null,
  });
  
  const selectedGroup = selectedGroupId ? groups[selectedGroupId] : null;
  
  const handleUpdate = (field: string, value: any) => {
    if (selectedGroupId) {
      updateGroup(selectedGroupId, { [field]: value });
    }
  };
  
  const handleDelete = () => {
    if (selectedGroupId && confirm(`Delete group "${selectedGroup?.name}"?`)) {
      removeGroup(selectedGroupId);
    }
  };
  
  const handleAddGroup = () => {
    if (newGroupForm.name.trim()) {
      addGroup({
        name: newGroupForm.name,
        color: newGroupForm.color,
        children: [],
        parentGroupId: newGroupForm.parentGroupId,
      });
      setNewGroupForm({
        name: '',
        color: '#8B5CF6',
        parentGroupId: null,
      });
      setShowAddForm(false);
    }
  };
  
  const handleAddChildToGroup = (childId: string, childType: 'system' | 'group') => {
    if (selectedGroupId) {
      addToGroup(selectedGroupId, { id: childId, type: childType });
    }
  };
  
  const handleRemoveChild = (childId: string) => {
    if (selectedGroupId) {
      removeFromGroup(selectedGroupId, childId);
    }
  };
  
  const handleMoveChild = (childId: string, childType: 'system' | 'group', targetGroupId: string | null) => {
    moveToGroup(childId, childType, targetGroupId);
  };
  
  const handleToggleIsolation = () => {
    if (selectedGroupId) {
      toggleIsolatedGroup(selectedGroupId);
    }
  };
  
  // Get available systems (root systems not in any group)
  const availableSystems = rootIds.filter(id => {
    return !Object.values(groups).some(g =>
      g.children.some((c: GroupChild) => c.type === 'system' && c.id === id)
    );
  });
  
  // Get available groups (excluding the selected group and its descendants)
  const availableGroups = Object.values(groups).filter(g => {
    if (!selectedGroupId) return true;
    if (g.id === selectedGroupId) return false;
    // Check if g is a descendant of selectedGroup
    let current = g;
    while (current.parentGroupId) {
      if (current.parentGroupId === selectedGroupId) return false;
      current = groups[current.parentGroupId];
      if (!current) break;
    }
    return true;
  });
  
  return (
    <div className="group-editor-panel">
      <div className="editor-header">
        <h3>Group Editor</h3>
        <button 
          className="btn-add-group" 
          onClick={() => setShowAddForm(!showAddForm)}
        >
          {showAddForm ? 'Cancel' : '+ Add Group'}
        </button>
      </div>
      
      {showAddForm && (
        <div className="add-form">
          <h4>Create New Group</h4>
          <div className="form-group">
            <label>Group Name</label>
            <input
              type="text"
              value={newGroupForm.name}
              onChange={(e) => setNewGroupForm({ ...newGroupForm, name: e.target.value })}
              placeholder="e.g., Milky Way, Local Group"
            />
          </div>
          <div className="form-group">
            <label>Color</label>
            <input
              type="color"
              value={newGroupForm.color}
              onChange={(e) => setNewGroupForm({ ...newGroupForm, color: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label>Parent Group (optional)</label>
            <select
              value={newGroupForm.parentGroupId || ''}
              onChange={(e) => setNewGroupForm({ 
                ...newGroupForm, 
                parentGroupId: e.target.value || null 
              })}
            >
              <option value="">None (Top-level group)</option>
              {Object.values(groups).map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-primary" onClick={handleAddGroup}>
            Create Group
          </button>
        </div>
      )}
      
      {selectedGroup && !showAddForm && (
        <div className="edit-form">
          <h4>Editing: {selectedGroup.name}</h4>
          
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={isolatedGroupId === selectedGroupId}
                onChange={handleToggleIsolation}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontWeight: 500 }}>Solo in viewport (show only this group)</span>
            </label>
            <small style={{ color: '#888', marginLeft: '1.5rem', display: 'block', marginTop: '0.25rem' }}>
              When enabled, only systems in this group are visible in the 3D scene
            </small>
          </div>
          
          <div className="form-group">
            <label>Group Name</label>
            <input
              type="text"
              value={selectedGroup.name}
              onChange={(e) => handleUpdate('name', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>Color</label>
            <input
              type="color"
              value={selectedGroup.color || '#8B5CF6'}
              onChange={(e) => handleUpdate('color', e.target.value)}
            />
          </div>
          
          <div className="form-group">
            <label>Parent Group</label>
            <select
              value={selectedGroup.parentGroupId || ''}
              onChange={(e) => handleMoveChild(selectedGroupId!, 'group', e.target.value || null)}
            >
              <option value="">None (Top-level group)</option>
              {availableGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="children-section">
            <label>Group Contents ({selectedGroup.children.length} items)</label>
            <div className="children-list">
              {selectedGroup.children.map((child: GroupChild) => {
                const name = child.type === 'system' 
                  ? stars[child.id]?.name || 'Unknown System'
                  : groups[child.id]?.name || 'Unknown Group';
                const icon = child.type === 'system' ? '⭐' : '📁';
                
                return (
                  <div key={`${child.type}-${child.id}`} className="child-item">
                    <span>{icon} {name}</span>
                    <button 
                      className="btn-remove-child"
                      onClick={() => handleRemoveChild(child.id)}
                      title="Remove from group"
                    >
                      ✕
                    </button>
                  </div>
                );
              })}
              {selectedGroup.children.length === 0 && (
                <div className="empty-children">No items in this group</div>
              )}
            </div>
          </div>
          
          {(availableSystems.length > 0 || availableGroups.length > 0) && (
            <div className="add-children-section">
              <label>Add to Group</label>
              {availableSystems.length > 0 && (
                <div className="available-section">
                  <small>Available Systems:</small>
                  {availableSystems.map((sysId) => {
                    const sys = stars[sysId];
                    if (!sys) return null;
                    return (
                      <button
                        key={sysId}
                        className="btn-add-child"
                        onClick={() => handleAddChildToGroup(sysId, 'system')}
                      >
                        + ⭐ {sys.name}
                      </button>
                    );
                  })}
                </div>
              )}
              {availableGroups.filter(g => g.id !== selectedGroupId && !g.parentGroupId).length > 0 && (
                <div className="available-section">
                  <small>Available Groups:</small>
                  {availableGroups
                    .filter(g => g.id !== selectedGroupId && !g.parentGroupId)
                    .map((grp) => (
                      <button
                        key={grp.id}
                        className="btn-add-child"
                        onClick={() => handleAddChildToGroup(grp.id, 'group')}
                      >
                        + 📁 {grp.name}
                      </button>
                    ))}
                </div>
              )}
            </div>
          )}
          
          <button className="btn-danger" onClick={handleDelete}>
            Delete Group
          </button>
        </div>
      )}
      
      {!selectedGroup && !showAddForm && (
        <div className="empty-state">
          Select a group to edit or create a new one
        </div>
      )}
    </div>
  );
};

