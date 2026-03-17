-- ============================================================================
-- Add New Tables: teams, team_members, project_teams, goals, breaks, work_sessions,
--                 workspace_user_preferences, workspace_statuses
-- ============================================================================

-- TEAMS TABLE
CREATE TABLE teams (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  icon TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  lead_user_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_teams_workspace_id ON teams(workspace_id);
CREATE INDEX idx_teams_lead_user_id ON teams(lead_user_id);

-- TEAM MEMBERS TABLE (join table - no soft delete)
CREATE TABLE team_members (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL,
  joined_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_team_members_team_user ON team_members(team_id, user_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);

-- PROJECT TEAMS TABLE (many-to-many join table - no soft delete)
CREATE TABLE project_teams (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  added_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_project_teams_project_team ON project_teams(project_id, team_id);
CREATE INDEX idx_project_teams_team_id ON project_teams(team_id);

-- GOALS TABLE
CREATE TABLE goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  type TEXT NOT NULL,
  target_value INTEGER NOT NULL,
  period TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_goals_user_id ON goals(user_id);
CREATE INDEX idx_goals_workspace_id ON goals(workspace_id);

-- BREAKS TABLE
CREATE TABLE breaks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL,
  started_at TEXT NOT NULL,
  ended_at TEXT,
  duration_minutes INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_breaks_user_id ON breaks(user_id);
CREATE INDEX idx_breaks_started_at ON breaks(started_at);

-- WORK SESSIONS TABLE
CREATE TABLE work_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,
  status TEXT NOT NULL,
  clocked_in_at TEXT NOT NULL,
  clocked_out_at TEXT,
  total_focus_minutes INTEGER NOT NULL DEFAULT 0,
  total_break_minutes INTEGER NOT NULL DEFAULT 0,
  date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted BOOLEAN NOT NULL DEFAULT false
);

CREATE INDEX idx_work_sessions_user_id ON work_sessions(user_id);
CREATE INDEX idx_work_sessions_date ON work_sessions(date);

-- WORKSPACE USER PREFERENCES TABLE
CREATE TABLE workspace_user_preferences (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  workspace_id TEXT NOT NULL,

  -- Task views
  default_view TEXT NOT NULL DEFAULT 'TODAY',
  group_tasks_by TEXT NOT NULL DEFAULT 'PROJECT',
  sort_tasks_by TEXT NOT NULL DEFAULT 'PRIORITY',
  show_completed_tasks BOOLEAN NOT NULL DEFAULT false,

  -- UI preferences
  show_quick_add_button BOOLEAN NOT NULL DEFAULT true,
  keyboard_shortcuts_enabled BOOLEAN NOT NULL DEFAULT true,
  auto_start_timer_on_task BOOLEAN NOT NULL DEFAULT false,

  -- Tracking toggles
  track_time BOOLEAN NOT NULL DEFAULT true,
  track_breaks BOOLEAN NOT NULL DEFAULT true,
  track_completion_times BOOLEAN NOT NULL DEFAULT true,
  track_focus BOOLEAN NOT NULL DEFAULT true,
  track_project_switching BOOLEAN NOT NULL DEFAULT false,

  -- Stats visibility
  stats_visibility TEXT NOT NULL DEFAULT 'ONLY_ME',
  show_on_leaderboard BOOLEAN NOT NULL DEFAULT false,
  share_achievements BOOLEAN NOT NULL DEFAULT false,

  -- Data retention
  data_retention TEXT NOT NULL DEFAULT 'FOREVER',

  -- Per-workspace notification overrides
  task_reminders BOOLEAN NOT NULL DEFAULT true,
  goal_progress_notifications BOOLEAN NOT NULL DEFAULT true,
  break_reminders BOOLEAN NOT NULL DEFAULT true,
  daily_summary BOOLEAN NOT NULL DEFAULT true,

  -- Weekly schedule (JSON)
  weekly_schedule TEXT,

  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_workspace_user_prefs_user_workspace ON workspace_user_preferences(user_id, workspace_id);

-- WORKSPACE STATUSES TABLE
CREATE TABLE workspace_statuses (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'Circle',
  color TEXT NOT NULL DEFAULT '#22c55e',
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_workspace_statuses_workspace_id ON workspace_statuses(workspace_id);

-- ============================================================================
-- Enable Row Level Security
-- ============================================================================

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE breaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_statuses ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- TEAMS: workspace members can view, lead can manage
CREATE POLICY "Users can view teams in their workspaces"
  ON teams FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "Team leads can manage their teams"
  ON teams FOR ALL
  USING (auth.uid()::text = lead_user_id);

-- TEAM MEMBERS: team members can view, leads can manage
CREATE POLICY "Users can view team memberships"
  ON team_members FOR SELECT
  USING (
    team_id IN (
      SELECT id FROM teams WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()::text
      )
    )
  );

CREATE POLICY "Team leads can manage team members"
  ON team_members FOR ALL
  USING (
    team_id IN (
      SELECT id FROM teams WHERE lead_user_id = auth.uid()::text
    )
  );

-- PROJECT TEAMS: workspace members can view, project owners can manage
CREATE POLICY "Users can view project teams"
  ON project_teams FOR SELECT
  USING (
    project_id IN (
      SELECT id FROM projects WHERE workspace_id IN (
        SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()::text
      )
    )
  );

CREATE POLICY "Project owners can manage project teams"
  ON project_teams FOR ALL
  USING (
    project_id IN (
      SELECT id FROM projects WHERE user_id = auth.uid()::text
    )
  );

-- GOALS: users manage their own goals
CREATE POLICY "Users can view own goals"
  ON goals FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage own goals"
  ON goals FOR ALL
  USING (auth.uid()::text = user_id);

-- BREAKS: users manage their own breaks
CREATE POLICY "Users can view own breaks"
  ON breaks FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage own breaks"
  ON breaks FOR ALL
  USING (auth.uid()::text = user_id);

-- WORK SESSIONS: users manage their own work sessions
CREATE POLICY "Users can view own work sessions"
  ON work_sessions FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage own work sessions"
  ON work_sessions FOR ALL
  USING (auth.uid()::text = user_id);

-- WORKSPACE USER PREFERENCES: users manage their own per-workspace preferences
CREATE POLICY "Users can view own workspace preferences"
  ON workspace_user_preferences FOR SELECT
  USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage own workspace preferences"
  ON workspace_user_preferences FOR ALL
  USING (auth.uid()::text = user_id);

-- WORKSPACE STATUSES: workspace members can view, admins can manage
CREATE POLICY "Users can view workspace statuses"
  ON workspace_statuses FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()::text
    )
  );

CREATE POLICY "Workspace admins can manage statuses"
  ON workspace_statuses FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM workspace_members
      WHERE user_id = auth.uid()::text AND role IN ('OWNER', 'ADMIN')
    )
  );

-- ============================================================================
-- Add tables to PowerSync publication
-- ============================================================================

ALTER PUBLICATION powersync ADD TABLE teams;
ALTER PUBLICATION powersync ADD TABLE team_members;
ALTER PUBLICATION powersync ADD TABLE project_teams;
ALTER PUBLICATION powersync ADD TABLE goals;
ALTER PUBLICATION powersync ADD TABLE breaks;
ALTER PUBLICATION powersync ADD TABLE work_sessions;
ALTER PUBLICATION powersync ADD TABLE workspace_user_preferences;
ALTER PUBLICATION powersync ADD TABLE workspace_statuses;
