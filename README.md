# PostMint

**AI-powered content engine that turns financial data into ready-to-post content.**

PostMint helps creators, traders, and advisors automatically generate high-quality posts from portfolios, market data, and financial insights — optimized for platforms like X (Twitter), LinkedIn, and TikTok.

---

## Why PostMint?

Most tools:

* Either understand **finance**
* Or help with **content creation**

PostMint does both.

It transforms:

* Portfolio data
* Market movements
* Earnings & news

Into:

* Threads
* Social posts
* Newsletter drafts

— in seconds.

---

## Core Features

* **AI Content Generation**

  * Platform-specific formatting (X, LinkedIn, TikTok)
  * Tone control (educational, hype, analytical)

* **Market-Aware AI**

  * Ticker recognition
  * Earnings & macro context integration

* **Prompt Engine**

  * Structured prompt builder (ticker + tone + format)
  * Claude API integration

* **Post Formatter**

  * Auto-adjust for character limits & platform rules

* **Portfolio Integration (optional)**

  * Sync via Plaid or manual input

* **Analytics (planned)**

  * Track post performance
  * Optimize content strategy

---

## Architecture Overview

```id="r9x1qa"
Clients (Mobile + Web)
        ↓
API Gateway (Node + Express)
        ↓
Microservices:
  - Auth Service (Supabase + JWT)
  - Content Service (AI pipeline)
  - Market Service (Polygon / Alpha Vantage)
  - Billing Service (Stripe)
        ↓
AI Layer:
  - Prompt Builder
  - Claude API
  - Post Formatter
  - Validator
        ↓
Data Layer:
  - Postgres (Supabase)
  - Redis (cache + rate limit)
  - Storage (generated posts)
  - Analytics
```

---

## Tech Stack

**Frontend**

* React Native (mobile)
* Next.js (web dashboard)

**Backend**

* Node.js + Express (API gateway)
* Supabase (auth + database)

**AI**

* Claude API (content generation)

**Data**

* Polygon.io / Alpha Vantage (market data)
* Redis (caching + rate limiting)

**Payments**

* Stripe

---

## Monetization

| Plan              | Features                                     |
| ----------------- | -------------------------------------------- |
| Free              | 5 posts/month, basic AI                      |
| Pro ($12/mo)      | Unlimited posts, all platforms, tone control |
| Business ($49/mo) | Team access, brand voice training, analytics |

---

## Project Structure

```id="zwu9k2"
apps/
  mobile/        # React Native app
  web/           # Next.js dashboard

services/
  api/           # API gateway
  content/       # AI generation service
  market/        # market data ingestion
  billing/       # Stripe integration

packages/
  ui/            # shared components
  utils/         # shared logic

infra/
  docker/
  (terraform - future)

docs/
  architecture.md
```

---

## Getting Started

```bash
# clone repo
git clone https://github.com/yourusername/postmint.git

cd postmint

# install dependencies
pnpm install

# run dev
pnpm dev
```

---

## Environment Variables

Create a `.env` file:

```env
SUPABASE_URL=
SUPABASE_ANON_KEY=

CLAUDE_API_KEY=

POLYGON_API_KEY=

STRIPE_SECRET_KEY=
```

---

## Roadmap

* [ ] MVP: AI post generation (manual input)
* [ ] Platform formatting engine
* [ ] Market data integration
* [ ] Portfolio sync (Plaid)
* [ ] Scheduling + auto-posting
* [ ] Analytics dashboard
* [ ] Mobile app release

---

## Vision

PostMint becomes the **default content engine for finance creators** — where data turns into distribution automatically.

---

## License

MIT License
