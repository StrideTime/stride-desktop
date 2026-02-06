import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getDatabase,
  taskService,
  projectRepo,
} from '@stridetime/core';

import {
  TaskDifficulty,
  TaskStatus,
  type Task,
  type Project
} from "@stridetime/types";

import './TaskManager.css';

interface TaskManagerProps {
  onTasksChange?: () => void;
}

export function TaskManager({ onTasksChange }: TaskManagerProps) {
  const { session } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [difficulty, setDifficulty] = useState<string>(TaskDifficulty.MEDIUM);
  const [status, setStatus] = useState<string>(TaskStatus.BACKLOG);
  const [estimatedMinutes, setEstimatedMinutes] = useState('');
  const [maxMinutes, setMaxMinutes] = useState('');
  const [plannedForDate, setPlannedForDate] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    loadData();
  }, [session]);

  const loadData = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const db = getDatabase();

      const [userTasks, userProjects] = await Promise.all([
        taskService.findByUser(db, session.user.id),
        projectRepo.findByUserId(db, session.user.id),
      ]);

      setTasks(userTasks);
      setProjects(userProjects);
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

    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    if (!selectedProjectId && !editingId) {
      setError('Please select a project');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const db = getDatabase();

      if (editingId) {
        // Update existing task
        await taskService.update(db, editingId, {
          title: title.trim(),
          description: description.trim() || null,
          status: status as typeof TaskStatus[keyof typeof TaskStatus],
          estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : null,
          maxMinutes: maxMinutes ? parseInt(maxMinutes) : null,
          plannedForDate: plannedForDate || null,
          dueDate: dueDate || null,
        });
      } else {
        // Create new task
        await taskService.create(db, {
          title: title.trim(),
          projectId: selectedProjectId,
          userId: session.user.id,
          description: description.trim() || undefined,
          difficulty: difficulty as typeof TaskDifficulty[keyof typeof TaskDifficulty],
          estimatedMinutes: estimatedMinutes ? parseInt(estimatedMinutes) : undefined,
          maxMinutes: maxMinutes ? parseInt(maxMinutes) : undefined,
          plannedForDate: plannedForDate || undefined,
          dueDate: dueDate || undefined,
        });
      }

      // Reset form and reload
      resetForm();
      await loadData();
      if (onTasksChange) onTasksChange();
    } catch (err) {
      console.error('Failed to save task:', err);
      setError(err instanceof Error ? err.message : 'Failed to save task');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingId(task.id);
    setTitle(task.title);
    setDescription(task.description || '');
    setSelectedProjectId(task.projectId);
    setDifficulty(task.difficulty);
    setStatus(task.status);
    setEstimatedMinutes(task.estimatedMinutes?.toString() || '');
    setMaxMinutes(task.maxMinutes?.toString() || '');
    setPlannedForDate(task.plannedForDate || '');
    setDueDate(task.dueDate || '');
    setShowCreateForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      setLoading(true);
      const db = getDatabase();
      await taskService.delete(db, id);
      await loadData();
      if (onTasksChange) onTasksChange();
      setError(null);
    } catch (err) {
      console.error('Failed to delete task:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (task: Task) => {
    try {
      const db = getDatabase();
      const newStatus = task.status === TaskStatus.COMPLETED ? TaskStatus.IN_PROGRESS : TaskStatus.COMPLETED;
      await taskService.update(db, task.id, { status: newStatus });
      await loadData();
      if (onTasksChange) onTasksChange();
    } catch (err) {
      console.error('Failed to update task:', err);
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedProjectId('');
    setDifficulty(TaskDifficulty.MEDIUM);
    setStatus(TaskStatus.BACKLOG);
    setEstimatedMinutes('');
    setMaxMinutes('');
    setPlannedForDate('');
    setDueDate('');
    setEditingId(null);
    setShowCreateForm(false);
  };

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || 'Unknown';
  };

  const getProjectColor = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.color || '#6b7280';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case TaskStatus.COMPLETED: return '#10b981';
      case TaskStatus.IN_PROGRESS: return '#3b82f6';
      case TaskStatus.BACKLOG: return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getDifficultyLabel = (diff: string) => {
    switch (diff) {
      case TaskDifficulty.TRIVIAL: return '⚪ Trivial';
      case TaskDifficulty.EASY: return '🟢 Easy';
      case TaskDifficulty.MEDIUM: return '🟡 Medium';
      case TaskDifficulty.HARD: return '🟠 Hard';
      case TaskDifficulty.EXTREME: return '🔴 Very Hard';
      default: return diff;
    }
  };

  const getStatusLabel = (status: string) => {
    return status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const filteredTasks = tasks.filter(task =>
    filterStatus === 'all' || task.status === filterStatus
  );

  if (loading && tasks.length === 0) {
    return <div className="task-manager-loading">Loading tasks...</div>;
  }

  if (projects.length === 0) {
    return (
      <div className="task-manager-empty">
        <p>You need to create a project first before creating tasks.</p>
      </div>
    );
  }

  return (
    <div className="task-manager-container">
      <div className="task-manager-header">
        <h2>Tasks</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="create-task-btn"
        >
          {showCreateForm ? 'Cancel' : '+ New Task'}
        </button>
      </div>

      {error && <div className="task-error">{error}</div>}

      {showCreateForm && (
        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="project">Project *</label>
              <select
                id="project"
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                required
                disabled={!!editingId}
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="status">Status *</label>
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                required
              >
                <option value={TaskStatus.BACKLOG}>Backlog</option>
                <option value={TaskStatus.PLANNED}>Planned</option>
                <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                <option value={TaskStatus.ARCHIVED}>Archived</option>
                <option value={TaskStatus.COMPLETED}>Completed</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="title">Task Title *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="What needs to be done?"
              maxLength={200}
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add more details..."
              rows={3}
              maxLength={5000}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="difficulty">Difficulty</label>
              <select
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                <option value={TaskDifficulty.TRIVIAL}>Trivial</option>
                <option value={TaskDifficulty.EASY}>Easy</option>
                <option value={TaskDifficulty.MEDIUM}>Medium</option>
                <option value={TaskDifficulty.HARD}>Hard</option>
                <option value={TaskDifficulty.EXTREME}>Very Hard</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="estimatedMinutes">Estimated Time (minutes)</label>
              <input
                id="estimatedMinutes"
                type="number"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(e.target.value)}
                placeholder="e.g., 60"
                min="0"
              />
            </div>

            <div className="form-group">
              <label htmlFor="maxMinutes">Max Time (minutes)</label>
              <input
                id="maxMinutes"
                type="number"
                value={maxMinutes}
                onChange={(e) => setMaxMinutes(e.target.value)}
                placeholder="e.g., 120"
                min="0"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="plannedForDate">Planned Date</label>
              <input
                id="plannedForDate"
                type="date"
                value={plannedForDate}
                onChange={(e) => setPlannedForDate(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="dueDate">Due Date</label>
              <input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading} className="submit-btn">
              {loading ? 'Saving...' : editingId ? 'Update Task' : 'Create Task'}
            </button>
            <button type="button" onClick={resetForm} className="cancel-btn" disabled={loading}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="task-filter">
        <button
          className={filterStatus === 'all' ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilterStatus('all')}
        >
          All ({tasks.length})
        </button>
        <button
          className={filterStatus === TaskStatus.PLANNED ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilterStatus(TaskStatus.PLANNED)}
        >
          To Do ({tasks.filter(t => t.status === TaskStatus.PLANNED).length})
        </button>
        <button
          className={filterStatus === TaskStatus.IN_PROGRESS ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilterStatus(TaskStatus.IN_PROGRESS)}
        >
          In Progress ({tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length})
        </button>
        <button
          className={filterStatus === TaskStatus.COMPLETED ? 'filter-btn active' : 'filter-btn'}
          onClick={() => setFilterStatus(TaskStatus.COMPLETED)}
        >
          Completed ({tasks.filter(t => t.status === TaskStatus.COMPLETED).length})
        </button>
      </div>

      <div className="task-list">
        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <p>No tasks {filterStatus !== 'all' ? `with status "${getStatusLabel(filterStatus)}"` : 'yet'}. Create your first task to get started!</p>
          </div>
        ) : (
          filteredTasks.map((task) => (
            <div key={task.id} className="task-item">
              <div className="task-color-bar" style={{ backgroundColor: getProjectColor(task.projectId) }}></div>
              <div className="task-main">
                <div className="task-checkbox">
                  <input
                    type="checkbox"
                    checked={task.status === TaskStatus.COMPLETED}
                    onChange={() => handleToggleStatus(task)}
                  />
                </div>
                <div className="task-content">
                  <h3 className="task-title">{task.title}</h3>
                  {task.description && <p className="task-description">{task.description}</p>}
                  <div className="task-meta">
                    <span className="task-project">📁 {getProjectName(task.projectId)}</span>
                    <span
                      className="task-status-badge"
                      style={{ backgroundColor: getStatusColor(task.status) }}
                    >
                      {getStatusLabel(task.status)}
                    </span>
                    <span className="task-difficulty">{getDifficultyLabel(task.difficulty)}</span>
                    {task.estimatedMinutes && (
                      <span className="task-time">⏱️ {task.estimatedMinutes}m</span>
                    )}
                    {task.dueDate && (
                      <span className="task-due">📅 Due: {new Date(task.dueDate).toLocaleDateString()}</span>
                    )}
                  </div>
                  {task.progress > 0 && (
                    <div className="task-progress-bar">
                      <div
                        className="task-progress-fill"
                        style={{ width: `${task.progress}%` }}
                      ></div>
                      <span className="task-progress-text">{task.progress}%</span>
                    </div>
                  )}
                </div>
              </div>
              <div className="task-actions">
                <button
                  onClick={() => handleEdit(task)}
                  className="edit-btn"
                  disabled={loading}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(task.id)}
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

      <div className="task-summary">
        <p>
          {filteredTasks.filter(t => t.status === TaskStatus.COMPLETED).length} of {filteredTasks.length} tasks completed
        </p>
      </div>
    </div>
  );
}
