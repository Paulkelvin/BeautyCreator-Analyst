# YouTube Competition Intelligence — Score Formulas

All scores are **0–100**. Higher **competition score** = harder to enter the topic on YouTube.

## Demand score (for gap)

Used when applying YouTube competition to an opportunity:

```
commentVolumeScore = clamp(log10(commentCount + 1) × 28, 0, 100)
trendGrowthScore   = clamp(monthlyGrowthPercent, 0, 100)   // from trend_snapshots / analysis
commercialScore    = clamp(commercialIntent, 0, 100)         // from comment signals

demandScore = commentVolumeScore × 0.35
            + trendGrowthScore   × 0.35
            + commercialScore    × 0.30
```

## Supply score

From top 20 YouTube search results:

```
videoDensity   = (resultCount / 20) × 100
channelDensity = (uniqueChannels / 20) × 100

supplyScore = videoDensity × 0.55 + channelDensity × 0.45
```

## Authority score

```
perChannelAuthority = clamp(log10(subscribers + 1) × 18, 0, 100)
authorityScore = average(perChannelAuthority) × 0.5 + median(perChannelAuthority) × 0.5
```

## Engagement score

Per video:

```
likeRate    = likes / max(views, 1)
commentRate = comments / max(views, 1)
videoEngagement = clamp(likeRate × 1200 + commentRate × 6000, 0, 100)
engagementScore = average(videoEngagement across top 20)
```

## Freshness score

```
pct30  = % of results published within 30 days
pct90  = % of results published within 90 days
pct180 = % of results published within 180 days

freshnessScore = pct30 × 0.50 + pct90 × 0.30 + pct180 × 0.20
```

## Competition score

```
competitionScore = supplyScore    × 0.25
                 + authorityScore  × 0.30
                 + engagementScore × 0.25
                 + freshnessScore  × 0.20
```

## Gap score

When a valid `competition_snapshots` row exists:

```
gapScore = clamp(demandScore - competitionScore, 0, 100)
```

When competition data is pending (no snapshot yet), gap is **not** computed from placeholder values.

## Confidence score

```
base = min(100, resultCount × 5)          // 20 results → 100
penalty = missingSubscriberCount × 3      // channels without sub data
confidenceScore = clamp(base - penalty, 0, 100)
```

## Per-video competition contribution

Each stored `competitor_results` row:

```
competition_contribution = video supply + authority + engagement + freshness
  (same sub-formulas, normalized per video, averaged to snapshot)
```
