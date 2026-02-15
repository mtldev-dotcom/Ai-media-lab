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
  type VARCHAR(50) NOT NULL, -- 'image', 'video', 'audio', 'text'
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

-- Generations table (Core - tracks all AI API calls)
CREATE TABLE IF NOT EXISTS public.generations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'openai', 'anthropic', 'fal', etc.
  model VARCHAR(100) NOT NULL,
  generation_type VARCHAR(50) NOT NULL, -- 'text', 'image', 'video', 'audio'
  prompt TEXT NOT NULL,
  parameters JSONB DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
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

-- User API Keys table (Encrypted)
CREATE TABLE IF NOT EXISTS public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  key_name VARCHAR(255),
  encrypted_key TEXT NOT NULL,
  encryption_iv TEXT NOT NULL,
  encryption_salt TEXT NOT NULL,
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
  status VARCHAR(20) NOT NULL DEFAULT 'unknown', -- healthy, degraded, down
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
  period_type VARCHAR(20) NOT NULL, -- 'daily', 'monthly'
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
  alert_type VARCHAR(50) NOT NULL, -- 'threshold_reached', 'budget_exceeded'
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
  conversion_type VARCHAR(50) NOT NULL, -- 'image_to_video', 'add_voiceover', etc.
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  parameters JSONB DEFAULT '{}',
  error_message TEXT,
  cost_cents INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- INDEXES
-- ============================================================

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

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

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

-- Users RLS: Users can only see/modify their own profile
CREATE POLICY users_auth_policy ON public.users
  FOR ALL
  USING (auth.uid() = id);

-- Projects RLS: Users can only see/modify their own projects
CREATE POLICY projects_auth_policy ON public.projects
  FOR ALL
  USING (auth.uid() = user_id);

-- Assets RLS: Users can only see/modify assets in their projects
CREATE POLICY assets_auth_policy ON public.assets
  FOR ALL
  USING (auth.uid() = user_id);

-- Generations RLS: Users can only see/modify their own generations
CREATE POLICY generations_auth_policy ON public.generations
  FOR ALL
  USING (auth.uid() = user_id);

-- API Keys RLS: Users can only see/modify their own keys
CREATE POLICY api_keys_auth_policy ON public.user_api_keys
  FOR ALL
  USING (auth.uid() = user_id);

-- Provider Configs RLS: Users can only see/modify their own config
CREATE POLICY provider_configs_auth_policy ON public.provider_configs
  FOR ALL
  USING (auth.uid() = user_id);

-- Provider Health RLS: Users can see all provider health, but only modify their own user-specific ones
CREATE POLICY provider_health_auth_policy ON public.provider_health
  FOR ALL
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Usage Analytics RLS: Users can only see their own analytics
CREATE POLICY usage_analytics_auth_policy ON public.usage_analytics
  FOR ALL
  USING (auth.uid() = user_id);

-- Budget Alerts RLS: Users can only see/modify their own alerts
CREATE POLICY budget_alerts_auth_policy ON public.budget_alerts
  FOR ALL
  USING (auth.uid() = user_id);

-- Conversion Jobs RLS: Users can only see/modify their own jobs
CREATE POLICY conversion_jobs_auth_policy ON public.conversion_jobs
  FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Function to update project spent_cents when a generation is created
CREATE OR REPLACE FUNCTION update_project_spent_cents()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.cost_cents > 0 THEN
    UPDATE public.projects
    SET spent_cents = spent_cents + NEW.cost_cents,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update project spent_cents on generation completion
DROP TRIGGER IF EXISTS trigger_update_project_spent_cents ON public.generations;
CREATE TRIGGER trigger_update_project_spent_cents
AFTER INSERT OR UPDATE ON public.generations
FOR EACH ROW
EXECUTE FUNCTION update_project_spent_cents();

-- Function to update user profile updated_at
CREATE OR REPLACE FUNCTION update_users_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update user timestamp
DROP TRIGGER IF EXISTS trigger_update_users_timestamp ON public.users;
CREATE TRIGGER trigger_update_users_timestamp
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_users_timestamp();

-- Similar triggers for other tables
DROP TRIGGER IF EXISTS trigger_update_projects_timestamp ON public.projects;
CREATE TRIGGER trigger_update_projects_timestamp
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION update_projects_timestamp();

DROP TRIGGER IF EXISTS trigger_update_assets_timestamp ON public.assets;
CREATE TRIGGER trigger_update_assets_timestamp
BEFORE UPDATE ON public.assets
FOR EACH ROW
EXECUTE FUNCTION update_assets_timestamp();

DROP TRIGGER IF EXISTS trigger_update_generations_timestamp ON public.generations;
CREATE TRIGGER trigger_update_generations_timestamp
BEFORE UPDATE ON public.generations
FOR EACH ROW
EXECUTE FUNCTION update_generations_timestamp();

-- Create timestamp update functions for other tables
CREATE OR REPLACE FUNCTION update_projects_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_assets_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_generations_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- STORAGE BUCKETS (via migrations or dashboard)
-- Note: These need to be created via Supabase dashboard:
-- - images/
-- - videos/
-- - audio/
-- - thumbnails/
-- With RLS policies matching the row-level security above
-- ============================================================
