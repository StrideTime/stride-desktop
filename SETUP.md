# Stride Desktop - Local Development Setup

Complete setup guide for running Stride Desktop with self-hosted Supabase, PowerSync, and all development services.

## What Was Implemented

✅ **Backend Security** - Tauri backend environment management with secure key storage
✅ **Database Initialization** - Automatic database setup with migration support
✅ **Interactive Setup CLI** - User-friendly environment configuration wizard
✅ **Service Orchestration** - Automated startup of Supabase, PowerSync, and supporting services
✅ **Custom Domains** - Local domain routing (supabase.stride.local, db.stride.local, etc.)
✅ **Database Seeding** - Three seed options (essential, minimal, complete)
✅ **Error Tracking** - Sentry integration for both frontend and backend
✅ **Package Scripts** - Convenient yarn commands for all operations

## Quick Start

```bash
# 1. Install dependencies
cd stride-desktop
yarn install

# 2. Run interactive setup (will prompt for all config)
yarn setup

# 3. Start the app
yarn dev
```

That's it! The setup script will:
- Ask if you want local-only mode or cloud sync
- Optionally start self-hosted Supabase + PowerSync
- Configure environment files
- Seed the database with demo data
- Show you all service URLs

## Prerequisites

- **Node.js 24+** (for running the app)
- **Rust** (for Tauri backend)
- **Docker Desktop** (for self-hosted services)
- **jq** (`brew install jq` on macOS) - for JSON parsing

## Architecture Overview

### Security Model

**Public (Frontend - .env.local):**
- `VITE_SUPABASE_URL` - API endpoint ✅ Safe
- `VITE_SUPABASE_ANON_KEY` - Limited permissions, protected by RLS ✅ Safe
- `VITE_POWERSYNC_URL` - API endpoint ✅ Safe
- `VITE_SENTRY_DSN` - Designed to be public ✅ Safe

**Private (Backend - src-tauri/.env.backend):**
- `SUPABASE_SERVICE_ROLE_KEY` - Bypasses RLS ❌ Secret
- `JWT_SECRET` - Signs auth tokens ❌ Secret
- `DATABASE_URL` - Direct DB access ❌ Secret
- `SENTRY_DSN` - Backend error tracking ⚠️ Private

### Services

When self-hosting, you'll have:

| Service | URL | Purpose |
|---------|-----|---------|
| Supabase API | http://supabase.stride.local | Backend API |
| Supabase Studio | http://studio.stride.local | Database admin UI |
| PowerSync | http://powersync.stride.local | Sync engine |
| Drizzle Studio | http://db.stride.local | Database schema viewer |
| Mailpit | http://localhost:8025 | Email testing (optional) |

## Setup Options

### Option 1: Local-Only Mode (Simplest)

No cloud services, just local SQLite database.

```bash
yarn setup
# Choose: "Run in local-only mode? Yes"
yarn dev
```

**Use for:** Offline development, no sync needed

### Option 2: Self-Hosted (Recommended for Dev)

Run Supabase + PowerSync locally in Docker.

```bash
yarn setup
# Choose: "Run in local-only mode? No"
# Choose: "Self-host Supabase locally? Yes"
# Choose: "Self-host PowerSync locally? Yes"
# Choose: Mailpit for email
# Choose: Minimal or Complete seed data
# Choose: Configure Sentry (optional)

yarn start  # If setup didn't auto-start
yarn dev
```

**Use for:** Full-stack development, testing sync

### Option 3: Managed Services (Production-like)

Connect to existing Supabase + PowerSync instances.

```bash
yarn setup
# Choose: "Run in local-only mode? No"
# Choose: "Self-host Supabase locally? No"
# Enter your Supabase URL + keys
# Choose: "Self-host PowerSync locally? No"
# Enter your PowerSync URL

yarn dev
```

**Use for:** Testing against staging/production services

## Available Scripts

### Setup & Start
```bash
yarn setup              # Interactive environment setup
yarn start              # Start all local services
yarn stop               # Stop all services
yarn reset              # Reset database and restart
yarn dev                # Start the Tauri app
```

### Database
```bash
yarn studio             # Open Supabase Studio
yarn studio:drizzle     # Open Drizzle Studio
```

### Monitoring
```bash
yarn logs               # View Docker service logs
yarn mailpit            # Open Mailpit email UI (if configured)
```

## File Structure

