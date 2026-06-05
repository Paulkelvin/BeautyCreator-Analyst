-- Topic linkage, vector match, and trend support

alter table comments
  add column if not exists topic_id uuid references topics(id) on delete set null;

create index if not exists comments_topic_id_idx on comments (topic_id);

create or replace function match_topics(
  p_user_id uuid,
  p_embedding vector(1536),
  p_match_threshold double precision default 0.84,
  p_match_count integer default 5
)
returns table (
  id uuid,
  canonical_key text,
  label text,
  similarity double precision
)
language sql
stable
as $$
  select
    t.id,
    t.canonical_key,
    t.label,
    1 - (t.embedding <=> p_embedding) as similarity
  from topics t
  where t.user_id = p_user_id
    and t.embedding is not null
    and 1 - (t.embedding <=> p_embedding) >= p_match_threshold
  order by t.embedding <=> p_embedding
  limit p_match_count;
$$;
