create extension if not exists "pgcrypto";
create extension if not exists "vector";

insert into storage.buckets (id, name, public)
values ('instagram-exports', 'instagram-exports', false)
on conflict (id) do nothing;

create type platform as enum ('youtube', 'tiktok', 'instagram');
create type source_type as enum ('automatic', 'upload');
create type intent_category as enum (
  'question',
  'complaint',
  'comparison',
  'recommendation',
  'purchase_intent',
  'confusion',
  'success_story',
  'feature_request',
  'trend_mention'
);
create type buying_stage as enum ('awareness', 'consideration', 'purchase', 'post_purchase');
create type trend_classification as enum ('emerging', 'stable', 'declining', 'exploding');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  role text not null default 'user',
  company_name text,
  strategic_goals jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table sources (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  platform platform not null,
  source_type source_type not null,
  name text not null,
  url text,
  metadata jsonb not null default '{}',
  status text not null default 'queued',
  created_at timestamptz not null default now()
);

create table comments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  source_id uuid not null references sources(id) on delete cascade,
  platform platform not null,
  creator text not null,
  content_title text not null,
  content_url text not null,
  content_views bigint not null default 0,
  content_likes bigint not null default 0,
  publish_date timestamptz,
  comment_text text not null,
  comment_likes integer not null default 0,
  comment_date timestamptz,
  reply_count integer not null default 0,
  raw_payload jsonb not null default '{}',
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create table comment_intelligence (
  comment_id uuid primary key references comments(id) on delete cascade,
  intent intent_category not null,
  sentiment text not null check (sentiment in ('negative', 'neutral', 'positive')),
  topic text not null,
  canonical_topic text not null,
  audience_type text not null,
  buying_stage buying_stage not null,
  region text,
  desired_outcome text,
  objection text,
  emotional_intensity numeric not null default 0,
  commercial_intent numeric not null default 0,
  actionability numeric not null default 0,
  insight_depth numeric not null default 0,
  created_at timestamptz not null default now()
);

create table topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  canonical_key text not null,
  label text not null,
  description text,
  embedding vector(1536),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  unique (user_id, canonical_key)
);

create table topic_clusters (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  description text,
  centroid_embedding vector(1536),
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table topic_cluster_topics (
  cluster_id uuid not null references topic_clusters(id) on delete cascade,
  topic_id uuid not null references topics(id) on delete cascade,
  strength numeric not null default 1,
  primary key (cluster_id, topic_id)
);

create table topic_relationships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  parent_topic_id uuid not null references topics(id) on delete cascade,
  child_topic_id uuid not null references topics(id) on delete cascade,
  relationship_type text not null,
  strength numeric not null default 0,
  created_at timestamptz not null default now(),
  unique (parent_topic_id, child_topic_id, relationship_type)
);

create table audience_segments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  name text not null,
  description text,
  inferred_traits jsonb not null default '{}',
  pain_points jsonb not null default '[]',
  objections jsonb not null default '[]',
  desired_outcomes jsonb not null default '[]',
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

create table signals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  topic_id uuid not null references topics(id) on delete cascade,
  question_density numeric not null default 0,
  complaint_density numeric not null default 0,
  comparison_frequency numeric not null default 0,
  purchase_intent numeric not null default 0,
  objection_frequency numeric not null default 0,
  desired_outcome_frequency numeric not null default 0,
  emotional_intensity numeric not null default 0,
  audience_engagement numeric not null default 0,
  cross_platform_confirmation numeric not null default 0,
  creator_authority numeric not null default 0,
  audience_segment_distribution jsonb not null default '{}',
  geographic_distribution jsonb not null default '{}',
  buying_stage_distribution jsonb not null default '{}',
  insight_depth numeric not null default 0,
  evergreen_score numeric not null default 0,
  trend_momentum numeric not null default 0,
  trend_velocity numeric not null default 0,
  trend_acceleration numeric not null default 0,
  opportunity_decay numeric not null default 0,
  strategic_fit numeric not null default 0,
  commercial_intent numeric not null default 0,
  actionability numeric not null default 0,
  calculated_at timestamptz not null default now()
);

create table competitors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  topic_id uuid references topics(id) on delete cascade,
  name text not null,
  url text,
  content_density numeric not null default 0,
  search_presence numeric not null default 0,
  video_presence numeric not null default 0,
  article_presence numeric not null default 0,
  competitor_presence numeric not null default 0,
  content_freshness numeric not null default 0,
  content_quality numeric not null default 0,
  content_depth numeric not null default 0,
  authority numeric not null default 0,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

