import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getDatabase,
  taskService,
  projectRepo,
  type CreateTaskParams,
  type Task,
  type Project,
} from '@stridetime/core';
import { TaskDifficulty, TaskStatus } from '@stridetime/types';
import './TaskList.css';

export function TaskList() {
  const { session } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [session]);

  const loadData = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const db = getDatabase();

      // Load user's projects
      const userProjects = await projectRepo.findByUserId(db, session.user.id);
      setProjects(userProjects);

      // Load user's tasks using taskService
      const userTasks = await taskService.findByUser(db, session.user.id);
      setTasks(userTasks);

      setError(null);
    } catch (err) {
      console.error('Failed to load data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.user?.id) return;

    // Validation
    if (!title.trim()) {
      setError('Task title is required');
      return;
    }

    if (!selectedProjectId) {
      setError('Please select a project');
      return;
    }

    try {
      setLoading(true);
      const db = getDatabase();

      const params: CreateTaskParams = {
        title: title.trim(),
        projectId: selectedProjectId,
        userId: session.user.id,
        description: description.trim() || undefined,
        difficulty: TaskDifficulty.MEDIUM,
      };

      const newTask = await taskService.create(db, params);
      setTasks([...tasks, newTask]);

      // Reset form
      setTitle('');
      setDescription('');
      setSelectedProjectId('');
      setShowCreateForm(false);
      setError(null);
    } catch (err) {
      console.error('Failed to create task:', err);
      setError(err instanceof Error ? err.message : 'Failed to create task');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const db = getDatabase();
      await taskService.delete(db, taskId);
      setTasks(tasks.filter((t) => t.id !== taskId));
      setError(null);
    } catch (err) {
      console.error('Failed to delete task:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete task');
    }
  };

  const handleToggleStatus = async (task: Task) => {
    try {
      const db = getDatabase();
      const newStatus = task.status === TaskStatus.COMPLETED ? TaskStatus.BACKLOG : TaskStatus.COMPLETED;

      const updatedTask = await taskService.update(db, task.id, {
        status: newStatus,
      });

      setTasks(tasks.map((t) => (t.id === task.id ? updatedTask : t)));
      setError(null);
    } catch (err) {
      console.error('Failed to update task:', err);
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  if (loading && tasks.length === 0) {
    return <div className="task-list-loading">Loading tasks...</div>;
  }

  return (
    <div className="task-list-container">
      <div className="task-list-header">
        <h2>My Tasks</h2>
        <button onClick={() => setShowCreateForm(!showCreateForm)} className="create-task-button">
          {showCreateForm ? 'Cancel' : '+ New Task'}
        </button>
      </div>

      {error && <div className="task-error">{error}</div>}

      {showCreateForm && (
        <form onSubmit={handleCreateTask} className="create-task-form">
          <div className="form-group">
            <label htmlFor="title">Task Title *</label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="What needs to be done?"
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
            />
          </div>

          <div className="form-group">
            <label htmlFor="project">Project *</label>
            <select
              id="project"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              required
            >
              <option value="">Select a project</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-actions">
            <button type="submit" disabled={loading} className="submit-button">
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>
        </form>
      )}

      <div className="task-list">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <p>No tasks yet. Create your first task to get started!</p>
          </div>
        ) : (
          tasks.map((task) => (
            <div key={task.id} className={`task-item ${task.status}`}>
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
                  <span className="task-status">{task.status}</span>
                  {task.projectId && projects.find((p) => p.id === task.projectId) && (
                    <span className="task-project">
                      {projects.find((p) => p.id === task.projectId)?.name}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => handleDeleteTask(task.id)} className="delete-button">
                ×
              </button>
            </div>
          ))
        )}
      </div>

      <div className="task-summary">
        <p>
          {tasks.filter((t) => t.status === TaskStatus.COMPLETED).length} of {tasks.length} tasks completed
        </p>
      </div>
    </div>
  );
}
