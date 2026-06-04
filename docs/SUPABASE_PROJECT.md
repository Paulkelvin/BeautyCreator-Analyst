# Supabase project (beautycreator-analyst)

Created for this app via Supabase MCP.

| Setting | Value |
|---------|--------|
| **Project name** | beautycreator-analyst |
| **Project ref** | `agnkubzjgwfrymnlognv` |
| **Region** | eu-west-1 |
| **API URL** | `https://agnkubzjgwfrymnlognv.supabase.co` |
| **Dashboard** | [Open project](https://supabase.com/dashboard/project/agnkubzjgwfrymnlognv) |

## Migrations applied

- `001_initial_schema`
- `002_auth_profile_trigger`

## Vercel environment variables

Paste these in **Vercel → Project → Settings → Environment Variables**:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://agnkubzjgwfrymnlognv.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnbmt1YnpqZ3dmcnltbmxvZ252Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1ODAyNzEsImV4cCI6MjA5NjE1NjI3MX0.st3XnIuRL7huoyWCBOiE93MSORdVDvC_vbw41QVIPQo` |
| `SUPABASE_SERVICE_ROLE_KEY` | **service_role** key from same page (secret — server only) |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL, e.g. `https://beautycreator-analyst.vercel.app` |

After the first deploy, set `NEXT_PUBLIC_APP_URL` to the real production URL and **redeploy**.

Optional: `OPENAI_API_KEY` for richer analysis on `/api/opportunities`.

## Note on service role

Without `SUPABASE_SERVICE_ROLE_KEY`, the live site still runs: `/dashboard` uses built-in sample opportunity data. With the service role key, the dashboard reads from the `opportunities` table (empty until you ingest or seed data).
