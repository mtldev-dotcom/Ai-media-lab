# Technical Architecture - AI Media Creation Workspace

**Last Updated**: 2026-02-17
**Status**: Phase 5 Complete — Generation pipeline fully operational

---

## Table of Contents

1. [System Architecture](#system-architecture)
2. [Database Design](#database-design)
3. [API Architecture](#api-architecture)
4. [Frontend Architecture](#frontend-architecture)
5. [Security Architecture](#security-architecture)
6. [Provider System](#provider-system)
7. [Generation Flow](#generation-flow)
8. [Key Patterns](#key-patterns)
9. [Deployment Architecture](#deployment-architecture)

---

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (Next.js 16)                  │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Pages: Projects, Generate, Analytics, Settings  │   │
│  │  Components: Cards, Forms, Results, Modals       │   │
│  │  State: Zustand (UI), React Query (Server)       │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              API Layer (Next.js API Routes)              │
│  ┌──────────────────────────────────────────────────┐   │
│  │  /api/generate     - Create & execute generation │   │
│  │  /api/generations  - List generations            │   │
│  │  /api/api-keys     - API key CRUD                │   │
│  │  /api/projects     - Project CRUD                │   │
│  │  /api/providers    - Model discovery             │   │
│  │  /api/estimate-cost - Cost estimation            │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│            Backend Services                              │
│  ┌──────────────────────────────────────────────────┐   │
│  │  ProviderFactory    - Registry of 7 providers    │   │
│  │  Provider Aliases   - "google" → "gemini"        │   │
│  │  API Key Manager    - AES-256-GCM encrypt/decrypt│   │
│  │  Cost Calculator    - Per-provider pricing       │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          ↓
        ┌────────────────┬────────────────┐
        ↓                ↓                ↓
   ┌─────────┐    ┌─────────────┐   ┌──────────┐
   │ Supabase│    │  AI APIs    │   │ Storage  │
   │  Cloud  │    │ Gemini,     │   │ (Future) │
   │(PostSQL)│    │ OpenRouter, │   │          │
   │  RLS    │    │ OpenAI,     │   │          │
   │  Auth   │    │ Anthropic...│   │          │
   └─────────┘    └─────────────┘   └──────────┘
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

#### Generations Table
```sql
CREATE TABLE generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  model VARCHAR(100) NOT NULL,
  generation_type VARCHAR(50) NOT NULL, -- 'text', 'image', 'video', 'audio'
  prompt TEXT NOT NULL,
  parameters JSONB DEFAULT '{}',
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  result JSONB,             -- { content: "base64 or text", mimeType: "..." }
  error_message TEXT,
  tokens_input INTEGER,
  tokens_output INTEGER,
  tokens_total INTEGER,
  cost_cents INTEGER,
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

### Row-Level Security (RLS)

All tables have RLS enabled. Every query must include `user_id = auth.uid()`:

```sql
CREATE POLICY projects_user_isolation ON projects
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY generations_user_isolation ON generations
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY api_keys_user_isolation ON user_api_keys
  FOR ALL USING (user_id = auth.uid());
```

**Critical**: API routes must use the server-side Supabase client (cookie-based auth) for RLS to work. The browser singleton client has no auth session server-side.

---

## API Architecture

### Implemented Routes

```
/api
├── /generate              POST   → Create & execute generation (returns 202)
├── /generations           GET    → List generations for project
├── /generations/stats     GET    → Generation statistics
├── /api-keys              GET    → List API keys
│                          POST   → Add new API key
├── /api-keys/[id]         PUT    → Update API key
│                          DELETE → Delete API key
├── /api-keys/test         POST   → Test API key validity
├── /providers/[provider]/models  GET → List available models
├── /estimate-cost         POST   → Estimate generation cost
├── /projects              GET    → List projects
│                          POST   → Create project
├── /projects/[id]         GET    → Get project
│                          PUT    → Update project
│                          DELETE → Delete project
└── /auth
    ├── /callback          GET    → OAuth callback
    └── /signout           POST   → Sign out
```

### Response Format

```typescript
interface APIResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}
```

---

## Frontend Architecture

### Route Structure

```
app/
├── (auth)/                    # Auth route group
│   ├── login/page.tsx
│   └── signup/page.tsx
├── (dashboard)/               # Authenticated route group
│   ├── layout.tsx             # Sidebar + main content
│   ├── projects/
│   │   ├── page.tsx           # Project list
│   │   └── [id]/
│   │       ├── page.tsx       # Project detail (Assets/Generate/Analytics tabs)
│   │       └── generate/
│   │           ├── page.tsx           # Server component
│   │           └── generate-client.tsx # Client: form + history + type tabs
│   ├── settings/page.tsx      # API key management
│   └── analytics/page.tsx     # Usage analytics
└── page.tsx                   # Landing page
```

### Key Components

```
components/
├── generation/
│   ├── generation-form.tsx       # Provider/model select, prompt, submit
│   ├── generation-result.tsx     # Renders text/image/video/audio output
│   ├── generation-history.tsx    # Lists all generations for a project
│   └── parameter-controls.tsx    # Advanced settings (temp, tokens, etc.)
├── projects/
│   ├── project-card.tsx
│   └── create-project-dialog.tsx
├── layout/
│   ├── sidebar.tsx
│   └── mobile-nav.tsx
└── ui/                           # shadcn/ui components
```

### React Query Hooks

```
hooks/
├── use-generations.ts    # useGenerations, useCreateGeneration, useEstimateCost
├── use-api-keys.ts       # useAPIKeys (fetches configured providers)
├── use-projects.ts       # useProjects, useProject
└── use-provider-models.ts  # (via use-generations.ts useProviderModels)
```

---

## Security Architecture

### API Key Encryption

```
User API Key → Encrypt(AES-256-GCM, Scrypt(MASTER_KEY, salt), IV) → Store in DB
                                                                        │
Decrypt only in server-side API routes ←────────────────────────────────┘
```

- Master key: `ENCRYPTION_MASTER_KEY` env var (64 hex chars = 32 bytes)
- Salt: 64 random bytes per key
- IV: 96 random bits per encryption
- Auth tag validates ciphertext integrity
- Never decrypted in browser

### Authentication

Cookie-based auth via `@supabase/ssr`:

```typescript
// Server-side (API routes, server components)
import { getCurrentUser, createClient } from '@/lib/db/supabase-server'

const user = await getCurrentUser()      // Auth check
const supabase = await createClient()    // Client for DB queries (has auth session)
```

```typescript
// Browser-side (client components)
import { createBrowserClient } from '@/lib/db/supabase-browser'

const supabase = createBrowserClient()   // For client-side auth state
```

---

## Provider System

### Registered Providers

| Provider | ID | Capabilities | Models |
|----------|-----|-------------|--------|
| OpenAI | `openai` | text, image | GPT-4o, DALL-E 3 |
| Anthropic | `anthropic` | text | Claude 3.5 Sonnet |
| Gemini | `gemini` | text, image, video | Gemini 2.5/3.0, Imagen 4, Veo 3.1/2.0 |
| OpenRouter | `openrouter` | text, image | 400+ models via single key |
| FAL | `fal` | image | Flux, Stable Diffusion |
| Nano Banana | `nano-banana` | image | Nano Banana Pro |
| Veo3 | `veo3` | video | Veo 3 (standalone) |

### Provider Architecture

```typescript
// Abstract base class
abstract class BaseProvider {
  abstract generate(request: GenerationRequest): Promise<GenerationResult>
  abstract getAvailableModels(): Promise<string[]>
  abstract estimateCost(request: GenerationRequest): Promise<number>
}

// Factory pattern
class ProviderFactory {
  static createProvider(name: string, apiKey: string): BaseProvider
  static getRegisteredProviders(): string[]
}
```

### Provider Alias System

Settings page stores provider names from user perspective (e.g., "google"), but the factory registers by internal ID (e.g., "gemini"):

```typescript
// web/src/lib/ai/provider-aliases.ts
const PROVIDER_ALIASES = { google: 'gemini' }

export function resolveProviderName(provider: string): string {
  return PROVIDER_ALIASES[provider] || provider
}
```

**Rule**: Use **raw** name for DB lookups (API keys stored as "google"), **resolved** name for `ProviderFactory.createProvider()`.

### Gemini Provider Details

The Gemini provider supports three generation methods:

1. **Text** — `POST /v1beta/models/{model}:generateContent`
2. **Imagen** — `POST /v1beta/models/{model}:predict` (Imagen 4 variants)
3. **Gemini Image** — `POST /v1beta/models/{model}:generateContent` with `responseModalities: ['IMAGE', 'TEXT']`
4. **Video (Veo)** — `POST /v1beta/models/{model}:predictLongRunning` with polling

Dynamic model discovery: `GET /v1beta/models?key=...` filtered by prefixes `gemini`, `imagen`, `veo`.

---

## Generation Flow

```
Client                    API Route                    Provider
  │                          │                            │
  ├─ POST /api/generate ────→│                            │
  │                          ├─ Auth check                │
  │                          ├─ Create DB record (pending)│
  │←─ 202 Accepted ─────────┤                            │
  │                          │                            │
  │                     [Fire-and-forget async]           │
  │                          ├─ Get API key (raw name)    │
  │                          ├─ Decrypt API key           │
  │                          ├─ Resolve provider alias    │
  │                          ├─ Create provider instance  │
  │                          ├─ Execute generation ──────→│
  │                          │←─── Result ────────────────┤
  │                          ├─ Update DB (completed)     │
  │                          │                            │
  │  [Polling every 2s]      │                            │
  ├─ GET /api/generations ──→│                            │
  │←─ Updated results ───────┤                            │
```

---

## Key Patterns

### 1. Server-Side Supabase Client

**Always** use the cookie-based server client in API routes:

```typescript
import { getCurrentUser, createClient } from '@/lib/db/supabase-server'
```

**Never** use `@/lib/db/client` (browser singleton) in API routes — it has no auth session and RLS will block all operations.

### 2. Query Functions Accept Supabase Client

All database query functions take `supabase: SupabaseClient` as their first parameter:

```typescript
// ✅ Correct
export async function getGenerations(supabase: SupabaseClient, projectId: string)
export async function saveAPIKey(supabase: SupabaseClient, ...)

// ❌ Wrong — importing global client
import { supabase } from '@/lib/db/client'
```

### 3. Provider Alias Resolution

Always resolve before calling ProviderFactory:

```typescript
import { resolveProviderName } from '@/lib/ai/provider-aliases'
const provider = ProviderFactory.createProvider(resolveProviderName(rawName), apiKey)
```

---

## File Structure (Key Source Files)

```
web/src/
├── lib/
│   ├── ai/
│   │   ├── base-provider.ts          # Abstract provider class
│   │   ├── provider-factory.ts       # Registry of all providers
│   │   ├── provider-aliases.ts       # "google" → "gemini" mapping
│   │   ├── provider-router.ts        # Routing with fallback
│   │   └── providers/
│   │       ├── openai.ts
│   │       ├── anthropic.ts
│   │       ├── gemini.ts             # Text + Imagen + Veo
│   │       ├── openrouter.ts         # 400+ models
│   │       ├── fal.ts
│   │       ├── nano-banana.ts
│   │       └── veo3.ts
│   ├── crypto/
│   │   └── api-key-manager.ts        # Encrypt/decrypt/CRUD (takes SupabaseClient)
│   └── db/
│       ├── supabase-server.ts        # Server client (cookie-based auth) ← USE THIS
│       ├── supabase-browser.ts       # Browser client (@supabase/ssr)
│       ├── client.ts                 # Legacy singleton (AVOID in API routes)
│       └── queries/
│           └── generations.ts        # Generation CRUD (takes SupabaseClient)
├── components/generation/
│   ├── generation-form.tsx           # Provider/model select, prompt, submit
│   ├── generation-result.tsx         # Renders text/image/video/audio output
│   ├── generation-history.tsx        # Lists all generations for a project
│   └── parameter-controls.tsx        # Advanced settings
├── hooks/
│   ├── use-generations.ts            # React Query hooks for generations
│   └── use-api-keys.ts              # React Query hooks for API keys
└── app/
    ├── api/
    │   ├── generate/route.ts         # POST - create & execute generation
    │   ├── generations/route.ts      # GET - list generations
    │   ├── generations/stats/route.ts
    │   ├── api-keys/route.ts         # GET/POST API keys
    │   ├── api-keys/[id]/route.ts    # PUT/DELETE API keys
    │   ├── estimate-cost/route.ts
    │   └── providers/[provider]/models/route.ts
    └── (dashboard)/
        ├── settings/page.tsx         # API key management
        └── projects/[id]/
            ├── page.tsx              # Project home (Assets/Generate/Analytics)
            └── generate/
                ├── page.tsx          # Server component
                └── generate-client.tsx  # Client: type tabs, form, history
```

---

## Known Issues / Technical Debt

1. **`@/lib/db/client.ts`** (browser singleton) may still be imported in some places — should be audited and replaced
2. **`provider-selector.tsx`** is orphaned — no longer used by generation form
3. **No Supabase Storage** for generated images — base64 stored directly in `generations.result`, inefficient for large images
4. **Video generation polling** happens synchronously in the API route — could timeout for long Veo generations
5. **`provider_configs` table** may not exist in all environments — `ProviderRouter` depends on it but `generate/route.ts` now bypasses it

---

## Deployment

- **Next.js 16.1.6** with Turbopack
- **Node.js 18+**
- **Supabase Cloud** (project: uaduokvobvkbremkfhki)
- **Database**: PostgreSQL with RLS

See [PRODUCTION_DEPLOYMENT.md](../PRODUCTION_DEPLOYMENT.md) and [SUPABASE_CLOUD_SETUP.md](../SUPABASE_CLOUD_SETUP.md) for setup guides.
