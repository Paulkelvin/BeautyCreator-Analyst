# Auto-pull comments from YouTube & TikTok URLs

## Why URL import failed on Vercel before

The original implementation called **CLI tools** (`youtube-comment-downloader`, `tiktok-scraper`). Those binaries are **not installed** on Vercel serverless functions, so imports failed with “command not found”.

This repo now uses:

| Platform | On Vercel | How |
|----------|-----------|-----|
| **YouTube** | Yes (recommended) | **YouTube Data API v3** + `YOUTUBE_API_KEY` |
| **TikTok** | Often | Node library `@tobyg74/tiktok-api-dl` (unofficial; can break) |
| **Instagram** | Yes | File upload (CSV/XLSX/JSON) |

---

## YouTube — set up in ~10 minutes

### 1. Google Cloud project

1. Open [Google Cloud Console](https://console.cloud.google.com/).
2. Create or select a project.
3. **APIs & Services** → **Library** → search **YouTube Data API v3** → **Enable**.

### 2. API key

1. **APIs & Services** → **Credentials** → **Create credentials** → **API key**.
2. Copy the key.
3. (Recommended) **Restrict key** → API restrictions → allow only **YouTube Data API v3**.

### 3. Vercel

| Variable | Value |
|----------|--------|
| `YOUTUBE_API_KEY` | Your API key |

Add for **Production**, then **Redeploy**.

### 4. Verify

```text
GET https://beauty-creator-analyst.vercel.app/api/setup-status
```

Expect:

```json
"youtubeCommentPull": "api",
"youtubeSetupHint": null
```

### 5. Use the app

Dashboard → **Import more data** → **YouTube URL** → paste a **public** video with **comments enabled** → **Import YouTube comments**.

Quota: each page of comments costs API quota (default ~10,000 units/day on free tier). Importing ~500 comments uses a few units.

---

## TikTok — no extra key (less reliable)

TikTok uses an unofficial in-process scraper. No API key required.

- Works for many public videos on Vercel.
- TikTok may block or change endpoints; if import fails, **paste comments manually** or use Instagram export.

---

## OpenAI key (optional)

| Question | Answer |
|----------|--------|
| Required for URL import? | **No** — import and scoring work without it. |
| Required for analysis? | **No** — heuristics run if OpenAI fails or is unset. |
| No billing / $0 balance? | API calls **fail**; the app **falls back** to heuristics automatically. |
| Worth adding credit? | Yes, for richer comment understanding on large batches. |

Add in Vercel:

| Variable | Value |
|----------|--------|
| `OPENAI_API_KEY` | `sk-...` from [OpenAI API keys](https://platform.openai.com/api-keys) |

Ensure the org has a **payment method** and **usage limits** allow at least a small spend (mini models are cents per run).

---

## Inngest (optional)

If `INNGEST_EVENT_KEY` is set, YouTube/TikTok requests may return `202 queued` instead of completing immediately. For most users on Vercel, **leave Inngest unset** so import runs **inline** in the API route (simpler).

---

## Local development

Without `YOUTUBE_API_KEY`, YouTube falls back to CLI:

```bash
pip install youtube-comment-downloader
```

TikTok falls back to `tiktok-scraper` if the Node library fails.
