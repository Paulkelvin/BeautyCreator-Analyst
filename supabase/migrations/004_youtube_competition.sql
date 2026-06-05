-- YouTube-only competition intelligence (7-day cache per topic)

create table competition_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  topic_id uuid not null references topics(id) on delete cascade,
  canonical_topic text not null,
  competition_score numeric not null default 0,
  supply_score numeric not null default 0,
  authority_score numeric not null default 0,
  engagement_score numeric not null default 0,
  freshness_score numeric not null default 0,
  confidence_score numeric not null default 0,
  fetched_at timestamptz not null default now(),
  expires_at timestamptz not null,
  metadata_json jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (topic_id)
);

create table competitor_results (
  id uuid primary key default gen_random_uuid(),
  snapshot_id uuid not null references competition_snapshots(id) on delete cascade,
  youtube_video_id text not null,
  title text not null,
  channel_name text not null,
  channel_subscribers integer,
  views integer not null default 0,
  likes integer not null default 0,
  comments integer not null default 0,
  published_at timestamptz,
  engagement_rate numeric not null default 0,
  authority_score numeric not null default 0,
  competition_contribution numeric not null default 0,
  created_at timestamptz not null default now()
);

create index competitor_results_snapshot_id_idx on competitor_results (snapshot_id);
create index competition_snapshots_expires_at_idx on competition_snapshots (expires_at desc);

alter table competition_snapshots enable row level security;
alter table competitor_results enable row level security;

create policy "Users own competition snapshots" on competition_snapshots
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "Users read competitor results via snapshot" on competitor_results
  for select using (
    exists (
      select 1 from competition_snapshots cs
      where cs.id = competitor_results.snapshot_id and cs.user_id = auth.uid()
    )
  );

create policy "Service role manages competitor results" on competitor_results
  for all using (auth.role() = 'service_role') with check (auth.role() = 'service_role');
