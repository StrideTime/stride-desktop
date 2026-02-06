-- Minimal seed data for Stride
-- Essential + 3 users, 1 workspace, 5 tasks
-- Generated: 2026-02-05

-- Load essential roles
\i /Users/jaren/Documents/programming/Stride/stride-desktop/seeds/essential.sql

-- Users
INSERT INTO users (id, email, first_name, last_name, timezone, created_at, updated_at, deleted)
VALUES
('user_jaren', 'jaren@stride.local', 'Jaren', 'Glover', 'America/New_York', NOW(), NOW(), FALSE),
('user_demo', 'demo@stride.local', 'Demo', 'User', 'America/Los_Angeles', NOW(), NOW(), FALSE),
('user_test', 'test@stride.local', 'Test', 'Account', 'Europe/London', NOW(), NOW(), FALSE);

-- User Subscriptions
INSERT INTO user_subscriptions (id, user_id, role_id, status, price_cents, currency, billing_period, started_at, is_grandfathered, created_at, updated_at)
VALUES
('sub_jaren', 'user_jaren', 'role_team', 'active', 2900, 'USD', 'MONTHLY', NOW(), FALSE, NOW(), NOW()),
('sub_demo', 'user_demo', 'role_pro', 'active', 1500, 'USD', 'MONTHLY', NOW(), FALSE, NOW(), NOW()),
('sub_test', 'user_test', 'role_free', 'active', 0, 'USD', 'MONTHLY', NOW(), FALSE, NOW(), NOW());

-- Workspaces
INSERT INTO workspaces (id, owner_user_id, name, type, created_at, updated_at, deleted)
VALUES
('ws_personal', 'user_jaren', 'Personal', 'PERSONAL', NOW(), NOW(), FALSE),
('ws_demo', 'user_demo', 'Demo Workspace', 'PERSONAL', NOW(), NOW(), FALSE);

-- Projects
INSERT INTO projects (id, workspace_id, user_id, name, description, color, completion_percentage, created_at, updated_at, deleted)
VALUES
('proj_stride', 'ws_personal', 'user_jaren', 'Stride Development', 'Building the Stride productivity app', '#3b82f6', 35, NOW(), NOW(), FALSE),
('proj_learning', 'ws_personal', 'user_jaren', 'Learning & Growth', 'Personal development and skill building', '#10b981', 60, NOW(), NOW(), FALSE),
('proj_demo', 'ws_demo', 'user_demo', 'Getting Started', 'Demo project to explore Stride', '#f59e0b', 10, NOW(), NOW(), FALSE);

-- Task Types
INSERT INTO task_types (id, workspace_id, user_id, name, icon, color, is_default, display_order, created_at)
VALUES
('type_feature', 'ws_personal', 'user_jaren', 'Feature', '✨', '#3b82f6', TRUE, 0, NOW()),
('type_bug', 'ws_personal', 'user_jaren', 'Bug', '🐛', '#ef4444', FALSE, 1, NOW()),
('type_improvement', 'ws_personal', 'user_jaren', 'Improvement', '🔧', '#f59e0b', FALSE, 2, NOW()),
('type_learning', 'ws_personal', 'user_jaren', 'Learning', '📚', '#8b5cf6', FALSE, 3, NOW());

-- Tasks
INSERT INTO tasks (id, user_id, project_id, parent_task_id, title, description, difficulty, progress, status, estimated_minutes, actual_minutes, planned_for_date, task_type_id, created_at, updated_at, deleted)
VALUES
('task_db_setup', 'user_jaren', 'proj_stride', NULL, 'Set up database infrastructure', 'Configure PostgreSQL, PowerSync, and migrations', 'MEDIUM', 100, 'COMPLETED', 180, 195, CURRENT_DATE, 'type_feature', NOW() - INTERVAL '2 days', NOW(), FALSE),
('task_auth', 'user_jaren', 'proj_stride', NULL, 'Implement authentication system', 'Supabase auth with JWT and session management', 'HARD', 40, 'IN_PROGRESS', 240, 95, CURRENT_DATE, 'type_feature', NOW() - INTERVAL '1 day', NOW(), FALSE),
('task_rbac', 'user_jaren', 'proj_stride', NULL, 'Build RBAC system', 'Role-based access control with permissions', 'HARD', 0, 'PLANNED', 180, 0, CURRENT_DATE + INTERVAL '1 day', 'type_feature', NOW(), NOW(), FALSE),
('task_typescript', 'user_jaren', 'proj_learning', NULL, 'Master TypeScript generics', NULL, 'MEDIUM', 70, 'IN_PROGRESS', 120, 85, CURRENT_DATE, 'type_learning', NOW() - INTERVAL '3 days', NOW(), FALSE),
('task_rust', 'user_jaren', 'proj_learning', NULL, 'Learn Rust fundamentals', 'Work through The Rust Book', 'HARD', 30, 'IN_PROGRESS', 600, 180, CURRENT_DATE, 'type_learning', NOW() - INTERVAL '5 days', NOW(), FALSE),
('task_welcome', 'user_demo', 'proj_demo', NULL, 'Welcome to Stride!', 'Complete this task to learn the basics', 'TRIVIAL', 100, 'COMPLETED', 5, 3, CURRENT_DATE - INTERVAL '1 day', NULL, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day', FALSE),
('task_create_project', 'user_demo', 'proj_demo', NULL, 'Create your first project', NULL, 'EASY', 0, 'BACKLOG', 10, 0, NULL, NULL, NOW(), NOW(), FALSE),
('task_track_time', 'user_demo', 'proj_demo', NULL, 'Track time on a task', NULL, 'EASY', 0, 'BACKLOG', 15, 0, NULL, NULL, NOW(), NOW(), FALSE);

-- User Preferences
INSERT INTO user_preferences (user_id, theme, planning_mode, check_in_frequency, check_in_enabled, end_of_day_summary_time, end_of_day_summary_enabled, auto_pause_minutes, auto_pause_enabled, break_reminder_enabled, break_reminder_minutes, updated_at)
VALUES
('user_jaren', 'DARK', 'WEEKLY', 30, TRUE, '17:00', TRUE, 10, TRUE, TRUE, 90, NOW()),
('user_demo', 'LIGHT', 'DAILY', 45, TRUE, '18:00', TRUE, 15, TRUE, TRUE, 120, NOW()),
('user_test', 'SYSTEM', 'WEEKLY', 30, FALSE, '17:00', FALSE, 10, FALSE, FALSE, 90, NOW());
