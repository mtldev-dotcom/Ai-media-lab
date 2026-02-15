# AI Media Creation Workspace

An all-in-one AI media creation platform that solves fragmentation in current AI tools. Generate images, videos, audio, and text from a single project space with transparent cost tracking.

## 🎯 Vision

Users currently juggle multiple platforms to generate AI media, manually stitch results together, and don't know what they're spending. This platform provides:

- **One project, one space, all media**
- **Transparent cost tracking** - see exactly what you spend
- **Mobile-first PWA** - generate on the go
- **Multi-provider support** - bring your own API keys
- **Project-centric organization** - assets grouped by project

## 🏗️ Project Structure

```
/ai-medialab
├── /docs                  # Documentation
│   ├── plan.md           # Full implementation plan
│   ├── tasks.md          # Task tracking (50+ tasks)
│   ├── progress.md       # Implementation progress
│   ├── architecture.md   # Technical deep-dive
│   └── README.md         # This file
├── /web                  # Next.js application (to be created)
└── .gitignore
```

## 📚 Documentation

Start here to understand the project:

1. **[plan.md](./docs/plan.md)** - Complete implementation plan with tech stack, database schema, and 11 implementation phases
2. **[tasks.md](./docs/tasks.md)** - 50+ granular tasks across all phases with detailed descriptions
3. **[progress.md](./docs/progress.md)** - Current implementation status and what needs to be done next
4. **[architecture.md](./docs/architecture.md)** - Technical architecture, database design, API structure, security

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Docker & Docker Compose (for local Supabase)
- AI Provider API keys (OpenAI, Anthropic, etc.)

### Current Status

**Phase**: Phase 5 Complete ✅ - Generation UI & Basic Generation
**Progress**:
- ✅ Phase 1: Foundation & Authentication
- ✅ Phase 2: Project Management
- ✅ Phase 3: API Key Encryption
- ✅ Phase 4: Provider Integration (6 providers)
- ✅ Phase 5: Generation UI & Cost Estimation

### Installation & Setup

```bash
# Clone and setup
git clone <repo-url>
cd ai-medialab/web
npm install

# Setup environment (copy from example)
cp .env.local.example .env.local
# Edit .env.local with your API keys

# Start local Supabase
docker compose up -d

# Run migrations (automatic on first startup)
npm run db:migrate

# Start development server
npm run dev
```

Visit `http://localhost:3000` and follow the [User Guide](./USER_GUIDE.md) for testing all features.

### Next Steps

1. Test all current flows (see [User Guide](./USER_GUIDE.md))
2. Phase 6: Asset Management
3. Phase 7: Cost Tracking & Analytics
4. Phase 8: Video & Audio Generation

See [FUTURE_IMPLEMENTATIONS.md](./FUTURE_IMPLEMENTATIONS.md) for detailed roadmap.

## 💡 Key Features

### MVP (In Development)
- ✅ User authentication
- 🔄 Encrypted API key storage
- 🔄 Project creation and management
- 🔄 Text and image generation
- 🔄 Asset management
- 🔄 Cost tracking per generation
- 🔄 Mobile-optimized UI
- 🔄 PWA support (installable)

### Post-MVP (Planned)
- Video and audio generation
- Asset conversions (image → video)
- Provider health monitoring
- Budget alerts and limits
- Advanced analytics dashboard
- Batch operations
- Offline support

## 🛠️ Tech Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS** - Mobile-first styling
- **shadcn/ui** - Accessible component library
- **React Query** - Server state management
- **Zustand** - Client state management
- **Serwist** - PWA and Service Worker

### Backend & Database
- **Supabase** - PostgreSQL + Auth + Storage + RLS
- **PostgreSQL** - Advanced queries, JSON support
- **Row-Level Security** - Database-level access control

### Security
- **AES-256-GCM** - API key encryption
- **Scrypt** - Key derivation
- **Supabase Auth** - JWT authentication

## 📊 System Architecture

```
Frontend (Next.js) → API Routes → Provider Router → AI APIs
                                 ↓
                         Supabase PostgreSQL
```

See [architecture.md](./docs/architecture.md) for detailed diagrams and specifications.

## 🔐 Security Highlights

- **Encrypted API Keys**: All provider API keys encrypted with AES-256-GCM
- **Row-Level Security**: Database-level access control per user
- **No Client-Side Decryption**: Keys only decrypted on server for API calls
- **HTTPS Everywhere**: All communication encrypted
- **Input Validation**: Zod schemas for all API requests

