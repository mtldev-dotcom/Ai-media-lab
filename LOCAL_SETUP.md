# Local Development Setup - Supabase Docker

This guide helps you set up a local Supabase instance using Docker for development.

## Prerequisites

- Docker installed (version 20.10+)
- Docker Compose (v2.0+)
- At least 2GB of free RAM
- At least 5GB of free disk space

## Architecture

Local setup includes:
- **PostgreSQL** on port 54320 (mapped from container port 5432)
- **PostgREST** (REST API) on port 3001
- **Database schema** with 10 core tables
- **RLS policies** for development

## Quick Start

### 1. Start Docker Services

```bash
cd /home/mtldev/git-dev/ai-medialab
docker compose up -d
```

Wait 10-15 seconds for services to start:

```bash
docker compose ps
```

You should see:
```
NAME                IMAGE                         STATUS
supabase_postgres   postgres:15-alpine            healthy
supabase_rest       postgrest/postgrest:v12.0.1   running
```

### 2. Verify Database is Ready

```bash
# Check PostgreSQL
docker exec supabase_postgres psql -U postgres -d postgres -c "SELECT version();"

# List tables (verify migration applied)
docker exec supabase_postgres psql -U postgres -d postgres -c "\dt public.*"

# Should show 10 tables:
# assets, budget_alerts, conversion_jobs, generations, projects,
# provider_configs, provider_health, usage_analytics, user_api_keys, users
```

### 3. Environment Variables Already Set

The `.env.local` file is already configured with:

```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:3001  # PostgREST endpoint
NEXT_PUBLIC_SUPABASE_ANON_KEY=...              # JWT token
DATABASE_URL=postgres://postgres:postgres@localhost:54320/postgres
```

### 4. Start Development Server

```bash
cd web
npm run dev
```

Visit: http://localhost:3000

You should be redirected to /login

## Services & Ports

| Service | Port | Description |
|---------|------|-------------|
| PostgreSQL | 54320 | Database (postgres:postgres) |
| PostgREST | 3001 | REST API (auto-generated from schema) |
| Next.js App | 3000 | Your application |

## Database Access

### Query Database Directly

```bash
# Connect with psql (in Docker)
docker exec -it supabase_postgres psql -U postgres -d postgres

# Common commands
\dt                          # List all tables
SELECT * FROM public.users;  # Query users
\d public.projects           # Show projects table schema
```

### Via REST API

```bash
# Get all users
curl http://localhost:3001/users

# Get all projects
curl http://localhost:3001/projects

# Filter by user_id
curl "http://localhost:3001/projects?user_id=eq.{user_id}"
```

## Common Commands

### View Logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f postgres
docker compose logs -f rest
```

### Stop Services

```bash
# Stop (containers preserved)
docker compose stop

# Stop and remove
docker compose down

# Remove volumes too
docker compose down -v
```

### Restart Services

```bash
# Restart all
docker compose restart

# Restart specific
docker compose restart postgres
```

### Database Commands

```bash
# Backup database
docker exec supabase_postgres pg_dump -U postgres postgres > backup.sql

# Restore database
docker exec -i supabase_postgres psql -U postgres postgres < backup.sql

# Remove all data
docker exec supabase_postgres psql -U postgres -d postgres -c "
  TRUNCATE public.users CASCADE;
  TRUNCATE public.projects CASCADE;
  TRUNCATE public.assets CASCADE;
"
```

## Troubleshooting

### Port 54320 Already in Use

```bash
# Find what's using the port
lsof -i :54320

# Kill the process
kill -9 <PID>

# Or use a different port - edit docker-compose.yml
ports:
  - '54321:5432'  # Use 54321 instead
```

### Services Not Starting

```bash
# Check logs
docker compose logs

# Restart services
docker compose restart

# Full reset (careful - removes data)
docker compose down -v
docker compose up -d
```

### Can't Connect from Next.js

Ensure `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=http://localhost:3001
```

### PostgREST Returns 404

Make sure you have:
1. Created the tables (migration ran successfully)
2. Granted anon role permissions (already done in migration)
3. Table name matches exactly (e.g., `/users` not `/Users`)

## Testing the Connection

### From Command Line

```bash
# Test REST API
curl http://localhost:3001/

# Insert test user (returns 200 if successful)
curl -X POST http://localhost:3001/users \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","name":"Test User"}'

# Verify user was created
curl http://localhost:3001/users
```

### From Next.js App

```javascript
import { supabase } from '@/lib/db/client'

// Test auth
const { data: user } = await supabase.auth.getUser()

// Test database
const { data: projects } = await supabase
  .from('projects')
  .select('*')
  .limit(10)

console.log('User:', user)
console.log('Projects:', projects)
```

## Development Tips

1. **Check RLS Policies**: All queries respect RLS - make sure you set proper JWT/auth context
2. **CORS**: PostgREST is configured for localhost - adjust if accessing from different host
3. **JWT Secret**: Matches what Next.js uses - change if you want tighter security
4. **Offline Development**: You can work without internet once Docker is running
5. **Data Persistence**: `postgres_data` volume persists data between restarts

## Performance

- **First startup**: ~10-15 seconds
- **Subsequent starts**: ~3-5 seconds
- **Database queries**: <100ms on local machine
- **REST API**: <50ms response time

## Cleanup

When done developing:

```bash
# Stop all services
docker compose down

# Free up disk space
docker volume prune
docker image prune

# Full cleanup (removes everything)
docker system prune -a
```

## Production Notes

For production deployment:
1. Use managed Supabase (supabase.com) or self-hosted production Postgres
2. Update `NEXT_PUBLIC_SUPABASE_URL` to production URL
3. Use strong encryption keys
4. Implement proper JWT verification
5. Enable HTTPS
6. Set up proper RLS policies
7. Configure backups
8. Use connection pooling (PgBouncer)

## Documentation Links

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [PostgREST Docs](https://postgrest.org/en/stable/)
- [Docker Docs](https://docs.docker.com/)

## Next Steps

1. ✅ Docker services running
2. ✅ Database migrated
3. ✅ Environment configured
4. Start development server: `npm run dev`
5. Test login/signup
6. Begin Phase 2 implementation

---

**Local Supabase is ready for development!**
