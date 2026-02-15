# Technical Architecture - AI Media Creation Workspace

**Document Version**: 1.0
**Last Updated**: 2026-02-15
**Status**: Draft - To be expanded during implementation

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Design](#database-design)
3. [API Architecture](#api-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [Security Architecture](#security-architecture)
6. [Cost Calculation System](#cost-calculation-system)
7. [Provider System](#provider-system)
8. [Deployment Architecture](#deployment-architecture)

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (Next.js 15)                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Pages: Projects, Generate, Analytics, Settings  │  │
│  │  Components: Cards, Forms, Charts, Modals        │  │
│  │  State: Zustand (UI), React Query (Server)       │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              API Layer (Next.js API Routes)             │
│  ┌──────────────────────────────────────────────────┐  │
│  │  /api/auth      - Authentication                │  │
│  │  /api/projects  - Project CRUD                  │  │
│  │  /api/generate  - Generation requests           │  │
│  │  /api/assets    - Asset management              │  │
│  │  /api/analytics - Analytics queries             │  │
│  │  /api/settings  - Settings/config               │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│            Backend Services (Node.js)                    │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Provider Router      - Route requests to best   │  │
│  │  Provider System      - Abstraction layer        │  │
│  │  Cost Calculator      - Price estimation        │  │
│  │  Asset Manager        - File handling           │  │
│  │  Analytics Engine     - Usage tracking          │  │
│  │  Encryption Service   - API key security        │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                          ↓
        ┌────────────────┬────────────────┐
        ↓                ↓                ↓
   ┌─────────┐    ┌─────────────┐   ┌──────────┐
   │ Supabase│    │  AI APIs    │   │ Storage  │
   │   DB    │    │  (OpenAI,   │   │  (S3)    │
   │(PostSQL)│    │Anthropic,   │   │          │
   │   RLS   │    │  etc.)      │   │ Buckets  │
   │  Auth   │    └─────────────┘   └──────────┘
   └─────────┘
```

---

## Database Design

### Core Tables

#### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Projects Table
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url TEXT,
  budget_cents INTEGER DEFAULT 0,
  spent_cents INTEGER DEFAULT 0,
  settings JSONB DEFAULT '{}',
  archived_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Assets Table
```sql
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'image', 'video', 'audio', 'text'
  name VARCHAR(255),
  description TEXT,
  file_url TEXT,
  file_size_bytes BIGINT,
  file_format VARCHAR(50),
  width INTEGER,
  height INTEGER,
  duration_seconds DECIMAL,
  generation_id UUID, -- Reference to generation that created this
  thumbnail_url TEXT,
  metadata JSONB DEFAULT '{}',
  tags TEXT[],
  favorite BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### Generations Table (Core Analytics)
```sql
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL, -- 'openai', 'anthropic', etc.
  model VARCHAR(100) NOT NULL,
  generation_type VARCHAR(50) NOT NULL, -- 'text', 'image', 'video', 'audio'
  prompt TEXT NOT NULL,
  parameters JSONB DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  result JSONB, -- Full API response
  error_message TEXT,
  tokens_input INTEGER,
  tokens_output INTEGER,
  tokens_total INTEGER,
  cost_cents INTEGER, -- Calculated cost in cents
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_ms INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### API Keys Table (Encrypted)
```sql
CREATE TABLE user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  key_name VARCHAR(255),
  encrypted_key TEXT NOT NULL,
  encryption_iv TEXT NOT NULL,
  encryption_salt TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, provider, key_name)
);
```

#### Provider Health Table
```sql
CREATE TABLE provider_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider VARCHAR(50) NOT NULL,
  user_id UUID REFERENCES users(id),
  status VARCHAR(20) NOT NULL DEFAULT 'unknown', -- healthy, degraded, down
  last_success_at TIMESTAMP,
  last_failure_at TIMESTAMP,
  failure_count INTEGER DEFAULT 0,
  avg_response_time_ms DECIMAL,
  error_message TEXT,
  checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(provider, user_id)
);
```

#### Usage Analytics Table (Aggregated)
```sql
CREATE TABLE usage_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
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
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, project_id, period_type, period_start, provider, model)
);
```

#### Budget Alerts Table
```sql
CREATE TABLE budget_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id),
  alert_type VARCHAR(50) NOT NULL, -- 'threshold_reached', 'budget_exceeded'
  threshold_cents INTEGER,
  current_spend_cents INTEGER,
  triggered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  acknowledged_at TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Key Indexes

