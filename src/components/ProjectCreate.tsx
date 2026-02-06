import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getDatabase,
  projectRepo,
  workspaceRepo,
} from '@stridetime/core';
import type {
  Project,
  Workspace
} from "@stridetime/types";

import './ProjectCreate.css';

interface ProjectCreateProps {
  onProjectCreated?: (project: Project) => void;
  onCancel?: () => void;
}

export function ProjectCreate({ onProjectCreated, onCancel }: ProjectCreateProps) {
  const { session } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingWorkspaces, setLoadingWorkspaces] = useState(true);

  // Load workspaces on mount
  useEffect(() => {
    loadWorkspaces();
  }, []);

  const loadWorkspaces = async () => {
    if (!session?.user?.id) return;

    try {
      setLoadingWorkspaces(true);
      const db = getDatabase();
      const userWorkspaces = await workspaceRepo.findByOwner(db, session.user.id);
      setWorkspaces(userWorkspaces);

      // Auto-select first workspace if available
      if (userWorkspaces.length > 0 && !selectedWorkspaceId) {
        setSelectedWorkspaceId(userWorkspaces[0].id);
      }
    } catch (err) {
      console.error('Failed to load workspaces:', err);
      setError(err instanceof Error ? err.message : 'Failed to load workspaces');
    } finally {
      setLoadingWorkspaces(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    // Validation
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    if (!selectedWorkspaceId) {
      setError('Please select a workspace');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const db = getDatabase();

      const newProject = await projectRepo.create(db, {
        workspaceId: selectedWorkspaceId,
        userId: session.user.id,
        name: name.trim(),
        description: description.trim() || null,
        color: color || null,
        completionPercentage: 0,
      });

      // Reset form
      setName('');
      setDescription('');
      setColor('#3b82f6');

      // Notify parent
      if (onProjectCreated) {
        onProjectCreated(newProject);
      }
    } catch (err) {
      console.error('Failed to create project:', err);
      setError(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  if (loadingWorkspaces) {
    return <div className="project-create-loading">Loading workspaces...</div>;
  }

  if (workspaces.length === 0) {
    return (
      <div className="project-create-empty">
        <p>You need to create a workspace first before creating projects.</p>
        {onCancel && (
          <button onClick={onCancel} className="cancel-button">
            Back
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="project-create-container">
      <h3>Create New Project</h3>

      {error && <div className="project-error">{error}</div>}

      <form onSubmit={handleSubmit} className="project-create-form">
        <div className="form-group">
          <label htmlFor="workspace">Workspace *</label>
          <select
            id="workspace"
            value={selectedWorkspaceId}
            onChange={(e) => setSelectedWorkspaceId(e.target.value)}
            required
          >
            <option value="">Select a workspace</option>
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="name">Project Name *</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="e.g., Mobile App Redesign"
            maxLength={100}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this project about?"
            rows={3}
            maxLength={500}
          />
        </div>

        <div className="form-group">
          <label htmlFor="color">Color</label>
          <div className="color-input-group">
            <input
              id="color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />
            <span className="color-preview" style={{ backgroundColor: color }}></span>
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="submit-button">
            {loading ? 'Creating...' : 'Create Project'}
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
