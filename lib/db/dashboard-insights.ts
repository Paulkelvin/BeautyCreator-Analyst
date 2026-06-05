import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sampleDashboardData } from "@/lib/db/repositories";
import { type CompetitionMetrics } from "@/lib/types";

type TrendPoint = {
  topic: string;
  current: number;
  growth: number;
  classification: string;
};

type SegmentPoint = {
  segment: string;
  pain: string;
  share: number;
};

type GraphEdge = {
  parent: string;
  child: string;
};

export type GapMetricRow = {
  label: string;
  value: string;
  description: string;
};

export type GeoRegionRow = {
  region: string;
  share: number;
};

export type CompetitionVideoRow = {
  youtubeVideoId: string;
  title: string;
  channelName: string;
  channelSubscribers: number | null;
  views: number;
  likes: number;
  comments: number;
};

export type CompetitionDashboardData = {
  available: boolean;
  canonicalTopic: string | null;
  competitionScore: number | null;
  supplyScore: number | null;
  authorityScore: number | null;
  engagementScore: number | null;
  freshnessScore: number | null;
  confidenceScore: number | null;
  demandScore: number | null;
  gapScore: number | null;
  videos: CompetitionVideoRow[];
};

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function scoreLabel(value: number) {
  if (value >= 75) return "High";
  if (value >= 50) return "Medium";
  return "Low";
}

function buildGapMetricsFromReasoning(reasoning: Record<string, unknown> | null): GapMetricRow[] {
  const breakdown = reasoning?.gapBreakdown as Record<string, number> | undefined;
  const competition = reasoning?.competition as CompetitionMetrics | undefined;

  if (!breakdown && !competition) {
    return [];
  }

  const gapScore = breakdown?.gapScore ?? competition?.gapScore ?? 0;
  const deficit = breakdown?.contentQualityDeficit ?? competition?.contentQualityDeficitScore ?? 0;
  const whiteSpace = breakdown?.whiteSpaceScore ?? competition?.whiteSpaceScore ?? 0;
  const difficulty = breakdown?.difficultyScore ?? competition?.difficultyScore ?? 0;
  const commercial = breakdown?.commercialScore ?? 0;

  const demandScore = breakdown?.demandScore;
  const competitionScore = breakdown?.competitionScore ?? competition?.competitionScore;

  return [
    {
      label: "Gap score",
      value: String(Math.round(gapScore)),
      description:
        demandScore !== undefined && competitionScore !== undefined
          ? `Demand (${Math.round(demandScore)}) minus YouTube competition (${Math.round(competitionScore)}).`
          : "Higher means stronger content opportunity vs modeled competition."
    },
    {
      label: "Content quality deficit",
      value: scoreLabel(deficit),
      description: `Modeled deficit score ${Math.round(deficit)} from competition inputs in your saved analysis.`
    },
    {
      label: "White space score",
      value: String(Math.round(whiteSpace)),
      description: "Derived from gap and competition scores in opportunity reasoning (not static demo values)."
    },
    {
      label: "Commercial intent",
      value: String(Math.round(commercial)),
      description: "From audience comment signals saved on the top opportunity."
    }
  ];
}

