# Supabase Cloud Setup Guide

This guide walks you through setting up the AI Media Creation Workspace with Supabase Cloud.

## Prerequisites

- Supabase account (create at https://supabase.com)
- Database created in Supabase Cloud

## Step 1: Create Supabase Cloud Project

1. Go to https://supabase.com
2. Sign in to your account
3. Click **"New Project"**
4. Fill in the details:
   - **Name**: `ai-medialab` (or your preferred name)
   - **Database Password**: Save this securely
   - **Region**: Choose closest to your location
   - **Pricing Plan**: Free or Pro
5. Click **"Create new project"** and wait for initialization (2-5 minutes)

## Step 2: Get Your Credentials

Once the project is initialized:

### Get Project URL and Anon Key
1. Click **"Connect"** button or go to **Settings → API**
2. Copy these values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **Anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Get Service Role Key
1. Go to **Settings → API**
2. Scroll down to find **"Service role secret"**
3. Copy this → `SUPABASE_SERVICE_KEY`

## Step 3: Update Environment Variables

Update your `.env.local` file:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here
```

## Step 4: Run Database Migrations

### Option A: Using SQL Editor (Recommended for beginners)

1. Go to your Supabase dashboard
2. Click **"SQL Editor"** in the left sidebar
3. Click **"New Query"**
4. Copy and paste the complete SQL script below
5. Click **"Run"** or press **Ctrl+Enter**
6. Wait for successful completion

### Option B: Using psql (Advanced)

```bash
# Replace with your connection details
psql "postgresql://postgres:YOUR_PASSWORD@db.REGION.supabase.co:5432/postgres" < supabase/migrations/003_supabase_cloud_setup.sql
```

## Database Migration SQL Script

Copy the entire script below and paste it into the Supabase SQL Editor:

```sql
-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  budget_cents INTEGER DEFAULT 0,
  spent_cents INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}',
  archived_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Assets table
CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  name VARCHAR(255),
  description TEXT,
  file_url TEXT,
  file_size_bytes BIGINT,
  file_format VARCHAR(50),
  width INTEGER,
  height INTEGER,
  duration_seconds DECIMAL,
  generation_id UUID,
  thumbnail_url TEXT,
  metadata JSONB DEFAULT '{}',
  tags TEXT[],
  favorite BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Generations table
CREATE TABLE IF NOT EXISTS public.generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  generation_type VARCHAR(50) NOT NULL,
  prompt TEXT NOT NULL,
  parameters JSONB DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  result JSONB,
  error_message TEXT,
  tokens_input INTEGER,
  tokens_output INTEGER,
  tokens_total INTEGER,
  cost_cents INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User API Keys table
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  key_name VARCHAR(255),
  encrypted_key TEXT NOT NULL,
  encryption_iv TEXT NOT NULL,
  encryption_salt TEXT NOT NULL,
  encryption_auth_tag TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider, key_name)
);

-- Provider Configuration table
CREATE TABLE IF NOT EXISTS public.provider_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  priority INTEGER DEFAULT 0,
  is_enabled BOOLEAN DEFAULT TRUE,
  fallback_provider VARCHAR(50),
  rate_limit_per_minute INTEGER DEFAULT 60,
  monthly_budget_cents INTEGER,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider)
);

-- Provider Health table
CREATE TABLE IF NOT EXISTS public.provider_health (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'unknown',
  last_success_at TIMESTAMP WITH TIME ZONE,
  last_failure_at TIMESTAMP WITH TIME ZONE,
  failure_count INTEGER DEFAULT 0,
  avg_response_time_ms DECIMAL,
  error_message TEXT,
  checked_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, user_id)
);

-- Usage Analytics table
CREATE TABLE IF NOT EXISTS public.usage_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id),
  period_type VARCHAR(20) NOT NULL,
  period_start DATE NOT NULL,
  provider VARCHAR(50),
  model VARCHAR(100),
  generation_type VARCHAR(50),
  request_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost_cents INTEGER DEFAULT 0,
  avg_duration_ms DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, project_id, period_type, period_start, provider, model)
);

-- Budget Alerts table
CREATE TABLE IF NOT EXISTS public.budget_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id),
  alert_type VARCHAR(50) NOT NULL,
  threshold_cents INTEGER,
  current_spend_cents INTEGER,
  triggered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Conversion Jobs table
CREATE TABLE IF NOT EXISTS public.conversion_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  source_asset_id UUID REFERENCES public.assets(id),
  target_asset_id UUID REFERENCES public.assets(id),
  conversion_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  parameters JSONB DEFAULT '{}',
  error_message TEXT,
  cost_cents INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at);
