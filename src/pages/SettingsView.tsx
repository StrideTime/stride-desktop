import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  LogOut,
  Wifi,
  WifiOff,
  Loader2,
  AlertCircle,
  RefreshCw,
  Database,
  Cloud,
  CloudOff,
  Palette,
  Bell,
  Shield,
} from 'lucide-react';
import { Button, Input, Label, ScrollArea, Separator } from '@stridetime/ui';
import { useAuth } from '../contexts/AuthContext';
import {
  getSyncStatus,
  onSyncStatusChange,
  isSyncEnabled,
  connectSync,
  disconnectSync,
} from '@stridetime/core';
import type { SyncStatus, SyncState } from '@stridetime/core';
import {
  SettingsSidebar,
  type SettingsSection,
} from '../components/navigation/SettingsSidebar';
import { AppLayout } from '../layouts/AppLayout';

export function SettingsView() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('account');

  return (
    <AppLayout
      sidebar={
        <SettingsSidebar
          activeSection={activeSection}
          onSectionChange={setActiveSection}
        />
      }
    >
      <ScrollArea className="h-full">
        <div className="p-8 max-w-3xl">
          <SectionContent section={activeSection} />
        </div>
      </ScrollArea>
    </AppLayout>
  );
}

// ============================================================================
// SECTION ROUTER
// ============================================================================

function SectionContent({ section }: { section: SettingsSection }) {
  switch (section) {
    case 'account':
      return <AccountSection />;
    case 'sync-status':
      return <SyncStatusSection />;
    case 'appearance':
      return <PlaceholderSection title="Appearance" icon={Palette} />;
    case 'notifications':
      return <PlaceholderSection title="Notifications" icon={Bell} />;
    case 'privacy':
      return <PlaceholderSection title="Privacy" icon={Shield} />;
    default:
      return <div>Select a section</div>;
  }
}

// ============================================================================
// ACCOUNT SECTION (existing Profile + Password + Sign Out)
// ============================================================================

