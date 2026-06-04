import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sampleDashboardData } from "@/lib/db/repositories";

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

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

export async function buildDashboardInsights(userId?: string) {
  const supabase = createSupabaseAdminClient();

  let oppQuery = supabase
    .from("opportunities")
    .select("title, momentum_score, trend_classification, opportunity_score")
    .order("created_at", { ascending: false })
    .limit(10);

  if (userId) {
    oppQuery = oppQuery.eq("user_id", userId);
  }

  const { data: opportunities } = await oppQuery;

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
  }> = [];

  if (commentIds.length) {
    const { data } = await supabase
      .from("comment_intelligence")
      .select("topic, canonical_topic, audience_type, objection")
      .in("comment_id", commentIds);
    intelRows = data ?? [];
  }

  const trendRadar: TrendPoint[] =
    opportunities?.map((row) => ({
      topic: String(row.title).slice(0, 48),
      current: Math.round(Number(row.opportunity_score)),
      growth: Math.round(Number(row.momentum_score)),
      classification: String(row.trend_classification)
    })) ?? [];

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
  for (const row of intelRows) {
    const parent = String(row.topic);
    const child = String(row.canonical_topic).replaceAll("_", " ");
    if (parent && child && parent.toLowerCase() !== child.toLowerCase()) {
      graph.push({ parent, child });
    }
  }

  const uniqueGraph = Array.from(
    new Map(graph.map((edge) => [`${edge.parent}|${edge.child}`, edge])).values()
  ).slice(0, 12);

  return {
    trendRadar: trendRadar.length ? trendRadar : sampleDashboardData.trendRadar,
    segments: segments.length ? segments : sampleDashboardData.segments,
    graph: uniqueGraph.length ? uniqueGraph : sampleDashboardData.graph,
    chartsFromLiveData: trendRadar.length > 0 || segments.length > 0 || uniqueGraph.length > 0
  };
}
