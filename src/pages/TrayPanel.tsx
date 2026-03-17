import { useState, useCallback } from 'react';
import { TrayWindow } from '@stridetime/ui';
import type { GoalPeriod, Workspace, Task } from '@stridetime/types';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';

/**
 * TrayPanel — entry point for the tray-panel window.
 *
 * Wraps the dumb TrayWindow component from @stridetime/ui
 * and provides real data via hooks / context. For now we use
 * placeholder data until stride-core services are wired in.
 */
export function TrayPanel() {
  const { session } = useAuth();
  const { currentWorkspace } = useWorkspace();

  const [activeTab, setActiveTab] = useState<'focus' | 'stats'>('focus');
  const [viewState, setViewState] = useState<
    'fresh' | 'idle' | 'active' | 'stopped' | 'upnext' | 'clockedout'
  >('fresh');
  const [statsPeriod, setStatsPeriod] = useState<GoalPeriod>('DAILY');

  // Placeholder workspace — will come from context once DB is wired
  const placeholderWorkspace: Workspace = currentWorkspace ?? {
    id: 'personal',
    ownerUserId: session?.user?.id ?? '',
    name: 'Personal',
    description: null,
    icon: null,
    type: 'PERSONAL',
    color: null,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    weekStartsOn: 1,
    defaultProjectId: null,
    defaultTeamId: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    deleted: false,
  };

  // ── Callbacks (placeholders — will be wired to services) ──

  const handleOpenMain = useCallback(async () => {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      await invoke('show_main_window');
    } catch {
      // Fallback: open in browser or no-op in dev
      console.log('show_main_window not available outside Tauri');
    }
  }, []);

  const handleStartTask = useCallback((taskOrId: Task | string) => {
    const id = typeof taskOrId === 'string' ? taskOrId : taskOrId.id;
    console.log('Start task:', id);
    setViewState('active');
  }, []);

  const handleStopSession = useCallback(() => {
    console.log('Stop session');
    setViewState('stopped');
  }, []);

  const handleClockOut = useCallback(() => {
    console.log('Clock out');
    setViewState('clockedout');
  }, []);

  const handleStartNewDay = useCallback(() => {
    setViewState('fresh');
  }, []);

  return (
    <TrayWindow
      activeTab={activeTab}
      onTabChange={setActiveTab}
      viewState={viewState}

      // Goals & Stats — placeholders
      goals={{
        pointsCurrent: 0,
        pointsTarget: 100,
        tasksCurrent: 0,
        tasksTarget: 5,
      }}
      stats={{
        period: statsPeriod,
        tasksCompleted: 0,
        tasksTarget: 5,
        pointsEarned: 0,
        pointsTarget: 100,
        focusMinutes: 0,
        focusTarget: 120,
        habitsCompleted: 0,
        habitsTotal: 0,
      }}
      onStatsPeriodChange={setStatsPeriod}

      // Habits — empty until wired
      habits={[]}
      habitsEnabled={false}
      onToggleHabit={id => console.log('Toggle habit:', id)}
      onUpdateHabitValue={(id, val) => console.log('Update habit:', id, val)}

      // Workspace
      workspaces={[placeholderWorkspace]}
      selectedWorkspace={placeholderWorkspace}
      onWorkspaceChange={ws => console.log('Change workspace:', ws.id)}

      // Callbacks
      onOpenMain={handleOpenMain}
      onStartTask={handleStartTask}
      onStopSession={handleStopSession}
      onClockOut={handleClockOut}
      onStartNewDay={handleStartNewDay}
      onOpenSchedule={() => console.log('Open schedule')}
      onTakeBreak={mins => console.log('Take break:', mins, 'min')}
      onViewGoals={() => console.log('View goals')}
      onSelectNewTask={() => setViewState('upnext')}
      onBackToInitial={() => setViewState('fresh')}
    />
  );
}
