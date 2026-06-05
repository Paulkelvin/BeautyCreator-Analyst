-- Server-only runtime secrets (read via service role; not exposed to clients)
create table if not exists app_runtime_secrets (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

alter table app_runtime_secrets enable row level security;

-- No policies: only service role can access
