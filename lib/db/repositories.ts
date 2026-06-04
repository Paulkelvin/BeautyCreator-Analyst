import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";
import { readRuntimeEnv } from "@/lib/runtime-env";
import { runOpportunityAnalysis } from "@/lib/intelligence/run-analysis";
import { type CommentUnderstanding, type NormalizedComment, type Opportunity } from "@/lib/types";

type AnalysisResult = Awaited<ReturnType<typeof runOpportunityAnalysis>>;

/** Ensures a profiles row exists (dev x-user-id or service-role ingest before Auth signup). */
export async function ensureProfile(userId: string, email?: string | null) {
  if (!readRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL") || !readRuntimeEnv("SUPABASE_SERVICE_ROLE_KEY")) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("profiles").upsert(
    { id: userId, email: email ?? null },
    { onConflict: "id" }
  );

  if (error) {
    throw error;
  }
}

export async function persistNormalizedComments({
  sourceId,
  userId,
  comments
}: {
  sourceId: string;
  userId: string;
  comments: NormalizedComment[];
}) {
  const supabase = createSupabaseAdminClient();
  const payload = comments.map((comment) => ({
    source_id: sourceId,
    user_id: userId,
    platform: comment.platform,
    creator: comment.creator,
    content_title: comment.contentTitle,
    content_url: comment.contentUrl,
    content_views: comment.contentViews,
    content_likes: comment.contentLikes,
    publish_date: comment.publishDate,
    comment_text: comment.commentText,
    comment_likes: comment.commentLikes,
    comment_date: comment.commentDate,
    reply_count: comment.replyCount ?? 0,
    raw_payload: comment.raw ?? {}
  }));

  const { data, error } = await supabase.from("comments").insert(payload).select("id");
  if (error) {
    throw error;
  }

  return data;
}

