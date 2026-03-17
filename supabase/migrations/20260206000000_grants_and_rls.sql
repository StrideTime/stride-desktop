-- ============================================================================
-- Schema and Table Grants for Supabase Roles
-- ============================================================================
-- Supabase uses PostgreSQL roles (anon, authenticated, service_role) that need
-- explicit access to the public schema and its tables. Without these grants,
-- all API requests through Supabase client return "permission denied for schema public".

-- Grant schema usage
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON SCHEMA public TO service_role;

-- Grant table permissions
-- authenticated: full CRUD on all tables (filtered by RLS policies below)
-- anon: read-only on roles (public data)
-- service_role: full access (bypasses RLS)
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Ensure future tables get the same grants
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;

-- ============================================================================
-- Enable Row Level Security on all tables
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- ROLES: readable by everyone (public reference data)
CREATE POLICY "Roles are viewable by everyone"
  ON roles FOR SELECT
  USING (true);

-- USERS: users can read/update their own row
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid()::text = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid()::text = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid()::text = id);

-- USER SUBSCRIPTIONS: users can read their own subscription
CREATE POLICY "Users can view own subscription"
  ON user_subscriptions FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage own subscription"
  ON user_subscriptions FOR ALL
  USING (auth.uid()::text = user_id);

-- SUBSCRIPTION HISTORY: users can read their own history
CREATE POLICY "Users can view own subscription history"
  ON subscription_history FOR SELECT
  USING (auth.uid()::text = user_id);

-- WORKSPACES: owners have full access
CREATE POLICY "Users can view own workspaces"
  ON workspaces FOR SELECT
  USING (auth.uid()::text = owner_user_id);

CREATE POLICY "Users can manage own workspaces"
  ON workspaces FOR ALL
  USING (auth.uid()::text = owner_user_id);

-- WORKSPACE MEMBERS: members can view, owners manage
CREATE POLICY "Users can view own memberships"
  ON workspace_members FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage own memberships"
  ON workspace_members FOR ALL
  USING (auth.uid()::text = user_id);

-- PROJECTS: user_id-based access
CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage own projects"
  ON projects FOR ALL
  USING (auth.uid()::text = user_id);

-- TASK TYPES: user_id-based access
CREATE POLICY "Users can view own task types"
  ON task_types FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage own task types"
  ON task_types FOR ALL
  USING (auth.uid()::text = user_id);

-- TASKS: user_id-based access
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage own tasks"
  ON tasks FOR ALL
  USING (auth.uid()::text = user_id);

-- TIME ENTRIES: user_id-based access
CREATE POLICY "Users can view own time entries"
  ON time_entries FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage own time entries"
  ON time_entries FOR ALL
  USING (auth.uid()::text = user_id);

-- SCHEDULED EVENTS: user_id-based access
CREATE POLICY "Users can view own scheduled events"
  ON scheduled_events FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage own scheduled events"
  ON scheduled_events FOR ALL
  USING (auth.uid()::text = user_id);

-- POINTS LEDGER: user_id-based access
CREATE POLICY "Users can view own points"
  ON points_ledger FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage own points"
  ON points_ledger FOR ALL
  USING (auth.uid()::text = user_id);

-- DAILY SUMMARIES: user_id-based access
CREATE POLICY "Users can view own daily summaries"
  ON daily_summaries FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage own daily summaries"
  ON daily_summaries FOR ALL
  USING (auth.uid()::text = user_id);

-- USER PREFERENCES: user_id is the primary key
CREATE POLICY "Users can view own preferences"
  ON user_preferences FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL
  USING (auth.uid()::text = user_id);

-- ============================================================================
-- PowerSync publication (for replication)
-- ============================================================================
-- Create if not exists (safe to run multiple times)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'powersync') THEN
    CREATE PUBLICATION powersync FOR TABLE
      users, workspaces, workspace_members, projects, tasks, task_types,
      time_entries, daily_summaries, user_preferences, user_subscriptions, roles;
  END IF;
END $$;
