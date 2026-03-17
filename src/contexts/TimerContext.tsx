import { createContext, useContext, ReactNode } from 'react';
import { useQuery } from '@powersync/react';
import type { TimeEntry } from '@stridetime/types';
import { useAuth } from './AuthContext';

interface TimerContextType {
  activeEntry: TimeEntry | null;
  startedAt: string | null;
  isLoading: boolean;
}

const TimerContext = createContext<TimerContextType | undefined>(undefined);

interface TimerProviderProps {
  children: ReactNode;
}

export function TimerProvider({ children }: TimerProviderProps) {
  const { session } = useAuth();
  const userId = session?.user?.id || null;

  // TODO: remove raw SQL query
  // Query for active time entry
  const { data: entries, isLoading } = useQuery<TimeEntry>(
    `SELECT * FROM time_entries
     WHERE user_id = ? AND ended_at IS NULL AND deleted = 0
     LIMIT 1`,
    [userId || ''],
  );

  const activeEntry = entries && entries.length > 0 ? entries[0] : null;
  const startedAt = activeEntry?.startedAt || null;

  const value: TimerContextType = {
    activeEntry,
    startedAt,
    isLoading,
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (context === undefined) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}
