-- Complete seed data for Stride
-- Full demo with multiple users, workspaces, projects, and tasks
-- Generated: 2026-02-05

-- Load minimal seed first
-- Loading minimal seed

-- ============================================================================
-- ADDITIONAL USERS
-- ============================================================================

INSERT INTO users (
  id,
  email,
  first_name,
  last_name,
  timezone,
  created_at,
  updated_at,
  deleted
) VALUES
('user_sarah', 'sarah@stride.local', 'Sarah', 'Chen', 'America/Chicago', NOW(), NOW(), FALSE),
('user_mike', 'mike@stride.local', 'Mike', 'Thompson', 'America/Denver', NOW(), NOW(), FALSE),
('user_alex', 'alex@stride.local', 'Alex', 'Rivera', 'Europe/Paris', NOW(), NOW(), FALSE);

-- ============================================================================
-- ADDITIONAL SUBSCRIPTIONS
-- ============================================================================

INSERT INTO user_subscriptions (
  id,
  user_id,
  role_id,
  status,
  price_cents,
  currency,
  billing_period,
  started_at,
  is_grandfathered,
  created_at,
  updated_at
) VALUES
('sub_sarah', 'user_sarah', 'role_pro', 'active', 1500, 'USD', 'MONTHLY', NOW(), FALSE, NOW(), NOW()),
('sub_mike', 'user_mike', 'role_pro', 'active', 1500, 'USD', 'MONTHLY', NOW(), FALSE, NOW(), NOW()),
('sub_alex', 'user_alex', 'role_team', 'active', 2900, 'USD', 'MONTHLY', NOW(), FALSE, NOW(), NOW());

-- ============================================================================
-- ADDITIONAL WORKSPACES
-- ============================================================================

INSERT INTO workspaces (
  id,
  owner_user_id,
  name,
  type,
  created_at,
  updated_at,
  deleted
) VALUES
('ws_work', 'user_jaren', 'Freelance Work', 'WORK', NOW(), NOW(), FALSE),
('ws_team', 'user_alex', 'Design Team', 'TEAM', NOW(), NOW(), FALSE),
('ws_sarah', 'user_sarah', 'Marketing Projects', 'WORK', NOW(), NOW(), FALSE);

-- ============================================================================
-- WORKSPACE MEMBERS (Team workspaces)
-- ============================================================================

INSERT INTO workspace_members (
  id,
  workspace_id,
  user_id,
  role,
  invited_by,
  joined_at
) VALUES
('wm_alex_team', 'ws_team', 'user_alex', 'OWNER', NULL, NOW()),
('wm_sarah_team', 'ws_team', 'user_sarah', 'ADMIN', 'user_alex', NOW()),
('wm_mike_team', 'ws_team', 'user_mike', 'MEMBER', 'user_alex', NOW());

-- ============================================================================
-- ADDITIONAL PROJECTS
-- ============================================================================

INSERT INTO projects (
  id,
  workspace_id,
  user_id,
  name,
  description,
  color,
  completion_percentage,
  created_at,
  updated_at,
  deleted
) VALUES
-- Jaren's freelance work
('proj_client_a', 'ws_work', 'user_jaren', 'Client A Website', 'E-commerce site redesign', '#ec4899', 85, NOW(), NOW(), FALSE),
('proj_client_b', 'ws_work', 'user_jaren', 'Client B App', 'Mobile app development', '#8b5cf6', 45, NOW(), NOW(), FALSE),

-- Design team projects
('proj_design_sys', 'ws_team', 'user_alex', 'Design System', 'Company-wide design system', '#3b82f6', 60, NOW(), NOW(), FALSE),
('proj_brand', 'ws_team', 'user_alex', 'Brand Refresh', 'Update brand guidelines', '#10b981', 30, NOW(), NOW(), FALSE),

-- Sarah's marketing projects
('proj_campaign', 'ws_sarah', 'user_sarah', 'Q1 Campaign', 'Spring product launch', '#f59e0b', 75, NOW(), NOW(), FALSE),
('proj_content', 'ws_sarah', 'user_sarah', 'Content Calendar', 'Social media planning', '#ef4444', 55, NOW(), NOW(), FALSE);

-- ============================================================================
-- ADDITIONAL TASK TYPES
-- ============================================================================

INSERT INTO task_types (
  id,
  workspace_id,
  user_id,
  name,
  icon,
  color,
  is_default,
  display_order,
  created_at
) VALUES
('type_design', 'ws_team', 'user_alex', 'Design', '🎨', '#ec4899', TRUE, FALSE, NOW()),
('type_review', 'ws_team', 'user_alex', 'Review', '👀', '#8b5cf6', FALSE, TRUE, NOW()),
('type_marketing', 'ws_sarah', 'user_sarah', 'Marketing', '📢', '#f59e0b', TRUE, FALSE, NOW()),
('type_content', 'ws_sarah', 'user_sarah', 'Content', '✍️', '#10b981', FALSE, TRUE, NOW());

-- ============================================================================
-- ADDITIONAL TASKS
-- ============================================================================

