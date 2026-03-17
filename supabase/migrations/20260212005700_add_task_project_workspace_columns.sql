-- ============================================================================
-- Add New Columns to Existing Tables
-- ============================================================================

-- TASKS: Add priority, assignment, ordering, tags, and external integration columns
ALTER TABLE tasks ADD COLUMN priority TEXT NOT NULL DEFAULT 'NONE';
ALTER TABLE tasks ADD COLUMN assignee_user_id TEXT;
ALTER TABLE tasks ADD COLUMN team_id TEXT;
ALTER TABLE tasks ADD COLUMN display_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE tasks ADD COLUMN tags TEXT; -- JSON array: '["urgent","frontend"]'
ALTER TABLE tasks ADD COLUMN external_id TEXT; -- e.g. Jira issue key
ALTER TABLE tasks ADD COLUMN external_source TEXT; -- GOOGLE_CALENDAR, JIRA, OUTLOOK, SLACK, MANUAL

-- PROJECTS: Add icon and status columns
ALTER TABLE projects ADD COLUMN icon TEXT;
ALTER TABLE projects ADD COLUMN status TEXT NOT NULL DEFAULT 'ACTIVE';

-- WORKSPACES: Add description, icon, color, timezone, and week start columns
ALTER TABLE workspaces ADD COLUMN description TEXT;
ALTER TABLE workspaces ADD COLUMN icon TEXT;
ALTER TABLE workspaces ADD COLUMN color TEXT;
ALTER TABLE workspaces ADD COLUMN timezone TEXT NOT NULL DEFAULT 'America/New_York';
ALTER TABLE workspaces ADD COLUMN week_starts_on INTEGER NOT NULL DEFAULT 1; -- 0=Sun, 1=Mon, 6=Sat

-- USER PREFERENCES: Add working hours, accent color, font size, and density columns
ALTER TABLE user_preferences ADD COLUMN working_hours_start TEXT NOT NULL DEFAULT '09:00';
ALTER TABLE user_preferences ADD COLUMN working_hours_end TEXT NOT NULL DEFAULT '17:00';
ALTER TABLE user_preferences ADD COLUMN working_days TEXT NOT NULL DEFAULT '[1,2,3,4,5]';
ALTER TABLE user_preferences ADD COLUMN accent_color TEXT;
ALTER TABLE user_preferences ADD COLUMN font_size TEXT NOT NULL DEFAULT 'MEDIUM';
ALTER TABLE user_preferences ADD COLUMN density TEXT NOT NULL DEFAULT 'COMFORTABLE';

-- DAILY SUMMARIES: Add break tracking and clock in/out columns
ALTER TABLE daily_summaries ADD COLUMN break_minutes INTEGER;
ALTER TABLE daily_summaries ADD COLUMN clock_in_time TEXT;
ALTER TABLE daily_summaries ADD COLUMN clock_out_time TEXT;

-- SCHEDULED EVENTS: Add external source and metadata columns
ALTER TABLE scheduled_events ADD COLUMN external_source TEXT;
ALTER TABLE scheduled_events ADD COLUMN metadata TEXT; -- JSON: { meetingUrl, location, conferenceType, ... }

-- ============================================================================
-- Add missing tables to PowerSync publication (drift fix)
-- ============================================================================

-- These tables exist in schema but were missing from PowerSync sync rules
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS scheduled_events;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS points_ledger;
ALTER PUBLICATION powersync ADD TABLE IF NOT EXISTS subscription_history;
