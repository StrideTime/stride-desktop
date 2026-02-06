import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getDatabase,
  workspaceRepo,
  WorkspaceType,
  type Workspace,
} from '@stridetime/core';
import './WorkspaceCreate.css';

interface WorkspaceCreateProps {
  onWorkspaceCreated?: (workspace: Workspace) => void;
  onCancel?: () => void;
}

export function WorkspaceCreate({ onWorkspaceCreated, onCancel }: WorkspaceCreateProps) {
  const { session } = useAuth();
  const [name, setName] = useState('');
  const [type, setType] = useState<string>(WorkspaceType.PERSONAL);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    // Validation
    if (!name.trim()) {
      setError('Workspace name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const db = getDatabase();

      const newWorkspace = await workspaceRepo.create(db, {
        ownerUserId: session.user.id,
        name: name.trim(),
        type: type as typeof WorkspaceType[keyof typeof WorkspaceType],
      });

      // Reset form
      setName('');
      setType(WorkspaceType.PERSONAL);

      // Notify parent
      if (onWorkspaceCreated) {
        onWorkspaceCreated(newWorkspace);
      }
    } catch (err) {
      console.error('Failed to create workspace:', err);
      setError(err instanceof Error ? err.message : 'Failed to create workspace');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="workspace-create-container">
      <h3>Create New Workspace</h3>

      {error && <div className="workspace-error">{error}</div>}

      <form onSubmit={handleSubmit} className="workspace-create-form">
        <div className="form-group">
          <label htmlFor="name">Workspace Name *</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g., My Personal Workspace"
            maxLength={100}
          />
        </div>

        <div className="form-group">
          <label htmlFor="type">Workspace Type *</label>
          <select
            id="type"
            value={type}
            onChange={(e) => setType(e.target.value)}
            required
          >
            <option value={WorkspaceType.PERSONAL}>Personal</option>
            <option value={WorkspaceType.WORK}>Work</option>
            <option value={WorkspaceType.TEAM}>Team</option>
          </select>
          <p className="field-hint">
            {type === WorkspaceType.PERSONAL && 'For your personal projects and tasks'}
            {type === WorkspaceType.WORK && 'For professional work-related activities'}
            {type === WorkspaceType.TEAM && 'For collaborative team projects'}
          </p>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Creating...' : 'Create Workspace'}
          </button>
          {onCancel && (
            <button type="button" onClick={onCancel} className="cancel-button" disabled={loading}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
