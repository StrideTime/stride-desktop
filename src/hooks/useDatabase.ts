import { useMemo } from 'react';
import { usePowerSync } from '@powersync/react';
import { getDatabase } from '@stridetime/core';
import type { StrideDatabase } from '@stridetime/core';

/**
 * Hook to safely access the Drizzle database instance.
 *
 * Depends on usePowerSync() which only returns after PowerSyncProvider
 * has confirmed the database is initialized. This ensures getDatabase()
 * never throws.
 *
 * @returns The Drizzle database instance, or null if not yet ready
 */
export function useDatabase(): StrideDatabase | null {
  // usePowerSync() is guaranteed non-null once PowerSyncProvider renders children
  const powerSync = usePowerSync();

  return useMemo(() => {
    if (!powerSync) return null;
    try {
      return getDatabase();
    } catch {
      return null;
    }
  }, [powerSync]);
}
