#!/bin/bash
set -e

echo "🚀 Starting Stride Desktop services..."

# Check if .env.local exists
if [ ! -f .env.local ]; then
  echo "❌ .env.local not found. Run 'yarn setup' first."
  exit 1
fi

# Load environment to determine what to start
source .env.local

# Check for local-only mode
if [ "$VITE_LOCAL_ONLY" = "true" ]; then
  echo "ℹ️  Running in local-only mode (no services to start)"
  exit 0
fi

# Update hosts file
./scripts/setup-hosts.sh

# Determine if self-hosting Supabase
SELF_HOST_SUPABASE=false
if grep -q "(will be auto-generated)" .env.local; then
  SELF_HOST_SUPABASE=true
fi

# Start Supabase if self-hosting
if [ "$SELF_HOST_SUPABASE" = true ]; then
  # Check if Supabase CLI is installed
  if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI not found. Installing..."

    # Detect OS and install
    if [[ "$OSTYPE" == "darwin"* ]]; then
      # macOS - check for Homebrew first
      if command -v brew &> /dev/null; then
        echo "📦 Installing via Homebrew..."
        brew install supabase/tap/supabase
      else
        echo "ℹ️  Homebrew not found. Installing via npm..."
        npm install -g supabase
      fi
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
      # Linux installation via official script
      echo "📦 Installing via official installer..."
      curl -fsSL https://supabase.com/install.sh | sh
    else
      # Windows or other - use npm
      echo "📦 Installing via npm..."
      npm install -g supabase
    fi

    # Verify installation
    if ! command -v supabase &> /dev/null; then
      echo "❌ Installation failed. Please install Supabase CLI manually:"
      echo "   https://supabase.com/docs/guides/cli"
      exit 1
    fi

    echo "✓ Supabase CLI installed"
  fi

  echo "🐘 Starting Supabase..."
  supabase start

  # Wait for Supabase
  echo "⏳ Waiting for Supabase..."
  until supabase status > /dev/null 2>&1; do
    sleep 2
  done

  # Extract keys and PostgreSQL URL
  ANON_KEY=$(supabase status -o json | jq -r '.anon_key')
  SERVICE_KEY=$(supabase status -o json | jq -r '.service_role_key')
  JWT_SECRET=$(supabase status -o json | jq -r '.jwt_secret')
  PG_URL=$(supabase status -o json | jq -r '.db_url')

  # Update .env.local
  sed -i.bak "s|VITE_SUPABASE_ANON_KEY=.*|VITE_SUPABASE_ANON_KEY=$ANON_KEY|" .env.local
  rm -f .env.local.bak

  # Update .env.backend
  sed -i.bak "s|SUPABASE_SERVICE_ROLE_KEY=.*|SUPABASE_SERVICE_ROLE_KEY=$SERVICE_KEY|" src-tauri/.env.backend
  sed -i.bak "s|JWT_SECRET=.*|JWT_SECRET=$JWT_SECRET|" src-tauri/.env.backend
  sed -i.bak "s|DATABASE_URL=.*|DATABASE_URL=$PG_URL|" src-tauri/.env.backend
  rm -f src-tauri/.env.backend.bak

  echo "✓ Supabase keys updated"
fi

# Start Docker services (PowerSync, Mailpit, Drizzle Studio, nginx)
if [ -f docker-compose.yml ]; then
  echo "🐳 Starting Docker services..."
  docker compose up -d

  # Wait for services
  echo "⏳ Waiting for services to be ready..."
  sleep 5
fi

# Load seed data if specified
SEED_TYPE=$(grep "SEED_DATA=" .env.local | cut -d'=' -f2)
if [ ! -z "$SEED_TYPE" ] && [ "$SEED_TYPE" != "none" ]; then
  echo "🌱 Loading seed data ($SEED_TYPE)..."

  # Get DATABASE_URL from backend env
  DB_URL=$(grep "DATABASE_URL=" src-tauri/.env.backend | cut -d'=' -f2-)

  if [ ! -z "$DB_URL" ] && [[ "$DB_URL" == postgresql* ]]; then
    # Check if seed file exists
    if [ -f "seeds/${SEED_TYPE}.sql" ]; then
      psql "$DB_URL" < "seeds/${SEED_TYPE}.sql"
      echo "✓ Seed data loaded"
    else
      echo "⚠️  Seed file seeds/${SEED_TYPE}.sql not found"
    fi
  else
    echo "⚠️  Cannot seed: DATABASE_URL not configured for PostgreSQL"
  fi
fi

echo ""
echo "✅ All services running!"
echo ""
