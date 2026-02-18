# AI Media Creation Workspace

An all-in-one AI media creation platform that solves fragmentation in current AI tools. Generate images, videos, audio, and text from a single project space with transparent cost tracking.

## Vision

Users currently juggle multiple platforms to generate AI media, manually stitch results together, and don't know what they're spending. This platform provides:

- **One project, one space, all media**
- **Transparent cost tracking** - see exactly what you spend
- **Mobile-first PWA** - generate on the go
- **Multi-provider support** - bring your own API keys
- **Project-centric organization** - assets grouped by project

## Current Status

**Phase 5 Complete** — Generation pipeline fully operational

| Phase | Title | Status |
|-------|-------|--------|
| 1 | Foundation & Auth | ✅ Complete |
| 2 | Project Management | ✅ Complete |
| 3 | API Key Encryption | ✅ Complete |
| 4 | Provider Integration (7 providers) | ✅ Complete |
| 5 | Generation UI & Flows | ✅ Complete |
| 6 | Asset Management | 🔄 Next |
| 7 | Cost Tracking & Analytics | 📋 Planned |
| 8-11 | Video/Audio, Conversions, PWA, Testing | 📋 Planned |

### What's Working

- Sign up / login with email & password (Supabase Auth)
- Encrypted API key storage (AES-256-GCM)
- Project creation and management with budgets
- **Text generation** — GPT-4o, Claude, Gemini 2.5/3.0
- **Image generation** — Imagen 4, Gemini Image, DALL-E 3, Flux (FAL)
- **Video generation** — Veo 3.1, Veo 2.0
- Dynamic model discovery from provider APIs
- Generation result display with fullscreen, download, copy
- Generation history per project
- Async generation with polling for status updates
- Real-time cost estimation
- 7 registered providers: OpenAI, Anthropic, Gemini, OpenRouter, FAL, Nano Banana, Veo3

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- AI Provider API keys (OpenAI, Anthropic, Google/Gemini, OpenRouter, etc.)

### Installation

```bash
# Clone and setup
git clone <repo-url>
cd ai-medialab/web
npm install

# Setup environment (copy from example)
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials and encryption key

# Start development server
npm run dev
```

Visit `http://localhost:3000` and follow the [User Guide](./USER_GUIDE.md) for testing all features.

### Environment Variables

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

## Tech Stack

### Frontend
- **Next.js 16** — React framework with App Router + Turbopack
- **TypeScript** — Type safety
- **Tailwind CSS** — Mobile-first styling
- **shadcn/ui** — Accessible component library
- **React Query** — Server state management

### Backend & Database
- **Supabase** — PostgreSQL + Auth + Storage + RLS
- **Row-Level Security** — Database-level access control per user

### Security
- **AES-256-GCM** — API key encryption with Scrypt key derivation
- **Cookie-based Auth** — `@supabase/ssr` for server-side authentication
- **No client-side decryption** — Keys only decrypted on server for API calls

## Project Structure

```
/ai-medialab
├── /docs                          # Documentation
│   ├── architecture.md           # Technical deep-dive
│   ├── plan.md                   # Implementation plan & phases
│   └── SESSION_2026-02-17.md     # Latest session notes
├── /web                           # Next.js application
│   └── /src
│       ├── /app                  # Pages & API routes
│       ├── /components           # React components
│       ├── /lib                  # Core libraries (AI, crypto, DB)
│       ├── /hooks                # React Query hooks
│       └── /types                # TypeScript types
├── README.md                      # This file
├── USER_GUIDE.md                  # Testing & usage guide
├── FUTURE_IMPLEMENTATIONS.md      # Detailed roadmap
├── PRODUCTION_DEPLOYMENT.md       # Deployment guide
└── SUPABASE_CLOUD_SETUP.md       # Supabase setup guide
```

## Documentation

| Document | Description |
|----------|-------------|
| [architecture.md](./docs/architecture.md) | Technical architecture, database design, API structure, key patterns |
| [plan.md](./docs/plan.md) | Implementation plan with phases and current status |
| [SESSION_2026-02-17.md](./docs/SESSION_2026-02-17.md) | Detailed session notes (bugs fixed, features added, patterns established) |
| [USER_GUIDE.md](./USER_GUIDE.md) | How to test and use all features |
| [FUTURE_IMPLEMENTATIONS.md](./FUTURE_IMPLEMENTATIONS.md) | Detailed roadmap for upcoming phases |
| [PRODUCTION_DEPLOYMENT.md](./PRODUCTION_DEPLOYMENT.md) | Production deployment guide |
| [SUPABASE_CLOUD_SETUP.md](./SUPABASE_CLOUD_SETUP.md) | Supabase cloud setup instructions |

## Key Architecture Patterns

### Server-Side Supabase Client
All API routes use the cookie-based server client from `@/lib/db/supabase-server`. Never use the browser singleton (`@/lib/db/client`) in API routes — it has no auth session and RLS will block everything.

### Provider Alias Resolution
Settings page stores "google" but the factory registers "gemini". Use `resolveProviderName()` from `@/lib/ai/provider-aliases` before calling `ProviderFactory`.

### Async Generation
POST `/api/generate` creates a DB record, returns 202 immediately, then executes generation asynchronously. The client polls every 2s to pick up status updates.

See [architecture.md](./docs/architecture.md) for full details.

## Next Steps

1. **Phase 6**: Asset Management — Supabase Storage for generated media
2. **Phase 7**: Cost Tracking & Analytics — Dashboard, budget alerts
3. **Phase 8**: Additional media types — Audio generation

See [FUTURE_IMPLEMENTATIONS.md](./FUTURE_IMPLEMENTATIONS.md) for detailed roadmap.

## Contributing

See [architecture.md](./docs/architecture.md) for technical details and key patterns. Start with [SESSION_2026-02-17.md](./docs/SESSION_2026-02-17.md) for the latest context on what was built and why.

---

**Last Updated**: 2026-02-17
**Status**: Phase 5 Complete — Generation pipeline operational