## 💰 Cost Transparency

Every generation shows:
- Provider used (e.g., "OpenAI GPT-4o")
- Cost breakdown (tokens × price)
- Total cost in USD/cents
- Running project total
- Remaining budget

## 📱 Mobile-First Design

- **Thumb-friendly UI**: Large touch targets (44px minimum)
- **Bottom Navigation**: Primary actions accessible without scrolling
- **Progressive Disclosure**: Advanced options hidden by default
- **Offline Support**: Works without internet connection (PWA)
- **Installable**: "Add to Home Screen" on iOS/Android

## 📈 Database Tables (10+)

Core tables:
- `users` - User accounts
- `projects` - User projects
- `assets` - Generated media files
- `generations` - AI API calls with cost tracking
- `user_api_keys` - Encrypted provider keys
- `provider_health` - Provider monitoring
- `usage_analytics` - Aggregated usage stats
- `budget_alerts` - Budget threshold alerts
- `provider_configs` - User provider settings
- `conversion_jobs` - Asset transformations

See [architecture.md](./docs/architecture.md) for full schema.

## 🔄 Implementation Phases

| Phase | Title | Status |
|-------|-------|--------|
| 1 | Foundation & Auth | ✅ Complete |
| 2 | Project Management | ✅ Complete |
| 3 | API Key Encryption | ✅ Complete |
| 4 | Provider Integration | ✅ Complete |
| 5 | Generation UI & Flows | ✅ Complete |
| 6 | Asset Management | 🔄 Next |
| 7 | Cost Tracking & Analytics | 📋 Planned |
| 8 | Video & Audio Generation | 📋 Planned |
| 9 | Asset Conversions | 📋 Planned |
| 10 | PWA & Mobile Polish | 📋 Planned |
| 11 | Testing & Deployment | 📋 Planned |

**Legend**: ✅ Complete | 🔄 In Progress | 📋 Planned

See [FUTURE_IMPLEMENTATIONS.md](./FUTURE_IMPLEMENTATIONS.md) for detailed roadmap.

## ✨ Completed Features

### Phase 1-5 Completed ✅
- ✅ Sign up / login with email & password
- ✅ OAuth authentication ready
- ✅ Encrypted API keys (AES-256-GCM)
- ✅ Create, read, update, delete projects
- ✅ Budget tracking and display
- ✅ Multi-provider support (6 providers)
- ✅ Text generation (GPT-4o, Claude, Gemini)
- ✅ Image generation (DALL-E 3, Flux, Stable Diffusion)
- ✅ Provider health monitoring
- ✅ Intelligent provider routing with fallback
- ✅ Real-time cost estimation
- ✅ Generation form UI (mobile-optimized)
- ✅ Async generation processing
- ✅ Error handling and recovery
- ✅ Mobile-first responsive design

### Upcoming Features
- 🔄 Asset management and storage
- 🔄 Video generation (Veo3)
- 🔄 Audio generation (ElevenLabs)
- 🔄 Asset conversion (image→video, add voiceover)
- 🔄 Cost analytics dashboard
- 🔄 Budget alerts and limits
- 🔄 PWA offline support
- 🔄 Advanced usage analytics
- 🔄 Batch operations
- 🔄 Generation history

## 📖 Documentation Updates

Documentation is kept in sync with implementation:
- `plan.md` - Overall strategy (static)
- `tasks.md` - Task status (updated after each phase)
- `progress.md` - Implementation progress (updated each session)
- `architecture.md` - Technical details (expanded during implementation)

## 🤝 Contributing

This is an active development project. See [tasks.md](./docs/tasks.md) for current priorities.

## 📝 Environment Variables

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

## 🚦 Getting Started with Implementation

1. Read [plan.md](./docs/plan.md) for overview
2. Check [progress.md](./docs/progress.md) for current status
3. See [tasks.md](./docs/tasks.md) for next immediate tasks
4. Refer to [architecture.md](./docs/architecture.md) for technical details

## 📞 Need Help?

- Check `docs/` folder for detailed documentation
- See `tasks.md` for what needs to be done
- Review `architecture.md` for technical questions

---

**Last Updated**: 2026-02-15
**Status**: Foundation phase preparation
**Next Update**: After Phase 1 completion
