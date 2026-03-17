import type { Meta, StoryObj } from '@storybook/react';
import { UserStatusPopover } from './UserStatusPopover';
import { UserStatus } from '@stridetime/types';

// Mock workspace statuses
const mockWorkspaceStatuses = [
  {
    id: 'ONLINE',
    workspaceId: 'workspace-1',
    name: 'Online',
    description: null,
    icon: 'Circle',
    color: '#22c55e',
    isEnabled: true,
    displayOrder: 0,
    isDefault: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    deleted: false,
  },
  {
    id: 'AWAY',
    workspaceId: 'workspace-1',
    name: 'Away',
    description: null,
    icon: 'Circle',
    color: '#eab308',
    isEnabled: true,
    displayOrder: 1,
    isDefault: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    deleted: false,
  },
  {
    id: 'BUSY',
    workspaceId: 'workspace-1',
    name: 'Busy',
    description: null,
    icon: 'Circle',
    color: '#ef4444',
    isEnabled: true,
    displayOrder: 2,
    isDefault: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    deleted: false,
  },
  {
    id: 'OFFLINE',
    workspaceId: 'workspace-1',
    name: 'Offline',
    description: null,
    icon: 'Circle',
    color: '#6b7280',
    isEnabled: true,
    displayOrder: 3,
    isDefault: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    deleted: false,
  },
  {
    id: 'custom-focus',
    workspaceId: 'workspace-1',
    name: 'In Focus Mode',
    description: 'Deep work session in progress',
    icon: 'Target',
    color: '#8b5cf6',
    isEnabled: true,
    displayOrder: 4,
    isDefault: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    deleted: false,
  },
];

// Mock the useUserStatus hook
const createMockUseUserStatus = (status: UserStatus, includeCustom = false) => () => ({
  currentStatus: status,
  workspaceStatuses: includeCustom ? mockWorkspaceStatuses : mockWorkspaceStatuses.slice(0, 4),
  setUserStatus: async (newStatus: UserStatus) => {
    console.log('Status changed to:', newStatus);
  },
  isLoading: false,
});

const meta: Meta<typeof UserStatusPopover> = {
  title: 'Components/UserStatusPopover',
  component: UserStatusPopover,
  tags: ['autodocs'],
  decorators: [
    (Story: React.ComponentType) => {
      // Mock the context providers
      return (
        <div style={{ padding: '20px' }}>
          <Story />
        </div>
      );
    },
  ],
};

export default meta;

type Story = StoryObj<typeof UserStatusPopover>;

export const Online: Story = {
  parameters: {
    useUserStatus: createMockUseUserStatus(UserStatus.ONLINE),
  },
};

export const Away: Story = {
  parameters: {
    useUserStatus: createMockUseUserStatus(UserStatus.AWAY),
  },
};

export const Busy: Story = {
  parameters: {
    useUserStatus: createMockUseUserStatus(UserStatus.BUSY),
  },
};

export const Offline: Story = {
  parameters: {
    useUserStatus: createMockUseUserStatus(UserStatus.OFFLINE),
  },
};

export const WithCustomStatus: Story = {
  parameters: {
    useUserStatus: createMockUseUserStatus(UserStatus.ONLINE, true),
  },
};

export const AllStatuses: Story = {
  render: () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div>
        <h3 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Online</h3>
        <UserStatusPopover />
      </div>
      <div>
        <h3 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Away</h3>
        <UserStatusPopover />
      </div>
      <div>
        <h3 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Busy</h3>
        <UserStatusPopover />
      </div>
      <div>
        <h3 style={{ marginBottom: '8px', fontSize: '14px', fontWeight: 600 }}>Offline</h3>
        <UserStatusPopover />
      </div>
    </div>
  ),
};
