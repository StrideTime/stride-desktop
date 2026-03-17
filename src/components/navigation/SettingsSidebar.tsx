import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Palette,
  Bell,
  Lock,
  RefreshCw,
  Wifi,
  WifiOff,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import {
  getSyncStatus,
  onSyncStatusChange,
  isSyncEnabled,
} from '@stridetime/core';
import type { SyncStatus, SyncState } from '@stridetime/core';

export type SettingsSection =
  | 'account'
  | 'appearance'
  | 'notifications'
  | 'privacy'
  | 'sync-status';

interface SettingsSidebarProps {
  activeSection: SettingsSection;
  onSectionChange: (section: SettingsSection) => void;
}

const SYNC_STATE_CONFIG: Record<SyncState, {
  icon: typeof Wifi;
  label: string;
  color: string;
  dotColor: string;
}> = {
  disabled: {
    icon: WifiOff,
    label: 'Disabled',
    color: 'text-muted-foreground',
    dotColor: 'bg-gray-400',
  },
  disconnected: {
    icon: WifiOff,
    label: 'Disconnected',
    color: 'text-yellow-500',
    dotColor: 'bg-yellow-500',
  },
  connecting: {
    icon: Loader2,
    label: 'Connecting...',
    color: 'text-blue-500',
    dotColor: 'bg-blue-500',
  },
  connected: {
    icon: Wifi,
    label: 'Connected',
    color: 'text-green-500',
    dotColor: 'bg-green-500',
  },
  error: {
    icon: AlertCircle,
    label: 'Error',
    color: 'text-red-500',
    dotColor: 'bg-red-500',
  },
};

export function SettingsSidebar({ activeSection, onSectionChange }: SettingsSidebarProps) {
  const navigate = useNavigate();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(getSyncStatus());

  useEffect(() => {
    const unsubscribe = onSyncStatusChange((status: SyncStatus) => {
      setSyncStatus(status);
    });
    return unsubscribe;
  }, []);

  const syncConfig = SYNC_STATE_CONFIG[syncStatus.state];
  const SyncIcon = syncConfig.icon;
  const syncActive = isSyncEnabled();

  return (
    <div className="flex h-full w-72 flex-col border-r bg-sidebar/60">
      {/* Header — pt-14 clears macOS traffic lights */}
      <div className="border-b px-6 pb-6 pt-14 space-y-3" data-tauri-drag-region>
        <button
          onClick={() => navigate('/today')}
          className="flex items-center gap-2 text-sm text-muted-foreground
            transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to App
        </button>
        <h1 className="text-xl font-bold">Settings</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {/* Personal Settings */}
        <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Personal Settings
        </div>
        <div className="mb-1 px-3 text-xs text-muted-foreground">
          Global settings across all workspaces
        </div>
        <div className="mt-2 space-y-1">
          <SidebarNavItem
            icon={User}
            label="Account"
            active={activeSection === 'account'}
            onClick={() => onSectionChange('account')}
          />
          <SidebarNavItem
            icon={Palette}
            label="Appearance"
            active={activeSection === 'appearance'}
            onClick={() => onSectionChange('appearance')}
          />
          <SidebarNavItem
            icon={Bell}
            label="Notifications"
            active={activeSection === 'notifications'}
            onClick={() => onSectionChange('notifications')}
          />
          <SidebarNavItem
            icon={Lock}
            label="Privacy"
            active={activeSection === 'privacy'}
            onClick={() => onSectionChange('privacy')}
          />
        </div>

        {/* Divider */}
        <div className="my-4 mx-2 h-px bg-border" />

        {/* Sync & Data */}
        <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Sync & Data
        </div>
        <div className="mt-2 space-y-1">
          <SidebarNavItem
            icon={RefreshCw}
            label="Sync Status"
            active={activeSection === 'sync-status'}
            onClick={() => onSectionChange('sync-status')}
          />
        </div>

        {/* Live sync indicator */}
        <div className="mt-4 mx-2 rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2 text-xs">
            <div className={`h-2 w-2 rounded-full ${syncConfig.dotColor} ${
              syncStatus.state === 'connecting' ? 'animate-pulse' : ''
            }`} />
            <SyncIcon className={`h-3 w-3 ${syncConfig.color} ${
              syncStatus.state === 'connecting' ? 'animate-spin' : ''
            }`} />
            <span className={`font-medium ${syncConfig.color}`}>
              {syncConfig.label}
            </span>
          </div>
          {syncActive && syncStatus.lastSyncedAt && (
            <div className="mt-1.5 text-[10px] text-muted-foreground">
              Last synced: {syncStatus.lastSyncedAt.toLocaleTimeString()}
            </div>
          )}
          {!syncActive && (
            <div className="mt-1.5 text-[10px] text-muted-foreground">
              Local-only mode
            </div>
          )}
        </div>
      </nav>
    </div>
  );
}

// ── Reusable nav button ──────────────────────────────────

interface SidebarNavItemProps {
  icon: typeof User;
  label: string;
  active: boolean;
  onClick: () => void;
}

function SidebarNavItem({ icon: Icon, label, active, onClick }: SidebarNavItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm
        font-medium transition-colors ${
        active
          ? 'bg-accent text-accent-foreground'
          : 'text-foreground hover:bg-accent/50'
      }`}
    >
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </button>
  );
}
