-- Stride Database Schema - PostgreSQL version
-- Converted from Drizzle SQLite schema
-- Generated: 2026-02-05

-- ============================================================================
-- USERS
-- ============================================================================

CREATE TABLE users (
  id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC' NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE INDEX idx_users_email ON users(email);

-- ============================================================================
-- ROLES
-- ============================================================================

CREATE TABLE roles (
  id TEXT PRIMARY KEY NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  cloud_sync BOOLEAN DEFAULT FALSE NOT NULL,
  mobile_app BOOLEAN DEFAULT FALSE NOT NULL,
  team_workspaces BOOLEAN DEFAULT FALSE NOT NULL,
  export_reports BOOLEAN DEFAULT FALSE NOT NULL,
  api_access BOOLEAN DEFAULT FALSE NOT NULL,
  sso BOOLEAN DEFAULT FALSE NOT NULL,
  audit_logs BOOLEAN DEFAULT FALSE NOT NULL,
  custom_integrations BOOLEAN DEFAULT FALSE NOT NULL,
  priority_support BOOLEAN DEFAULT FALSE NOT NULL,
  max_workspaces INTEGER,
  max_projects INTEGER,
  max_team_members INTEGER,
  max_api_calls_per_day INTEGER,
  max_storage_mb INTEGER,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- ============================================================================
-- USER SUBSCRIPTIONS
-- ============================================================================

CREATE TABLE user_subscriptions (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL UNIQUE,
  role_id TEXT NOT NULL,
  status TEXT NOT NULL,
  price_cents INTEGER NOT NULL,
  currency TEXT DEFAULT 'USD' NOT NULL,
  billing_period TEXT NOT NULL,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  stripe_price_id TEXT,
  started_at TIMESTAMP NOT NULL,
  current_period_start TIMESTAMP,
  current_period_end TIMESTAMP,
  canceled_at TIMESTAMP,
  trial_ends_at TIMESTAMP,
  is_grandfathered BOOLEAN DEFAULT FALSE NOT NULL,
  grandfathered_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_role_id ON user_subscriptions(role_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);

-- ============================================================================
-- SUBSCRIPTION HISTORY
-- ============================================================================

CREATE TABLE subscription_history (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  old_role_id TEXT,
  new_role_id TEXT NOT NULL,
  old_price_cents INTEGER,
  new_price_cents INTEGER NOT NULL,
  reason TEXT NOT NULL,
  changed_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_subscription_history_user_id ON subscription_history(user_id);

-- ============================================================================
-- WORKSPACES
-- ============================================================================

CREATE TABLE workspaces (
  id TEXT PRIMARY KEY NOT NULL,
  owner_user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE INDEX idx_workspaces_owner_user_id ON workspaces(owner_user_id);

-- ============================================================================
-- WORKSPACE MEMBERS
-- ============================================================================

CREATE TABLE workspace_members (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  invited_by TEXT,
  joined_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_workspace_members_user_id ON workspace_members(user_id);

-- ============================================================================
-- PROJECTS
-- ============================================================================

CREATE TABLE projects (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  completion_percentage INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  deleted BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE INDEX idx_projects_workspace_id ON projects(workspace_id);
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_deleted ON projects(deleted);

-- ============================================================================
-- TASK TYPES
-- ============================================================================

CREATE TABLE task_types (
  id TEXT PRIMARY KEY NOT NULL,
  workspace_id TEXT,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  color TEXT,
  is_default BOOLEAN DEFAULT FALSE NOT NULL,
  display_order INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_task_types_user_id ON task_types(user_id);
CREATE INDEX idx_task_types_workspace_id ON task_types(workspace_id);

-- ============================================================================
-- TASKS
-- ============================================================================

CREATE TABLE tasks (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  parent_task_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  difficulty TEXT NOT NULL,
  progress INTEGER DEFAULT 0 NOT NULL,
  status TEXT DEFAULT 'BACKLOG' NOT NULL,
  estimated_minutes INTEGER,
  max_minutes INTEGER,
  actual_minutes INTEGER DEFAULT 0 NOT NULL,
  planned_for_date DATE,
  due_date DATE,
  task_type_id TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMP,
  deleted BOOLEAN DEFAULT FALSE NOT NULL
);

CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_parent_task_id ON tasks(parent_task_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_planned_for_date ON tasks(planned_for_date);
CREATE INDEX idx_tasks_deleted ON tasks(deleted);

-- ============================================================================
-- TIME ENTRIES
-- ============================================================================

CREATE TABLE time_entries (
  id TEXT PRIMARY KEY NOT NULL,
  task_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  started_at TIMESTAMP NOT NULL,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_time_entries_task_id ON time_entries(task_id);
CREATE INDEX idx_time_entries_user_id ON time_entries(user_id);
CREATE INDEX idx_time_entries_started_at ON time_entries(started_at);

-- ============================================================================
-- SCHEDULED EVENTS
-- ============================================================================

CREATE TABLE scheduled_events (
  id TEXT PRIMARY KEY NOT NULL,
  task_id TEXT,
  user_id TEXT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  duration_minutes INTEGER NOT NULL,
  label TEXT NOT NULL,
  type TEXT NOT NULL,
  external_id TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_scheduled_events_user_id ON scheduled_events(user_id);
CREATE INDEX idx_scheduled_events_start_time ON scheduled_events(start_time);
CREATE INDEX idx_scheduled_events_external_id ON scheduled_events(external_id);

-- ============================================================================
-- POINTS LEDGER
-- ============================================================================

CREATE TABLE points_ledger (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  task_id TEXT,
  time_entry_id TEXT,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_points_ledger_user_id ON points_ledger(user_id);
CREATE INDEX idx_points_ledger_user_created ON points_ledger(user_id, created_at);
CREATE INDEX idx_points_ledger_task_id ON points_ledger(task_id);

-- ============================================================================
-- DAILY SUMMARIES
-- ============================================================================

CREATE TABLE daily_summaries (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  date DATE NOT NULL,
  tasks_completed INTEGER DEFAULT 0 NOT NULL,
  tasks_worked_on INTEGER DEFAULT 0 NOT NULL,
  total_points INTEGER DEFAULT 0 NOT NULL,
  focus_minutes INTEGER DEFAULT 0 NOT NULL,
  efficiency_rating REAL DEFAULT 0.0 NOT NULL,
  standout_moment TEXT,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, date)
);

CREATE INDEX idx_daily_summaries_user_id_date ON daily_summaries(user_id, date);

-- ============================================================================
-- USER PREFERENCES
-- ============================================================================

CREATE TABLE user_preferences (
  user_id TEXT PRIMARY KEY NOT NULL,
  theme TEXT DEFAULT 'SYSTEM' NOT NULL,
  planning_mode TEXT DEFAULT 'WEEKLY' NOT NULL,
  check_in_frequency INTEGER DEFAULT 30 NOT NULL,
  check_in_enabled BOOLEAN DEFAULT TRUE NOT NULL,
  end_of_day_summary_time TEXT DEFAULT '17:00' NOT NULL,
  end_of_day_summary_enabled BOOLEAN DEFAULT TRUE NOT NULL,
  auto_pause_minutes INTEGER DEFAULT 10 NOT NULL,
  auto_pause_enabled BOOLEAN DEFAULT TRUE NOT NULL,
  break_reminder_enabled BOOLEAN DEFAULT TRUE NOT NULL,
  break_reminder_minutes INTEGER DEFAULT 90 NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);