INSERT INTO tasks (
  id,
  user_id,
  project_id,
  parent_task_id,
  title,
  description,
  difficulty,
  progress,
  status,
  estimated_minutes,
  actual_minutes,
  planned_for_date,
  task_type_id,
  created_at,
  updated_at,
  completed_at,
  deleted
) VALUES
-- Stride Development - More tasks
('task_ui_polish', 'user_jaren', 'proj_stride', NULL, 'Polish UI components', 'Refine spacing, colors, and animations', 'MEDIUM', 80, 'IN_PROGRESS', 120, 95, CURRENT_DATE, 'type_improvement', NOW() - INTERVAL '1 days', NOW(), NULL, FALSE),
('task_tests', 'user_jaren', 'proj_stride', NULL, 'Write integration tests', 'Cover main user flows', 'HARD', 25, 'IN_PROGRESS', 180, 45, CURRENT_DATE, 'type_feature', NOW() - INTERVAL '2 days', NOW(), NULL, FALSE),

-- Client A project tasks
('task_client_a_1', 'user_jaren', 'proj_client_a', NULL, 'Product page redesign', 'Update product gallery and info', 'MEDIUM', 100, 'COMPLETED', 240, 255, CURRENT_DATE + '-3 days'), 'type_feature', NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', FALSE),
('task_client_a_2', 'user_jaren', 'proj_client_a', NULL, 'Shopping cart optimization', 'Improve checkout flow', 'MEDIUM', 90, 'IN_PROGRESS', 180, 162, CURRENT_DATE - INTERVAL '1 day', 'type_improvement', NOW() - INTERVAL '4 days', NOW(), NULL, FALSE),
('task_client_a_3', 'user_jaren', 'proj_client_a', NULL, 'Performance audit', 'Lighthouse score improvements', 'EASY', FALSE, 'PLANNED', 60, FALSE, CURRENT_DATE + INTERVAL '2 days', 'type_improvement', NOW(), NOW(), NULL, FALSE),

-- Client B project tasks
('task_client_b_1', 'user_jaren', 'proj_client_b', NULL, 'User authentication', 'Implement login and signup', 'HARD', 100, 'COMPLETED', 300, 285, CURRENT_DATE + '-7 days'), 'type_feature', NOW() - INTERVAL '10 days', NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days', FALSE),
('task_client_b_2', 'user_jaren', 'proj_client_b', NULL, 'Dashboard UI', 'Create main dashboard screen', 'MEDIUM', 60, 'IN_PROGRESS', 180, 108, CURRENT_DATE, 'type_feature', NOW() - INTERVAL '3 days', NOW(), NULL, FALSE),
('task_client_b_3', 'user_jaren', 'proj_client_b', NULL, 'Push notifications', 'Set up Firebase Cloud Messaging', 'HARD', FALSE, 'BACKLOG', 240, FALSE, NULL, 'type_feature', NOW(), NOW(), NULL, FALSE),

-- Design system tasks
('task_design_1', 'user_alex', 'proj_design_sys', NULL, 'Button components', 'Create all button variants', 'EASY', 100, 'COMPLETED', 90, 85, CURRENT_DATE + '-5 days'), 'type_design', NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', FALSE),
('task_design_2', 'user_alex', 'proj_design_sys', NULL, 'Form components', 'Input, select, checkbox, radio', 'MEDIUM', 70, 'IN_PROGRESS', 180, 126, CURRENT_DATE - INTERVAL '1 day', 'type_design', NOW() - INTERVAL '4 days', NOW(), NULL, FALSE),
('task_design_3', 'user_sarah', 'proj_design_sys', NULL, 'Documentation site', 'Build Storybook documentation', 'MEDIUM', 40, 'IN_PROGRESS', 240, 96, CURRENT_DATE, 'type_feature', NOW() - INTERVAL '2 days', NOW(), NULL, FALSE),

-- Brand refresh tasks
('task_brand_1', 'user_alex', 'proj_brand', NULL, 'Logo variations', 'Create light/dark/color versions', 'MEDIUM', 100, 'COMPLETED', 120, 135, CURRENT_DATE + '-4 days'), 'type_design', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', FALSE),
('task_brand_2', 'user_alex', 'proj_brand', NULL, 'Color palette', 'Define new brand colors', 'EASY', 100, 'COMPLETED', 60, 55, CURRENT_DATE + '-6 days'), 'type_design', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', FALSE),
('task_brand_3', 'user_mike', 'proj_brand', NULL, 'Typography system', 'Font pairings and scale', 'EASY', 30, 'IN_PROGRESS', 90, 27, CURRENT_DATE, 'type_design', NOW() - INTERVAL '1 days', NOW(), NULL, FALSE),

-- Marketing campaign tasks
('task_campaign_1', 'user_sarah', 'proj_campaign', NULL, 'Landing page copy', 'Write conversion-focused copy', 'MEDIUM', 100, 'COMPLETED', 120, 115, CURRENT_DATE + '-8 days'), 'type_content', NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', FALSE),
('task_campaign_2', 'user_sarah', 'proj_campaign', NULL, 'Email sequence', 'Create 5-email nurture sequence', 'MEDIUM', 80, 'IN_PROGRESS', 180, 144, CURRENT_DATE + '-2 days'), 'type_content', NOW() - INTERVAL '5 days', NOW(), NULL, FALSE),
('task_campaign_3', 'user_sarah', 'proj_campaign', NULL, 'Social media ads', 'Design ad creatives for Meta', 'EASY', 50, 'IN_PROGRESS', 90, 45, CURRENT_DATE, 'type_marketing', NOW() - INTERVAL '1 days', NOW(), NULL, FALSE),

