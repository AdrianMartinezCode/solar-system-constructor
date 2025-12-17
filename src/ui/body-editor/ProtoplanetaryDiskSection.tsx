import React from 'react';
import type { Star, ProtoplanetaryDisk } from '../../types';
import { ProtoplanetaryDiskEditor } from '../ProtoplanetaryDiskEditor';

interface ProtoplanetaryDiskSectionProps {
  body: Star;
  protoplanetaryDisks: Record<string, ProtoplanetaryDisk>;
  onAddDisk: (starId: string) => void;
  onRemoveDisk: (diskId: string) => void;
  onUpdateDisk: (diskId: string, field: string, value: any) => void;
}

export const ProtoplanetaryDiskSection: React.FC<ProtoplanetaryDiskSectionProps> = ({
  body,
  protoplanetaryDisks,
  onAddDisk,
  onRemoveDisk,
  onUpdateDisk,
}) => {
  // Only show for root stars (no parent) that aren't black holes
  if (body.parentId || body.bodyType === 'blackHole') {
    return null;
  }
  
  // Find disk for this star
  const disk = Object.values(protoplanetaryDisks).find(
    d => d.centralStarId === body.id
  );
  
  return (
    <div>
      <h5 style={{ marginTop: 0, marginBottom: '10px' }}>💿 Protoplanetary Disk</h5>
      
      <div className="form-group">
        <label className="generator-checkbox">
          <input
            type="checkbox"
            checked={!!disk}
            onChange={(e) => {
              if (e.target.checked) {
                onAddDisk(body.id);
              } else if (disk) {
                onRemoveDisk(disk.id);
              }
            }}
          />
          <span>Has Protoplanetary Disk</span>
        </label>
        <small>Young circumstellar disk of gas and dust</small>
      </div>
      
      {disk && (
        <div style={{ marginTop: '10px' }}>
          <ProtoplanetaryDiskEditor
            disk={disk}
            onUpdate={(field, value) => {
              onUpdateDisk(disk.id, field, value);
            }}
            compact={true}
          />
        </div>
      )}
    </div>
  );
};

