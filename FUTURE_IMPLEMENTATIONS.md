# Future Implementations Roadmap

Detailed roadmap for all planned phases and features.

## Overview

This document outlines the future implementation roadmap for AI Media Creation Workspace. Current status: **Phase 5 Complete** (Generation UI & Basic Generation).

> **Note**: Video generation (Veo 3.1/2.0) and image generation (Imagen 4, Gemini Image) are already working via the Gemini provider. Phase 8 below covers additional providers (ElevenLabs for audio, Replicate) and enhanced UI for these media types.

---

## Phase 6: Asset Management (Next)

**Duration**: 1-2 weeks
**Goal**: Store, organize, and manage generated media

### Database Changes

```sql
-- Update assets table to support generation linking
ALTER TABLE assets ADD COLUMN generation_id UUID REFERENCES generations(id);
ALTER TABLE assets ADD COLUMN source_asset_id UUID REFERENCES assets(id);

-- Add indexes
CREATE INDEX idx_assets_generation_id ON assets(generation_id);
CREATE INDEX idx_assets_source_asset_id ON assets(source_asset_id);
```

### Features to Implement

#### 6.1 Asset Storage in Supabase
- [ ] Upload generated content to Supabase Storage
- [ ] Organize into project folders: `{userId}/{projectId}/{assetId}`
- [ ] Support formats: JPG, PNG, MP4, MP3, WebM
- [ ] Generate thumbnails for preview
- [ ] Set up signed URLs for secure access

#### 6.2 Asset Gallery/Grid View
- [ ] Create asset grid component (mobile-optimized)
- [ ] Lazy load images
- [ ] Show asset metadata (type, size, created date)
- [ ] Display generation details (prompt, provider, cost)
- [ ] Responsive layout (1-3 columns based on screen)

#### 6.3 Asset Preview & Lightbox
- [ ] Full-screen image viewer
- [ ] Video player with controls
- [ ] Audio player with waveform
- [ ] Text editor for text assets
- [ ] Download asset button
- [ ] Share/copy URL
- [ ] View generation metadata

#### 6.4 Asset Organization
- [ ] Tag system for categorization
- [ ] Favorite/star assets
- [ ] Sort by: date, type, cost, name
- [ ] Filter by: type, tag, date range
- [ ] Search by prompt/description
- [ ] Bulk operations (delete, tag, download)

#### 6.5 Asset Management Operations
- [ ] Rename assets
- [ ] Edit descriptions
- [ ] Add/remove tags
- [ ] Archive instead of delete
- [ ] Permanently delete with confirmation
- [ ] Duplicate asset

#### 6.6 API Endpoints
```
GET    /api/assets?projectId=...              # List assets
POST   /api/assets                            # Create asset
GET    /api/assets/[id]                       # Get asset details
PUT    /api/assets/[id]                       # Update asset
DELETE /api/assets/[id]                       # Delete asset
POST   /api/assets/[id]/download              # Get signed download URL
```

#### 6.7 React Hooks
- [ ] `useAssets(projectId)` - Fetch all assets
- [ ] `useAsset(assetId)` - Fetch single asset
- [ ] `useCreateAsset()` - Create new asset
- [ ] `useUpdateAsset()` - Update asset
- [ ] `useDeleteAsset()` - Delete asset
- [ ] `useAssetStats()` - Get asset statistics

#### 6.8 UI Components
- [ ] Asset grid component
- [ ] Asset card component
- [ ] Asset preview lightbox
- [ ] Asset filter/sort bar
- [ ] Asset upload progress
- [ ] Asset context menu

#### 6.9 Pages
- [ ] `/projects/[id]/assets` - Asset gallery
- [ ] Asset detail modal
- [ ] Asset management page

### Success Criteria

- ✅ Generated assets stored in cloud
- ✅ Can browse all project assets
- ✅ Can preview different media types
- ✅ Can organize with tags
- ✅ Can download assets
- ✅ Mobile-optimized gallery

