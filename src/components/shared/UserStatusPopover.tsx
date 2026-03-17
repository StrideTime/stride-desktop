import { useState } from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@stridetime/ui';
import { UserStatus } from '@stridetime/types';
import { useUserStatus } from '../../hooks/useUserStatus';
import './UserStatusPopover.css';

const STATUS_COLORS: Record<UserStatus, string> = {
  ONLINE: '#22c55e',
  AWAY: '#eab308',
  BUSY: '#ef4444',
  OFFLINE: '#6b7280',
};

const STATUS_LABELS: Record<UserStatus, string> = {
  ONLINE: 'Online',
  AWAY: 'Away',
  BUSY: 'Busy',
  OFFLINE: 'Offline',
};

interface StatusDotProps {
  color: string;
  size?: number;
}

function StatusDot({ color, size = 10 }: StatusDotProps) {
  return (
    <div
      className="status-dot"
      style={{
        width: size,
        height: size,
        backgroundColor: color,
        borderRadius: '50%',
      }}
    />
  );
}

export function UserStatusPopover() {
  const { currentStatus, workspaceStatuses, setUserStatus, isLoading } = useUserStatus();
  const [open, setOpen] = useState(false);

  const handleStatusChange = async (statusId: string) => {
    try {
      await setUserStatus(statusId as UserStatus);
      setOpen(false);
    } catch (error) {
      console.error('Failed to update status:', error);
    }
  };

  if (isLoading || !currentStatus) {
    return (
      <div className="user-status-popover-trigger">
        <StatusDot color="#6b7280" />
      </div>
    );
  }

  // Determine current status color
  // First check if it's a default status
  const currentColor = currentStatus in STATUS_COLORS
    ? STATUS_COLORS[currentStatus as UserStatus]
    : workspaceStatuses.find(s => s.id === currentStatus)?.color || '#6b7280';

  // Get all available statuses (defaults + custom from workspace)
  const defaultStatuses = Object.values(UserStatus);
  const customStatuses = workspaceStatuses.filter(
    s => !defaultStatuses.includes(s.id as UserStatus)
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="user-status-popover-trigger" aria-label="Change status">
          <StatusDot color={currentColor} />
          <span className="user-status-label">
            {STATUS_LABELS[currentStatus as UserStatus] ||
             workspaceStatuses.find(s => s.id === currentStatus)?.name ||
             'Status'}
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="user-status-popover-content">
        <div className="status-list">
          <div className="status-section">
            <h4 className="status-section-title">Status</h4>
            {defaultStatuses.map(status => (
              <button
                key={status}
                className={`status-item ${currentStatus === status ? 'active' : ''}`}
                onClick={() => handleStatusChange(status)}
              >
                <StatusDot color={STATUS_COLORS[status]} />
                <span className="status-name">{STATUS_LABELS[status]}</span>
              </button>
            ))}
          </div>

          {customStatuses.length > 0 && (
            <div className="status-section">
              <h4 className="status-section-title">Custom</h4>
              {customStatuses.map(status => (
                <button
                  key={status.id}
                  className={`status-item ${currentStatus === status.id ? 'active' : ''}`}
                  onClick={() => handleStatusChange(status.id)}
                >
                  <StatusDot color={status.color} />
                  <span className="status-name">{status.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
