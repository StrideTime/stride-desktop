import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getDatabase,
  workspaceRepo,
  WorkspaceType,
  type Workspace,
} from '@stridetime/core';
import './WorkspaceManager.css';

interface WorkspaceManagerProps {
  onWorkspacesChange?: () => void;
}

export function WorkspaceManager({ onWorkspacesChange }: WorkspaceManagerProps) {
  const { session } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<string>(WorkspaceType.PERSONAL);

  useEffect(() => {
    loadWorkspaces();
  }, [session]);

  const loadWorkspaces = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const db = getDatabase();
      const userWorkspaces = await workspaceRepo.findByOwner(db, session.user.id);
      setWorkspaces(userWorkspaces);
      setError(null);
    } catch (err) {
      console.error('Failed to load workspaces:', err);
      setError(err instanceof Error ? err.message : 'Failed to load workspaces');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    if (!name.trim()) {
      setError('Workspace name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const db = getDatabase();

      if (editingId) {
        // Update existing workspace
        await workspaceRepo.update(db, editingId, {
          name: name.trim(),
          type: type as typeof WorkspaceType[keyof typeof WorkspaceType],
        });
      } else {
        // Create new workspace
        await workspaceRepo.create(db, {
          ownerUserId: session.user.id,
          name: name.trim(),
          type: type as typeof WorkspaceType[keyof typeof WorkspaceType],
        });
      }

      // Reset form and reload
      resetForm();
      await loadWorkspaces();
      if (onWorkspacesChange) onWorkspacesChange();
    } catch (err) {
      console.error('Failed to save workspace:', err);
      setError(err instanceof Error ? err.message : 'Failed to save workspace');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (workspace: Workspace) => {
    setEditingId(workspace.id);
    setName(workspace.name);
    setType(workspace.type);
    setShowCreateForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this workspace? This will also delete all associated projects and tasks.')) {
      return;
    }

    try {
      setLoading(true);
      const db = getDatabase();
      await workspaceRepo.delete(db, id);
      await loadWorkspaces();
      if (onWorkspacesChange) onWorkspacesChange();
      setError(null);
    } catch (err) {
      console.error('Failed to delete workspace:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete workspace');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setType(WorkspaceType.PERSONAL);
    setEditingId(null);
    setShowCreateForm(false);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case WorkspaceType.PERSONAL: return 'Personal';
      case WorkspaceType.WORK: return 'Work';
      case WorkspaceType.TEAM: return 'Team';
      default: return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case WorkspaceType.PERSONAL: return '#8b5cf6';
      case WorkspaceType.WORK: return '#3b82f6';
      case WorkspaceType.TEAM: return '#10b981';
      default: return '#6b7280';
    }
  };

  if (loading && workspaces.length === 0) {
    return <div className="workspace-manager-loading">Loading workspaces...</div>;
  }

  return (
    <div className="workspace-manager-container">
      <div className="workspace-manager-header">
        <h2>Workspaces</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="create-workspace-btn"
        >
          {showCreateForm ? 'Cancel' : '+ New Workspace'}
        </button>
      </div>

      {error && <div className="workspace-error">{error}</div>}

      {showCreateForm && (
        <form onSubmit={handleSubmit} className="workspace-form">
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
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Saving...' : editingId ? 'Update Workspace' : 'Create Workspace'}
            </button>
            <button type="button" onClick={resetForm} className="cancel-btn" disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="workspace-list">
        {workspaces.length === 0 ? (
          <div className="empty-state">
            <p>No workspaces yet. Create your first workspace to get started!</p>
          </div>
        ) : (
          workspaces.map((workspace) => (
            <div key={workspace.id} className="workspace-item">
              <div className="workspace-content">
                <h3 className="workspace-name">{workspace.name}</h3>
                <span
                  className="workspace-type-badge"
                  style={{ backgroundColor: getTypeColor(workspace.type) }}
                >
                  {getTypeLabel(workspace.type)}
                </span>
              </div>
              <div className="workspace-actions">
                <button
                  onClick={() => handleEdit(workspace)}
                  className="edit-btn"
                  disabled={loading}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(workspace.id)}
                  className="delete-btn"
                  disabled={loading}
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="workspace-summary">
        <p>{workspaces.length} workspace{workspaces.length !== 1 ? 's' : ''}</p>
      </div>
    </div>
  );
}