---

## Phase 7: Cost Tracking & Analytics

**Duration**: 2 weeks
**Goal**: Comprehensive cost visibility and analytics

### Database Changes

```sql
-- Update generations table
ALTER TABLE generations ADD COLUMN tokens_input INTEGER;
ALTER TABLE generations ADD COLUMN tokens_output INTEGER;
ALTER TABLE generations ADD COLUMN tokens_total INTEGER;
ALTER TABLE generations ADD COLUMN started_at TIMESTAMP;

-- Aggregation table
CREATE TABLE usage_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  project_id UUID REFERENCES projects(id),
  period_type VARCHAR(20) NOT NULL,  -- 'daily', 'monthly'
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
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_usage_analytics_user_id ON usage_analytics(user_id);
CREATE INDEX idx_usage_analytics_period ON usage_analytics(period_start);
```

### Features to Implement

#### 7.1 Cost Breakdown Dashboard
- [ ] Total cost this month
- [ ] Cost by provider pie chart
- [ ] Cost by generation type
- [ ] Cost per model comparison
- [ ] Daily/weekly/monthly trends
- [ ] Cost vs budget gauge

#### 7.2 Analytics Dashboard
- [ ] Request volume trends
- [ ] Success/failure rates by provider
- [ ] Average generation time by model
- [ ] Most used providers
- [ ] Most used models
- [ ] Peak usage times

#### 7.3 Per-Project Analytics
- [ ] Project total cost
- [ ] Cost distribution (providers, types)
- [ ] Generation count
- [ ] Asset count
- [ ] Average cost per generation
- [ ] Budget utilization

#### 7.4 Usage Aggregation
- [ ] Daily aggregation job (cron)
- [ ] Monthly rollup
- [ ] Accuracy within 1 minute of generation
- [ ] Support historical data queries
- [ ] Handle deletion of generations (update aggregates)

#### 7.5 Export & Reporting
- [ ] Download usage report (PDF)
- [ ] CSV export of generations
- [ ] Monthly invoices
- [ ] Cost summary emails
- [ ] Custom date range exports

#### 7.6 API Endpoints
```
GET    /api/analytics/dashboard                    # Global analytics
GET    /api/analytics/project/[id]                # Project analytics
GET    /api/analytics/usage?period=month           # Usage data
GET    /api/analytics/export?format=csv            # Export data
POST   /api/analytics/report/[period]              # Generate report
```

#### 7.7 React Hooks
- [ ] `useAnalytics()` - Global analytics
- [ ] `useProjectAnalytics(projectId)` - Project analytics
- [ ] `useUsageData(period)` - Usage by period
- [ ] `useExportAnalytics()` - Export data

#### 7.8 UI Components
- [ ] Cost dashboard component
- [ ] Charts (pie, line, bar, gauge)
- [ ] Analytics filters (date range, provider, model)
- [ ] Export button
- [ ] Analytics loading skeleton
- [ ] No-data placeholder

#### 7.9 Pages
- [ ] `/analytics` - Global dashboard
- [ ] `/projects/[id]/analytics` - Project dashboard
- [ ] `/analytics/reports` - Historical reports
- [ ] `/analytics/export` - Data export

### Success Criteria

- ✅ Visual cost breakdown
- ✅ Trend analysis
- ✅ Compare providers by cost
- ✅ Export data
- ✅ Historical data queries
- ✅ Mobile-friendly charts

---

## Phase 8: Audio Generation & Enhanced Media UI

**Duration**: 2 weeks
**Goal**: Add audio generation and improve video/image generation UX

> **Already implemented**: Text generation (OpenAI, Anthropic, Gemini), Image generation (Imagen 4, Gemini Image, DALL-E 3, Flux), Video generation (Veo 3.1, Veo 2.0) — all via 7 registered providers.

### New Providers to Add

