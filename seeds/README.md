# Database Seed Files

SQL dumps for seeding the Stride database with sample data.

## Files

- **essential.sql** - Roles, permissions, and basic app configuration only
- **minimal.sql** - Basic setup (3 users, 1 workspace, 5 tasks)
- **complete.sql** - Full demo data (6 users, 3 workspaces, 5 projects, 18 tasks with varied statuses)

## Usage

During `yarn setup`, choose which seed to load. Or manually:

```bash
# Load essential seed (roles/permissions only)
psql $DATABASE_URL < seeds/essential.sql

# Load minimal seed
psql $DATABASE_URL < seeds/minimal.sql

# Load complete seed
psql $DATABASE_URL < seeds/complete.sql
```

## Seed Options

### Essential
- 3 roles (Free, Pro, Team)
- 3 permissions (workspace.create, sync.enable, team.collaborate)
- Role-permission mappings

**Use for:** Production-like setup with no demo data

### Minimal
- Essential data +
- 3 test users (free@stride.local, demo@stride.local, admin@stride.local)
- 1 workspace
- 1 project
- 5 basic tasks
- 3 task types

**Use for:** Quick testing and development

### Complete
- Minimal data +
- 6 users total
- 3 workspaces (Personal, Work, Team)
- 5 projects across workspaces
- 18 tasks with varied statuses (BACKLOG, PLANNED, IN_PROGRESS, COMPLETED)
- Time entries for completed tasks
- Demonstrates full app functionality

**Use for:** Comprehensive testing and demos

## Generating Custom Seeds

To create a new seed from your current database:

```bash
# Export specific tables
pg_dump $DATABASE_URL \
  --data-only \
  --inserts \
  --table=users \
  --table=workspaces \
  --table=projects \
  --table=tasks \
  > seeds/custom.sql
```

## Test User Credentials

All test users can use any password in local development (auth bypass in dev mode).

In production with real Supabase auth:
- free@stride.local
- demo@stride.local
- admin@stride.local
- team1@stride.local
- team2@stride.local
- team3@stride.local

(You'll need to create these users in Supabase Auth)
