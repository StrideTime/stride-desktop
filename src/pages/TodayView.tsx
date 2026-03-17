import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@powersync/react';
import { format } from 'date-fns';
import { Plus, Calendar, ChevronDown, ChevronRight } from 'lucide-react';
import {
  TaskCard,
  TaskDetailModal,
  QuickAddTask,
  Badge,
  Button,
  ScrollArea,
  type DraftTask,
} from '@stridetime/ui';
import { taskService, projectService } from '@stridetime/core';
import type { Task, Project } from '@stridetime/types';
import { TaskStatus } from '@stridetime/types';
import { useAuth } from '../contexts/AuthContext';
import { useDatabase } from '../hooks/useDatabase';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// No-op query for when database isn't ready yet (rules of hooks require unconditional useQuery)
const NO_OP_QUERY = 'SELECT 1 WHERE 0';

export function TodayView() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  // TODO: add type declaration to useDatabase hook
  const db = useDatabase();
  const todayDate = getTodayDate();

  // ── Reactive queries ──────────────────────────────────────
  const { data: todayTasks = [], isLoading: tasksLoading } = useQuery(
    db ? taskService.getTodayTasks(db, userId || '', todayDate) : NO_OP_QUERY
  );

  const { data: projects = [] } = useQuery(
    db ? projectService.getAllForUser(db, userId || '') : NO_OP_QUERY
  );

  // ── Local state ───────────────────────────────────────────
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [draftTasks, setDraftTasks] = useState<DraftTask[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>();
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const openQuickAdd = useCallback(() => {
    setDraftTasks([{
      id: `task-${Date.now()}`,
      title: '',
      indent: 0,
      parentTaskId: null,
      difficulty: 'MEDIUM',
    }]);
    setSelectedTaskId(null);
    // Auto-select first project if none selected
    if (!selectedProjectId && projects.length > 0) {
      setSelectedProjectId(projects[0].id);
    }
    setQuickAddOpen(true);
  }, [selectedProjectId, projects]);

  // ── Derived data ──────────────────────────────────────────
  const projectMap = useMemo(() => {
    const map = new Map<string, Project>();
    for (const p of projects) {
      map.set(p.id, p);
    }
    return map;
  }, [projects]);

  const activeTasks = useMemo(
    () => todayTasks.filter(t => t.status !== TaskStatus.COMPLETED),
    [todayTasks]
  );

  const completedTasks = useMemo(
    () => todayTasks.filter(t => t.status === TaskStatus.COMPLETED),
    [todayTasks]
  );

  // ── Handlers ──────────────────────────────────────────────
  const handleStart = useCallback(async (taskId: string) => {
    if (!db) return;
    await taskService.update(db, taskId, { status: TaskStatus.IN_PROGRESS });
  }, [db]);

  const handleComplete = useCallback(async (taskId: string) => {
    if (!db) return;
    await taskService.update(db, taskId, {
      status: TaskStatus.COMPLETED,
      progress: 100,
    });
  }, [db]);

  const handleUpdateProgress = useCallback(async (taskId: string, progress: number) => {
    if (!db) return;
    await taskService.updateProgress(db, taskId, progress);
  }, [db]);

  const handleUpdateTask = useCallback(async (updates: Partial<Task>) => {
    if (!db || !editingTask) return;
    await taskService.update(db, editingTask.id, updates);
  }, [db, editingTask]);

  const handleDeleteTask = useCallback(async (taskId: string) => {
    if (!db) return;
    await taskService.delete(db, taskId);
    setEditingTask(null);
  }, [db]);

  const handleCreateTasks = useCallback(async (tasks: DraftTask[]) => {
    console.log('[TodayView] handleCreateTasks CALLED', {
      taskCount: tasks.length,
      tasks: tasks.map(t => ({ id: t.id, title: t.title })),
      hasDb: !!db,
      userId,
      selectedProjectId,
      firstProjectId: projects[0]?.id,
    });
    if (!db) { console.warn('[TodayView] No db — aborting'); return; }
    const projectId = selectedProjectId || projects[0]?.id;
    if (!projectId || !userId) {
      console.warn('[TodayView] Missing projectId or userId — aborting', { projectId, userId });
      return;
    }

    // Only create top-level tasks (indent === 0), skip subtasks
    const topLevel = tasks.filter(t => t.indent === 0);
    console.log('[TodayView] Creating tasks...', { count: topLevel.length, projectId, userId });

    for (const draft of topLevel) {
      try {
        const created = await taskService.create(db, {
          title: draft.title,
          projectId: draft.projectId || projectId,
          userId,
          description: draft.description || undefined,
          difficulty: draft.difficulty || undefined,
          priority: draft.priority || undefined,
          estimatedMinutes: draft.estimatedMinutes ?? undefined,
          maxMinutes: draft.maxMinutes ?? undefined,
          plannedForDate: todayDate,
        });
        console.log('[TodayView] ✓ Task created:', created.id, created.title);
      } catch (err) {
        console.error('[TodayView] ✗ Task creation failed:', err);
      }
    }

    setDraftTasks([]);
    setQuickAddOpen(false);
  }, [db, userId, selectedProjectId, projects, todayDate]);

  const handleCreateProject = useCallback(async (name: string, color: string) => {
    if (!db || !userId) return;
    const workspaceId = (projects[0] as Project)?.workspaceId;
    if (!workspaceId) return;
    const created = await projectService.create(db, {
      name,
      color,
      workspaceId,
      userId,
    });
    setSelectedProjectId(created.id);
  }, [db, userId, projects]);

  // ── Loading state ─────────────────────────────────────────
  if (!db || tasksLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2
          border-primary border-t-transparent" />
      </div>
    );
  }

  const formattedDate = format(new Date(), 'EEEE, MMMM d');

  return (
    <ScrollArea className="flex-1">
      <div className="mx-auto max-w-3xl px-8 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Today</h1>
            <p className="mt-1 text-sm text-muted-foreground">{formattedDate}</p>
          </div>
          <Button
            size="sm"
            onClick={openQuickAdd}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New Task
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="mb-6 flex gap-3">
          <Badge variant="secondary" className="px-3 py-1.5">
            {activeTasks.length} planned
          </Badge>
          <Badge variant="outline" className="px-3 py-1.5">
            {completedTasks.length} completed
          </Badge>
        </div>

        {/* Active Tasks */}
        {activeTasks.length > 0 ? (
          <div className="space-y-2">
            {activeTasks.map(task => {
              const project = projectMap.get(task.projectId);
              return (
                <TaskCard
                  key={task.id}
                  task={task as Task}
                  projectName={project?.name || 'Unknown'}
                  projectColor={project?.color || '#6b7280'}
                  expanded={expandedTaskId === task.id}
                  onToggleExpand={() =>
                    setExpandedTaskId(prev => prev === task.id ? null : task.id)
                  }
                  onOpenDetail={() => setEditingTask(task as Task)}
                  onStart={() => handleStart(task.id)}
                  onComplete={() => handleComplete(task.id)}
                  onDelete={() => handleDeleteTask(task.id)}
                  onUpdateProgress={progress =>
                    handleUpdateProgress(task.id, progress)
                  }
                />
              );
            })}
          </div>
        ) : completedTasks.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 rounded-full bg-muted p-4">
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="mb-1 text-lg font-medium">No tasks planned</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Add tasks to get started with your day
            </p>
            <Button
              size="sm"
              onClick={openQuickAdd}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Task
            </Button>
          </div>
        ) : null}

        {/* Completed Section */}
        {completedTasks.length > 0 && (
          <div className="mt-6">
            <button
              onClick={() => setShowCompleted(prev => !prev)}
              className="mb-2 flex items-center gap-2 text-sm font-medium
                text-muted-foreground transition-colors hover:text-foreground"
            >
              {showCompleted ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              Completed ({completedTasks.length})
            </button>
            {showCompleted && (
              <div className="space-y-2 opacity-60">
                {completedTasks.map(task => {
                  const project = projectMap.get(task.projectId);
                  return (
                    <TaskCard
                      key={task.id}
                      task={task as Task}
                      projectName={project?.name || 'Unknown'}
                      projectColor={project?.color || '#6b7280'}
                      expanded={expandedTaskId === task.id}
                      onToggleExpand={() =>
                        setExpandedTaskId(prev =>
                          prev === task.id ? null : task.id
                        )
                      }
                      onOpenDetail={() => setEditingTask(task as Task)}
                      onDelete={() => handleDeleteTask(task.id)}
                    />
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* QuickAddTask Dialog */}
      <QuickAddTask
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
        projects={projects as Project[]}
        taskTypes={[]}
        tasks={draftTasks}
        onTasksChange={setDraftTasks}
        selectedProjectId={selectedProjectId}
        onSelectedProjectChange={setSelectedProjectId}
        selectedTaskId={selectedTaskId}
        onSelectedTaskChange={setSelectedTaskId}
        onCreate={handleCreateTasks}
        onCreateProject={handleCreateProject}
      />

      {/* Edit Task Modal */}
      {editingTask && (() => {
        const project = projectMap.get(editingTask.projectId);
        return (
          <TaskDetailModal
            open={!!editingTask}
            onOpenChange={open => { if (!open) setEditingTask(null); }}
            task={editingTask}
            projectName={project?.name || 'Unknown'}
            projectColor={project?.color || '#6b7280'}
            projects={(projects as Project[]).map(p => ({
              id: p.id,
              name: p.name,
              color: p.color ?? '#6b7280',
            }))}
            onUpdateTask={handleUpdateTask}
            onCreateProject={handleCreateProject}
            onComplete={() => handleComplete(editingTask.id)}
            onDelete={() => handleDeleteTask(editingTask.id)}
          />
        );
      })()}
    </ScrollArea>
  );
}
