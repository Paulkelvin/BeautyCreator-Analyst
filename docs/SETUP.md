# Setup: Supabase, MCP, and Vercel

Follow these steps in order. Steps marked **(you)** require your Supabase/Vercel/Cursor accounts. Steps marked **(agent)** can be done in chat after MCP is connected.

---

## Part A — Create Supabase project **(you)**

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) and sign in.
2. Click **New project**.
3. Choose an organization, name (e.g. `beautycreator-analyst`), database password (save it), and region.
4. Wait until the project status is **Active**.

### Run database migrations **(you or agent via MCP)**

**Option 1 — SQL Editor (no MCP)**

1. In the project, open **SQL Editor** → **New query**.
2. Paste and run the full contents of:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_auth_profile_trigger.sql`
3. Confirm **Success** for both (extensions `vector` and `pgcrypto` must be enabled; Supabase enables them by default on new projects).

**Option 2 — Supabase MCP in Cursor (after Part B)**

Ask the agent: *“Apply both migrations in `supabase/migrations/` to my Supabase project.”*

### Copy API keys **(you)**

1. **Project Settings** → **API**.
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (server only; never expose in the browser)

---

## Part B — Add Supabase MCP in Cursor **(you)**

This cloud agent environment does not include the Supabase MCP server. Add it on **your machine** so future sessions can run SQL and manage the project for you.

### 1. Create a Supabase personal access token

1. Open [https://supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens).
2. **Generate new token** (e.g. name: `Cursor MCP`).
3. Copy the token once (it will not be shown again).

### 2. Configure MCP in this repo

This repo includes `.cursor/mcp.json`. In Cursor:

1. Open **Cursor Settings** → **Features** → **MCP**.
2. Find the **supabase** server (from `.cursor/mcp.json`).
3. Set environment variable **`SUPABASE_ACCESS_TOKEN`** to your personal access token  
   (either edit the MCP server env in the UI, or put the token in your user-level env and restart Cursor).
4. Toggle the server **on** until status is active/green.
5. Click **Refresh** if tools do not appear.

### 3. Verify MCP

In **Agent** chat (not always in Ask mode), say:

> List my Supabase projects and confirm MCP is connected.

You should see Supabase tools (e.g. list projects, run SQL, apply migrations).

### 4. Optional: scope MCP to one project

After the project exists, you can pass `--project-ref <ref>` in `.cursor/mcp.json` `args` (ref is in **Project Settings** → **General** → **Reference ID**).

---

## Part C — Local environment **(you)**

```bash
npm install
cp .env.example .env.local
```

Edit `.env.local`:

| Variable | Required for Vercel preview | Notes |
|----------|----------------------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | From Supabase API settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | service_role key |
| `NEXT_PUBLIC_APP_URL` | Yes on Vercel | e.g. `https://your-app.vercel.app` |
| `OPENAI_API_KEY` | Recommended | Without it, analysis uses heuristics |
| `INNGEST_EVENT_KEY` / `INNGEST_SIGNING_KEY` | For background ingest | See [Inngest + Vercel](https://www.inngest.com/docs/deploy/vercel) |
| `UPSTASH_REDIS_*` | Optional | Omit keys entirely if unused |
| `NEXT_PUBLIC_POSTHOG_*` | Optional | Omit if unused |

**Important:** Leave optional services **out** of `.env.local` or commented — do not set `NEXT_PUBLIC_SUPABASE_URL=` to an empty string (build will fail).

Run locally:

```bash
npm run dev
```

Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard).

---

## Part D — Deploy on Vercel **(you)**

### 1. Connect GitHub

1. [https://vercel.com/new](https://vercel.com/new) → import `paulkelvin/beautycreator-analyst` (or your fork).
2. Use branch **`cursor/supabase-vercel-setup-ee70`** (or `main` after you merge the PR).
3. Framework preset: **Next.js** (auto-detected).

### 2. Environment variables

In the Vercel project → **Settings** → **Environment Variables**, add the same keys as `.env.local` for **Production** (and **Preview** if you want PR previews):

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key |
| `NEXT_PUBLIC_APP_URL` | `https://<your-vercel-domain>.vercel.app` |
| `OPENAI_API_KEY` | Your OpenAI key (optional but recommended) |

Do **not** add empty optional URL variables.

### 3. Deploy

Click **Deploy**. After build succeeds, open the production URL → `/dashboard`.

### 4. Post-deploy (when you need ingest jobs)

- Register the app with [Inngest](https://www.inngest.com/) and add signing keys to Vercel.
- Set Inngest serve URL to `https://<your-domain>/api/inngest`.
- YouTube/TikTok auto-extract needs CLI tools on a worker; Instagram CSV upload works without CLIs.

---

## Part E — What works without extra setup

| Feature | Needs |
|---------|--------|
| Landing page `/` | Nothing |
| Dashboard `/dashboard` with demo data | Nothing (no Supabase) |
| Dashboard with your DB | Supabase + migrations + env vars |
| `POST /api/opportunities` | Optional OpenAI |
| Ingest APIs | Supabase + Inngest + auth (`x-user-id` in dev or Supabase JWT) |

---

## Quick checklist

- [ ] Supabase project created
- [ ] Migrations `001` and `002` applied
- [ ] Supabase MCP enabled in Cursor with PAT
- [ ] `.env.local` filled (no empty URL strings)
- [ ] `npm run build` passes locally
- [ ] Vercel project connected to GitHub branch
- [ ] Vercel env vars set
- [ ] Production URL loads `/dashboard`