```
stride-desktop/
├── src/
│   ├── lib/
│   │   └── db.ts              # Database initialization
│   ├── App.tsx                # App entry (with DB init)
│   └── main.tsx               # Sentry setup
├── src-tauri/
│   ├── src/
│   │   ├── env.rs             # Backend env loader
│   │   └── lib.rs             # Tauri commands
│   └── .env.backend           # Backend secrets (gitignored)
├── scripts/
│   ├── setup-cli.ts           # Interactive setup wizard
│   ├── start-local.sh         # Service startup script
│   └── setup-hosts.sh         # Hosts file configuration
├── nginx/
│   └── nginx.conf             # Reverse proxy config
├── seeds/
│   ├── essential.sql          # Roles/permissions only
│   ├── minimal.sql            # Basic demo data
│   ├── complete.sql           # Full demo data
│   └── README.md              # Seed documentation
├── .env.local                 # Frontend config (gitignored)
├── .env.example               # Template
└── docker-compose.yml         # Generated by setup (gitignored)
```

## Database Seeding

### Seed Options

**Essential** - Roles, permissions, basic config only
- Use for: Production-like setup

**Minimal** - Essential + 3 users, 1 workspace, 5 tasks
- Use for: Quick testing

**Complete** - Minimal + 6 users, 3 workspaces, 18 tasks
- Use for: Comprehensive testing

### Manual Seeding

```bash
# Get database URL
DB_URL=$(grep "DATABASE_URL=" src-tauri/.env.backend | cut -d'=' -f2-)

# Load seed
psql "$DB_URL" < seeds/minimal.sql
```

## Troubleshooting

### Setup Script Fails

**Problem:** `yarn setup` errors
**Solution:**
```bash
# Check prerequisites
docker --version
docker-compose --version
node --version

# Make scripts executable
chmod +x scripts/*.sh
```

### Supabase Won't Start

**Problem:** `supabase start` hangs or fails
**Solution:**
```bash
# Check Docker is running
docker ps

# Reset Supabase
supabase stop
supabase start
```

### Services Not Accessible

**Problem:** Can't reach http://supabase.stride.local
**Solution:**
```bash
# Check hosts file
cat /etc/hosts | grep stride.local

# If missing, run:
./scripts/setup-hosts.sh
```

### Port Conflicts

**Problem:** Ports 5432, 8080, etc. in use
**Solution:**
```bash
# See what's using ports
lsof -i :5432
lsof -i :8080

# Stop conflicting services or change ports in docker-compose.yml
```

### Database Connection Fails

**Problem:** App can't connect to database
**Solution:**
```bash
# Verify services running
docker ps
supabase status

# Check environment files exist
ls -la .env.local src-tauri/.env.backend

# Restart services
yarn stop && yarn start
```

### Homebrew Not Installed (macOS)

**Problem:** Script tries to use brew but it's not installed
**Solution:** The script will auto-fallback to npm installation:
```bash
npm install -g supabase
```

Or install Homebrew:
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

## Advanced Configuration

### Custom PostgreSQL URL

If using external PostgreSQL, set in setup CLI or manually edit:

```bash
# src-tauri/.env.backend
DATABASE_URL=postgresql://user:pass@host:port/database
```

### Skip Auto-Start

Don't want setup to start services?

```bash
yarn setup
# When asked "Start services now?", choose No
# Start later with: yarn start
```

### Change Seed Data

To reload different seed data:

```bash
# Edit .env.local
SEED_DATA=complete  # Change to: essential, minimal, complete, or none

# Reset and reseed
yarn reset
```

### Use External Supabase

Already have a Supabase project?

```bash
yarn setup
# Choose: "Self-host Supabase locally? No"
# Enter your project URL and keys
```

## Next Steps

1. **Read the plan:** Check `/Users/jaren/.claude/plans/binary-spinning-crane.md` for full implementation details

2. **Check FUNCTIONALITY.md:** See `.agents/FUNCTIONALITY.md` for app architecture

3. **Review TODO.md:** See `.agents/TODO.md` for remaining tasks

4. **Install dependencies:**
   ```bash
   yarn install
   ```

5. **Build Rust backend:**
   ```bash
   cargo build
   ```

6. **Run setup:**
   ```bash
   yarn setup
   ```

## Security Notes

- ✅ Anon key is **safe to expose** - it's protected by Row Level Security
- ❌ Service role key **must stay private** - it bypasses all security rules
- ⚠️ Never commit `.env.local` or `.env.backend`
- ✅ All secrets stay in Tauri backend, never exposed to frontend
- ✅ Frontend only receives database URL, no sensitive keys

## Support

For issues:
1. Check this guide's troubleshooting section
2. Review the plan file for implementation details
3. Check Docker/Supabase logs: `yarn logs` or `supabase status`
4. Verify all prerequisites are installed

---

**You're all set!** Run `yarn setup` to get started. 🚀