```sql
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_assets_project_id ON assets(project_id);
CREATE INDEX idx_assets_user_id ON assets(user_id);
CREATE INDEX idx_generations_user_id ON generations(user_id);
CREATE INDEX idx_generations_project_id ON generations(project_id);
CREATE INDEX idx_generations_created_at ON generations(created_at);
CREATE INDEX idx_generations_provider ON generations(provider);
CREATE INDEX idx_api_keys_user_id ON user_api_keys(user_id);
CREATE INDEX idx_provider_health_provider ON provider_health(provider);
CREATE INDEX idx_usage_analytics_user_id ON usage_analytics(user_id);
CREATE INDEX idx_usage_analytics_period ON usage_analytics(period_start);
```

### Row-Level Security (RLS)

All user tables have RLS enabled with policies:

```sql
-- Projects: Users can only see/modify their own projects
CREATE POLICY projects_user_isolation ON projects
  FOR ALL USING (auth.uid() = user_id);

-- Assets: Users can only see/modify assets in their projects
CREATE POLICY assets_user_isolation ON assets
  FOR ALL USING (user_id = auth.uid());

-- Generations: Users can only see their own generations
CREATE POLICY generations_user_isolation ON generations
  FOR ALL USING (user_id = auth.uid());

-- API Keys: Users can only see/modify their own keys
CREATE POLICY api_keys_user_isolation ON user_api_keys
  FOR ALL USING (user_id = auth.uid());
```

---

## API Architecture

### Route Structure

```
/api
├── /auth
│   ├── POST /login          → Authenticate user
│   ├── POST /signup         → Register new user
│   ├── POST /logout         → End session
│   └── GET /me              → Current user info
├── /projects
│   ├── GET /                → List projects
│   ├── POST /               → Create project
│   ├── GET /[id]            → Get project details
│   ├── PUT /[id]            → Update project
│   └── DELETE /[id]         → Delete project
├── /generate
│   └── POST /               → Request generation
├── /assets
│   ├── GET /                → List assets
│   ├── GET /[id]            → Get asset details
│   ├── PUT /[id]            → Update asset
│   └── DELETE /[id]         → Delete asset
├── /analytics
│   ├── GET /usage           → Usage stats
│   ├── GET /cost            → Cost breakdown
│   └── GET /provider        → Provider comparison
├── /api-keys
│   ├── GET /                → List keys
│   ├── POST /               → Add new key
│   └── DELETE /[id]         → Delete key
└── /settings
    ├── GET /providers       → Provider config
    └── PUT /providers       → Update config
```

### Request/Response Patterns

**Success Response**:
```json
{
  "success": true,
  "data": { /* payload */ },
  "message": "Operation successful"
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "ERROR_CODE",
  "message": "Human-readable error message",
  "details": { /* error details */ }
}
```

---

## Frontend Architecture

### Component Hierarchy

```
App (Layout)
├── RootLayout
│   ├── Providers (React Query, Zustand)
│   └── Navigation (Bottom Nav)
├── AuthLayout
│   ├── LoginPage
│   └── SignupPage
└── DashboardLayout
    ├── Projects
    │   ├── ProjectList
    │   │   └── ProjectCard
    │   ├── ProjectDetail
    │   │   ├── Assets Tab
    │   │   │   └── AssetGrid
    │   │   ├── Generate Tab
    │   │   │   └── GenerationForm
    │   │   └── Analytics Tab
    │   │       └── CostChart
    │   └── CreateProject
    ├── Generate (Quick)
    │   └── GenerationForm
    ├── Analytics (Global)
    │   ├── CostChart
    │   ├── ProviderComparison
    │   └── UsageBreakdown
    └── Settings
        ├── APIKeys
        ├── Providers
        ├── Budgets
        └── Profile
```

