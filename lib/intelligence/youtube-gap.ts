import { calculateYoutubeGapScore } from "@/lib/competition/scoring";
import { type StoredCompetitionSnapshot } from "@/lib/competition/types";
import { type CompetitionMetrics, type SignalMetrics } from "@/lib/types";
import { clampScore } from "@/lib/utils";

export function buildCompetitionFromYoutubeSnapshot(
  snapshot: StoredCompetitionSnapshot,
  signals: SignalMetrics,
  commentCount: number,
  monthlyGrowthPercent: number
): { competition: CompetitionMetrics; demandScore: number; gapScore: number } {
  const { demandScore, gapScore } = calculateYoutubeGapScore({
    commentCount,
    monthlyGrowthPercent,
    commercialIntent: signals.commercialIntent,
    competitionScore: snapshot.competitionScore
  });

  const competition: CompetitionMetrics = {
    contentDensity: snapshot.supplyScore,
    searchPresence: 0,
    videoPresence: snapshot.supplyScore,
    articlePresence: 0,
    competitorPresence: snapshot.authorityScore,
    contentFreshness: snapshot.freshnessScore,
    contentQuality: snapshot.engagementScore,
    contentDepth: snapshot.engagementScore,
    authority: snapshot.authorityScore,
    competitionScore: snapshot.competitionScore,
    contentQualityDeficitScore: clampScore(100 - snapshot.engagementScore),
    gapScore,
    difficultyScore: clampScore(snapshot.competitionScore * 0.68 + snapshot.authorityScore * 0.32),
    whiteSpaceScore: clampScore(gapScore * 0.72 + (100 - snapshot.competitionScore) * 0.28)
  };

  return { competition, demandScore, gapScore };
}

export function buildPendingCompetitionMetrics(): CompetitionMetrics {
  return {
    contentDensity: 0,
    searchPresence: 0,
    videoPresence: 0,
    articlePresence: 0,
    competitorPresence: 0,
    contentFreshness: 0,
    contentQuality: 0,
    contentDepth: 0,
    authority: 0,
    competitionScore: 0,
    contentQualityDeficitScore: 0,
    gapScore: 0,
    difficultyScore: 0,
    whiteSpaceScore: 0
  };
}
