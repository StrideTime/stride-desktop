import { ContextType, ReactNode, useEffect, useState } from 'react';
import { PowerSyncContext } from '@powersync/react';
import { getPowerSyncDatabase } from '@stridetime/core';

// Derive the db type from PowerSyncContext to avoid @powersync/common version mismatch.
// Two versions (1.46.x from @stridetime/db, 1.47.x from @powersync/react) are resolved by
// pnpm, making the AbstractPowerSyncDatabase classes nominally incompatible.
type PowerSyncDb = NonNullable<ContextType<typeof PowerSyncContext>>;

interface PowerSyncProviderProps {
  children: ReactNode;
}

/**
 * Waits for the PowerSync database to be initialized, then provides
 * it to the rest of the component tree via PowerSyncContext.
 *
 * Shows a loading spinner while waiting. This avoids the race condition
 * where the provider mounts before initAppDatabase() has completed.
 */
export function PowerSyncProvider({ children }: PowerSyncProviderProps) {
  const [db, setDb] = useState<PowerSyncDb | null>(
    () => getPowerSyncDatabase() as PowerSyncDb | null
  );

  useEffect(() => {
    if (db) return;

    // Poll for the database instance (it's created by initAppDatabase)
    const interval = setInterval(() => {
      const instance = getPowerSyncDatabase();
      if (instance) {
        setDb(instance);
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [db]);

  // TODO: So far this seems to just show a circle but it should be a spinner
  if (!db) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <PowerSyncContext.Provider value={db}>
      {children}
    </PowerSyncContext.Provider>
  );
}