export async function buildDashboardInsights(userId?: string) {
  const supabase = createSupabaseAdminClient();

  let oppQuery = supabase
    .from("opportunities")
    .select("title, momentum_score, trend_classification, opportunity_score, topic_id, reasoning, demand_score, gap_score")
    .order("opportunity_score", { ascending: false })
    .limit(10);

  if (userId) {
    oppQuery = oppQuery.eq("user_id", userId);
  }

  const { data: opportunities } = await oppQuery;

  let trendRadar: TrendPoint[] = [];

  if (userId && opportunities?.length) {
    const topicIds = opportunities.map((row) => row.topic_id).filter(Boolean) as string[];
    if (topicIds.length) {
      const { data: snapshots } = await supabase
        .from("trend_snapshots")
        .select("topic_id, current_mentions, monthly_growth, classification")
        .in("topic_id", topicIds)
        .order("snapshot_month", { ascending: false });

      const { data: topicRows } = await supabase
        .from("topics")
        .select("id, label")
        .in("id", topicIds);

      const labelById = new Map((topicRows ?? []).map((row) => [String(row.id), String(row.label)]));

      const seen = new Set<string>();
      for (const row of snapshots ?? []) {
        const topicId = String(row.topic_id);
        if (seen.has(topicId)) {
          continue;
        }
        seen.add(topicId);
        trendRadar.push({
          topic: (labelById.get(topicId) ?? "Topic").slice(0, 48),
          current: Number(row.current_mentions),
          growth: Math.round(Number(row.monthly_growth)),
          classification: String(row.classification)
        });
      }
    }
  }

  if (!trendRadar.length && opportunities?.length) {
    trendRadar = opportunities.map((row) => ({
      topic: String(row.title).slice(0, 48),
      current: Math.round(Number(row.opportunity_score)),
      growth: Math.round(Number(row.momentum_score)),
      classification: String(row.trend_classification)
    }));
  }

  let commentIds: string[] = [];
  if (userId) {
    const { data: comments } = await supabase.from("comments").select("id").eq("user_id", userId).limit(500);
    commentIds = (comments ?? []).map((row) => String(row.id));
  } else {
    const { data: comments } = await supabase.from("comments").select("id").limit(500);
    commentIds = (comments ?? []).map((row) => String(row.id));
  }

  let intelRows: Array<{
    topic: string;
    canonical_topic: string;
    audience_type: string;
    objection: string | null;
    region: string | null;
  }> = [];

  if (commentIds.length) {
    const { data } = await supabase
      .from("comment_intelligence")
      .select("topic, canonical_topic, audience_type, objection, region")
      .in("comment_id", commentIds);
    intelRows = data ?? [];
  }

  const segmentCounts = new Map<string, { count: number; objection: string }>();
  for (const row of intelRows) {
    const key = String(row.audience_type);
    const existing = segmentCounts.get(key);
    const objection = row.objection
      ? String(row.objection)
      : (existing?.objection ?? "Audience pain inferred from comments.");
    segmentCounts.set(key, {
      count: (existing?.count ?? 0) + 1,
      objection
    });
  }

  const total = Array.from(segmentCounts.values()).reduce((sum, item) => sum + item.count, 0) || 1;
  const segments: SegmentPoint[] = Array.from(segmentCounts.entries())
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([segment, data]) => ({
      segment: titleCase(segment),
      pain: data.objection,
      share: Math.round((data.count / total) * 100)
    }));

  const graph: GraphEdge[] = [];
  if (userId) {
    const { data: topics } = await supabase
      .from("topics")
      .select("id, label, canonical_key")
      .eq("user_id", userId)
      .limit(50);

    for (const topic of topics ?? []) {
      const parts = String(topic.canonical_key).split("_").filter(Boolean);
      if (parts.length > 1) {
        graph.push({
          parent: titleCase(parts[0]),
          child: String(topic.label).slice(0, 40)
        });
      }
    }
  }

  if (!graph.length) {
    for (const row of intelRows) {
      const parent = String(row.topic);
      const child = String(row.canonical_topic).replaceAll("_", " ");
      if (parent && child && parent.toLowerCase() !== child.toLowerCase()) {
        graph.push({ parent, child });
      }
    }
  }

  const uniqueGraph = Array.from(
    new Map(graph.map((edge) => [`${edge.parent}|${edge.child}`, edge])).values()
  ).slice(0, 12);

  const regionCounts = new Map<string, number>();
  for (const row of intelRows) {
    if (!row.region) {
      continue;
    }
    const key = titleCase(row.region);
    regionCounts.set(key, (regionCounts.get(key) ?? 0) + 1);
  }

  const regionTotal = Array.from(regionCounts.values()).reduce((sum, n) => sum + n, 0) || 1;
  const geoRegions: GeoRegionRow[] = Array.from(regionCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([region, count]) => ({
      region,
      share: Math.round((count / regionTotal) * 100)
    }));

  const topReasoning = (opportunities?.[0]?.reasoning ?? null) as Record<string, unknown> | null;
  const gapMetrics = buildGapMetricsFromReasoning(topReasoning);

  let competition: CompetitionDashboardData = {
    available: false,
    canonicalTopic: null,
    competitionScore: null,
    supplyScore: null,
    authorityScore: null,
    engagementScore: null,
    freshnessScore: null,
    confidenceScore: null,
    demandScore: null,
    gapScore: null,
    videos: []
  };

  const topTopicId = opportunities?.[0]?.topic_id ? String(opportunities[0].topic_id) : null;
  if (topTopicId) {
    const now = new Date().toISOString();
    const { data: snapshot } = await supabase
      .from("competition_snapshots")
      .select("*")
      .eq("topic_id", topTopicId)
      .gt("expires_at", now)
      .maybeSingle();

    if (snapshot) {
      const { data: videos } = await supabase
        .from("competitor_results")
        .select(
          "youtube_video_id, title, channel_name, channel_subscribers, views, likes, comments"
        )
        .eq("snapshot_id", snapshot.id)
        .order("competition_contribution", { ascending: false })
        .limit(5);

      const breakdown = topReasoning?.gapBreakdown as Record<string, number> | undefined;

      competition = {
        available: true,
        canonicalTopic: String(snapshot.canonical_topic),
        competitionScore: Number(snapshot.competition_score),
        supplyScore: Number(snapshot.supply_score),
        authorityScore: Number(snapshot.authority_score),
        engagementScore: Number(snapshot.engagement_score),
        freshnessScore: Number(snapshot.freshness_score),
        confidenceScore: Number(snapshot.confidence_score),
        demandScore: breakdown?.demandScore ?? Number(opportunities?.[0]?.demand_score ?? 0),
        gapScore: breakdown?.gapScore ?? Number(opportunities?.[0]?.gap_score ?? 0),
        videos: (videos ?? []).map((row) => ({
          youtubeVideoId: String(row.youtube_video_id),
          title: String(row.title),
          channelName: String(row.channel_name),
          channelSubscribers: row.channel_subscribers === null ? null : Number(row.channel_subscribers),
          views: Number(row.views),
          likes: Number(row.likes),
          comments: Number(row.comments)
        }))
      };
    }
  }

  return {
    trendRadar: trendRadar.length ? trendRadar : sampleDashboardData.trendRadar,
    segments: segments.length ? segments : sampleDashboardData.segments,
    graph: uniqueGraph.length ? uniqueGraph : sampleDashboardData.graph,
    gapMetrics,
    geoRegions,
    competition,
    chartsFromLiveData:
      trendRadar.length > 0 ||
      segments.length > 0 ||
      uniqueGraph.length > 0 ||
      gapMetrics.length > 0 ||
      competition.available
  };
}
