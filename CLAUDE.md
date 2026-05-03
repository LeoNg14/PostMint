# PostMint 🌿

> AI-powered finance video generator. Paste a ticker or market event → PostMint generates a ready-to-post short video with animated charts, AI voiceover, auto-captions, and platform branding. One click.

**License:** AGPL-3.0 — open source, but commercial use must also be open sourced.

---

## What PostMint Does

PostMint turns raw financial insights into short-form videos for TikTok, Instagram Reels, and YouTube Shorts. The user types something like "Tesla up 8% on India Gigafactory news" and gets back a fully rendered 30-45 second vertical video with:

- AI-generated script (Groq / Llama 3.3 70B)
- AI voiceover (ElevenLabs)
- Animated video composition (Remotion — React → MP4)
- Live market data overlays (Polygon.io)
- Auto-synced captions
- PostMint branding

---

## Monetization

Freemium model:
- **Free** — 5 posts/month (written content only)
- **Pro — $12/mo** — unlimited posts, all platforms, video generation
- **Business — $49/mo** — team seats, brand voice, white-label output

Stripe is integrated (test mode). Price IDs are in `.env`.

---

## Tech Stack

| Layer | Tech |
|-------|------|
| API | Node.js + Express + TypeScript |
| Auth | Supabase Auth (JWT) |
| Database | Supabase (Postgres + RLS) |
| Cache / Queue | Redis (Upstash) + BullMQ |
| AI Script | Groq API (llama-3.3-70b-versatile) |
| AI Voice | ElevenLabs (eleven_turbo_v2) |
| Video Render | Remotion (React → MP4 frames) |
| Video Stitch | FFmpeg |
| Storage | Supabase Storage (postmint-videos bucket) |
| Web Dashboard | Next.js 14 + Tailwind |
| Mobile | React Native / Expo (not yet started) |
| Payments | Stripe |
| Market Data | Polygon.io (Massive) |
| Monorepo | npm workspaces |

---

## Project Structure

```
PostMint/
├── apps/
│   ├── api/                  # Express backend (PRIMARY — most work here)
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── env.ts          # All env var validation
│   │   │   │   ├── supabase.ts     # Admin + anon clients
│   │   │   │   ├── redis.ts        # ioredis client
│   │   │   │   ├── groq.ts         # Groq AI client
│   │   │   │   └── queue.ts        # BullMQ video queue
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts         # requireAuth + requireTier
│   │   │   │   ├── rateLimiter.ts  # global + generate limiters
│   │   │   │   └── errorHandler.ts # AppError class + handler
│   │   │   ├── routes/
│   │   │   │   ├── health.ts       # GET /health — checks supabase + redis
│   │   │   │   ├── auth.ts         # GET /auth/me
│   │   │   │   ├── generate.ts     # POST /generate — written posts (WORKING ✅)
│   │   │   │   ├── video.ts        # POST /video — video job queue (BUILT, needs FFmpeg test)
│   │   │   │   ├── market.ts       # GET /market/:ticker
│   │   │   │   └── billing.ts      # POST /billing/portal (skeleton)
│   │   │   ├── services/
│   │   │   │   ├── contentService.ts   # Written post orchestrator (WORKING ✅)
│   │   │   │   ├── promptBuilder.ts    # Platform-aware prompt construction
│   │   │   │   ├── postFormatter.ts    # Char limits, hashtag extraction
│   │   │   │   ├── marketService.ts    # Polygon.io + Redis cache
│   │   │   │   ├── scriptService.ts    # Video script generator (Groq JSON mode)
│   │   │   │   └── voiceService.ts     # ElevenLabs TTS with word timings
│   │   │   ├── workers/
│   │   │   │   └── videoWorker.ts  # BullMQ worker: script→voice→render→stitch→upload
│   │   │   ├── types/
│   │   │   │   ├── index.ts        # Platform, Tone, GeneratedPost, MarketSnapshot
│   │   │   │   └── video.ts        # VideoJob, VideoStyle, ElevenLabs voice IDs
│   │   │   └── index.ts            # Express app entry — starts server + worker
│   │   ├── .env.example            # All required env vars listed here
│   │   └── package.json
│   │
│   ├── web/                  # Next.js dashboard (WORKING ✅)
│   │   ├── app/
│   │   │   ├── page.tsx            # Root redirect (auth check)
│   │   │   ├── layout.tsx          # Auth listener + Supabase session
│   │   │   ├── globals.css         # Design system — dark theme, DM fonts
│   │   │   ├── login/page.tsx      # Login + signup (WORKING ✅)
│   │   │   └── dashboard/
│   │   │       ├── layout.tsx      # Sidebar nav, auth guard
│   │   │       ├── page.tsx        # Generate page (WORKING ✅ — tested end to end)
│   │   │       └── history/page.tsx # Generated posts history
│   │   ├── lib/
│   │   │   ├── supabase.ts         # Browser Supabase client
│   │   │   ├── api.ts              # Axios instance with auth interceptor
│   │   │   └── types.ts            # Frontend types
│   │   ├── store/
│   │   │   └── auth.ts             # Zustand auth store
│   │   └── .env.local              # NEXT_PUBLIC_ vars
│   │
│   └── renderer/             # Remotion video renderer (BUILT, needs testing)
│       └── src/
│           ├── index.ts            # Remotion registerRoot
│           ├── Root.tsx            # Composition registry
│           └── compositions/
│               └── FinanceVideo.tsx # 1080x1920 vertical video composition
│
├── packages/
│   └── shared/               # Shared constants (platform limits, tones)
│
└── supabase/
    └── migrations/
        ├── 001_initial_schema.sql      # profiles + generated_posts + RLS + triggers ✅
        ├── 002_increment_function.sql  # increment_posts_used + reset_monthly_usage ✅
        └── 003_video_jobs.sql          # video_jobs table + RLS + indexes ✅
```

