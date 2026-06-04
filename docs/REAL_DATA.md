# Real data setup and roadmap

## What works today (after latest deploy)

| Feature | Real data? | Notes |
|---------|------------|--------|
| Paste comments → Analyze | Yes | Saves to Supabase when `APP_OWNER_USER_ID` is set |
| Instagram CSV/XLSX/JSON upload | Yes | Processes inline on Vercel (no Inngest required) |
| Dashboard opportunity cards | Yes | Shows **your** saved rows when DB has data |
| Trend radar / segments / graph | Demo only | Still sample until aggregation is built |
| YouTube/TikTok URL scrape | No on Vercel | Needs Inngest + shell tools on a worker |

---

## Required: one-time Vercel env for saves

### 1. Create an app owner in Supabase Auth

1. [Supabase → Authentication → Users](https://supabase.com/dashboard/project/agnkubzjgwfrymnlognv/auth/users)
2. **Add user** → email + password (this is you / your app owner)
3. Open the user → copy **User UID** (UUID)

### 2. Add to Vercel → Environment Variables

| Name | Value |
|------|--------|
| `APP_OWNER_USER_ID` | The UUID from step 1 |
| `NEXT_PUBLIC_SUPABASE_URL` | Already set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Already set |
| `SUPABASE_SERVICE_ROLE_KEY` | Already set |
| `NEXT_PUBLIC_APP_URL` | `https://beauty-creator-analyst.vercel.app` |

**Redeploy** after saving.

The profile row is created automatically on first save (trigger + `ensureProfile`).

### 3. Use the app

1. **Analyze your comments** → Run analysis → auto-refresh → see **Saved opportunities** (not demo)
2. **Upload Instagram export** → topic + file → refresh → new opportunity from file

---

## What was fixed in code

- Analysis **persists** to `opportunities` + `content_recommendations`
- **Single-tenant mode** via `APP_OWNER_USER_ID` (no login UI yet)
- Instagram ingest runs **synchronously** when Inngest is not configured
- Inngest jobs (when enabled) also **score and save** opportunities after ingest

---

## Still needed for “full product” intent

### Phase A — You (config, ~15 min)

- [ ] Set `APP_OWNER_USER_ID` and redeploy
- [ ] Optional: `OPENAI_API_KEY` for better comment understanding
- [ ] Run one paste-analysis and one Instagram upload to confirm dashboard updates

### Phase B — Engineering (next builds)

| Item | Why |
|------|-----|
| **Login UI** (Supabase Auth) | Multi-user, secure ingest without owner UUID in env |
| **YouTube/TikTok URL form** | UX for URL ingest |
| **Inngest on Vercel** | Background jobs for URL scrape + large files |
| **Worker with CLIs** | `youtube-comment-downloader`, `tiktok-scraper` (not on serverless) |
| **Dashboard from DB** | Trend radar, segments, graph from stored `comment_intelligence` |
| **Topic graph builder** | Embeddings + `topics` / `topic_relationships` tables |
| **Opportunity dedup** | Merge analyses for same topic |
| **Feedback UI** | Wire `POST /api/feedback` to outcomes |

### Phase C — Nice to have

- Redis cache, PostHog, admin scoring UI, competition crawl

---

## Troubleshooting saves

**“Analysis works but dashboard still shows demo”**

- `APP_OWNER_USER_ID` missing or wrong UUID
- Profile FK: user must exist in **Authentication → Users**
- Redeploy after env change

**Instagram upload error**

- File must have a `comment` / `comment_text` column (see `lib/ingestion/parsers.ts`)
- Service role key must be valid

**YouTube URL queued but nothing happens**

- Expected without Inngest + worker. Use paste or Instagram upload instead.
