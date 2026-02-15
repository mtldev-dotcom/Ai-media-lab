# Production Deployment Guide

Complete guide for deploying AI Media Creation Workspace to production.

**Status**: Ready for production deployment
**Last Updated**: 2026-02-15
**Target**: Vercel + Supabase Cloud

---

## Table of Contents

1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Environment Setup](#environment-setup)
3. [Database Setup](#database-setup)
4. [Deployment Platforms](#deployment-platforms)
5. [Configuration](#configuration)
6. [Security Hardening](#security-hardening)
7. [Monitoring & Logging](#monitoring--logging)
8. [Performance Optimization](#performance-optimization)
9. [Backup & Recovery](#backup--recovery)
10. [Post-Deployment](#post-deployment)
11. [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

### Code Quality
- [ ] All TypeScript errors resolved
- [ ] Linting passes (`npm run lint`)
- [ ] Tests pass (`npm run test`)
- [ ] No console errors or warnings
- [ ] No hardcoded secrets in code
- [ ] Environment variables documented
- [ ] Git history is clean

### Build & Performance
- [ ] Production build successful (`npm run build`)
- [ ] Bundle size optimized
- [ ] Images optimized and compressed
- [ ] Code splitting working
- [ ] Lighthouse score >90
- [ ] Load time <2.5s on 4G

### Security
- [ ] All dependencies updated
- [ ] Security scan passed (`npm audit`)
- [ ] No known vulnerabilities
- [ ] API key encryption working
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] HTTPS enforced

### Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] All 37 user guide tests pass
- [ ] Mobile testing complete
- [ ] Browser compatibility verified
- [ ] Cross-browser tested

### Documentation
- [ ] README.md updated
- [ ] API documentation generated
- [ ] Deployment guide complete
- [ ] Environment variables documented
- [ ] Architecture documented
- [ ] Troubleshooting guide created

### Infrastructure
- [ ] Domain name purchased
- [ ] SSL certificate ready
- [ ] CDN configured
- [ ] Database backups enabled
- [ ] Monitoring set up
- [ ] Logging configured
- [ ] CI/CD pipeline ready

---

## Environment Setup

### 1. Register Accounts

Create accounts for:

```bash
# Infrastructure
- Vercel (vercel.com)
- Supabase Cloud (supabase.com)
- GitHub (github.com) - if not already
- CloudFlare (cloudflare.com) - optional CDN
- SendGrid (sendgrid.com) - email service
- Sentry (sentry.io) - error tracking
- PostHog (posthog.com) - analytics

# AI Providers
- OpenAI (platform.openai.com)
- Anthropic (console.anthropic.com)
- Google Cloud (console.cloud.google.com)
- FAL.ai (fal.ai)
- Banana.dev
- Runway
- ElevenLabs (elevenlabs.io)
```

### 2. Domain Setup

```bash
# Get domain from:
# - Route 53 (AWS)
# - GoDaddy
# - Namecheap
# - Vercel Domains

# For this guide, we'll use example.com
DOMAIN="yourdomain.com"
```

### 3. Git Repository

```bash
# Ensure repository is set up
git init
git add .
git commit -m "Initial commit: AI Media Creation Workspace Phase 5"
git branch -M main
git remote add origin https://github.com/username/ai-medialab.git
git push -u origin main
```

---

## Database Setup

### Option 1: Supabase Cloud (Recommended for MVP)

#### 1. Create Supabase Project

```bash
# 1. Go to https://app.supabase.com
# 2. Click "New project"
# 3. Fill in:
#    - Project name: "ai-medialab"
#    - Password: Generate strong password
#    - Region: Closest to your users (us-east-1 for US)
#    - Pricing: Pay-as-you-go
# 4. Click "Create new project"
# 5. Wait 2-3 minutes for initialization
```

#### 2. Get Connection Details

```bash
# From Supabase Dashboard:
# - Project URL (NEXT_PUBLIC_SUPABASE_URL)
# - Anon Key (NEXT_PUBLIC_SUPABASE_ANON_KEY)
# - Service Role Key (SUPABASE_SERVICE_KEY)
# - Database password (saved securely)
```

#### 3. Run Migrations

```bash
# Copy current migration
cp web/supabase/migrations/001_initial_schema_local.sql \
   migrations/001_initial_schema.sql

# Update to production version (remove local comments):
# File: migrations/001_initial_schema.sql

-- Initialize schema for production
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- [Rest of schema from 001_initial_schema_local.sql]
# ...

# Run via Supabase CLI or SQL Editor:
supabase db push

# Or manually via Supabase Dashboard:
# 1. Go to SQL Editor
# 2. Create new query
# 3. Paste migration content
# 4. Execute
```

#### 4. Enable Row-Level Security

```bash
# Via Supabase Dashboard → Authentication → Row-Level Security

# For each table, enable RLS:
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;

# Create policies (see SECURITY section below)
```

#### 5. Configure Authentication

```bash
# Supabase Dashboard → Authentication → Providers

# Email/Password (already enabled)
# - Enable "Email confirmations"
# - Set redirect URL: https://yourdomain.com/auth/callback

# OAuth Providers (optional)
# - GitHub
# - Google
# - Discord

# Email Templates
# - Customize welcome email
# - Set SMTP for production (SendGrid recommended)
```

#### 6. Storage Setup

```bash
# Create buckets via Supabase Dashboard

# Create buckets:
- images (public)
- videos (public)
- audio (public)
- thumbnails (public)

# Configure CORS:
# [
#   {
#     "origin": "https://yourdomain.com",
#     "methods": ["GET", "POST", "PUT", "DELETE"],
#     "allowedHeaders": ["*"],
#     "credentials": true
#   }
# ]

# Set bucket policies:
-- Public read, authenticated write
CREATE POLICY "public read" ON storage.objects
  FOR SELECT USING (bucket_id IN ('images', 'videos', 'audio', 'thumbnails'));

CREATE POLICY "authenticated write" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id IN ('images', 'videos', 'audio', 'thumbnails') AND
    auth.role() = 'authenticated'
  );
```

### Option 2: Self-Hosted PostgreSQL (Advanced)

For self-hosted in production:

```bash
# Not recommended for MVP - requires:
# - Kubernetes cluster or VPS
# - PostgreSQL expertise
# - Backup strategy
# - HA/failover setup
# - Security hardening

# If needed, see INFRASTRUCTURE.md for details
```

---

## Deployment Platforms

### Option 1: Vercel (Recommended for Next.js)

#### 1. Connect GitHub

```bash
# 1. Go to vercel.com
# 2. Click "Import Project"
# 3. Connect your GitHub account
# 4. Select ai-medialab repository
# 5. Configure project:
#    - Root Directory: ./web
#    - Framework: Next.js
#    - Build Command: npm run build
#    - Output Directory: .next
```

#### 2. Environment Variables

```bash
# In Vercel Dashboard → Settings → Environment Variables

NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key
ENCRYPTION_MASTER_KEY=your_64_char_hex_key

# Email
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Monitoring
SENTRY_DSN=your_sentry_dsn
NEXT_PUBLIC_POSTHOG_KEY=your_posthog_key

# Analytics
NEXT_PUBLIC_GA_ID=your_google_analytics_id
```

#### 3. Deploy

```bash
# Method 1: Automatic on push
git push origin main
# Deployment starts automatically

# Method 2: Manual via Vercel CLI
npm i -g vercel
vercel --prod

# Monitor deployment:
# - Vercel Dashboard → Deployments
# - Watch build logs in real-time
# - Verify preview URLs work
```

#### 4. Configure Domain

```bash
# In Vercel Dashboard → Settings → Domains

# 1. Add Domain
# 2. Choose DNS Configuration
# 3. Update your domain registrar with Vercel nameservers
# 4. Wait 24-48 hours for DNS propagation
# 5. Verify domain shows "Valid Configuration"

# SSL Certificate
# - Automatically provisioned via Let's Encrypt
# - Auto-renews before expiration
# - Available at https://yourdomain.com
```

### Option 2: Railway / Render (Alternative)

```bash
# Railway (railway.app)
# - Easy GitHub integration
# - PostgreSQL included
# - Pay-as-you-go pricing
# - Good for startups

# Steps:
# 1. Connect GitHub
# 2. Select repository
# 3. Configure environment variables
# 4. Select Node.js service
# 5. Add PostgreSQL service
# 6. Deploy

# Render (render.com)
# - Similar to Railway
# - Free tier available (limited)
# - Simple deployment
```

### Option 3: Docker + Kubernetes

For enterprise deployments:

```bash
# Create Dockerfile
cat > Dockerfile << 'EOF'
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Build
RUN npm run build

# Expose port
EXPOSE 3000

# Start
CMD ["npm", "start"]
EOF

# Build image
docker build -t ai-medialab:latest .

# Deploy to:
# - AWS ECS
# - Google Cloud Run
# - Azure Container Instances
# - Self-hosted Kubernetes
```

---

## Configuration

### 1. Environment Variables

**Production `.env.production.local`:**

```bash
# App Configuration
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...  # From Supabase
SUPABASE_SERVICE_KEY=eyJhbGc...           # From Supabase

# Encryption (CRITICAL - use strong random value)
# Generate with: openssl rand -hex 32
ENCRYPTION_MASTER_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

# Email Service (SendGrid)
SENDGRID_API_KEY=SG.abc123...
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# Error Tracking
SENTRY_DSN=https://your@sentry.io/12345

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_abc123...
NEXT_PUBLIC_GA_ID=G-ABC123...

# Optional: Feature Flags
NEXT_PUBLIC_FEATURE_VIDEO_GENERATION=false
NEXT_PUBLIC_FEATURE_AUDIO_GENERATION=false
NEXT_PUBLIC_FEATURE_CONVERSIONS=false

# Rate Limiting
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000

# Logging
LOG_LEVEL=info
```

### 2. Next.js Configuration

**`next.config.js`:**

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  productionBrowserSourceMaps: false,
  compress: true,

  // Image optimization
  images: {
    domains: ['your-project.supabase.co'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 year
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ]
  },

  // CORS
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/api/:path*',
          destination: 'https://yourdomain.com/api/:path*',
        },
      ],
    }
  },
}

module.exports = nextConfig
```

### 3. Middleware Configuration

**`src/middleware.ts`:**

```typescript
import { type NextRequest, NextResponse } from 'next/server'
import { jwtVerify } from 'jose'

export async function middleware(request: NextRequest) {
  // Redirect HTTP to HTTPS in production
  if (
    process.env.NODE_ENV === 'production' &&
    request.headers.get('x-forwarded-proto') !== 'https'
  ) {
    return NextResponse.redirect(
      `https://${request.headers.get('host')}${request.nextUrl.pathname}`,
      301
    )
  }

  // Protected routes
  const protectedRoutes = ['/projects', '/analytics', '/settings', '/generate']
  const path = request.nextUrl.pathname

  if (protectedRoutes.some((route) => path.startsWith(route))) {
    const token = request.cookies.get('auth-token')
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

---

## Security Hardening

### 1. API Security

**Rate Limiting:**

```typescript
// src/lib/middleware/rate-limit.ts
import { Ratelimit } from '@upstash/ratelimit'

const ratelimit = new Ratelimit({
  redis: {
    url: process.env.UPSTASH_REDIS_URL,
    token: process.env.UPSTASH_REDIS_TOKEN,
  },
  limiter: Ratelimit.slidingWindow(100, '1 m'), // 100 requests per minute
})

export async function checkRateLimit(ip: string) {
  const { success } = await ratelimit.limit(ip)
  return success
}
```

**CORS Configuration:**

```typescript
// src/lib/middleware/cors.ts
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': process.env.NEXT_PUBLIC_APP_URL,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
}
```

### 2. Database Security

**Row-Level Security Policies:**

```sql
-- Users can only see their own data
CREATE POLICY "Users see own data" ON projects
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users update own data" ON projects
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own data" ON projects
  FOR DELETE USING (auth.uid() = user_id);

-- Apply to all tables: projects, assets, generations, user_api_keys, etc.
```

**Encryption at Rest:**

```bash
# Supabase Cloud includes encryption at rest
# For self-hosted, enable:
# - PostgreSQL native encryption
# - Disk encryption (dm-crypt)
# - Backup encryption
```

### 3. Secrets Management

**Never commit secrets:**

```bash
# .env.production.local is in .gitignore
cat >> .gitignore << 'EOF'
.env.local
.env.production.local
.env.test.local
.env.development.local
EOF

# Use Vercel Secrets (built-in)
# Or external: Doppler, HashiCorp Vault, AWS Secrets Manager

# Rotation schedule:
# - ENCRYPTION_MASTER_KEY: Every 90 days
# - API Keys: Every 30 days
# - Database passwords: Every 60 days
```

### 4. Input Validation

**All endpoints must validate:**

```typescript
// Example: Generate endpoint
import { z } from 'zod'

const GenerateSchema = z.object({
  projectId: z.string().uuid('Invalid project ID'),
  generationType: z.enum(['text', 'image', 'video', 'audio']),
  provider: z.string().min(1).max(50),
  model: z.string().min(1).max(100),
  prompt: z.string().min(1).max(10000), // Max 10k chars
  parameters: z.record(z.any()).optional(),
})

// Validate all user input
export async function POST(request: NextRequest) {
  const body = await request.json()
  const validated = GenerateSchema.parse(body)
  // Process validated data
}
```

---

## Monitoring & Logging

### 1. Error Tracking (Sentry)

```bash
# Installation
npm install @sentry/nextjs

# Configuration: next.config.js
const withSentry = require('@sentry/nextjs').withSentry

module.exports = withSentry(nextConfig, {
  org: 'your-org',
  project: 'ai-medialab',
  authToken: process.env.SENTRY_AUTH_TOKEN,
})
```

**Usage:**

```typescript
import * as Sentry from '@sentry/nextjs'

// Automatic error capture
// Or manual:
Sentry.captureException(error)
Sentry.captureMessage('User action', 'info')
Sentry.setUser({ id: userId, email: userEmail })
```

### 2. Analytics (PostHog)

```bash
# Installation
npm install posthog-js

# Usage
import { usePostHog } from 'posthog-js/react'

export function MyComponent() {
  const posthog = usePostHog()

  const handleClick = () => {
    posthog?.capture('button_clicked', {
      button_name: 'generate',
      project_id: projectId,
    })
  }
}
```

### 3. Logging (Structured)

```typescript
// src/lib/logger.ts
export const logger = {
  info: (message: string, meta?: any) => {
    console.log(JSON.stringify({ level: 'info', message, ...meta }))
  },
  error: (message: string, error?: Error, meta?: any) => {
    console.error(JSON.stringify({ level: 'error', message, error: error?.message, ...meta }))
  },
  warn: (message: string, meta?: any) => {
    console.warn(JSON.stringify({ level: 'warn', message, ...meta }))
  },
}
```

### 4. Monitoring Dashboard

**Key Metrics to Track:**

```
- API response times (p50, p95, p99)
- Error rates by endpoint
- User signup/login rates
- Generation success rates by provider
- Cost accuracy
- Database query performance
- Storage usage
- Authentication success rates
- Feature usage
- User retention
```

---

## Performance Optimization

### 1. Image Optimization

```typescript
// Use next/image for all images
import Image from 'next/image'

export function AssetCard({ src, alt }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={300}
      height={300}
      quality={75}
      priority={false}
      placeholder="blur"
      blurDataURL="data:image/svg+xml,..."
    />
  )
}
```

### 2. Code Splitting

```typescript
// Dynamic imports for large components
import dynamic from 'next/dynamic'

const HeavyChart = dynamic(() => import('./HeavyChart'), {
  loading: () => <div>Loading chart...</div>,
  ssr: false,
})
```

### 3. Database Query Optimization

```typescript
// Use indexes for frequent queries
CREATE INDEX idx_generations_project_created ON generations(project_id, created_at DESC);
CREATE INDEX idx_assets_project_type ON assets(project_id, type);

// Avoid N+1 queries
// Use batch queries and relationships
```

### 4. Caching Strategy

**HTTP Caching:**

```typescript
// Cache immutable assets
response.headers.set('Cache-Control', 'public, immutable, max-age=31536000')

// Cache static pages
response.headers.set('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')

// No cache for sensitive data
response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
```

**Database Caching (Redis):**

```typescript
import { Redis } from '@upstash/redis'

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
})

// Cache provider health
const health = await redis.get(`health:${provider}`)
if (!health) {
  const fresh = await checkProvider(provider)
  await redis.setex(`health:${provider}`, 300, JSON.stringify(fresh))
}
```

---

## Backup & Recovery

### 1. Database Backups

**Supabase Cloud (Automatic):**

- ✅ Automatic daily backups
- ✅ 7-day retention
- ✅ Point-in-time recovery
- ✅ Encryption at rest

**Configure via Dashboard:**

```
Settings → Backups → Enable automated backups
```

### 2. Manual Backups

```bash
# Monthly backup to S3
pg_dump -h your-host -U postgres your-db > backup-$(date +%Y%m%d).sql

# Upload to S3
aws s3 cp backup-*.sql s3://your-backup-bucket/
```

### 3. Recovery Procedure

```bash
# 1. Create new database
# 2. Restore from backup
psql -h new-host -U postgres new-db < backup-20260215.sql

# 3. Update connection strings
# 4. Test thoroughly
# 5. Update DNS/load balancer
```

### 4. Disaster Recovery Plan

```
RTO (Recovery Time Objective): < 4 hours
RPO (Recovery Point Objective): < 1 hour

Steps:
1. Detect failure (monitoring alert)
2. Notify team (Slack, PagerDuty)
3. Assess impact
4. Restore from backup
5. Verify functionality
6. Update DNS
7. Monitor recovery
8. Post-mortem analysis
```

---

## Post-Deployment

### 1. Health Checks

```bash
# Verify deployment
curl -I https://yourdomain.com
# Should return 200 OK with security headers

# Check API
curl https://yourdomain.com/api/health
# Should return {"status": "ok"}

# Test authentication
# 1. Sign up at https://yourdomain.com/signup
# 2. Login
# 3. Create project
# 4. Add API key
# 5. Generate content
```

### 2. Smoke Testing

Run USER_GUIDE.md tests in production:

```bash
# Test 1-5: Authentication
# Test 10-14: Project Management
# Test 15-20: Generation
# All should pass in production
```

### 3. Monitor for Issues

```bash
# Watch in real-time:
# - Sentry dashboard for errors
# - PostHog for user behavior
# - Vercel analytics for performance
# - Database for slow queries
# - Log aggregation for warnings
```

### 4. Performance Baseline

```bash
# Record initial metrics
- Page load time: _____ ms
- API response time: _____ ms
- Database query time: _____ ms
- User signup time: _____ s
- Generation time: _____ s
- Cost estimation time: _____ ms

# Monitor weekly to detect regression
```

### 5. Security Audit

```bash
# Run security checks
npm audit                           # Dependencies
npm run lint                        # Code quality
npx lighthouse https://yourdomain.com  # Performance

# Manual checks
- Test SQL injection attempts
- Verify API key encryption
- Check HTTPS/SSL
- Test CORS
- Verify RLS policies
- Check rate limiting
```

---

## Troubleshooting

### Issue: "Supabase Connection Failed"

**Diagnosis:**

```bash
# Check credentials
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Test connection
curl -H "apikey: YOUR_ANON_KEY" \
  https://your-project.supabase.co/rest/v1/users?limit=1
```

**Solution:**

```bash
# 1. Verify credentials in Vercel settings
# 2. Check Supabase project is running
# 3. Verify RLS policies aren't blocking access
# 4. Check network connectivity
# 5. Restart deployment
```

### Issue: "API Key Encryption Failed"

**Diagnosis:**

```bash
# Check master key
echo $ENCRYPTION_MASTER_KEY | wc -c  # Should be 65 (64 + newline)

# Verify format
echo $ENCRYPTION_MASTER_KEY | grep -E '^[a-f0-9]{64}$'
```

**Solution:**

```bash
# 1. Regenerate ENCRYPTION_MASTER_KEY: openssl rand -hex 32
# 2. Update in Vercel environment variables
# 3. Redeploy application
# 4. Re-encrypt stored keys with migration script
```

### Issue: "Generation Fails Silently"

**Diagnosis:**

```bash
# Check Sentry for errors
# Check browser console (F12)
# Check network tab for failed requests
# Check API logs

# Test endpoint directly
curl -X POST https://yourdomain.com/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "projectId": "...",
    "generationType": "text",
    "provider": "openai",
    "model": "gpt-4o",
    "prompt": "test"
  }'
```

**Solution:**

```bash
# 1. Check provider API keys are valid
# 2. Verify provider health
# 3. Check rate limits
# 4. Review error logs in Sentry
# 5. Check database for generation record
```

### Issue: "High Database Latency"

**Diagnosis:**

```bash
# Check slow query log
SELECT query, calls, mean_time FROM pg_stat_statements
  ORDER BY mean_time DESC LIMIT 10;

# Monitor connections
SELECT usename, state, count(*) FROM pg_stat_activity
  GROUP BY usename, state;
```

**Solution:**

```bash
# 1. Add database indexes (see schema)
# 2. Optimize queries (avoid SELECT *)
# 3. Enable query cache (Redis)
# 4. Increase connection pool
# 5. Upgrade database instance
# 6. Archive old data
```

### Issue: "Out of Memory"

**Diagnosis:**

```bash
# Check memory in Vercel logs
# Check for memory leaks:
# - Open DevTools Memory tab
# - Take heap snapshot
# - Look for detached DOM nodes
```

**Solution:**

```bash
# 1. Increase Node memory: NODE_OPTIONS="--max-old-space-size=4096"
# 2. Reduce bundle size (code splitting)
# 3. Implement pagination for large lists
# 4. Lazy load images/components
# 5. Clear cache regularly
```

---

## Rollback Procedure

If deployment has critical issues:

```bash
# Via Vercel Dashboard
# 1. Go to Deployments
# 2. Find last working deployment
# 3. Click "Redeploy"
# 4. Monitor for recovery

# Via Git
git revert HEAD --no-edit
git push origin main
# Automatic redeployment to previous version
```

---

## Maintenance Schedule

### Daily
- [ ] Monitor Sentry for errors
- [ ] Check status dashboard
- [ ] Verify user signups

### Weekly
- [ ] Review performance metrics
- [ ] Check database size
- [ ] Verify backups completed
- [ ] Update security patches

### Monthly
- [ ] Security audit
- [ ] Dependency updates
- [ ] Cost analysis
- [ ] User feedback review
- [ ] Capacity planning

### Quarterly
- [ ] Full penetration test
- [ ] Disaster recovery drill
- [ ] Architecture review
- [ ] Performance optimization

---

## Cost Management

### Expected Monthly Costs

| Service | Tier | Cost |
|---------|------|------|
| Vercel | Hobby | Free |
| Vercel | Pro | $20/mo |
| Supabase | Free | Free |
| Supabase | Pro | $25/mo |
| SendGrid | Free | Free |
| SendGrid | Paid | $19.95-$349/mo |
| Sentry | Free | Free |
| PostHog | Cloud | Free-$500+/mo |
| Domain | Registrar | $10-15/year |
| CDN | CloudFlare | Free-200/mo |
| **Total** | **MVP** | **$50-100/mo** |

### Optimization Tips

```bash
# 1. Use free tiers during MVP
# 2. Monitor Vercel bandwidth usage
# 3. Clean up old Supabase files
# 4. Implement rate limiting (prevent abuse)
# 5. Cache aggressively
# 6. Compress all assets
```

---

## Scaling Guide (After MVP)

As you grow:

```
0-1,000 users: Current setup
- Vercel Pro
- Supabase Pro
- Cloudflare CDN

1,000-10,000 users: Scale database
- Supabase Dedicated Instance
- Redis cache layer
- CDN with caching rules

10,000+ users: Enterprise setup
- Multi-region deployment
- Database read replicas
- Load balancing
- Dedicated infrastructure
```

---

## Checklist: Deployment Day

- [ ] All tests passing
- [ ] Security audit complete
- [ ] Environment variables set
- [ ] Database migrated
- [ ] SSL certificate ready
- [ ] Backups tested
- [ ] Monitoring configured
- [ ] Team notified
- [ ] Rollback plan ready
- [ ] Status page created
- [ ] Communication plan ready
- [ ] Post-launch monitoring scheduled

---

## Support & Resources

**Documentation:**
- [Vercel Docs](https://vercel.com/docs)
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

**Community:**
- Discord/Slack support channels
- GitHub issues
- Stack Overflow
- Community forums

**Professional Support:**
- Vercel Pro Support
- Supabase Enterprise
- 24/7 on-call engineers

---

## Post-Deployment Checklist

```bash
# Week 1
- [ ] Monitor error rates
- [ ] Check user signups
- [ ] Verify email delivery
- [ ] Test all AI providers
- [ ] Monitor database performance

# Month 1
- [ ] Analyze user behavior
- [ ] Review cost data
- [ ] Security review
- [ ] Performance optimization
- [ ] Gather user feedback

# Quarter 1
- [ ] Plan Phase 6 implementation
- [ ] Scale infrastructure as needed
- [ ] Begin analytics review
- [ ] User retention analysis
```

---

**Deployment Guide Created**: 2026-02-15
**Status**: Ready for Production
**Next**: Execute deployment following this guide
**Support**: See documentation links above

---

# Good luck with your deployment! 🚀

