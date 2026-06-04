# Real data setup and roadmap

## What works today (after latest deploy)

| Feature | Real data? | Notes |
|---------|------------|--------|
| Paste comments → Analyze | Yes | Saves to Supabase when `APP_OWNER_USER_ID` is set |
| Instagram CSV/XLSX/JSON upload | Yes | Processes inline on Vercel (no Inngest required) |
| Dashboard opportunity cards | Yes | Shows **your** saved rows when DB has data |
| Trend radar / segments / graph | From your DB when comments exist | Falls back to sample until you save analyses |
| YouTube/TikTok URL scrape | Tries on server; usually fails on Vercel | Needs CLI tools or Inngest + worker |
| Performance feedback form | Yes | On dashboard when you have saved opportunities |

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

**Redeploy** after saving (required — Vercel only injects new env vars on a new deployment).

**Check save config:** open `https://beauty-creator-analyst.vercel.app/api/setup-status` — you should see `"canPersist": true` and `"appOwnerConfigured": true`.

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

- [x] Set `APP_OWNER_USER_ID` and redeploy
- [ ] Run one paste-analysis → wait for auto-refresh → confirm **Saved opportunities**
- [ ] Optional: `OPENAI_API_KEY` for better comment understanding

### Phase B — Engineering (next builds)

| Item | Why |
|------|-----|
| **Login UI** (Supabase Auth) | Multi-user; optional while `APP_OWNER_USER_ID` works |
| **YouTube/TikTok on Vercel** | Worker with `youtube-comment-downloader` / `tiktok-scraper`, or Inngest |
| **Topic graph builder** | Embeddings + `topics` / `topic_relationships` tables |
| **Opportunity dedup** | Merge analyses for same topic |

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