-- Content calendar tasks
('task_content_1', 'user_sarah', 'proj_content', NULL, 'Instagram content plan', 'Plan 30 days of posts', 'EASY', 100, 'COMPLETED', 60, 65, CURRENT_DATE + '-3 days'), 'type_content', NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', FALSE),
('task_content_2', 'user_sarah', 'proj_content', NULL, 'Blog post schedule', 'Plan Q1 blog topics', 'EASY', 60, 'IN_PROGRESS', 45, 27, CURRENT_DATE, 'type_content', NOW() - INTERVAL '2 days', NOW(), NULL, FALSE),
('task_content_3', 'user_sarah', 'proj_content', NULL, 'Video scripts', 'Write 5 product demo scripts', 'MEDIUM', FALSE, 'PLANNED', 120, FALSE, CURRENT_DATE + INTERVAL '3 days', 'type_content', NOW(), NOW(), NULL, FALSE);

-- ============================================================================
-- TIME ENTRIES
-- ============================================================================

INSERT INTO time_entries (
  id,
  task_id,
  user_id,
  started_at,
  ended_at,
  created_at
) VALUES
('time_1', 'task_db_setup', 'user_jaren', NOW() - INTERVAL '2 days' + INTERVAL '9 hours', NOW() - INTERVAL '2 days' + INTERVAL '12 hours' + INTERVAL '15 minutes', NOW() - INTERVAL '2 days'),
('time_2', 'task_client_a_1', 'user_jaren', NOW() - INTERVAL '5 days' + INTERVAL '10 hours', NOW() - INTERVAL '5 days' + INTERVAL '14 hours' + INTERVAL '15 minutes', NOW() - INTERVAL '5 days'),
('time_3', 'task_client_b_1', 'user_jaren', NOW() - INTERVAL '10 days' + INTERVAL '9 hours', NOW() - INTERVAL '10 days' + INTERVAL '13 hours' + INTERVAL '45 minutes', NOW() - INTERVAL '10 days'),
('time_4', 'task_design_1', 'user_alex', NOW() - INTERVAL '6 days' + INTERVAL '14 hours', NOW() - INTERVAL '6 days' + INTERVAL '15 hours' + INTERVAL '25 minutes', NOW() - INTERVAL '6 days'),
('time_5', 'task_campaign_1', 'user_sarah', NOW() - INTERVAL '10 days' + INTERVAL '11 hours', NOW() - INTERVAL '10 days' + INTERVAL '13 hours', NOW() - INTERVAL '10 days');

-- ============================================================================
-- DAILY SUMMARIES
-- ============================================================================

INSERT INTO daily_summaries (
  id,
  user_id,
  date,
  tasks_completed,
  tasks_worked_on,
  total_points,
  focus_minutes,
  efficiency_rating,
  standout_moment,
  created_at
) VALUES
('summary_jaren_1', 'user_jaren', CURRENT_DATE + '-2 days'), TRUE, 3, 150, 195, 0.92, 'Successfully set up entire database infrastructure', NOW() - INTERVAL '2 days' + INTERVAL '17 hours'),
('summary_jaren_2', 'user_jaren', CURRENT_DATE + '-1 days'), FALSE, 2, 95, 120, 0.85, NULL, NOW() - INTERVAL '1 days' + INTERVAL '17 hours'),
('summary_alex_1', 'user_alex', CURRENT_DATE + '-6 days'), 2, 2, 120, 140, 0.88, 'Completed brand color palette ahead of schedule', NOW() - INTERVAL '6 days' + INTERVAL '18 hours'),
('summary_sarah_1', 'user_sarah', CURRENT_DATE + '-10 days'), TRUE, 1, 115, 115, 0.95, 'Nailed the landing page copy on first draft', NOW() - INTERVAL '10 days' + INTERVAL '17 hours');

-- ============================================================================
-- USER PREFERENCES FOR NEW USERS
-- ============================================================================

INSERT INTO user_preferences (
  user_id,
  theme,
  planning_mode,
  check_in_frequency,
  check_in_enabled,
  end_of_day_summary_time,
  end_of_day_summary_enabled,
  auto_pause_minutes,
  auto_pause_enabled,
  break_reminder_enabled,
  break_reminder_minutes,
  updated_at
) VALUES
('user_sarah', 'LIGHT', 'WEEKLY', 60, TRUE, '18:00', TRUE, 15, TRUE, 1, 120, NOW()),
('user_mike', 'DARK', 'DAILY', 45, TRUE, '17:30', TRUE, 10, TRUE, FALSE, 90, NOW()),
('user_alex', 'DARK', 'WEEKLY', 30, TRUE, '19:00', TRUE, 10, TRUE, 1, 90, NOW());