#### 8.1 ElevenLabs (Audio)
```typescript
// /src/lib/ai/providers/elevenlabs.ts
- Support text-to-speech
- Multiple voice options
- Voice cloning
- Multiple languages
```

#### 8.3 Replicate (Video/Audio alternatives)
```typescript
// /src/lib/ai/providers/replicate.ts
- Support various models
- Async job handling
- Long-running task polling
```

### Features to Implement

#### 8.1 Enhanced Video Generation UI
- [x] Basic video generation via Veo 3.1/2.0 (Gemini provider)
- [ ] Duration selector UI (4-120 seconds)
- [ ] Resolution selector UI (576x576, 1024x1024)
- [ ] Style/effect selection
- [ ] Preview of similar examples
- [ ] Enhanced cost estimation for duration/resolution

#### 8.2 Audio Generation UI
- [ ] Text input for TTS
- [ ] Voice selection dropdown
- [ ] Speed control
- [ ] Tone selection
- [ ] Language selection
- [ ] Preview button

#### 8.3 Media Preview
- [ ] Video player with controls
- [ ] Audio waveform player
- [ ] Download buttons
- [ ] Share/embed options
- [ ] Duration display
- [ ] File size display

#### 8.4 Async Job Handling
- [ ] Poll for long-running jobs
- [ ] Show progress percentage
- [ ] Estimated time remaining
- [ ] Cancel job button
- [ ] Handle timeout (>10 minutes)
- [ ] Retry on failure

#### 8.5 Database Updates
```sql
-- Track async jobs (for progress tracking)
CREATE TABLE async_jobs (
  id UUID PRIMARY KEY,
  generation_id UUID REFERENCES generations(id),
  provider_job_id VARCHAR(255),
  status VARCHAR(50),
  progress_percent INTEGER,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

> **Note**: Video/audio generation already uses the existing `POST /api/generate` endpoint with `generationType: 'video'` or `'audio'`. The Gemini provider handles Veo polling internally.

#### 8.6 Additional API Endpoints
```
GET    /api/jobs/[id]/status                      # Check async job progress
POST   /api/jobs/[id]/cancel                      # Cancel async job
```

#### 8.7 React Hooks
- [x] `useCreateGeneration()` - Already handles all types (text/image/video/audio)
- [ ] `useAsyncJobStatus(jobId)` - Poll job progress percentage
- [ ] `useCancelAsyncJob()` - Cancel running job

#### 8.8 UI Components
- [x] Video result display (`<video>` player in generation-result.tsx)
- [x] Audio result display (`<audio>` player in generation-result.tsx)
- [ ] Audio generation form (voice selection, language, speed)
- [ ] Progress bar with percentage
- [ ] Cancel button
- [ ] Estimated time display

### Success Criteria

- ✅ Generate 4-120 second videos (**done via Veo**)
- ✅ Generate audio from text
- ✅ Show generation progress
- ✅ Handle long-running tasks (**done — polling in Gemini provider**)
- ✅ Preview generated media (**done — generation-result.tsx**)
- ✅ Accurate cost calculation

---

## Phase 9: Asset Conversions

**Duration**: 1-2 weeks
**Goal**: Transform media (image→video, add voiceover, etc.)

### Database Changes

```sql
CREATE TABLE conversion_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL REFERENCES projects(id),
  user_id UUID NOT NULL REFERENCES users(id),
  source_asset_id UUID REFERENCES assets(id),
  target_asset_id UUID REFERENCES assets(id),
  conversion_type VARCHAR(50) NOT NULL,  -- 'image_to_video', 'add_voiceover'
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  parameters JSONB DEFAULT '{}',
  error_message TEXT,
  cost_cents INTEGER DEFAULT 0,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_conversion_jobs_project ON conversion_jobs(project_id);