function AccountSection() {
  const navigate = useNavigate();
  const { session, signOut, updatePassword, resetPassword } = useAuth();
  const user = session?.user;

  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.firstName || '';
  const displayEmail = user?.email || '';

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user?.firstName) {
      return user.firstName[0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return '?';
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    setPasswordSuccess('');

    if (!newPassword.trim()) {
      setPasswordError('New password is required');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    setIsChangingPassword(true);
    try {
      await updatePassword(newPassword);
      setPasswordSuccess('Password updated successfully!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(
        err instanceof Error ? err.message : 'Failed to update password'
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleResetPassword = async () => {
    if (!displayEmail) return;
    setIsResettingPassword(true);
    try {
      await resetPassword(displayEmail);
    } catch (err) {
      console.error('Failed to send reset email:', err);
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      navigate('/login');
    } catch (err) {
      console.error('Failed to sign out:', err);
      setIsSigningOut(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Account</h2>
        <p className="text-sm text-muted-foreground">
          Manage your profile and security settings
        </p>
      </div>

      {/* Profile */}
      <div className="rounded-lg border p-6">
        <h3 className="mb-4 text-lg font-semibold">Profile</h3>
        <div className="flex items-center gap-4">
          {user?.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={displayName}
              className="h-16 w-16 rounded-full object-cover"
            />
          ) : (
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full
                bg-primary text-lg font-semibold text-primary-foreground"
            >
              {getInitials()}
            </div>
          )}
          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                <User className="h-3.5 w-3.5" />
                Name
              </Label>
              <p className="text-sm font-medium">
                {displayName || 'Not set'}
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Mail className="h-3.5 w-3.5" />
                Email
              </Label>
              <p className="text-sm font-medium">{displayEmail}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="rounded-lg border p-6">
        <h3 className="mb-4 text-lg font-semibold">Change Password</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="new-password">New Password</Label>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm New Password</Label>
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4 shrink-0 text-muted-foreground" />
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="flex-1"
              />
            </div>
          </div>

          {passwordError && (
            <p className="text-sm text-red-500">{passwordError}</p>
          )}
          {passwordSuccess && (
            <p className="text-sm text-green-500">{passwordSuccess}</p>
          )}

          <div className="flex items-center gap-3 pt-1">
            <Button
              size="sm"
              onClick={handlePasswordChange}
              disabled={!newPassword || !confirmPassword || isChangingPassword}
            >
              {isChangingPassword ? 'Updating...' : 'Update Password'}
            </Button>
            <button
              onClick={handleResetPassword}
              disabled={isResettingPassword}
              className="text-sm text-muted-foreground underline-offset-4
                transition-colors hover:text-foreground hover:underline"
            >
              {isResettingPassword
                ? 'Sending...'
                : 'Send reset email instead'}
            </button>
          </div>
        </div>
      </div>

      {/* Sign Out */}
      <div className="rounded-lg border border-red-200 p-6 dark:border-red-900">
        <h3 className="mb-2 text-lg font-semibold text-red-600 dark:text-red-400">
          Sign Out
        </h3>
        <p className="mb-4 text-sm text-muted-foreground">
          Sign out of your account on this device. Your data will be synced
          when you sign back in.
        </p>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {isSigningOut ? 'Signing out...' : 'Sign Out'}
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// SYNC STATUS SECTION
// ============================================================================

const SYNC_STATE_DISPLAY: Record<SyncState, {
  icon: typeof Cloud;
  label: string;
  description: string;
  color: string;
  bgColor: string;
  dotColor: string;
}> = {
  disabled: {
    icon: CloudOff,
    label: 'Disabled',
    description: 'Cloud sync is not enabled. Running in local-only mode.',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted/50',
    dotColor: 'bg-gray-400',
  },
  disconnected: {
    icon: WifiOff,
    label: 'Disconnected',
    description: 'Sync is enabled but not currently connected to the cloud.',
    color: 'text-yellow-600 dark:text-yellow-400',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    dotColor: 'bg-yellow-500',
  },
  connecting: {
    icon: Loader2,
    label: 'Connecting',
    description: 'Establishing connection to the sync service...',
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    dotColor: 'bg-blue-500',
  },
  connected: {
    icon: Cloud,
    label: 'Connected',
    description: 'Syncing data with the cloud in real-time.',
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    dotColor: 'bg-green-500',
  },
  error: {
    icon: AlertCircle,
    label: 'Error',
    description: 'An error occurred while syncing.',
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    dotColor: 'bg-red-500',
  },
};

function SyncStatusSection() {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(getSyncStatus());
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const unsubscribe = onSyncStatusChange((status: SyncStatus) => {
      setSyncStatus(status);
      setIsReconnecting(false);
    });
    return unsubscribe;
  }, []);

  const syncActive = isSyncEnabled();
  const display = SYNC_STATE_DISPLAY[syncStatus.state];
  const StatusIcon = display.icon;

  const handleReconnect = async () => {
    setIsReconnecting(true);
    try {
      await disconnectSync();
      await connectSync();
    } catch (err) {
      console.error('Failed to reconnect:', err);
      setIsReconnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectSync();
    } catch (err) {
      console.error('Failed to disconnect:', err);
    }
  };

  const handleConnect = async () => {
    setIsReconnecting(true);
    try {
      await connectSync();
    } catch (err) {
      console.error('Failed to connect:', err);
      setIsReconnecting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Sync Status</h2>
        <p className="text-sm text-muted-foreground">
          Monitor and manage your data synchronization
        </p>
      </div>

      {/* Current Status Card */}
      <div className={`rounded-lg border p-6 ${display.bgColor}`}>
        <div className="flex items-start gap-4">
          <div className={`rounded-lg p-3 ${display.bgColor}`}>
            <StatusIcon className={`h-6 w-6 ${display.color} ${
              syncStatus.state === 'connecting' || isReconnecting
                ? 'animate-spin'
                : ''
            }`} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <h3 className={`text-lg font-semibold ${display.color}`}>
                {display.label}
              </h3>
              <div className={`h-2.5 w-2.5 rounded-full ${display.dotColor} ${
                syncStatus.state === 'connecting' ? 'animate-pulse' : ''
              }`} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {display.description}
            </p>
            {syncStatus.lastSyncedAt && (
              <p className="mt-2 text-xs text-muted-foreground">
                Last synced: {syncStatus.lastSyncedAt.toLocaleString()}
              </p>
            )}
            {syncStatus.error && (
              <div className="mt-3 rounded-md bg-red-100 p-3 dark:bg-red-950/50">
                <p className="text-xs font-medium text-red-700 dark:text-red-300">
                  {syncStatus.error.message}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      {syncActive && (
        <div className="rounded-lg border p-6">
          <h3 className="mb-4 text-lg font-semibold">Actions</h3>
          <div className="flex flex-wrap gap-3">
            {(syncStatus.state === 'connected' || syncStatus.state === 'connecting') && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleReconnect}
                disabled={isReconnecting}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isReconnecting ? 'animate-spin' : ''}`} />
                {isReconnecting ? 'Reconnecting...' : 'Reconnect'}
              </Button>
            )}
            {syncStatus.state === 'connected' && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleDisconnect}
              >
                <WifiOff className="mr-2 h-4 w-4" />
                Disconnect
              </Button>
            )}
            {(syncStatus.state === 'disconnected' || syncStatus.state === 'error') && (
              <Button
                size="sm"
                onClick={handleConnect}
                disabled={isReconnecting}
              >
                <Wifi className={`mr-2 h-4 w-4 ${isReconnecting ? 'animate-spin' : ''}`} />
                {isReconnecting ? 'Connecting...' : 'Connect'}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Details */}
      <div className="rounded-lg border p-6">
        <h3 className="mb-4 text-lg font-semibold">Details</h3>
        <div className="space-y-3">
          <DetailRow
            icon={Database}
            label="Storage"
            value="Local SQLite (WASM)"
          />
          <Separator />
          <DetailRow
            icon={syncActive ? Cloud : CloudOff}
            label="Cloud Sync"
            value={syncActive ? 'Enabled (PowerSync)' : 'Disabled'}
          />
          <Separator />
          <DetailRow
            icon={RefreshCw}
            label="Sync State"
            value={display.label}
          />
          {syncStatus.lastSyncedAt && (
            <>
              <Separator />
              <DetailRow
                icon={Wifi}
                label="Last Synced"
                value={syncStatus.lastSyncedAt.toLocaleString()}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Database;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4" />
        <span>{label}</span>
      </div>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

// ============================================================================
// PLACEHOLDER SECTION (for future settings pages)
// ============================================================================

function PlaceholderSection({
  title,
  icon: Icon,
}: {
  title: string;
  icon: typeof Palette;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">
          This section is coming soon.
        </p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12">
        <Icon className="h-12 w-12 text-muted-foreground/30" />
        <p className="mt-4 text-sm text-muted-foreground">
          {title} settings will be available in a future update.
        </p>
      </div>
    </div>
  );
}
