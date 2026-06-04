# AGENTS.md

## Cursor Cloud specific instructions

### Repository layout

- Runnable app lives on branch **`cursor/supabase-vercel-setup-ee70`** (or `main` after merge).
- Single Next.js 16 app. Package manager: **npm**.

### Supabase MCP (local Cursor only)

- Config: `.cursor/mcp.json` — user must set **`SUPABASE_ACCESS_TOKEN`** (PAT from [account tokens](https://supabase.com/dashboard/account/tokens)).
- Setup guide: **`docs/SETUP.md`**.

### Services (local dev)

| Service | Required for | How to run |
|--------|----------------|------------|
| Next.js | UI + API | `npm run dev` (port 3000) |
| Supabase | Persisted data | Hosted project + migrations `001` + `002` |
| Inngest | Background ingest | Dev server → `http://localhost:3000/api/inngest` |

Without Supabase, `/dashboard` uses sample data. Without Inngest, ingest APIs queue but jobs do not run.

### Environment variables

Copy `.env.example` → `.env.local`. Omit optional keys; empty strings are normalized to unset in `lib/env.ts`.

Dev API auth: header **`x-user-id`** (non-production) or Supabase Bearer token.

### Commands

- `npm install` / `npm run dev` / `npm run lint` / `npm run typecheck` / `npm run build`

### Smoke test

`curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/dashboard` → `200`
