# Content Intelligence Engine Architecture

## Data flow

1. **Collect** audience conversations from YouTube, TikTok, or Instagram exports.
2. **Normalize** every source into the unified schema:
   `platform, creator, content_title, content_url, content_views, content_likes, publish_date,
   comment_text, comment_likes, comment_date`.
3. **Understand** each comment with intent, sentiment, topic, audience type, buying stage, region,
   objection, desired outcome, commercial intent, and insight depth.
4. **Canonicalize** similar phrasings into stable topics with embeddings and clustering.
5. **Construct** graph relationships between parent topics, modifiers, clusters, regions, and
   audience segments.
6. **Extract signals** such as question density, complaint density, purchase intent, emotional
   intensity, creator authority, cross-platform confirmation, evergreen score, and trend velocity.
7. **Measure competition** by quality, depth, freshness, authority, density, and presence rather than
   raw page count alone.
8. **Score opportunities** with configurable weighted inputs and explicit competition/difficulty
   penalties.
9. **Recommend strategy** through content clusters, videos, FAQs, lead magnets, landing pages,
   product ideas, and social post ideas.
10. **Learn** from feedback results including traffic, leads, sales, engagement, rankings, and
    revenue.

## Important design choice

Comments remain raw evidence. Product value is created in the derived layers:

- Topics and topic clusters
- Audience segments
- Signals and trend snapshots
- Competition and gap metrics
- Opportunities and scores
- Strategic recommendations
- Feedback results

This keeps the platform aligned with market intelligence instead of keyword research.
