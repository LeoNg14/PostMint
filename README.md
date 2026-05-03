<div align="center">

# 🌿 PostMint

**Turn financial insights into viral short-form videos — in one click.**

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%20v3-green.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Node.js](https://img.shields.io/badge/Node.js-20+-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org)
[![Next.js](https://img.shields.io/badge/Next.js-14-black)](https://nextjs.org)

[Demo](#) · [Report Bug](https://github.com/yourusername/postmint/issues) · [Request Feature](https://github.com/yourusername/postmint/issues)

</div>

---

## What is PostMint?

PostMint is an AI-powered platform that transforms raw financial data into ready-to-post short-form videos for TikTok, Instagram Reels, and YouTube Shorts.

Type `"Apple just beat earnings by 12% YoY, iPhone sales record high"` — PostMint generates a fully produced vertical video in under a minute:

- 📝 **AI-written script** — punchy, platform-native, finance-aware
- 🎙️ **AI voiceover** — natural-sounding narration via ElevenLabs
- 📊 **Live market data overlays** — real-time price, change %, volume
- 🎬 **Animated video** — rendered React components, professional branding
- 💬 **Auto-synced captions** — word-level timing from voice generation
- 📱 **1080×1920 vertical format** — TikTok/Reels ready out of the box

---

## Built For

- **Retail traders** who want to share their market takes without spending hours editing
- **Finance creators** who publish daily content and need to move fast
- **Independent financial advisors** who want to build an audience
- **Anyone** who has a market opinion and wants it to look professional

---

## Features

| Feature | Free | Pro ($12/mo) | Business ($49/mo) |
|---------|------|--------------|-------------------|
| Written posts | 5/month | Unlimited | Unlimited |
| Video generation | — | ✅ | ✅ |
| Platforms | Twitter, LinkedIn | All | All |
| Market data integration | — | ✅ | ✅ |
| Custom brand voice | — | — | ✅ |
| Team seats | — | — | ✅ |

---

## Tech Stack

```
Backend          Node.js + Express + TypeScript
Auth             Supabase Auth
Database         PostgreSQL (Supabase)
Queue            BullMQ + Redis (Upstash)
AI Script        Groq (Llama 3.3 70B)
AI Voice         ElevenLabs
Video Render     Remotion (React → MP4)
Video Processing FFmpeg
Storage          Supabase Storage
Web App          Next.js 14 + Tailwind CSS
Mobile           React Native / Expo (in progress)
Payments         Stripe
Market Data      Polygon.io
```

---

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- FFmpeg installed and in PATH

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/postmint.git
cd postmint

# Install all workspace dependencies
npm install
```

### Environment Setup

```bash
# API
cp apps/api/.env.example apps/api/.env
# Fill in your keys (see Environment Variables below)

# Web
cp apps/web/.env.example apps/web/.env.local
```

### Required API Keys

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| [Supabase](https://supabase.com) | Auth + Database + Storage | ✅ Generous |
| [Groq](https://console.groq.com) | AI script generation | ✅ Free |
| [ElevenLabs](https://elevenlabs.io) | AI voiceover | ✅ 10k chars/mo |
| [Polygon.io](https://polygon.io) | Market data | ✅ Free tier |
| [Upstash](https://upstash.com) | Redis (queue + cache) | ✅ Free tier |
| [Stripe](https://stripe.com) | Payments | ✅ Test mode |

### Running Locally

```bash
# Terminal 1 — API server + background video worker
cd apps/api && npm run dev
# → http://localhost:4000/api/v1/health

# Terminal 2 — Web dashboard
cd apps/web && npm run dev
# → http://localhost:3000

# Terminal 3 — Remotion video renderer
cd apps/renderer && npx remotion studio
# → http://localhost:3001
```

---

## Project Structure

```
postmint/
├── apps/
│   ├── api/          # Express REST API + BullMQ video worker
│   ├── web/          # Next.js dashboard
│   └── renderer/     # Remotion video compositions
├── packages/
│   └── shared/       # Shared types and constants
└── supabase/
    └── migrations/   # Database schema
```

---

## How Video Generation Works

```
User input
    │
    ▼
POST /api/v1/video
    │
    ▼
BullMQ job queue (instant 202 response to user)
    │
    ▼
┌─────────────────────────────────────┐
│           Video Worker              │
│                                     │
│  1. Groq → generate script (JSON)   │
│  2. ElevenLabs → AI voiceover MP3   │
│  3. Remotion → render video frames  │
│  4. FFmpeg → stitch audio + video   │
│  5. Supabase Storage → upload MP4   │
└─────────────────────────────────────┘
    │
    ▼
Supabase Realtime → notify frontend
    │
    ▼
Video ready in dashboard
```

Jobs are polled via `GET /api/v1/video/:jobId` with status progression:
`queued` → `scripting` → `voicing` → `rendering` → `stitching` → `done`

---

## API Reference

### Authentication
All endpoints require a Supabase JWT in the `Authorization: Bearer <token>` header.

### Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/v1/health` | Health check (Supabase + Redis status) |
| `GET` | `/api/v1/auth/me` | Get current user profile |
| `POST` | `/api/v1/generate` | Generate written posts (Twitter, LinkedIn, TikTok, Newsletter) |
| `GET` | `/api/v1/generate/history` | Get user's generated post history |
| `POST` | `/api/v1/video` | Queue a video generation job |
| `GET` | `/api/v1/video/:jobId` | Poll video job status |
| `GET` | `/api/v1/video` | List user's video jobs |
| `GET` | `/api/v1/market/:ticker` | Get market snapshot for a ticker |

---

## Video Styles

| Style | Description |
|-------|-------------|
| `breaking` | Urgent breaking news format — red accents, dramatic hook |
| `analysis` | Professional market analysis — blue tones, data-forward |
| `educational` | Beginner-friendly — green accents, clear explanations |
| `hype` | High energy bullish/bearish — orange accents, influencer style |

---

## Contributing

Contributions are welcome. Please open an issue first to discuss what you'd like to change.

1. Fork the repo
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0)**.

This means:
- ✅ You can use, study, and modify this code
- ✅ You can distribute it
- ❌ If you deploy a modified version as a service, you **must** release your modifications under AGPL-3.0
- ❌ You cannot use this in closed-source commercial products without open-sourcing your changes

See [LICENSE](LICENSE) for full details.

---

## Roadmap

- [x] Written post generation (Twitter, LinkedIn, TikTok, Newsletter)
- [x] Web dashboard
- [x] AI video pipeline (script + voice + render + stitch)
- [ ] Video generation UI with real-time progress
- [ ] Supabase Realtime notifications
- [ ] Stripe billing (upgrade flow)
- [ ] Landing page
- [ ] React Native mobile app
- [ ] Post scheduling
- [ ] Direct social media publishing

---

<div align="center">
Built with ❤️ using Next.js, Express, Remotion, and Groq
</div>
