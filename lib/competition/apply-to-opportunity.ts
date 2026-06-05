import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { calculateYoutubeGapScore } from "@/lib/competition/scoring";
import { type StoredCompetitionSnapshot } from "@/lib/competition/types";

export async function applyCompetitionToOpportunities({
  userId,
  topicId,
  snapshot,
  commentCount
}: {
  userId: string;
  topicId: string;
  snapshot: StoredCompetitionSnapshot;
  commentCount?: number;
}) {
  const supabase = createSupabaseAdminClient();

  const { data: opportunities } = await supabase
    .from("opportunities")
    .select("id, reasoning, demand_score, commercial_score, momentum_score")
    .eq("user_id", userId)
    .eq("topic_id", topicId);

  if (!opportunities?.length) {
    return { updated: 0 };
  }

  let updated = 0;

  for (const row of opportunities) {
    const reasoning = (row.reasoning ?? {}) as Record<string, unknown>;
    const signals = (reasoning.signals ?? {}) as Record<string, number>;
    const commentsUsed = commentCount ?? Number(reasoning.commentCount ?? 1);

    const { demandScore, gapScore } = calculateYoutubeGapScore({
      commentCount: commentsUsed,
      monthlyGrowthPercent: Number(row.momentum_score ?? signals.trendVelocity ?? 0),
      commercialIntent: Number(signals.commercialIntent ?? row.commercial_score ?? 0),
      competitionScore: snapshot.competitionScore
    });

    const nextReasoning = {
      ...reasoning,
      commentCount: commentsUsed,
      competitionPending: false,
      youtubeCompetition: {
        snapshotId: snapshot.id,
        canonicalTopic: snapshot.canonicalTopic,
        competitionScore: snapshot.competitionScore,
        supplyScore: snapshot.supplyScore,
        authorityScore: snapshot.authorityScore,
        engagementScore: snapshot.engagementScore,
        freshnessScore: snapshot.freshnessScore,
        confidenceScore: snapshot.confidenceScore,
        fetchedAt: snapshot.fetchedAt,
        expiresAt: snapshot.expiresAt
      },
      gapBreakdown: {
        demandScore,
        gapScore,
        competitionScore: snapshot.competitionScore,
        commercialScore: Number(row.commercial_score ?? 0)
      }
    };

    const { error } = await supabase
      .from("opportunities")
      .update({
        demand_score: demandScore,
        gap_score: gapScore,
        competition_score: snapshot.competitionScore,
        reasoning: nextReasoning,
        updated_at: new Date().toISOString()
      })
      .eq("id", row.id);

    if (!error) {
      updated += 1;
    }
  }

  return { updated };
}
