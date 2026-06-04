# Working examples — topic intelligence

Apply migration first (Supabase SQL Editor):

```text
supabase/migrations/003_topic_intelligence.sql
```

## 1. Local verification (no database)

```bash
npx tsx scripts/verify-intelligence.ts
```

**Example output (deterministic embeddings without OpenAI):**

| Pair | Similarity | Result |
|------|------------|--------|
| "foundation for oily skin…" vs "foundation for greasy face…" | ~high | MERGE at threshold 0.84 |
| "foundation…" vs "bridal makeup kit nigeria" | ~low | Separate topics |

## 2. Analyze + canonical topic + dedupe (API)

```bash
curl -sS -X POST https://beauty-creator-analyst.vercel.app/api/opportunities \
  -H "Content-Type: application/json" \
  -d '{
    "topic": "Foundation for dark skin in humid weather",
    "persist": true,
    "comments": [
      {
        "platform": "youtube",
        "creator": "Channel",
        "contentTitle": "Foundation review",
        "contentUrl": "https://youtube.com/watch?v=demo1",
        "contentViews": 1000,
        "contentLikes": 10,
        "commentText": "Does this oxidize in Lagos humidity?",
        "commentLikes": 3
      },
      {
        "platform": "youtube",
        "creator": "Channel",
        "contentTitle": "Foundation review",
        "contentUrl": "https://youtube.com/watch?v=demo1",
        "contentViews": 1000,
        "contentLikes": 10,
        "commentText": "Best foundation for greasy skin in heat?",
        "commentLikes": 5
      }
    ]
  }'
```

**Second run with similar topic** (same canonical topic → `deduplicated: true`, one opportunity row):

```json
"topic": "foundation for greasy face humid climate"
```

Response fields:

- `topicId` — UUID in `topics`
- `canonicalTopic` — `{ id, canonicalKey, label, matchedExisting }`
- `deduplicated` — `true` if opportunity updated instead of inserted

## 3. Supabase checks

```sql
-- Canonical topics
select id, label, canonical_key, created_at
from topics
order by created_at desc
limit 10;

-- Comments linked to topics
select c.id, t.label, left(c.comment_text, 60) as comment
from comments c
join topics t on t.id = c.topic_id
order by c.created_at desc
limit 10;

-- One opportunity per topic (dedupe)
select topic_id, count(*) as opportunity_rows
from opportunities
where topic_id is not null
group by topic_id
having count(*) > 1;

-- Trend snapshots (monthly)
select ts.snapshot_month, t.label, ts.current_mentions, ts.previous_mentions,
       ts.monthly_growth, ts.classification
from trend_snapshots ts
join topics t on t.id = ts.topic_id
order by ts.snapshot_month desc
limit 10;
```

## 4. Dashboard (live metrics, not hardcoded gap card)

Open:

```text
https://beauty-creator-analyst.vercel.app/dashboard
```

- **Gap and Competitor Intelligence** — reads `reasoning.gapBreakdown` from top opportunity
- **Geographic Insights** — regions from `comment_intelligence.region`
- **Trend Radar** — prefers `trend_snapshots` (mention growth), falls back to opportunity scores

## 5. Vector match RPC

```sql
select * from match_topics(
  '<user_uuid>'::uuid,
  (select embedding from topics where canonical_key = 'foundation_for_oily_skin' limit 1),
  0.84,
  5
);
```

Replace `<user_uuid>` with your `APP_OWNER_USER_ID`.