---

## Current Status

### ✅ Done and tested
- Full Express API booting with health check
- Supabase auth (JWT middleware, profile auto-creation trigger)
- Redis connected (Upstash)
- Written post generation end-to-end: Groq AI → platform formatter → DB save → credit tracking
- Web dashboard: login, generate page, history page
- All 3 Supabase migrations applied
- Supabase Storage bucket `postmint-videos` created (public)
- BullMQ video queue wired up
- ElevenLabs voiceover service built
- Groq script generator with JSON mode
- Remotion video composition built (FinanceVideo — 1080x1920 vertical)
- Video worker built (script → voice → render → FFmpeg stitch → Supabase upload)

### 🔧 Next up — video pipeline testing
The video endpoint (`POST /api/v1/video`) is built but **not yet tested end to end**. The next session should:

1. Test `POST /api/v1/video` with a curl request (use fresh Supabase JWT)
2. Watch the BullMQ worker logs in the API terminal
3. Poll `GET /api/v1/video/:jobId` to check status progression
4. Fix any FFmpeg/Remotion issues that come up (FFmpeg may need installing on Windows)
5. Verify the final MP4 appears in Supabase Storage

**FFmpeg on Windows** — likely needs installing. Run:
```
winget install Gyan.FFmpeg
```
Or download from ffmpeg.org and add to PATH.

### 📋 After video pipeline works
- Video generation UI in the web dashboard (progress polling, video player)
- Supabase Realtime websocket → notify frontend when video is done
- Settings page (account info, tier display)
- Stripe billing flow (upgrade to Pro/Business)
- Landing page (public marketing page)
- React Native / Expo mobile app
- Deployment: Vercel (web) + Railway (API) + Upstash (Redis already cloud)

---

## Environment Variables

See `apps/api/.env.example` for the full list. Required:

```env
# Supabase
SUPABASE_URL=https://kllgbznvpknvxuiiwkfg.supabase.co
SUPABASE_ANON_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

# AI
GROQ_API_KEY=gsk_...
ELEVENLABS_API_KEY=sk_...

# Payments
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_placeholder  # set up properly when server is running

# Data
POLYGON_API_KEY=...   # from massive.com (Polygon.io)

# Cache / Queue
REDIS_URL=rediss://default:...@....upstash.io:6379  # Upstash (note: rediss:// with double s)

# Internal
PORT=4000
NODE_ENV=development
API_VERSION=v1
RENDERER_URL=http://localhost:3001
```

Web app env is in `apps/web/.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=https://kllgbznvpknvxuiiwkfg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_...
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
```

---

## Running Locally

```bash
# Terminal 1 — API + BullMQ worker
cd apps/api
npm run dev
# → http://localhost:4000/api/v1/health

# Terminal 2 — Web dashboard
cd apps/web
npm run dev
# → http://localhost:3000

# Terminal 3 — Remotion renderer (for video jobs)
cd apps/renderer
npx remotion studio
# → http://localhost:3001
```

---

## Key Design Decisions

- **AGPL-3.0 license** — public repo, but forks that deploy commercially must open-source. Chosen deliberately over MIT.
- **BullMQ over simple async** — video generation takes 30-60s. Job queue means user gets immediate 202 response, polls for status. Worker has retry logic with exponential backoff.
- **Two Supabase clients** — `supabaseAdmin` (service role, full DB access, backend only) and `supabaseClient` (anon key, respects RLS, used for JWT verification). Never mix them up.
- **Groq over OpenAI/Anthropic** — free tier, fast inference, Llama 3.3 70B is excellent for structured text. Easy to swap later.
- **ElevenLabs `with-timestamps` endpoint** — returns word-level timing data alongside audio, enabling caption sync in the video.
- **Remotion for video** — React components render to MP4 frames server-side. The composition (`FinanceVideo.tsx`) is 1080x1920 (vertical/TikTok format). FFmpeg stitches frames + audio.
- **Upstash Redis** — cloud Redis, no local Docker needed. Works on Windows dev without Docker Desktop issues.
- **Monorepo with npm workspaces** — `apps/api`, `apps/web`, `apps/mobile` (todo), `apps/renderer`, `packages/shared`.

---

## Test Credentials

Supabase test user (created via dashboard):
- Email: `test@postmint.com`
- Password: `Test1234!`

To get a JWT for API testing:
```bash
curl -X POST "https://kllgbznvpknvxuiiwkfg.supabase.co/auth/v1/token?grant_type=password" \
  -H "Content-Type: application/json" \
  -H "apikey: sb_publishable_2zgIqPgRDbfcI_ESQtBwVA_OVl3APtV" \
  -d '{"email":"test@postmint.com","password":"Test1234!"}'
```

Token expires in 1 hour. On Windows use curl.exe and `--data-binary "@auth.json"` pattern.

---

## Supabase Project

- Project ID: `kllgbznvpknvxuiiwkfg`
- Region: Sydney (ap-southeast-2)
- Storage bucket: `postmint-videos` (public)
- Auth: email/password enabled, auto-confirm on

---

*README last updated: May 2026 — generated to hand off context between Claude sessions.*