export async function createSource(input: {
  userId: string;
  platform: string;
  sourceType: "automatic" | "upload";
  name: string;
  url?: string;
  metadata?: Record<string, unknown>;
}) {
  await ensureProfile(input.userId);
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("sources")
    .insert({
      user_id: input.userId,
      platform: input.platform,
      source_type: input.sourceType,
      name: input.name,
      url: input.url ?? null,
      metadata: input.metadata ?? {}
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  return data.id as string;
}

export async function persistCommentUnderstanding(input: {
  commentId: string;
  understanding: CommentUnderstanding;
}) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("comment_intelligence").upsert({
    comment_id: input.commentId,
    intent: input.understanding.intent,
    sentiment: input.understanding.sentiment,
    topic: input.understanding.topic,
    canonical_topic: input.understanding.canonicalTopic,
    audience_type: input.understanding.audienceType,
    buying_stage: input.understanding.buyingStage,
    region: input.understanding.region,
    desired_outcome: input.understanding.desiredOutcome,
    objection: input.understanding.objection,
    emotional_intensity: input.understanding.emotionalIntensity,
    commercial_intent: input.understanding.commercialIntent,
    actionability: input.understanding.actionability,
    insight_depth: input.understanding.insightDepth
  });

  if (error) {
    throw error;
  }
}

export async function persistOpportunityAnalysis({
  userId,
  analysis
}: {
  userId: string;
  analysis: AnalysisResult;
}) {
  await ensureProfile(userId);
  const supabase = createSupabaseAdminClient();

  const recommendedTypes = [
    ...analysis.recommendations.videoIdeas.slice(0, 2),
    ...analysis.recommendations.blogTopics.slice(0, 1),
    ...analysis.recommendations.shortFormContent.slice(0, 1)
  ];

  const { data: opportunity, error } = await supabase
    .from("opportunities")
    .insert({
      user_id: userId,
      title: analysis.title,
      description: analysis.description,
      demand_score: analysis.scores.demandScore,
      gap_score: analysis.scores.gapScore,
      commercial_score: analysis.scores.commercialScore,
      momentum_score: analysis.scores.momentumScore,
      strategic_fit_score: analysis.scores.strategicFitScore,
      actionability_score: analysis.scores.actionabilityScore,
      difficulty_score: analysis.scores.difficultyScore,
      competition_score: analysis.scores.competitionScore,
      confidence_score: analysis.scores.confidenceScore,
      opportunity_score: analysis.scores.opportunityScore,
      audience_segments: analysis.audienceSegments,
      trend_classification: analysis.trend.classification,
      recommended_content_types: recommendedTypes,
      reasoning: {
        signals: analysis.signals,
        competition: analysis.competition,
        whiteSpace: analysis.whiteSpace
      }
    })
    .select("id")
    .single();

  if (error) {
    throw error;
  }

  const { error: recError } = await supabase.from("content_recommendations").insert({
    user_id: userId,
    opportunity_id: opportunity.id,
    blog_topics: analysis.recommendations.blogTopics,
    seo_clusters: analysis.recommendations.seoClusters,
    video_ideas: analysis.recommendations.videoIdeas,
    short_form_content: analysis.recommendations.shortFormContent,
    faqs: analysis.recommendations.faqs,
    email_ideas: analysis.recommendations.emailIdeas,
    lead_magnets: analysis.recommendations.leadMagnets,
    product_ideas: analysis.recommendations.productIdeas,
    landing_page_ideas: analysis.recommendations.landingPageIdeas,
    social_post_ideas: analysis.recommendations.socialPostIdeas
  });

  if (recError) {
    throw recError;
  }

  return { opportunityId: String(opportunity.id) };
}

/** Stores source + comments + intelligence alongside a saved opportunity. */
export async function persistAnalysisWithComments({
  userId,
  topic,
  comments,
  analysis
}: {
  userId: string;
  topic: string;
  comments: NormalizedComment[];
  analysis: AnalysisResult;
}) {
  const platform = comments[0]?.platform ?? "youtube";
  const contentUrl = comments[0]?.contentUrl ?? null;

  const sourceId = await createSource({
    userId,
    platform,
    sourceType: "upload",
    name: `Analysis: ${topic}`,
    url: contentUrl || undefined,
    metadata: { analysisType: "manual" }
  });

  const inserted = await persistNormalizedComments({ userId, sourceId, comments });

  await Promise.all(
    inserted.map(async (row, index) => {
      await persistCommentUnderstanding({
        commentId: String(row.id),
        understanding: analysis.understandings[index]
      });
    })
  );

  return persistOpportunityAnalysis({ userId, analysis });
}

function mapOpportunityRow(item: Record<string, unknown>): Opportunity {
  return {
    id: String(item.id),
    title: String(item.title),
    description: String(item.description),
    demandScore: Number(item.demand_score),
    gapScore: Number(item.gap_score),
    commercialScore: Number(item.commercial_score),
    momentumScore: Number(item.momentum_score),
    strategicFitScore: Number(item.strategic_fit_score),
    actionabilityScore: Number(item.actionability_score),
    difficultyScore: Number(item.difficulty_score),
    competitionScore: Number(item.competition_score),
    confidenceScore: Number(item.confidence_score),
    audienceSegments: (item.audience_segments ?? []) as Opportunity["audienceSegments"],
    trendClassification: String(item.trend_classification) as Opportunity["trendClassification"],
    recommendedContentTypes: (item.recommended_content_types ?? []) as string[]
  };
}

/** Count saved opportunities for the configured owner (setup diagnostics). */
export async function countSavedOpportunities() {
  const hasSupabase =
    readRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL") && readRuntimeEnv("SUPABASE_SERVICE_ROLE_KEY");
  if (!hasSupabase) {
    return { count: 0, configured: false };
  }

  const ownerId = readRuntimeEnv("APP_OWNER_USER_ID") ?? env.APP_OWNER_USER_ID;
  const supabase = createSupabaseAdminClient();
  let query = supabase.from("opportunities").select("id", { count: "exact", head: true });
  if (ownerId) {
    query = query.eq("user_id", ownerId);
  }

  const { count, error } = await query;
  return { count: error ? 0 : (count ?? 0), configured: true, error: error?.message };
}

export async function getDashboardData() {
  const hasSupabase =
    readRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL") &&
    readRuntimeEnv("SUPABASE_SERVICE_ROLE_KEY");
  const ownerId = readRuntimeEnv("APP_OWNER_USER_ID") ?? env.APP_OWNER_USER_ID;

  if (!hasSupabase) {
    return { ...sampleDashboardData, isDemoData: true, chartsFromLiveData: false, dataLoadError: null };
  }

  const supabase = createSupabaseAdminClient();

  let query = supabase.from("opportunities").select("*").order("opportunity_score", { ascending: false }).limit(8);

  if (ownerId) {
    query = query.eq("user_id", ownerId);
  }

  const { data: opportunities, error } = await query;

  if (error) {
    const { buildDashboardInsights } = await import("@/lib/db/dashboard-insights");
    const insights = await buildDashboardInsights(ownerId ?? undefined);
    return {
      isDemoData: false,
      chartsFromLiveData: false,
      dataLoadError: error.message,
      opportunities: [] as Opportunity[],
      trendRadar: insights.trendRadar.length ? insights.trendRadar : sampleDashboardData.trendRadar,
      segments: insights.segments.length ? insights.segments : sampleDashboardData.segments,
      graph: insights.graph.length ? insights.graph : sampleDashboardData.graph
    };
  }

  if (!opportunities?.length) {
    const showDemoCharts = !ownerId;
    if (showDemoCharts) {
      return { ...sampleDashboardData, isDemoData: true, chartsFromLiveData: false, dataLoadError: null };
    }

    const { buildDashboardInsights } = await import("@/lib/db/dashboard-insights");
    const insights = await buildDashboardInsights(ownerId);
    return {
      isDemoData: false,
      chartsFromLiveData: insights.chartsFromLiveData,
      dataLoadError: null,
      opportunities: [] as Opportunity[],
      trendRadar: insights.trendRadar,
      segments: insights.segments,
      graph: insights.graph
    };
  }

  const { buildDashboardInsights } = await import("@/lib/db/dashboard-insights");
  const insights = await buildDashboardInsights(ownerId ?? undefined);

  return {
    isDemoData: false,
    chartsFromLiveData: insights.chartsFromLiveData,
    dataLoadError: null,
    opportunities: opportunities.map((item) => mapOpportunityRow(item as Record<string, unknown>)),
    trendRadar: insights.trendRadar,
    segments: insights.segments,
    graph: insights.graph
  };
}

export const sampleDashboardData = {
  opportunities: [
    {
      id: "opp_1",
      title: "Foundation for dark skin that does not oxidize in humid weather",
      description:
        "High-intent comments combine shade matching, oxidation complaints, and West African humidity context with weak existing content depth.",
      demandScore: 88,
      gapScore: 91,
      commercialScore: 84,
      momentumScore: 76,
      strategicFitScore: 86,
      actionabilityScore: 92,
      difficultyScore: 38,
      competitionScore: 42,
      confidenceScore: 81,
      audienceSegments: ["budget_buyer", "professional", "bridal_makeup"],
      trendClassification: "emerging",
      recommendedContentTypes: ["comparison guide", "short-form tests", "regional landing page"]
    },
    {
      id: "opp_2",
      title: "Beginner bridal makeup kit for Nigerian weddings",
      description:
        "Recurring beginner questions and purchase intent cluster around kit building, weather, photography, and affordability.",
      demandScore: 79,
      gapScore: 82,
      commercialScore: 78,
      momentumScore: 68,
      strategicFitScore: 90,
      actionabilityScore: 88,
      difficultyScore: 44,
      competitionScore: 47,
      confidenceScore: 76,
      audienceSegments: ["beginner", "bridal_makeup", "budget_buyer"],
      trendClassification: "stable",
      recommendedContentTypes: ["checklist", "YouTube tutorial", "lead magnet"]
    }
  ] satisfies Opportunity[],
  trendRadar: [
    { topic: "oily skin foundation in humidity", current: 418, growth: 64, classification: "emerging" },
    { topic: "skin tint for mature skin", current: 231, growth: 37, classification: "emerging" },
    { topic: "matte lip oil", current: 88, growth: -19, classification: "declining" }
  ],
  segments: [
    { segment: "Budget Buyer", pain: "Needs proof products survive humidity without oxidizing.", share: 34 },
    { segment: "Bridal Makeup", pain: "Worries about flashback, longevity, and shade accuracy.", share: 28 },
    { segment: "Professional", pain: "Needs kit-safe recommendations that work across undertones.", share: 21 }
  ],
  graph: [
    { parent: "Foundation", child: "Oily Skin" },
    { parent: "Foundation", child: "Oxidation" },
    { parent: "Oxidation", child: "Humid Weather" },
    { parent: "Humid Weather", child: "Nigeria" },
    { parent: "Foundation", child: "Dark Skin" }
  ]
};
