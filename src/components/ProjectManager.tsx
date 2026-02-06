import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getDatabase,
  projectRepo,
  workspaceRepo,
  type Project,
  type Workspace,
} from '@stridetime/core';
import './ProjectManager.css';

interface ProjectManagerProps {
  onProjectsChange?: () => void;
}

export function ProjectManager({ onProjectsChange }: ProjectManagerProps) {
  const { session } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState('');
  const [color, setColor] = useState('#3b82f6');

  useEffect(() => {
    loadData();
  }, [session]);

  const loadData = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const db = getDatabase();

      const [userProjects, userWorkspaces] = await Promise.all([
        projectRepo.findByUserId(db, session.user.id),
        workspaceRepo.findByOwner(db, session.user.id),
      ]);

      setProjects(userProjects);
      setWorkspaces(userWorkspaces);
      setError(null);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    if (!name.trim()) {
      setError('Project name is required');
      return;
    }

    if (!selectedWorkspaceId && !editingId) {
      setError('Please select a workspace');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const db = getDatabase();

      if (editingId) {
        // Update existing project
        await projectRepo.update(db, editingId, {
          name: name.trim(),
          description: description.trim() || null,
          color: color || null,
        });
      } else {
        // Create new project
        await projectRepo.create(db, {
          workspaceId: selectedWorkspaceId,
          userId: session.user.id,
          name: name.trim(),
          description: description.trim() || null,
          color: color || null,
          completionPercentage: 0,
        });
      }

      // Reset form and reload
      resetForm();
      await loadData();
      if (onProjectsChange) onProjectsChange();
    } catch (err) {
      console.error('Failed to save project:', err);
      setError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (project: Project) => {
    setEditingId(project.id);
    setName(project.name);
    setDescription(project.description || '');
    setColor(project.color || '#3b82f6');
    setSelectedWorkspaceId(project.workspaceId);
    setShowCreateForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this project? This will also delete all associated tasks.')) {
      return;
    }

    try {
      setLoading(true);
      const db = getDatabase();
      await projectRepo.delete(db, id);
      await loadData();
      if (onProjectsChange) onProjectsChange();
      setError(null);
    } catch (err) {
      console.error('Failed to delete project:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete project');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setColor('#3b82f6');
    setSelectedWorkspaceId('');
    setEditingId(null);
    setShowCreateForm(false);
  };

  const getWorkspaceName = (workspaceId: string) => {
    return workspaces.find(w => w.id === workspaceId)?.name || 'Unknown';
  };

  if (loading && projects.length === 0) {
    return <div className="project-manager-loading">Loading projects...</div>;
  }

  if (workspaces.length === 0) {
    return (
      <div className="project-manager-empty">
        <p>You need to create a workspace first before creating projects.</p>
      </div>
    );
  }

  return (
    <div className="project-manager-container">
      <div className="project-manager-header">
        <h2>Projects</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="create-project-btn"
        >
          {showCreateForm ? 'Cancel' : '+ New Project'}
        </button>
      </div>

      {error && <div className="project-error">{error}</div>}

      {showCreateForm && (
        <form onSubmit={handleSubmit} className="project-form">
          <div className="form-group">
            <label htmlFor="workspace">Workspace *</label>
            <select
              id="workspace"
              value={selectedWorkspaceId}
              onChange={(e) => setSelectedWorkspaceId(e.target.value)}
              required
              disabled={!!editingId}
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
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Saving...' : editingId ? 'Update Project' : 'Create Project'}
            </button>
            <button type="button" onClick={resetForm} className="cancel-btn" disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="project-list">
        {projects.length === 0 ? (
          <div className="empty-state">
            <p>No projects yet. Create your first project to get started!</p>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="project-item">
              <div className="project-color-bar" style={{ backgroundColor: project.color || '#6b7280' }}></div>
              <div className="project-content">
                <h3 className="project-name">{project.name}</h3>
                {project.description && (
                  <p className="project-description">{project.description}</p>
                )}
                <div className="project-meta">
                  <span className="project-workspace">
                    📁 {getWorkspaceName(project.workspaceId)}
                  </span>
                  <span className="project-completion">
                    {project.completionPercentage}% complete
                  </span>
                </div>
              </div>
              <div className="project-actions">
                <button
                  onClick={() => handleEdit(project)}
                  className="edit-btn"
                  disabled={loading}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(project.id)}
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

      <div className="project-summary">
        <p>{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
      </div>
    </div>
  );
}