### State Management Strategy

**Zustand Stores**:
- `uiStore`: UI state (modals, toasts, loading)
- `generationStore`: Generation form state
- `projectStore`: Selected project

**React Query**:
- `useProjects()`: Fetch/manage projects
- `useAssets()`: Fetch/manage assets
- `useGenerations()`: Fetch/manage generations
- `useAnalytics()`: Fetch analytics data

---

## Security Architecture

### Encryption Strategy

**API Key Encryption Flow**:

```
User API Key
    ↓
[Encrypt with AES-256-GCM]
    ├─ Plaintext: User API Key
    ├─ Key: Scrypt(MASTER_KEY, salt)
    ├─ IV: Random 96-bit
    └─ Output: ciphertext + authTag
    ↓
[Store in Database]
    ├─ encrypted_key: Base64(ciphertext)
    ├─ encryption_iv: Base64(IV)
    ├─ encryption_salt: Base64(salt)
    └─ Never store plaintext
    ↓
[Decrypt on API Call]
    └─ Only in server-side API routes
    └─ Never logged or exposed
```

**Implementation Details**:
- Master key: 32-byte random key stored in ENCRYPTION_MASTER_KEY env var
- Salt: 64 random bytes generated per key
- IV: 96 random bits per encryption
- Authentication tag: Validates ciphertext integrity
- Never decrypt in browser (no client-side decryption)

### Authentication Flow

```
Client                  Server                  Supabase
  │                       │                         │
  ├──POST /auth/login────→│                         │
  │ (email, password)     ├──Auth Request──────────→│
  │                       │                         │
  │                       │←──JWT Token──────────────┤
  │                       │                         │
  │←──JWT (httpOnly)──────┤                         │
  │                       │                         │
  ├──GET /api/protected──→│                         │
  │ (JWT in header)       ├──Verify JWT──────────→│
  │                       │                        │
  │                       │←──Valid──────────────┤
  │←──Response────────────┤                       │
```

---

## Cost Calculation System

### Pricing Data Structure

```javascript
const pricingData = {
  openai: {
    'gpt-4o': {
      textGeneration: {
        inputTokens: 0.0000025,  // $0.0000025 per token
        outputTokens: 0.00001    // $0.00001 per token
      }
    },
    'dall-e-3': {
      imageGeneration: {
        '1024x1024': 20,    // 20 cents
        '1792x1024': 25,    // 25 cents
        '1024x1792': 25     // 25 cents
      }
    }
  },
  anthropic: {
    'claude-3-5-sonnet': {
      textGeneration: {
        inputTokens: 0.000003,   // $0.000003 per input token
        outputTokens: 0.000015   // $0.000015 per output token
      }
    }
  }
};
```

### Cost Estimation

```
1. User submits request
   ├─ Provider: OpenAI (GPT-4o)
   ├─ Model: text
   └─ Prompt: "Write a poem about..."

2. Estimate cost
   ├─ Estimate prompt tokens: ~15
   ├─ Estimate output tokens: ~50
   ├─ Cost: (15 × $0.0000025) + (50 × $0.00001)
   └─ Total estimate: ~$0.0005 (0.05 cents)

3. Show to user
   ├─ "This will cost approximately $0.0005"
   └─ Allow generation

4. Execute generation
   └─ Track actual tokens from API response

5. Calculate actual cost
   ├─ Actual tokens: (input: 18, output: 47)
   └─ Actual cost: (18 × $0.0000025) + (47 × $0.00001) = $0.000495

6. Update database
   ├─ Store in generations table
   ├─ Update projects.spent_cents
   └─ Trigger budget alert if needed
```

---

## Provider System

### Provider Abstraction

