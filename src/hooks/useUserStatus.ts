import { useCallback } from 'react';
import { useQuery } from '@powersync/react';
import type { UserStatus, WorkspaceStatus } from '@stridetime/types';
import { useAuth } from '../contexts/AuthContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { getDatabase } from '@stridetime/core';

interface UserPreferencesResult {
  userId: string;
  userStatus: UserStatus;
}

interface UseUserStatusReturn {
  currentStatus: UserStatus | null;
  workspaceStatuses: WorkspaceStatus[];
  setUserStatus: (status: UserStatus) => Promise<void>;
  isLoading: boolean;
}

// TODO: get rid of all raw sql
export function useUserStatus(): UseUserStatusReturn {
  const { session } = useAuth();
  const { currentWorkspace } = useWorkspace();
  const userId = session?.user?.id || null;
  const workspaceId = currentWorkspace?.id || null;

  // Query current user status from user_preferences
  const { data: userPrefs, isLoading: prefsLoading } = useQuery<UserPreferencesResult>(
    `SELECT user_id as userId, user_status as userStatus
     FROM user_preferences
     WHERE user_id = ?
     LIMIT 1`,
    [userId || '']
  );

  // Query available workspace statuses
  const { data: statuses, isLoading: statusesLoading } = useQuery<WorkspaceStatus>(
    `SELECT id, workspace_id as workspaceId, name, description, icon, color,
            is_enabled as isEnabled, display_order as displayOrder,
            is_default as isDefault, created_at as createdAt,
            updated_at as updatedAt, deleted
     FROM workspace_statuses
     WHERE workspace_id = ? AND is_enabled = 1 AND deleted = 0
     ORDER BY display_order ASC`,
    [workspaceId || '']
  );

  const currentStatus = userPrefs && userPrefs.length > 0 ? userPrefs[0].userStatus : null;
  const workspaceStatuses = statuses || [];

  // Function to update user status
  const setUserStatus = useCallback(
    async (status: UserStatus) => {
      if (!userId) {
        throw new Error('User not authenticated');
      }

      const db = getDatabase();
      // Execute update directly via PowerSync
      await db.execute(
        `UPDATE user_preferences
         SET user_status = ?, updated_at = ?
         WHERE user_id = ?`,
        [status, new Date().toISOString(), userId]
      );
    },
    [userId]
  );

  return {
    currentStatus,
    workspaceStatuses,
    setUserStatus,
    isLoading: prefsLoading || statusesLoading,
  };
}
