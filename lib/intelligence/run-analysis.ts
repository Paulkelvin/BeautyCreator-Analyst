import { understandComment } from "@/lib/ai/comment-understanding";
import { calculateCompetitionMetrics, calculateSignals } from "@/lib/intelligence/signals";
import { calculateOpportunityScore, defaultScoringWeights } from "@/lib/intelligence/scoring";
import { calculateTrendSnapshot } from "@/lib/intelligence/trends";
import { discoverWhiteSpace, generateContentRecommendations } from "@/lib/intelligence/recommendations";
import { type NormalizedComment, type ScoringWeights } from "@/lib/types";

export async function runOpportunityAnalysis({
  topic,
  comments,
  modifiers = [],
  competition = {},
  trend,
  weights
}: {
  topic: string;
  comments: NormalizedComment[];
  modifiers?: string[];
  competition?: Record<string, number>;
  trend?: {
    currentMentions: number;
    previousMentions: number;
    mentionsThreeMonthsAgo?: number;
    previousVelocity?: number;
  };
  weights?: Partial<ScoringWeights>;
}) {
  const understandings = await Promise.all(comments.map((comment) => understandComment(comment)));
  const competitionMetrics = calculateCompetitionMetrics(competition);
  const signals = calculateSignals({ comments, understandings, competition: competitionMetrics });
  const trendSnapshot = calculateTrendSnapshot(
    trend ?? {
      currentMentions: comments.length,
      previousMentions: Math.max(1, Math.floor(comments.length * 0.72))
    }
  );

  signals.trendMomentum = trendSnapshot.monthlyGrowth;
  signals.trendVelocity = trendSnapshot.monthlyGrowth;
  signals.trendAcceleration = trendSnapshot.acceleration;

  const scores = calculateOpportunityScore({
    signals,
    competition: competitionMetrics,
    weights: { ...defaultScoringWeights, ...weights }
  });
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
    understandings
  };
}