CREATE INDEX IF NOT EXISTS idx_assets_project_id ON public.assets(project_id);
CREATE INDEX IF NOT EXISTS idx_assets_user_id ON public.assets(user_id);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON public.assets(created_at);
CREATE INDEX IF NOT EXISTS idx_generations_user_id ON public.generations(user_id);
CREATE INDEX IF NOT EXISTS idx_generations_project_id ON public.generations(project_id);
CREATE INDEX IF NOT EXISTS idx_generations_created_at ON public.generations(created_at);
CREATE INDEX IF NOT EXISTS idx_generations_provider ON public.generations(provider);
CREATE INDEX IF NOT EXISTS idx_generations_status ON public.generations(status);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.user_api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_provider ON public.user_api_keys(provider);
CREATE INDEX IF NOT EXISTS idx_provider_health_provider ON public.provider_health(provider);
CREATE INDEX IF NOT EXISTS idx_provider_health_status ON public.provider_health(status);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_user_id ON public.usage_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_analytics_period_start ON public.usage_analytics(period_start);
CREATE INDEX IF NOT EXISTS idx_budget_alerts_user_id ON public.budget_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_jobs_user_id ON public.conversion_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_conversion_jobs_status ON public.conversion_jobs(status);

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_health ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversion_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY users_auth_policy ON public.users FOR ALL USING (auth.uid() = id);
CREATE POLICY projects_auth_policy ON public.projects FOR ALL USING (auth.uid() = user_id);
CREATE POLICY assets_auth_policy ON public.assets FOR ALL USING (auth.uid() = user_id);
CREATE POLICY generations_auth_policy ON public.generations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY api_keys_auth_policy ON public.user_api_keys FOR ALL USING (auth.uid() = user_id);
CREATE POLICY provider_configs_auth_policy ON public.provider_configs FOR ALL USING (auth.uid() = user_id);
CREATE POLICY provider_health_auth_policy ON public.provider_health FOR ALL USING (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY usage_analytics_auth_policy ON public.usage_analytics FOR ALL USING (auth.uid() = user_id);
CREATE POLICY budget_alerts_auth_policy ON public.budget_alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY conversion_jobs_auth_policy ON public.conversion_jobs FOR ALL USING (auth.uid() = user_id);
```

## Step 5: Create User Profile Auto-Sync Trigger

Run this additional migration to automatically create user profiles when they sign up:

1. Go to **SQL Editor** in Supabase
2. Click **"New Query"**
3. Paste this SQL:

```sql
-- Function to automatically create a user profile when someone signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

4. Click **"Run"**

This ensures that every time someone signs up, they automatically get a profile in `public.users`.

## Step 6: Test the Setup

After running both migrations:

1. Start your development server:
   ```bash
   cd web
   npm run dev
   ```

2. Go to http://localhost:3000
3. Click **"Sign Up"**
4. Create an account with email and password
5. You should be redirected to the projects page

## What Was Created

✅ **10 Database Tables**
- `users` - Extended Supabase auth.users
- `projects` - Project management
- `assets` - Generated media storage
- `generations` - AI generation tracking
- `user_api_keys` - Encrypted API keys
- `provider_configs` - Provider settings
- `provider_health` - Health monitoring
- `usage_analytics` - Usage tracking
- `budget_alerts` - Budget notifications
- `conversion_jobs` - Asset conversions

✅ **Security Features**
- Row-Level Security (RLS) on all tables
- User data isolation
- AES-256 encrypted API keys
- Database constraints and relationships

✅ **Performance**
- 18 indexes for common queries
- Optimized for read/write operations

## Troubleshooting

### "Missing Supabase configuration"
- Check your `.env.local` file has correct `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Make sure you're using the **Anon public key**, not the service role key

### "Permission denied" errors
- Verify the RLS policies were created
- Check that you're authenticated before accessing protected tables
- Ensure user_id matches auth.uid()

### "Table already exists"
- This is fine! The SQL uses `CREATE TABLE IF NOT EXISTS`
- You can safely run the migration multiple times

### Migration fails on specific table
- Check the error message in the Supabase dashboard
- Try running each table creation individually
- Make sure auth.users table exists (it does in Supabase Cloud)

## Next Steps

1. ✅ Database is set up
2. 🔄 Now test signup/login
3. 📝 Add API keys in settings
4. 🎨 Create your first project
5. 🚀 Generate AI content

## Environment Variables Summary

```bash
# From Supabase Dashboard Settings → API
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs... (long string)
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIs... (long string)

# Encryption
ENCRYPTION_MASTER_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef
```

## Useful Links

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Setup Complete!** Your Supabase Cloud database is ready for the AI Media Creation Workspace.
