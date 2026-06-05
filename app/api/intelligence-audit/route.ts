import { NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { readRuntimeEnv } from "@/lib/runtime-env";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Read-only production audit aggregates (no secrets). */
export async function GET() {
  const ownerId = readRuntimeEnv("APP_OWNER_USER_ID");
  if (!ownerId) {
    return NextResponse.json({ error: "APP_OWNER_USER_ID not configured" }, { status: 503 });
  }

  const supabase = createSupabaseAdminClient();

  const [topicsRes, opportunitiesRes, snapshotsRes, competitorCountRes, trendCountRes] =
    await Promise.all([
    supabase
      .from("topics")
      .select("id, label, canonical_key, created_at")
      .eq("user_id", ownerId)
      .order("created_at", { ascending: false }),
    supabase
      .from("opportunities")
      .select(
        "id, title, topic_id, demand_score, gap_score, competition_score, confidence_score, opportunity_score, created_at"
      )
      .eq("user_id", ownerId)
      .order("opportunity_score", { ascending: false }),
    supabase
      .from("competition_snapshots")
      .select(
        "id, topic_id, canonical_topic, competition_score, supply_score, authority_score, freshness_score, confidence_score, engagement_score, fetched_at"
      )
      .eq("user_id", ownerId)
      .order("fetched_at", { ascending: false }),
    supabase.from("competitor_results").select("id", { count: "exact", head: true }),
    supabase.from("trend_snapshots").select("id", { count: "exact", head: true })
  ]);

  let youtubeKeyInSupabase = false;
  try {
    const runtimeSecretsRes = await supabase
      .from("app_runtime_secrets")
      .select("key")
      .eq("key", "YOUTUBE_API_KEY")
      .maybeSingle();
    youtubeKeyInSupabase = Boolean(runtimeSecretsRes.data?.key);
  } catch {
    youtubeKeyInSupabase = false;
  }

  const opportunities = opportunitiesRes.data ?? [];
  const gapScores = opportunities.map((row) => Number(row.gap_score));
  const zeroGap = gapScores.filter((score) => score === 0).length;
  const withTopicId = opportunities.filter((row) => row.topic_id).length;
  const duplicateTitles = opportunities.reduce<Record<string, number>>((acc, row) => {
    const title = String(row.title);
    acc[title] = (acc[title] ?? 0) + 1;
    return acc;
  }, {});

  const snapshots = snapshotsRes.data ?? [];
  const confidenceValues = snapshots.map((row) => Number(row.confidence_score));

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    counts: {
      topics: topicsRes.data?.length ?? 0,
      opportunities: opportunities.length,
      competitionSnapshots: snapshots.length,
      competitorResults: competitorCountRes.count ?? 0,
      trendSnapshots: trendCountRes.count ?? 0
    },
    runtimeSecrets: {
      youtubeKeyInSupabase
    },
    gapDistribution: {
      total: gapScores.length,
      zeroGap,
      zeroGapPercent: gapScores.length ? Math.round((zeroGap / gapScores.length) * 100) : 0,
      positiveGap: gapScores.filter((score) => score > 0).length,
      avgGap: gapScores.length
        ? Math.round(gapScores.reduce((sum, score) => sum + score, 0) / gapScores.length)
        : 0,
      minGap: gapScores.length ? Math.min(...gapScores) : null,
      maxGap: gapScores.length ? Math.max(...gapScores) : null
    },
    deduplication: {
      opportunitiesWithTopicId: withTopicId,
      opportunitiesWithoutTopicId: opportunities.length - withTopicId,
      duplicateTitleGroups: Object.entries(duplicateTitles)
        .filter(([, count]) => count > 1)
        .map(([title, count]) => ({ title, count }))
    },
    competitionConfidence: {
      snapshotCount: snapshots.length,
      allConfidence100: confidenceValues.length > 0 && confidenceValues.every((value) => value === 100),
      values: snapshots.map((row) => ({
        canonicalTopic: row.canonical_topic,
        competitionScore: row.competition_score,
        supplyScore: row.supply_score,
        authorityScore: row.authority_score,
        freshnessScore: row.freshness_score,
        confidenceScore: row.confidence_score
      }))
    },
    topics: topicsRes.data ?? [],
    opportunities,
    sqlQueries: [
      "SELECT count(*) FROM topics;",
      "SELECT count(*) FROM opportunities;",
      "SELECT count(*) FROM competition_snapshots;",
      "SELECT count(*) FROM competitor_results;",
      "SELECT gap_score, count(*) FROM opportunities GROUP BY gap_score ORDER BY gap_score;",
      "SELECT canonical_topic, confidence_score, competition_score FROM competition_snapshots ORDER BY fetched_at DESC;"
    ]
  });
}