CREATE INDEX idx_conversion_jobs_status ON conversion_jobs(status);
```

### Features to Implement

#### 9.1 Image to Video Conversion
- [ ] Select image asset
- [ ] Add motion/animation prompts
- [ ] Choose video duration (4-10 seconds)
- [ ] Select provider (Runway recommended)
- [ ] Show preview
- [ ] Save as new video asset

#### 9.2 Add Voiceover to Video
- [ ] Select video asset
- [ ] Input voiceover text
- [ ] Choose voice (ElevenLabs)
- [ ] Adjust volume balance
- [ ] Preview with original audio
- [ ] Save as new video asset

#### 9.3 Image Enhancement
- [ ] Upscale resolution
- [ ] Enhance colors
- [ ] Remove background
- [ ] Change background

#### 9.4 Audio Mixing
- [ ] Combine multiple audio tracks
- [ ] Adjust volumes
- [ ] Add transitions
- [ ] Export mixed audio

#### 9.5 Conversion UI
- [ ] Asset selector (source)
- [ ] Conversion type selector
- [ ] Parameters for each type
- [ ] Preview button
- [ ] Cost estimate
- [ ] Start conversion button
- [ ] Progress tracking

#### 9.6 Conversion Status
- [ ] Show conversion progress
- [ ] Estimated time remaining
- [ ] Can cancel during processing
- [ ] Show errors clearly
- [ ] Retry failed conversions

#### 9.7 API Endpoints
```
POST   /api/conversions                           # Start conversion
GET    /api/conversions/[id]                      # Get status
POST   /api/conversions/[id]/cancel               # Cancel
GET    /api/conversions?projectId=...             # List conversions
```

#### 9.8 React Hooks
- [ ] `useConvert(type)` - Start conversion
- [ ] `useConversionStatus(conversionId)` - Track status
- [ ] `useCancelConversion()` - Cancel conversion
- [ ] `useConversions(projectId)` - List conversions

### Success Criteria

- ✅ Convert images to videos
- ✅ Add voiceover to videos
- ✅ Track conversion progress
- ✅ Handle conversion errors
- ✅ Cost accurate
- ✅ Results stored as assets

---

## Phase 10: PWA & Mobile Polish

**Duration**: 1-2 weeks
**Goal**: Production-ready mobile app

### Features to Implement

#### 10.1 PWA Configuration
- [ ] Configure `manifest.json`
  - App name: "AI Media Creator"
  - Icons: 192x192, 512x512
  - Colors: Primary: #2563eb, Secondary: #9333ea
  - Start URL: /projects
  - Display: standalone
- [ ] Set up Service Worker (Serwist)
- [ ] Configure caching strategies
- [ ] Test on iOS and Android

#### 10.2 Install Prompts
- [ ] "Add to Home Screen" banner on Android
- [ ] Installation instructions for iOS
- [ ] Install button in settings
- [ ] Highlight in onboarding

#### 10.3 Offline Support
- [ ] Cache critical assets
- [ ] Support viewing cached projects
- [ ] Queue generation requests (sync when online)
- [ ] Offline indicator
- [ ] Sync status display

#### 10.4 Background Sync
- [ ] Queue API key additions
- [ ] Queue generation requests
- [ ] Sync when connectivity restored
- [ ] Show sync status
- [ ] Handle offline -> online transitions

#### 10.5 Mobile Optimizations
- [ ] Optimize images (next/image)
- [ ] Lazy load components
- [ ] Code splitting by route
- [ ] Reduce bundle size
- [ ] Optimize fonts
- [ ] Critical CSS inlining

#### 10.6 Performance Optimization
- [ ] Lighthouse score >90
- [ ] FCP <1.5s
- [ ] LCP <2.5s
- [ ] CLS <0.1
- [ ] TTI <3s
- [ ] Minified assets

#### 10.7 UX Polish
- [ ] Loading skeletons everywhere
- [ ] Success animations
- [ ] Error toast messages
- [ ] Undo/redo for actions (future)
- [ ] Haptic feedback on mobile
- [ ] Smooth transitions
- [ ] Proper focus states

#### 10.8 Mobile-Specific Features
- [ ] Camera input for image descriptions (future)
- [ ] Voice input for prompts (future)
- [ ] Share generation to social media
- [ ] Copy to clipboard with feedback
- [ ] Swipe navigation
- [ ] Pull-to-refresh

#### 10.9 Testing
- [ ] Test on iPhone 12-15
- [ ] Test on Android 10-14
- [ ] Test on iPad
- [ ] Test on slow 4G connection
- [ ] Test with battery saver
- [ ] Test offline mode thoroughly

### Success Criteria

- ✅ Installable on iOS and Android
- ✅ Works offline (view existing data)
- ✅ Syncs when connection restored
- ✅ Lighthouse score >90
- ✅ <2.5s load time on 4G
- ✅ Smooth animations
- ✅ Touch-optimized UI

---

## Phase 11: Testing & Deployment

**Duration**: 2 weeks
**Goal**: Production-ready application

### Testing

#### 11.1 Unit Tests
- [ ] Provider classes
- [ ] Cost calculator
- [ ] Encryption/decryption
- [ ] Database queries
- [ ] API validators

#### 11.2 Integration Tests
- [ ] User signup → login → generate → view
- [ ] Multi-provider fallback
- [ ] Cost calculation accuracy
- [ ] Asset upload and retrieval
- [ ] Conversion workflows

#### 11.3 E2E Tests (Playwright)
- [ ] Complete user journey
- [ ] Error scenarios
- [ ] Mobile flows
- [ ] Offline scenarios
- [ ] Provider health checks

#### 11.4 Performance Tests
- [ ] Load testing (1000 concurrent users)
- [ ] Database query performance
- [ ] File upload/download
- [ ] Real-time updates
- [ ] Memory leaks

#### 11.5 Security Tests
- [ ] API key encryption/decryption
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] CSRF protection
- [ ] Rate limiting
- [ ] Access control verification

#### 11.6 Accessibility Tests
- [ ] WCAG 2.1 AA compliance
- [ ] Keyboard navigation
- [ ] Screen reader testing
- [ ] Color contrast
- [ ] Focus indicators

### Deployment

#### 11.1 Production Environment
- [ ] Set up production Supabase
- [ ] Configure domain/SSL
- [ ] Set up CDN (Cloudflare)
- [ ] Configure email (SMTP)
- [ ] Set up error monitoring (Sentry)
- [ ] Set up analytics (Posthog)
- [ ] Configure logging

#### 11.2 CI/CD Pipeline
- [ ] GitHub Actions workflow
- [ ] Automated tests on PR
- [ ] Lint checking
- [ ] Build verification
- [ ] Staging deployment
- [ ] Production deployment with approval

#### 11.3 Infrastructure
- [ ] Docker containerization
- [ ] Kubernetes setup (optional)
- [ ] Database backups
- [ ] Log aggregation
- [ ] Monitoring alerts
- [ ] Disaster recovery plan

#### 11.4 Documentation
- [ ] API documentation (Swagger)
- [ ] Deployment guide
- [ ] Troubleshooting guide
- [ ] Contributing guide
- [ ] Architecture diagrams
- [ ] Database schema docs

#### 11.5 Post-Launch
- [ ] Monitor errors
- [ ] Track user adoption
- [ ] Gather feedback
- [ ] Fix critical issues
- [ ] Plan feature releases
- [ ] Community engagement

### Success Criteria

- ✅ 90%+ test coverage
- ✅ All critical paths tested
- ✅ Zero known security issues
- ✅ <100ms API response times
- ✅ 99.9% uptime
- ✅ Accessible to all users
- ✅ Live and stable

---

## Additional Planned Features (Post-MVP)

### Provider Features

#### 12.1 Additional Providers
- [ ] Mistral AI
- [ ] Cohere
- [ ] HuggingFace Inference
- [ ] Together.ai
- [ ] Deepseek
- [ ] Local models (Ollama)

#### 12.2 Model-Specific Features
- [ ] Vision capabilities (Claude, Gemini)
- [ ] Fine-tuning support
- [ ] Custom system prompts
- [ ] Seed for reproducibility
- [ ] Token counting before generation

### User Features

#### 13.1 Teams & Collaboration
- [ ] Invite team members
- [ ] Shared projects
- [ ] Role-based access
- [ ] Audit logs
- [ ] Comment on generations
- [ ] Shared templates

#### 13.2 Advanced Analytics
- [ ] ROI calculation
- [ ] Cost per use case
- [ ] Provider comparison tool
- [ ] Cost forecasting
- [ ] Budget optimization tips
- [ ] Usage patterns AI

#### 13.3 Content Management
- [ ] Prompt templates
- [ ] Save/load workflows
- [ ] Batch operations
- [ ] Scheduled generation (cron)
- [ ] Generation webhooks
- [ ] API access for developers

#### 13.4 Monetization Features
- [ ] Usage limits by plan
- [ ] Monthly subscriptions
- [ ] Pay-as-you-go billing
- [ ] Invoice management
- [ ] Multi-currency support
- [ ] Discount codes

### Performance Features

#### 14.1 Caching
- [ ] Redis cache for frequently generated content
- [ ] Browser cache optimization
- [ ] CDN for asset delivery
- [ ] Database query caching
- [ ] API response caching

#### 14.2 Optimization
- [ ] Image compression
- [ ] Video transcoding
- [ ] Lazy loading everywhere
- [ ] Worker processes for heavy tasks
- [ ] Database query optimization

---

## Estimated Timeline

| Phase | Months | Cumulative |
|-------|--------|-----------|
| 1-5 (Done) | 1 | 1 |
| 6-7 | 1 | 2 |
| 8-9 | 1 | 3 |
| 10-11 | 1 | 4 |
| 12-14 (Post-MVP) | 2-4 | 6-8 |

---

## Success Metrics

- **User Acquisition**: 10k+ active users in first 3 months
- **Cost Accuracy**: 99.9% within $0.01 of actual provider costs
- **Reliability**: 99.9% uptime
- **Performance**: <100ms API response times
- **Accessibility**: WCAG 2.1 AA compliance
- **Security**: Zero critical vulnerabilities
- **User Satisfaction**: 4.5+ stars on App Store/Play Store

---

## Key Decisions Made

1. **Supabase Cloud**: Managed PostgreSQL with Auth, RLS, and Storage
2. **AES-256-GCM Encryption**: Industry standard for API key protection
3. **Multi-provider Architecture**: 7 providers, no vendor lock-in, user choice
4. **Mobile-first Design**: Growing mobile usage, better UX
5. **Transparent Pricing**: All costs visible immediately
6. **PWA instead of Native**: Cross-platform, easier updates
7. **Next.js 16**: Modern, full-stack, great DX with Turbopack
8. **Cookie-based Auth**: `@supabase/ssr` for reliable server-side authentication
9. **Provider Alias System**: Decouples user-facing names from internal provider IDs

---

## Known Limitations (To Address)

- ⚠️ API key rotation (v1.2)
- ⚠️ Advanced provider settings (v1.1)
- ⚠️ Webhook support (v2.0)
- ⚠️ Batch API endpoints (v1.5)
- ⚠️ Real-time collab (v2.0)
- ⚠️ Custom domain hosting (v1.3)

---

## Contributing

To contribute to future phases:

1. Pick a feature from the roadmap
2. Open a GitHub Issue
3. Discuss implementation approach
4. Create PR with tests
5. Code review and merge
6. Deploy to production

---

**Last Updated**: 2026-02-17
**Status**: Phase 5 Complete, Phase 6 Next
**Maintainer**: Development Team
