import {
  type CompetitionMetrics,
  type ScoringWeights,
  type SignalMetrics
} from "@/lib/types";
import { clampScore } from "@/lib/utils";

export const defaultScoringWeights: ScoringWeights = {
  demand: 1.2,
  purchaseIntent: 1.1,
  commercialIntent: 1,
  questionDensity: 0.85,
  complaintDensity: 0.8,
  comparisonDensity: 0.65,
  desiredOutcomeFrequency: 0.75,
  emotionalIntensity: 0.55,
  trendGrowth: 0.85,
  trendAcceleration: 0.75,
  creatorAuthority: 0.45,
  crossPlatformValidation: 0.8,
  gapScore: 1.25,
  contentQualityDeficit: 1.05,
  strategicFit: 1,
  actionability: 0.9,
  competition: 1.1,
  difficulty: 0.9,
  contentSaturation: 0.75
};

export function calculateOpportunityScore({
  signals,
  competition,
  weights = defaultScoringWeights,
  competitionPending = false
}: {
  signals: SignalMetrics;
  competition: CompetitionMetrics;
  weights?: ScoringWeights;
  competitionPending?: boolean;
}) {
  const demand = clampScore(
    signals.questionDensity * 0.24 +
      signals.complaintDensity * 0.2 +
      signals.purchaseIntent * 0.2 +
      signals.audienceEngagement * 0.18 +
      signals.crossPlatformConfirmation * 0.18
  );

  const gapContribution = competitionPending ? 0 : competition.gapScore * weights.gapScore;
  const deficitContribution = competitionPending ? 0 : competition.contentQualityDeficitScore * weights.contentQualityDeficit;

  const positive =
    demand * weights.demand +
    signals.purchaseIntent * weights.purchaseIntent +
    signals.commercialIntent * weights.commercialIntent +
    signals.questionDensity * weights.questionDensity +
    signals.complaintDensity * weights.complaintDensity +
    signals.comparisonFrequency * weights.comparisonDensity +
    signals.desiredOutcomeFrequency * weights.desiredOutcomeFrequency +
    signals.emotionalIntensity * weights.emotionalIntensity +
    signals.trendVelocity * weights.trendGrowth +
    signals.trendAcceleration * weights.trendAcceleration +
    signals.creatorAuthority * weights.creatorAuthority +
    signals.crossPlatformConfirmation * weights.crossPlatformValidation +
    gapContribution +
    deficitContribution +
    signals.strategicFit * weights.strategicFit +
    signals.actionability * weights.actionability;

  const negative = competitionPending
    ? 0
    : competition.competitionScore * weights.competition +
      competition.difficultyScore * weights.difficulty +
      competition.contentDensity * weights.contentSaturation;

  const positiveWeight = Object.entries(weights)
    .filter(([key]) => !["competition", "difficulty", "contentSaturation"].includes(key))
    .reduce((sum, [, value]) => sum + value, 0);
  const negativeWeight = competitionPending
    ? 1
    : weights.competition + weights.difficulty + weights.contentSaturation;
  const raw = positive / positiveWeight - (negative / negativeWeight) * 0.42;

  return {
    demandScore: demand,
    gapScore: competition.gapScore,
    commercialScore: clampScore((signals.commercialIntent + signals.purchaseIntent) / 2),
    momentumScore: clampScore((signals.trendMomentum + signals.trendVelocity + signals.trendAcceleration) / 3),
    strategicFitScore: signals.strategicFit,
    actionabilityScore: signals.actionability,
    difficultyScore: competition.difficultyScore,
    competitionScore: competition.competitionScore,
    confidenceScore: clampScore(
      signals.crossPlatformConfirmation * 0.28 +
        signals.insightDepth * 0.26 +
        signals.audienceEngagement * 0.18 +
        signals.creatorAuthority * 0.14 +
        (100 - competition.difficultyScore) * 0.14
    ),
    opportunityScore: clampScore(raw)
  };
}