create table trend_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  topic_id uuid not null references topics(id) on delete cascade,
  current_mentions integer not null default 0,
  previous_mentions integer not null default 0,
  monthly_growth numeric not null default 0,
  quarterly_growth numeric not null default 0,
  acceleration numeric not null default 0,
  classification trend_classification not null default 'stable',
  snapshot_month date not null default date_trunc('month', now())::date,
  created_at timestamptz not null default now(),
  unique (topic_id, snapshot_month)
);

create table opportunities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  topic_id uuid references topics(id) on delete set null,
  title text not null,
  description text not null,
  demand_score numeric not null default 0,
  gap_score numeric not null default 0,
  commercial_score numeric not null default 0,
  momentum_score numeric not null default 0,
  strategic_fit_score numeric not null default 0,
  actionability_score numeric not null default 0,
  difficulty_score numeric not null default 0,
  competition_score numeric not null default 0,
  confidence_score numeric not null default 0,
  opportunity_score numeric not null default 0,
  audience_segments text[] not null default '{}',
  trend_classification trend_classification not null default 'stable',
  recommended_content_types text[] not null default '{}',
  reasoning jsonb not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table content_recommendations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  blog_topics jsonb not null default '[]',
  seo_clusters jsonb not null default '[]',
  video_ideas jsonb not null default '[]',
  short_form_content jsonb not null default '[]',
  faqs jsonb not null default '[]',
  email_ideas jsonb not null default '[]',
  lead_magnets jsonb not null default '[]',
  product_ideas jsonb not null default '[]',
  landing_page_ideas jsonb not null default '[]',
  social_post_ideas jsonb not null default '[]',
  created_at timestamptz not null default now()
);

create table opportunity_scores (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  weights jsonb not null,
  inputs jsonb not null,
  output_score numeric not null,
  created_at timestamptz not null default now()
);

create table feedback_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  opportunity_id uuid not null references opportunities(id) on delete cascade,
  traffic numeric not null default 0,
  leads numeric not null default 0,
  sales numeric not null default 0,
  engagement numeric not null default 0,
  rankings numeric not null default 0,
  revenue numeric not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table scoring_weights (
  id uuid primary key default gen_random_uuid(),
  created_by uuid references profiles(id) on delete set null,
  weights jsonb not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index comments_embedding_idx on comments using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index topics_embedding_idx on topics using ivfflat (embedding vector_cosine_ops) with (lists = 100);
create index comments_user_platform_idx on comments (user_id, platform);
create index comments_comment_date_idx on comments (comment_date);
create index opportunities_user_score_idx on opportunities (user_id, opportunity_score desc);
create index trend_snapshots_topic_month_idx on trend_snapshots (topic_id, snapshot_month desc);

alter table profiles enable row level security;
alter table sources enable row level security;
alter table comments enable row level security;
alter table comment_intelligence enable row level security;
alter table topics enable row level security;
alter table topic_clusters enable row level security;
alter table topic_cluster_topics enable row level security;
alter table topic_relationships enable row level security;
alter table audience_segments enable row level security;
alter table signals enable row level security;
alter table competitors enable row level security;
alter table trend_snapshots enable row level security;
alter table opportunities enable row level security;
alter table content_recommendations enable row level security;
alter table opportunity_scores enable row level security;
alter table feedback_results enable row level security;
alter table scoring_weights enable row level security;

create policy "Users can read their profile" on profiles for select using (auth.uid() = id);
create policy "Users can update their profile" on profiles for update using (auth.uid() = id);

create policy "Users own sources" on sources for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users own comments" on comments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users read comment intelligence" on comment_intelligence
  for select using (exists (select 1 from comments where comments.id = comment_id and comments.user_id = auth.uid()));
create policy "Users own topics" on topics for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users own topic clusters" on topic_clusters for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users read cluster topics" on topic_cluster_topics
  for select using (exists (select 1 from topic_clusters where topic_clusters.id = cluster_id and topic_clusters.user_id = auth.uid()));
create policy "Users own topic relationships" on topic_relationships for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users own audience segments" on audience_segments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users own signals" on signals for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users own competitors" on competitors for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users own trends" on trend_snapshots for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users own opportunities" on opportunities for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users own recommendations" on content_recommendations for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users own opportunity scores" on opportunity_scores for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users own feedback" on feedback_results for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Authenticated users can read active scoring weights" on scoring_weights for select using (auth.role() = 'authenticated');