```typescript
abstract class BaseProvider {
  abstract generateText(request: TextGenerationRequest): Promise<GenerationResponse>;
  abstract generateImage(request: ImageGenerationRequest): Promise<GenerationResponse>;
  abstract generateVideo(request: VideoGenerationRequest): Promise<GenerationResponse>;
  abstract generateAudio(request: AudioGenerationRequest): Promise<GenerationResponse>;
  abstract healthCheck(): Promise<ProviderHealth>;
  abstract estimateCost(request: GenerationRequest): Promise<number>;
}
```

### Provider Router Logic

```
User requests generation
    ↓
Get user's enabled providers (sorted by priority)
    ├─ Filter by capability (supports image generation?)
    ├─ Filter by health status (not down?)
    ├─ Filter by rate limits
    └─ Filter by budget
    ↓
Try primary provider
    ├─ Success? Return result
    └─ Failure? Try fallback
    ↓
Try fallback provider
    ├─ Success? Return result
    └─ Failure? Return error
    ↓
Log result
    ├─ Update provider health
    ├─ Update cost tracking
    └─ Create budget alerts if needed
```

---

## Deployment Architecture

### Production Stack

```
┌──────────────────────────────────────┐
│   Client (Browser/PWA)               │
│   - Next.js Static Assets            │
│   - Service Worker                   │
│   - Offline Support                  │
└──────────────────────────────────────┘
           ↓ HTTPS
┌──────────────────────────────────────┐
│   Edge Layer (Vercel/CDN)            │
│   - Route caching                    │
│   - DDoS protection                  │
│   - SSL termination                  │
└──────────────────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│   Next.js Server (Vercel)            │
│   - API routes                       │
│   - Server-side rendering            │
│   - Authentication middleware        │
└──────────────────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│   Supabase (Self-Hosted or Cloud)   │
│   - PostgreSQL Database              │
│   - Auth Service                     │
│   - Storage (S3-compatible)          │
│   - Real-time subscriptions          │
└──────────────────────────────────────┘
           ↓
┌──────────────────────────────────────┐
│   External APIs                      │
│   - OpenAI API                       │
│   - Anthropic API                    │
│   - FAL.ai API                       │
│   - Others                           │
└──────────────────────────────────────┘
```

### Environment Configuration

```
.env.local
├── NEXT_PUBLIC_APP_URL=https://app.domain.com
├── NEXT_PUBLIC_SUPABASE_URL=https://supabase.domain.com
├── NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
├── SUPABASE_SERVICE_KEY=eyJ...
├── ENCRYPTION_MASTER_KEY=randomly_generated_key
├── NODE_ENV=production
└── SENTRY_DSN=https://sentry.io/...
```

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| FCP (First Contentful Paint) | < 1.5s | Essential for user perception |
| LCP (Largest Contentful Paint) | < 2.5s | Main content visible |
| CLS (Cumulative Layout Shift) | < 0.1 | Visual stability |
| TTI (Time to Interactive) | < 3s | App is responsive |
| Lighthouse Score | > 90 | Performance + Accessibility |

---

## Scalability Considerations

### Database Scaling
- Partitioning: generations table by user_id and date
- Read replicas for analytics queries
- Connection pooling (PgBouncer)

### API Scaling
- Horizontal scaling: Multiple Node.js instances
- Load balancing: Vercel built-in
- Rate limiting: Per-user and per-IP

### File Storage Scaling
- S3 bucket for asset storage
- CloudFront CDN for asset delivery
- Automatic cleanup for old assets

---

## Monitoring & Observability

### Metrics to Track
- API response times
- Error rates by endpoint
- Provider health status
- Cost tracking accuracy
- User generation success rates

### Logging Strategy
- Application logs: Sentry
- Database logs: Supabase
- API logs: Vercel Analytics
- User events: PostHog or Mixpanel

---

## Next Steps

This architecture document will be expanded with implementation details as each phase is completed. Check back for updates on:
- Detailed API endpoint specifications
- Component implementation guides
- Database query examples
- Provider-specific integration details
