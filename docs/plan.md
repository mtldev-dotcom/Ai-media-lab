# AI Media Creation Workspace - Implementation Plan

## Context

Building an **all-in-one AI media creation workspace** that solves the fragmentation problem in current AI tools. Users currently juggle multiple platforms to generate images, videos, audio, and text, then manually stitch everything together. This platform provides **one project, one space, all media** with transparent cost tracking.

### Key Problem Being Solved
- **Fragmentation**: AI tools are scattered across different platforms
- **Desktop-first**: Most tools aren't optimized for mobile
- **No project organization**: Assets live in isolation, not grouped by project
- **Hidden costs**: Users don't know what they're spending on AI generations
- **Complex workflows**: No easy way to chain media (image → video → voiceover)

### Core Differentiators
1. **Project-Centric**: Everything lives inside projects (images, videos, audio, scripts, costs)
2. **Cost Transparency**: Every generation shows provider, tokens, cost, running totals
3. **Mobile-First**: Thumb-friendly PWA optimized for touch
4. **Multi-Provider**: Support for nano banana pro, veo3, fal.ai, openrouter, openai, anthropic, etc.
5. **User-Owned Keys**: Users bring their own API keys (encrypted in DB)

---

## Tech Stack

### Frontend
- **Next.js 15** (App Router) - Mobile-first PWA
- **TypeScript** - Type safety
- **Tailwind CSS** - Mobile-first styling
- **shadcn/ui** - Accessible components
- **Serwist** - PWA (Service Worker)

### Backend & Database
- **Supabase (Self-Hosted)** - PostgreSQL + Auth + Storage + RLS
- **PostgreSQL** - Complex analytics queries, ACID compliance, JSON support

### State Management
- **Zustand** - Client state (generation form, UI state)
- **React Query** - Server state (projects, assets, analytics)

### Security
- **AES-256-GCM** - API key encryption with Scrypt key derivation
- **Supabase Auth** - JWT-based authentication
- **Row-Level Security** - Database-level access control

---

## Implementation Phases (11 Total)

| Phase | Title | Duration | Status |
|-------|-------|----------|--------|
| 1 | Foundation | Week 1-2 | Pending |
| 2 | Project Management | Week 3 | Pending |
| 3 | API Key Management & Encryption | Week 4 | Pending |
| 4 | Provider Integration | Week 5-6 | Pending |
| 5 | Generation UI & Basic Generation | Week 7 | Pending |
| 6 | Asset Management | Week 8 | Pending |
| 7 | Cost Tracking & Analytics | Week 9-10 | Pending |
| 8 | Additional Providers & Media Types | Week 11-12 | Pending |
| 9 | Asset Conversion & Advanced Features | Week 13 | Pending |
| 10 | PWA & Polish | Week 14-15 | Pending |
| 11 | Testing & Deployment | Week 16 | Pending |

---

## Database Schema Overview

### Core Tables
- **users** - User accounts and profiles
- **user_api_keys** - Encrypted API keys for providers
- **provider_configs** - Provider priority, budgets, fallbacks
- **provider_health** - Health monitoring for providers
- **projects** - User projects with budgets
- **assets** - Generated images, videos, audio, text
- **generations** - AI API call tracking with cost
- **usage_analytics** - Aggregated usage stats
- **budget_alerts** - Budget threshold alerts
- **conversion_jobs** - Asset transformation tracking

---

## Project Structure

```
/ai-medialab/
├── /docs                    # Documentation
│   ├── plan.md             # This file
│   ├── tasks.md            # Task tracking
│   ├── progress.md         # Implementation progress
│   └── architecture.md     # Technical deep-dive
│
├── /web                     # Next.js application
│   ├── /public
│   ├── /src
│   │   ├── /app
│   │   ├── /components
│   │   ├── /lib
│   │   ├── /hooks
│   │   ├── /stores
│   │   ├── /types
│   │   └── /styles
│   ├── /supabase
│   ├── package.json
│   └── next.config.js
│
└── README.md               # Project overview
```

---

## Success Criteria

### MVP (Minimum Viable Product)
- [ ] User can sign up and log in
- [ ] User can add encrypted API keys for OpenAI and Anthropic
- [ ] User can create projects
- [ ] User can generate text and images
- [ ] User can view generated assets
- [ ] User can see cost per generation
- [ ] User can view project cost totals
- [ ] Mobile-optimized UI works on iOS and Android
- [ ] PWA is installable

### Post-MVP
- [ ] Video and audio generation
- [ ] Asset conversions (image → video)
- [ ] Provider health monitoring and fallbacks
- [ ] Budget alerts
- [ ] Advanced analytics dashboard
- [ ] Batch operations
- [ ] Offline support

---

## Key Files to Create (Priority Order)

### Priority 1: Foundation
1. `/web/supabase/migrations/001_initial_schema.sql` - Database schema
2. `/web/src/lib/db/client.ts` - Supabase client setup
3. `/web/src/lib/auth/session.ts` - Session management
4. `/web/src/middleware.ts` - Auth middleware

### Priority 2: Security
5. `/web/src/lib/crypto/encryption.ts` - API key encryption
6. `/web/src/lib/crypto/api-key-manager.ts` - API key CRUD

### Priority 3: Provider System
7. `/web/src/lib/ai/base-provider.ts` - Provider interface
8. `/web/src/lib/ai/provider-factory.ts` - Provider instantiation
9. `/web/src/lib/ai/provider-router.ts` - Routing logic

### Priority 4: Cost Tracking
11. `/web/src/lib/cost/calculator.ts` - Cost calculation
12. `/web/src/lib/cost/pricing-data.ts` - Pricing tables

### Priority 5: Core API
13. `/web/src/app/api/generate/route.ts` - Main generation endpoint
14. `/web/src/app/api/projects/route.ts` - Projects API

---

## Environment Variables

```bash
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# Encryption
ENCRYPTION_MASTER_KEY=your_64_char_random_string
```

---

## Next Steps
1. Initialize Next.js project structure
2. Set up database schema
3. Configure authentication
4. Begin Phase 1 implementation

See `progress.md` for current implementation status and `tasks.md` for detailed task tracking.
