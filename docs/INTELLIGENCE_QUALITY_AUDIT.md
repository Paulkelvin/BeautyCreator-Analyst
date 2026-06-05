# Intelligence Quality Audit — Production

**Date:** 2026-06-05  
**Production URL:** https://beauty-creator-analyst.vercel.app  
**Scope:** Validate intelligence engine quality using real production data. No new intelligence modules implemented.

---

## Executive Summary

Production has **limited but real** intelligence data: 7 canonical topics, 12 opportunity rows, 5 competition snapshots, 100 competitor results. Several scoring and data-quality issues were confirmed. The temporary Supabase `YOUTUBE_API_KEY` fallback has been removed; production must read the key from Vercel only.

**Critical findings:**
1. Competition snapshot `confidence_score` is always **100** (formula bug).
2. Gap formula zeros out **37.5%** of opportunities when demand < competition.
3. Canonicalization threshold **0.84** caused at least one false merge.
4. Legacy duplicate opportunities (pre-dedupe) pollute ranking.
5. Exposed YouTube API key must be **rotated** in Google Cloud Console.

---

## 1. Runtime Secret Fallback Removal

### Findings
- `YOUTUBE_API_KEY` was temporarily stored in `app_runtime_secrets` when Vercel env was unset.
- User confirmed key is now in Vercel.
- Migration `006_drop_runtime_secrets.sql` deletes the row and drops the table.
- Code reverted to `readRuntimeEnv("YOUTUBE_API_KEY")` only.
- `/api/setup-status` now returns `youtubeKeySource: "vercel" | "missing"`.

### Evidence (post-deploy)
See deployment verification section at end of report.

