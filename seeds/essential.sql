-- Essential seed data for Stride
-- Roles with feature flags only
-- Generated: 2026-02-05

INSERT INTO roles (
  id,
  display_name,
  description,
  cloud_sync,
  mobile_app,
  team_workspaces,
  export_reports,
  api_access,
  sso,
  audit_logs,
  custom_integrations,
  priority_support,
  max_workspaces,
  max_projects,
  max_team_members,
  max_api_calls_per_day,
  max_storage_mb,
  is_active,
  created_at,
  updated_at
) VALUES
('role_free', 'Free', 'Local-only mode with basic features', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, 1, 10, NULL, NULL, 100, TRUE, NOW(), NOW()),
('role_pro', 'Pro', 'Cloud sync with advanced features', TRUE, TRUE, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE, 3, NULL, NULL, 10000, 1000, TRUE, NOW(), NOW()),
('role_team', 'Team', 'Full collaboration with team workspaces', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, NULL, NULL, 50, 100000, 10000, TRUE, NOW(), NOW());
