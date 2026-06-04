import { resolveOrCreateTopic, resolveTopicsForLabels } from "@/lib/topics/registry";
import { recordTrendSnapshot, getTrendInputForTopic } from "@/lib/topics/trend-snapshots";
import { runOpportunityAnalysis } from "@/lib/intelligence/run-analysis";
import { type NormalizedComment } from "@/lib/types";
import {
  createSource,
  persistCommentUnderstanding,
  persistNormalizedComments,
  persistOpportunityAnalysis
} from "@/lib/db/repositories";

type AnalysisResult = Awaited<ReturnType<typeof runOpportunityAnalysis>>;

/** Run analysis with historical trend + canonical topic, then persist with deduplication. */
export async function analyzeAndPersist({
  userId,
  topic,
  comments,
  modifiers,
  competition,
  weights,
  source
}: {
  userId: string;
  topic: string;
  comments: NormalizedComment[];
  modifiers?: string[];
  competition?: Record<string, number>;
  weights?: Record<string, number>;
  source?: {
    platform: "youtube" | "tiktok" | "instagram";
    name: string;
    url?: string;
    sourceType?: "automatic" | "upload";
    metadata?: Record<string, unknown>;
  };
}) {
  const canonicalTopic = await resolveOrCreateTopic(userId, topic);
  const trend = (await getTrendInputForTopic(canonicalTopic.id)) ?? undefined;

  const analysis = await runOpportunityAnalysis({
    topic: canonicalTopic.label,
    comments,
    modifiers,
    competition,
    trend,
    weights: weights as Record<string, number> | undefined
  });

  const saved = await persistAnalysisWithTopics({
    userId,
    topicId: canonicalTopic.id,
    topicLabel: canonicalTopic.label,
    comments,
    analysis,
    source
  });

  await recordTrendSnapshot(userId, canonicalTopic.id);

  return {
    analysis,
    canonicalTopic,
    ...saved
  };
}

export async function persistAnalysisWithTopics({
  userId,
  topicId,
  topicLabel,
  comments,
  analysis,
  source
}: {
  userId: string;
  topicId: string;
  topicLabel: string;
  comments: NormalizedComment[];
  analysis: AnalysisResult;
  source?: {
    platform: "youtube" | "tiktok" | "instagram";
    name: string;
    url?: string;
    sourceType?: "automatic" | "upload";
    metadata?: Record<string, unknown>;
  };
}) {
  const platform = comments[0]?.platform ?? "youtube";
  const contentUrl = comments[0]?.contentUrl ?? null;

  const sourceId = await createSource({
    userId,
    platform: source?.platform ?? platform,
    sourceType: source?.sourceType ?? "upload",
    name: source?.name ?? `Analysis: ${topicLabel}`,
    url: source?.url ?? (contentUrl || undefined),
    metadata: { ...source?.metadata, topicId }
  });

  const inserted = await persistNormalizedComments({ userId, sourceId, comments });

  const uniqueLabels = Array.from(new Set(analysis.understandings.map((u) => u.topic)));
  const topicCache = await resolveTopicsForLabels(userId, uniqueLabels);

  await Promise.all(
    inserted.map(async (row, index) => {
      const understanding = analysis.understandings[index];
      const resolved = topicCache.get(understanding.topic.trim().toLowerCase());
      const canonicalTopic = resolved?.canonicalKey ?? understanding.canonicalTopic;

      const supabase = await import("@/lib/supabase/admin").then((m) => m.createSupabaseAdminClient());
      await supabase
        .from("comments")
        .update({ topic_id: resolved?.id ?? topicId })
        .eq("id", row.id);

      await persistCommentUnderstanding({
        commentId: String(row.id),
        understanding: { ...understanding, canonicalTopic }
      });
    })
  );

  const result = await persistOpportunityAnalysis({
    userId,
    topicId,
    analysis
  });

  return { ...result, sourceId };
}
