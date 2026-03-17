import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@powersync/react';
import { Search, Plus } from 'lucide-react';
import {
  TaskCard,
  TaskDetailModal,
  QuickAddTask,
  Badge,
  Button,
  Input,
  ScrollArea,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  type DraftTask,
} from '@stridetime/ui';
import { taskService, projectService } from '@stridetime/core';
import type { Task, Project } from '@stridetime/types';
import { TaskStatus } from '@stridetime/types';
import { useAuth } from '../contexts/AuthContext';
import { useDatabase } from '../hooks/useDatabase';

// No-op query for when database isn't ready yet (rules of hooks require unconditional useQuery)
const NO_OP_QUERY = 'SELECT 1 WHERE 0';

export function AllTasksView() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const db = useDatabase();

  // TODO: add some middleware to make queries less verbose.
  // ── Reactive queries ──────────────────────────────────────
  const { data: allTasks = [], isLoading } = useQuery(
    db ? taskService.getAllTasks(db, userId || '') : NO_OP_QUERY
  );

  const { data: projects = [] } = useQuery(
    db ? projectService.getAllForUser(db, userId || '') : NO_OP_QUERY
  );

  // ── Local state ───────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
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

  const searchFilter = useCallback((task: Record<string, unknown>) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const title = (task.title as string || '').toLowerCase();
    const desc = (task.description as string || '').toLowerCase();
    return title.includes(q) || desc.includes(q);
  }, [searchQuery]);

  const filteredByTab = useMemo(() => {
    const searched = allTasks.filter(searchFilter);
    return {
      all: searched.filter(t => t.status !== 'ARCHIVED'),
      backlog: searched.filter(t => t.status === TaskStatus.BACKLOG),
      planned: searched.filter(
        t => t.status === TaskStatus.PLANNED || t.status === TaskStatus.IN_PROGRESS
      ),
      completed: searched.filter(t => t.status === TaskStatus.COMPLETED),
    };
  }, [allTasks, searchFilter]);

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
    if (!db) return;
    const projectId = selectedProjectId || projects[0]?.id;
    if (!projectId || !userId) return;

    // Only create top-level tasks (indent === 0), skip subtasks
    const topLevel = tasks.filter(t => t.indent === 0);

    for (const draft of topLevel) {
      await taskService.create(db, {
        title: draft.title,
        projectId: draft.projectId || projectId,
        userId,
        description: draft.description || undefined,
        difficulty: draft.difficulty || undefined,
        priority: draft.priority || undefined,
        estimatedMinutes: draft.estimatedMinutes ?? undefined,
        maxMinutes: draft.maxMinutes ?? undefined,
      });
    }

    setDraftTasks([]);
    setQuickAddOpen(false);
  }, [db, userId, selectedProjectId, projects]);

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

  // ── Task list renderer ────────────────────────────────────
  const renderTaskList = (tasks: Record<string, unknown>[], emptyMessage: string) => {
    if (tasks.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {tasks.map(task => {
          const project = projectMap.get(task.projectId as string);
          return (
            <TaskCard
              key={task.id as string}
              task={task as Task}
              projectName={project?.name || 'Unknown'}
              projectColor={project?.color || '#6b7280'}
              expanded={expandedTaskId === task.id}
              onToggleExpand={() =>
                setExpandedTaskId(prev =>
                  prev === task.id ? null : task.id as string
                )
              }
              onOpenDetail={() => setEditingTask(task as Task)}
              onStart={() => handleStart(task.id as string)}
              onComplete={() => handleComplete(task.id as string)}
              onDelete={() => handleDeleteTask(task.id as string)}
              onUpdateProgress={progress =>
                handleUpdateProgress(task.id as string, progress)
              }
            />
          );
        })}
      </div>
    );
  };

  // ── Loading state ─────────────────────────────────────────
  if (!db || isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2
          border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="mx-auto max-w-3xl px-8 py-2">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">All Tasks</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage and track all your tasks
            </p>
          </div>
          <Button
            size="sm"
            onClick={openQuickAdd}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            New Task
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2
            text-muted-foreground" />
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all">
          <TabsList className="mb-4 w-full">
            <TabsTrigger value="all" className="flex-1">
              All
              <Badge variant="secondary" className="ml-2">
                {filteredByTab.all.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="backlog" className="flex-1">
              Backlog
              <Badge variant="secondary" className="ml-2">
                {filteredByTab.backlog.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="planned" className="flex-1">
              Planned
              <Badge variant="secondary" className="ml-2">
                {filteredByTab.planned.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex-1">
              Completed
              <Badge variant="secondary" className="ml-2">
                {filteredByTab.completed.length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all">
            {renderTaskList(filteredByTab.all, 'No tasks found')}
          </TabsContent>
          <TabsContent value="backlog">
            {renderTaskList(filteredByTab.backlog, 'No backlog tasks')}
          </TabsContent>
          <TabsContent value="planned">
            {renderTaskList(filteredByTab.planned, 'No planned or in-progress tasks')}
          </TabsContent>
          <TabsContent value="completed">
            {renderTaskList(filteredByTab.completed, 'No completed tasks')}
          </TabsContent>
        </Tabs>
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
