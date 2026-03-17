import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@powersync/react';
import { format } from 'date-fns';
import {
  TaskCard,
  TaskDetailModal,
  QuickAddTask,
  ScrollArea,
  ActiveTimerBanner,
  TodayHeader,
  TodayStats,
  TaskSection,
  EmptyTasksState,
  type DraftTask,
} from '@stridetime/ui';
import { taskService, projectService } from '@stridetime/core';
import type { Task, Project } from '@stridetime/types';
import { TaskStatus } from '@stridetime/types';
import { useAuth } from '../contexts/AuthContext';
import { useDatabase } from '../hooks/useDatabase';
import { useTimer } from '../contexts/TimerContext';

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// No-op query for when database isn't ready yet (rules of hooks require unconditional useQuery)
const NO_OP_QUERY = 'SELECT 1 WHERE 0';

/**
 * TodayView — Smart container component for the Today page.
 * Uses new presentational components from @stridetime/ui for better composition.
 */
export function TodayView() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const db = useDatabase();
  const todayDate = getTodayDate();
  const { activeEntry, startedAt } = useTimer();

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
    setDraftTasks([
      {
        id: `task-${Date.now()}`,
        title: '',
        indent: 0,
        parentTaskId: null,
        difficulty: 'MEDIUM',
      },
    ]);
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
    () => todayTasks.filter((t) => t.status !== TaskStatus.COMPLETED),
    [todayTasks]
  );

  const completedTasks = useMemo(
    () => todayTasks.filter((t) => t.status === TaskStatus.COMPLETED),
    [todayTasks]
  );

  const activeTask = useMemo(() => {
    if (!activeEntry?.taskId) return null;
    return todayTasks.find((t) => t.id === activeEntry.taskId) || null;
  }, [activeEntry, todayTasks]);

  // ── Handlers ──────────────────────────────────────────────
  const handleStart = useCallback(
    async (taskId: string) => {
      if (!db) return;
      await taskService.update(db, taskId, { status: TaskStatus.IN_PROGRESS });
    },
    [db]
  );

  const handleComplete = useCallback(
    async (taskId: string) => {
      if (!db) return;
      await taskService.update(db, taskId, {
        status: TaskStatus.COMPLETED,
        progress: 100,
      });
    },
    [db]
  );

  const handleUpdateProgress = useCallback(
    async (taskId: string, progress: number) => {
      if (!db) return;
      await taskService.updateProgress(db, taskId, progress);
    },
    [db]
  );

  const handleUpdateTask = useCallback(
    async (updates: Partial<Task>) => {
      if (!db || !editingTask) return;
      await taskService.update(db, editingTask.id, updates);
    },
    [db, editingTask]
  );

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      if (!db) return;
      await taskService.delete(db, taskId);
      setEditingTask(null);
    },
    [db]
  );

  const handleCreateTasks = useCallback(
    async (tasks: DraftTask[]) => {
      if (!db) return;
      const projectId = selectedProjectId || projects[0]?.id;
      if (!projectId || !userId) return;

      // Only create top-level tasks (indent === 0), skip subtasks
      const topLevel = tasks.filter((t) => t.indent === 0);

      for (const draft of topLevel) {
        try {
          await taskService.create(db, {
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
        } catch (err) {
          console.error('[TodayView] Task creation failed:', err);
        }
      }

      setDraftTasks([]);
      setQuickAddOpen(false);
    },
    [db, userId, selectedProjectId, projects, todayDate]
  );

  const handleCreateProject = useCallback(
    async (name: string, color: string) => {
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
    },
    [db, userId, projects]
  );

  // ── Loading state ─────────────────────────────────────────
  if (!db || tasksLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div
          className="h-6 w-6 animate-spin rounded-full border-2
          border-primary border-t-transparent"
        />
      </div>
    );
  }

  const formattedDate = format(new Date(), 'EEEE, MMMM d');

  return (
    <ScrollArea className="flex-1">
      <div className="mx-auto max-w-3xl px-8 py-6">
        {/* Header */}
        <TodayHeader formattedDate={formattedDate} onNewTask={openQuickAdd} />

        {/* Active Timer Banner */}
        {activeTask && activeEntry && startedAt && (
          <ActiveTimerBanner
            taskTitle={activeTask.title}
            projectName={projectMap.get(activeTask.projectId)?.name || 'Unknown'}
            projectColor={projectMap.get(activeTask.projectId)?.color || '#6b7280'}
            startedAt={startedAt}
            onPause={() => {
              /* TODO: implement pause */
            }}
            onComplete={() => handleComplete(activeTask.id)}
          />
        )}

        {/* Quick Stats */}
        <TodayStats activeTasks={activeTasks.length} completedTasks={completedTasks.length} />

        {/* Active Tasks */}
        {activeTasks.length > 0 ? (
          <TaskSection>
            {activeTasks.map((task) => {
              const project = projectMap.get(task.projectId);
              return (
                <TaskCard
                  key={task.id}
                  task={task as Task}
                  projectName={project?.name || 'Unknown'}
                  projectColor={project?.color || '#6b7280'}
                  expanded={expandedTaskId === task.id}
                  onToggleExpand={() =>
                    setExpandedTaskId((prev) => (prev === task.id ? null : task.id))
                  }
                  onOpenDetail={() => setEditingTask(task as Task)}
                  onStart={() => handleStart(task.id)}
                  onComplete={() => handleComplete(task.id)}
                  onDelete={() => handleDeleteTask(task.id)}
                  onUpdateProgress={(progress) => handleUpdateProgress(task.id, progress)}
                />
              );
            })}
          </TaskSection>
        ) : completedTasks.length === 0 ? (
          /* Empty State */
          <EmptyTasksState onAddTask={openQuickAdd} />
        ) : null}

        {/* Completed Section */}
        {completedTasks.length > 0 && (
          <TaskSection
            title="Completed"
            count={completedTasks.length}
            collapsible
            expanded={showCompleted}
            onToggle={() => setShowCompleted((prev) => !prev)}
            className="opacity-60 mt-6"
          >
            {completedTasks.map((task) => {
              const project = projectMap.get(task.projectId);
              return (
                <TaskCard
                  key={task.id}
                  task={task as Task}
                  projectName={project?.name || 'Unknown'}
                  projectColor={project?.color || '#6b7280'}
                  expanded={expandedTaskId === task.id}
                  onToggleExpand={() =>
                    setExpandedTaskId((prev) => (prev === task.id ? null : task.id))
                  }
                  onOpenDetail={() => setEditingTask(task as Task)}
                  onDelete={() => handleDeleteTask(task.id)}
                />
              );
            })}
          </TaskSection>
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
      {editingTask &&
        (() => {
          const project = projectMap.get(editingTask.projectId);
          return (
            <TaskDetailModal
              open={!!editingTask}
              onOpenChange={(open) => {
                if (!open) setEditingTask(null);
              }}
              task={editingTask}
              projectName={project?.name || 'Unknown'}
              projectColor={project?.color || '#6b7280'}
              projects={(projects as Project[]).map((p) => ({
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