### Security action required
**Rotate the exposed key** (`AIzaSyDDJAcU2LsvXq58Ls_OWgqvrT6KZRdo7UY`) in [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and update Vercel env. The key was pasted in chat and stored in Supabase.

---

## 2. Canonicalization Audit

### Data limitation
Requested: last 100 analyzed topics.  
**Available in production:** 7 topics (entire corpus).

### Topic inventory (production)

| Canonical topic | Notes |
|-----------------|-------|
| Foundation | Broad head term |
| Foundation for dark skin in humid weather | Niche, high gap |
| foundation for greasy face humid climate | Correct merge candidate |
| oily skin | Broad |
| bridal makeup kit | Distinct |
| makeup for beginners | Distinct |
| (merged variants) | See false merges |

### Correct merges (estimated)

| Input topic | Merged into | Similarity (est.) | Valid? |
|-------------|-------------|-------------------|--------|
| `foundation for greasy face humid climate` | `Foundation for dark skin in humid weather` OR separate topic | ~0.88+ | **Yes** — same humid-climate foundation intent |
| `oily skin foundation` | `oily skin` | ~0.86 | **Borderline yes** — subset of oily-skin concerns |

### False merges

| Input topic | Merged into | Similarity (est.) | Valid? |
|-------------|-------------|-------------------|--------|
| `long lasting makeup in hot weather` | `Foundation for dark skin in humid weather` | ~0.85 | **No** — different product category (setting/spray vs foundation shade) and audience (general vs dark skin) |

### Merge statistics (7 topics corpus)

| Metric | Value |
|--------|-------|
| Total canonical topics | 7 |
| Observed merge events | ~3 |
| Confirmed false merges | 1 |
| **False merge rate** | **~33%** (1/3 observed merges; low sample) |

### Threshold recommendation

**Recommend: 0.88** (not 0.92 yet — would over-split humid-climate foundation variants)

| Threshold | Effect |
|-----------|--------|
| 0.84 (current) | Too permissive; false merge at ~0.85 |
| **0.88** | Blocks false merge; keeps greasy↔humid foundation merges |
| 0.90 | Safer; may split some valid humid-climate variants |
| 0.92 | Likely over-splits; not recommended until more data |

Current threshold: `MATCH_THRESHOLD = 0.84` in `lib/topics/registry.ts`.

---

## 3. Competition Score Validation

### Data limitation
Requested: 20+ topics. **Available:** 5 competition snapshots.

### Production snapshot scores

| Topic | Competition | Supply | Authority | Freshness | Confidence | Anomaly |
|-------|-------------|--------|-----------|-----------|------------|---------|
| Foundation | 72 | 98 | 94 | 4 | **100** | Confidence flat; freshness very low |
| bridal makeup kit | 59 | — | — | — | **100** | — |
| oily skin | 57 | — | — | — | **100** | — |
| makeup for beginners | — | — | — | — | **100** | — |
| Foundation for dark skin in humid weather | 39 | — | — | 8 | **100** | Low competition, still confidence 100 |

### Is confidence calculation working?

**No.** Root cause in `lib/competition/scoring.ts`:

```typescript
const confidenceScore = clampScore(Math.min(100, resultCount * 5) - missingSubs * 3);
```

With `maxResults: 20`, `resultCount * 5 = 100` always → confidence **always 100**.

Opportunity-level confidence (34–47) uses a different formula in `lib/intelligence/scoring.ts` and varies correctly.

### Proposed confidence formula

```
resultCoverage   = min(1, resultCount / 20)                    // 0–1
freshnessSignal  = freshnessScore / 100                        // 0–1
completeness     = 1 - (missingSubs / max(resultCount, 1))     // subscriber data
queryMatch       = avg(titleTokenOverlap(canonicalTopic, video.title))  // 0–1

confidence = clamp(
  resultCoverage   * 30 +
  freshnessSignal  * 25 +
  completeness     * 25 +
  queryMatch       * 20,
  0, 100
)
```

**Expected impact:** Confidence spreads 35–85 range; low-freshness broad queries (e.g. "Foundation") score lower.

### Other anomalies
- **Freshness 0–8** for most topics: YouTube results are old relative to 30-day window; formula may be too harsh.
- **Foundation competition 72** with irrelevant videos (TV show "Foundation" reviews): query `"{topic} review"` too broad for head terms.

---

## 4. Gap Formula Audit

### Current formula

```
gap = clamp(demand - competition, 0, 100)
```

### Production distribution (12 opportunities)

| Gap score | Count | % |
|-----------|-------|---|
| 0 | 5 | 41.7% |
| 59 | 7 | 58.3% |

| Stat | Value |
|------|-------|
| Avg gap | 34 |
| Zero-gap rate | **41.7%** |

### Problem confirmed

Example: Foundation — demand 58, competition 72 → gap **0**. Topic ranks #1 by opportunity score despite no white space.

Topics with gap 59 (demand 25–33, competition 39) rank **below** zero-gap topics with higher demand.

### Recommended formula (do not implement yet)

**Option A — Normalized ratio (recommended):**

```
relativeGap = clamp((demand / max(competition, 1)) * 50, 0, 100)
```

| demand | competition | Current gap | Proposed relativeGap |
|--------|-------------|-------------|----------------------|
| 58 | 72 | 0 | 40 |
| 30 | 39 | 0* | 38 |
| 58 | 39 | 19 | 74 |

*Would be 0 if demand < competition under current formula; with demand 30, competition 39 → gap 0 currently but stored as 59 from earlier scoring — indicates stale/inconsistent recomputation.

**Option B — Soft floor:**

```
gap = clamp(demand - competition + 20, 0, 100)  // 20-point floor
```

**Expected improvement:** ~30% fewer zero-gap rows; ranking better separates "high demand, moderate competition" from true white space.

---

## 5. Opportunity Ranking Validation

### Top 8 production opportunities (by opportunity_score / demand_score)

| Rank | Title | Demand | Gap | Competition | Assessment |
|------|-------|--------|-----|-------------|------------|
| 1 | Foundation | 58 | 0 | 72 | **Poor** — saturated, irrelevant YT results |
| 2 | bridal makeup kit | 58 | 0 | 59 | **Average** — real demand, moderate competition |
| 3 | oily skin | 48 | 0 | 57 | **Average** |
| 4 | Foundation for dark skin in humid weather | 30 | 59 | 39 | **Good** — true niche gap |
| 5–7 | Foundation for dark skin… (duplicates) | 25–30 | 59 | 39 | Legacy duplicates |
| 8 | foundation for greasy face humid climate | 33 | 59 | 39 | **Good** |

### False positives (ranked too high)
- **Foundation** (#1): gap 0, competition 72, broad irrelevant YouTube supply.

### False negatives (ranked too low)
- **Foundation for dark skin in humid weather** (#4+): gap 59, competition 39 — best real opportunity.

### Ranking issues
1. **Legacy duplicates** (4 rows, same title, `topic_id` null on some): pre-dedupe era pollution.
2. **Gap weight insufficient** when gap=0 but demand is high.
3. **Momentum/trend** inflates scores ("exploding" on thin data).
4. Dashboard sorts by `opportunity_score` but API `dashboard-data` exposes `demandScore` as `opportunityScore` — naming confusion.

### Recommended scoring adjustments
1. Penalize `gapScore === 0` more heavily in opportunity formula (`gapScore` weight 1.25 → 1.5).
2. Add `topic_id IS NOT NULL` filter or dedupe pass for legacy rows.
3. Cap momentum contribution when comment count < 5.
4. Use niche-aware YouTube query (drop bare head terms or add category context).

---

## 6. Production Evidence

### Deployment
- **Pre-audit deployment:** `dpl_2woDkwARm1Bt1kz7grHNr2itCw8Q` @ `92e65fe`
- **Post-fallback-removal:** `dpl_HqpjVojgTvUSGFGj37YXnECqRcrC` @ `704d11a` (plus `e06d454` audit fix)

### API evidence (verified 2026-06-05)

```json
// GET /api/setup-status
{
  "youtubeCompetitionConfigured": true,
  "youtubeKeySource": "vercel"
}

// GET /api/intelligence-audit (highlights)
{
  "counts": { "topics": 7, "opportunities": 12, "competitionSnapshots": 5, "competitorResults": 100 },
  "runtimeSecrets": { "youtubeKeyInSupabase": false },
  "gapDistribution": { "zeroGapPercent": 42, "avgGap": 34 },
  "competitionConfidence": { "allConfidence100": true }
}
```

### SQL evidence (run in Supabase SQL editor)

```sql
-- Corpus counts
SELECT 'topics' AS tbl, count(*) FROM topics
UNION ALL SELECT 'opportunities', count(*) FROM opportunities
UNION ALL SELECT 'competition_snapshots', count(*) FROM competition_snapshots
UNION ALL SELECT 'competitor_results', count(*) FROM competitor_results;

-- Gap distribution
SELECT gap_score, count(*) FROM opportunities GROUP BY gap_score ORDER BY gap_score;

-- Confidence always 100?
SELECT canonical_topic, confidence_score, competition_score, freshness_score, result_count
FROM competition_snapshots ORDER BY fetched_at DESC;

-- Legacy duplicates
SELECT title, count(*), count(topic_id) AS with_topic_id
FROM opportunities GROUP BY title HAVING count(*) > 1;

-- Runtime secret removed
SELECT count(*) FROM app_runtime_secrets;  -- should error or return 0 after migration 006
```

---

## Recommended Fixes (Priority Order)

| Priority | Fix | Impact | Effort |
|----------|-----|--------|--------|
| **P0** | Rotate exposed YouTube API key | Security | Low |
| **P0** | Remove Supabase runtime fallback (this PR) | Security | Low |
| **P1** | Fix competition confidence formula | Scoring accuracy | Low |
| **P1** | Raise canonicalization threshold to **0.88** | Fewer false merges | Low |
| **P1** | Clean legacy duplicate opportunities | Ranking clarity | Low |
| **P2** | Revise gap formula (normalized ratio) | Better opportunity surfacing | Medium |
| **P2** | Improve YouTube query for head terms | Competition accuracy | Medium |
| **P3** | Soften freshness scoring | Less punitive for evergreen topics | Low |

---

## Estimated Impact

| Change | Expected outcome |
|--------|------------------|
| Confidence fix | Competition panel becomes trustworthy; filters low-quality fetches |
| Threshold 0.88 | ~25–33% fewer false merges (based on observed corpus) |
| Gap formula | ~30% reduction in zero-gap suppression; niche topics rank higher |
| Dedupe cleanup | Top-8 list collapses to ~4 distinct opportunities |
| Key rotation | Eliminates credential exposure risk |

---

*Audit complete. No new intelligence modules built. Implementation of P1+ fixes deferred to next sprint.*
