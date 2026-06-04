# Content Intelligence Engine

Production-grade Next.js application for discovering profitable content opportunities, market gaps,
emerging trends, audience pain points, and strategic recommendations from YouTube, TikTok, and
Instagram audience conversations.

This is intentionally **not** a keyword tool or comment summarizer. Comments are raw inputs. The
application models the market as a knowledge graph of topics, audience segments, signals,
opportunities, competitors, trend snapshots, recommendations, scores, and feedback outcomes.

## Stack

- Next.js App Router, TypeScript, TailwindCSS, shadcn-style UI primitives
- Supabase Auth, PostgreSQL, Storage, and pgvector
- Inngest background jobs
- OpenAI chat + embeddings with deterministic local fallbacks
- Upstash Redis cache adapter
- PostHog analytics
- Vercel-ready runtime

## Key modules

- `app/dashboard` - executive dashboard covering opportunity discovery, gaps, trends, audience
  intelligence, competitor intelligence, topic graph, content clusters, geography, strategic fit,
  and feedback.
- `app/api/ingest/youtube` - queues automatic YouTube extraction using a configured open-source
  `youtube-comment-downloader` compatible CLI.
- `app/api/ingest/tiktok` - queues automatic TikTok extraction using a configured open-source
  TikTok scraper CLI.
- `app/api/ingest/instagram-upload` - accepts CSV, XLSX, and JSON Instagram comment exports,
  stores the original file in Supabase Storage, and normalizes rows.
- `app/api/opportunities` - runs comment understanding, signal extraction, trend classification,
  competition metrics, white-space discovery, weighted scoring, and recommendation generation.
- `app/api/admin/scoring-weights` - stores configurable master opportunity formula weights.
- `app/api/feedback` - records traffic, leads, sales, engagement, rankings, and revenue outcomes.
- `supabase/migrations/001_initial_schema.sql` - production schema with pgvector and RLS.

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Apply the Supabase migration in `supabase/migrations/001_initial_schema.sql`, then configure the
environment variables from `.env.example`.

For automatic extraction in production, install compatible CLI tools in the worker/runtime image and
set:

```bash
YOUTUBE_COMMENT_DOWNLOADER_COMMAND=youtube-comment-downloader
TIKTOK_EXTRACTOR_COMMAND=tiktok-scraper
```

## Validation

```bash
npm run typecheck
npm run lint
npm run build
```
