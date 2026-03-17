import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Settings,
  Circle,
  Clock,
  Ban,
  Moon,
  CheckCircle2,
  Home,
  Calendar,
  CheckSquare,
  TrendingUp,
} from 'lucide-react';
import { Popover, PopoverTrigger, PopoverContent } from '@stridetime/ui';
import { useAuth } from '../../contexts/AuthContext';

type StatusId = 'online' | 'away' | 'busy' | 'offline';

type StatusConfig = {
  icon: typeof Circle;
  label: string;
  color: string;
  badgeColor: string;
};

const STATUS_CONFIG: Record<StatusId, StatusConfig> = {
  online: {
    icon: Circle,
    label: 'Online',
    color: 'text-green-500',
    badgeColor: 'bg-green-500',
  },
  away: {
    icon: Clock,
    label: 'Away',
    color: 'text-yellow-500',
    badgeColor: 'bg-yellow-500',
  },
  busy: {
    icon: Ban,
    label: 'Busy',
    color: 'text-red-500',
    badgeColor: 'bg-red-500',
  },
  offline: {
    icon: Moon,
    label: 'Offline',
    color: 'text-gray-500',
    badgeColor: 'bg-gray-500',
  },
};

// Temporary mock statuses — will be replaced with real data from useUserStatus
const MOCK_STATUSES: StatusId[] = ['online', 'away', 'busy', 'offline'];

type NavItem = {
  label: string;
  icon: typeof Home;
  path: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Today', icon: Home, path: '/today' },
  { label: 'Schedule', icon: Calendar, path: '/schedule/weekly' },
  { label: 'Tasks', icon: CheckSquare, path: '/tasks' },
  { label: 'Stats', icon: TrendingUp, path: '/stats' },
];

function getInitials(firstName?: string | null, lastName?: string | null, email?: string): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  if (firstName) {
    return firstName[0].toUpperCase();
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return '?';
}

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session } = useAuth();
  const [userStatus, setUserStatus] = useState<StatusId>('online');

  const user = session?.user;
  const displayName = user?.firstName && user?.lastName
    ? `${user.firstName} ${user.lastName}`
    : user?.firstName || user?.email || 'User';
  const initials = getInitials(user?.firstName, user?.lastName, user?.email);
  const isSettingsActive = location.pathname.startsWith('/settings');

  const currentStatusConfig = STATUS_CONFIG[userStatus];
  const StatusIcon = currentStatusConfig.icon;

  return (
    <div className="flex h-full w-72 flex-col border-r bg-sidebar/60">
      {/* Logo — pt-12 clears macOS traffic lights in frameless window */}
      <div className="border-b px-6 pb-6 pt-14" data-tauri-drag-region>
        <span className="text-xl font-bold tracking-tight">Stride</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Personal
        </div>
        <div className="space-y-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path
              || (item.path === '/schedule/weekly'
                && location.pathname.startsWith('/schedule'));
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm
                  font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-accent'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* User Profile Footer */}
      <div className="border-t px-4 pb-4 pt-4">
        <div className="flex items-center gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="flex flex-1 items-center gap-3 rounded-lg p-2
                  transition-colors hover:bg-accent"
              >
                {/* Avatar with status badge */}
                <div className="relative">
                  {user?.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={displayName}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-10 w-10 items-center justify-center
                        rounded-full bg-primary text-sm font-medium text-primary-foreground"
                    >
                      {initials}
                    </div>
                  )}
                  <div
                    className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full
                      border-2 border-transparent ${currentStatusConfig.badgeColor}`}
                  />
                </div>

                {/* Name and status */}
                <div className="min-w-0 flex-1 text-left">
                  <div className="truncate text-sm font-medium">{displayName}</div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <StatusIcon className={`h-3 w-3 ${currentStatusConfig.color}`} />
                    <span>{currentStatusConfig.label}</span>
                  </div>
                </div>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-2" align="end" side="top">
              <div className="space-y-1">
                {MOCK_STATUSES.map(status => {
                  const config = STATUS_CONFIG[status];
                  const Icon = config.icon;
                  return (
                    <button
                      key={status}
                      onClick={() => setUserStatus(status)}
                      className="flex w-full items-center gap-3 rounded-md px-3 py-2
                        text-sm transition-colors hover:bg-accent"
                    >
                      <Icon className={`h-4 w-4 ${config.color}`} />
                      <span>{config.label}</span>
                      {userStatus === status && (
                        <CheckCircle2 className="ml-auto h-3.5 w-3.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            </PopoverContent>
          </Popover>

          {/* Settings icon — separate clickable */}
          <button
            onClick={() => navigate('/settings')}
            className={`rounded-lg p-2 transition-colors hover:bg-accent ${
              isSettingsActive ? 'bg-accent text-foreground' : 'text-muted-foreground'
            }`}
            title="Settings"
          >
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
