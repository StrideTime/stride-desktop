#!/bin/bash
# Reset and migrate database to latest schema

set -e

echo "🔄 Resetting Stride database..."

# Get DATABASE_URL from env
if [ ! -f "src-tauri/.env.backend" ]; then
  echo "❌ src-tauri/.env.backend not found"
  exit 1
fi

DB_URL=$(grep "DATABASE_URL=" src-tauri/.env.backend | cut -d'=' -f2-)

if [ -z "$DB_URL" ]; then
  echo "❌ DATABASE_URL not found in .env.backend"
  exit 1
fi

echo "📊 Database: $DB_URL"

# Drop all tables
echo "🗑️  Dropping old tables..."
psql "$DB_URL" <<'EOF'
-- Drop all tables (in correct order to handle foreign keys)
DROP TABLE IF EXISTS workspace_members CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;
DROP TABLE IF EXISTS daily_summaries CASCADE;
DROP TABLE IF EXISTS points_ledger CASCADE;
DROP TABLE IF EXISTS time_entries CASCADE;
DROP TABLE IF EXISTS scheduled_events CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS task_types CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS subscription_history CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- Drop old/legacy tables that might exist
DROP TABLE IF EXISTS permissions CASCADE;
DROP TABLE IF EXISTS role_permissions CASCADE;
EOF

echo "✓ Old tables dropped"

# Apply latest migration
echo "📝 Applying latest schema migration..."
psql "$DB_URL" < scripts/schema.sql

echo "✓ Schema migration complete"

# Load seed data
SEED_TYPE=$(grep "SEED_DATA=" .env.local 2>/dev/null | cut -d'=' -f2 || echo "minimal")

if [ -z "$SEED_TYPE" ] || [ "$SEED_TYPE" = "none" ]; then
  echo "⚠️  No seed data configured"
else
  echo "🌱 Loading seed data ($SEED_TYPE)..."
  if [ -f "seeds/${SEED_TYPE}.sql" ]; then
    psql "$DB_URL" < "seeds/${SEED_TYPE}.sql"
    echo "✓ Seed data loaded"
  else
    echo "⚠️  Seed file seeds/${SEED_TYPE}.sql not found"
  fi
fi

echo ""
echo "✅ Database reset complete!"
echo ""
echo "Next steps:"
echo "  - Refresh Supabase Studio: http://studio.stride.local"
echo ""
