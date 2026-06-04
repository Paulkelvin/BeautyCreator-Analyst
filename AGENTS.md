# AGENTS.md

## Cursor Cloud specific instructions

### Repository layout

- **`main`** may only contain a stub README. The runnable app is on branch **`cursor/content-intelligence-engine-ab16`** (merge or check out that branch before `npm install` / `npm run dev`).
- Single Next.js 16 app (not a monorepo). Package manager: **npm** (`package-lock.json`).

### Services (local dev)

| Service | Required for | How to run |
|--------|----------------|------------|
| Next.js | UI + API | `npm run dev` (port 3000) |
| Supabase | Persisted ingest, feedback, admin | Hosted project + apply `supabase/migrations/001_initial_schema.sql` |
| Inngest | Background ingest jobs | Dev server targeting `http://localhost:3000/api/inngest` |

Without Supabase, **`/dashboard` still works** using built-in sample data (`lib/db/repositories.ts`). Without Inngest, ingest APIs return queued responses but jobs do not execute.

Optional: OpenAI (quality), Upstash Redis (cache), PostHog, `youtube-comment-downloader` / `tiktok-scraper` CLIs.

### Environment variables

Copy `.env.example` to `.env.local`, then **omit or comment out** optional URL keys (`NEXT_PUBLIC_SUPABASE_URL`, `UPSTASH_REDIS_REST_URL`) when unset. **Empty strings fail** `lib/env.ts` Zod validation and break `npm run build`.

Non-production API calls can pass header **`x-user-id`** instead of Supabase JWT (`lib/auth.ts`).

### Standard commands

See `README.md`:

- Install: `npm install`
- Dev: `npm run dev`
- Lint: `npm run lint`
- Typecheck: `npm run typecheck`
- Build: `npm run build`

### Quick smoke / hello-world

1. `curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/dashboard` → expect `200`
2. Core API (no DB): `POST /api/opportunities` with `topic` and `comments[].commentText` (see `lib/ingestion/normalization.ts`).

### Long-running processes

Use **tmux** for `npm run dev` and any separate Inngest dev CLI so sessions survive backgrounding.
