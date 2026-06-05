import { understandComment } from "@/lib/ai/comment-understanding";
import { type StoredCompetitionSnapshot } from "@/lib/competition/types";
import {
  buildCompetitionFromYoutubeSnapshot,
  buildPendingCompetitionMetrics
} from "@/lib/intelligence/youtube-gap";
import { calculateSignals } from "@/lib/intelligence/signals";
import { calculateOpportunityScore, defaultScoringWeights } from "@/lib/intelligence/scoring";
import { calculateTrendSnapshot } from "@/lib/intelligence/trends";
import { discoverWhiteSpace, generateContentRecommendations } from "@/lib/intelligence/recommendations";
import { type NormalizedComment, type ScoringWeights } from "@/lib/types";

export async function runOpportunityAnalysis({
  topic,
  comments,
  modifiers = [],
  youtubeCompetition,
  competitionPending = false,
  trend,
  weights
}: {
  topic: string;
  comments: NormalizedComment[];
  modifiers?: string[];
  youtubeCompetition?: StoredCompetitionSnapshot | null;
  competitionPending?: boolean;
  trend?: {
    currentMentions: number;
    previousMentions: number;
    mentionsThreeMonthsAgo?: number;
    previousVelocity?: number;
  };
  weights?: Partial<ScoringWeights>;
}) {
  const understandings = await Promise.all(comments.map((comment) => understandComment(comment)));
  const pendingCompetition = competitionPending && !youtubeCompetition;
  const placeholderCompetition = buildPendingCompetitionMetrics();
  const signals = calculateSignals({ comments, understandings, competition: placeholderCompetition });

  const trendSnapshot = calculateTrendSnapshot(
    trend ?? {
      currentMentions: comments.length,
      previousMentions: Math.max(1, Math.floor(comments.length * 0.72))
    }
  );

  signals.trendMomentum = trendSnapshot.monthlyGrowth;
  signals.trendVelocity = trendSnapshot.monthlyGrowth;
  signals.trendAcceleration = trendSnapshot.acceleration;

  const competitionMetrics = youtubeCompetition
    ? buildCompetitionFromYoutubeSnapshot(
        youtubeCompetition,
        signals,
        comments.length,
        trendSnapshot.monthlyGrowth
      ).competition
    : placeholderCompetition;

  let scores = calculateOpportunityScore({
    signals,
    competition: competitionMetrics,
    weights: { ...defaultScoringWeights, ...weights },
    competitionPending: pendingCompetition
  });

  if (youtubeCompetition) {
    const { demandScore, gapScore } = buildCompetitionFromYoutubeSnapshot(
      youtubeCompetition,
      signals,
      comments.length,
      trendSnapshot.monthlyGrowth
    );
    scores = { ...scores, demandScore, gapScore, competitionScore: youtubeCompetition.competitionScore };
  }
  const audienceSegments = Array.from(new Set(understandings.map((item) => item.audienceType)));

  return {
    title: topic,
    description: `Opportunity analysis for ${topic} based on ${comments.length} normalized audience comments.`,
    signals,
    competition: competitionMetrics,
    trend: trendSnapshot,
    scores,
    audienceSegments,
    whiteSpace: discoverWhiteSpace(topic, modifiers),
    recommendations: generateContentRecommendations(topic, audienceSegments),
    understandings,
    competitionPending: pendingCompetition,
    commentCount: comments.length
  };
}
