import {
  type CommentUnderstanding,
  type CompetitionMetrics,
  type NormalizedComment,
  type SignalMetrics
} from "@/lib/types";
import { clampScore } from "@/lib/utils";

type SignalInput = {
  comments: NormalizedComment[];
  understandings: CommentUnderstanding[];
  competition?: Partial<CompetitionMetrics>;
};

export function calculateSignals({ comments, understandings, competition }: SignalInput): SignalMetrics {
  const total = Math.max(understandings.length, 1);
  const views = comments.reduce((sum, comment) => sum + comment.contentViews, 0);
  const commentLikes = comments.reduce((sum, comment) => sum + comment.commentLikes, 0);
  const platforms = new Set(comments.map((comment) => comment.platform));
  const creators = new Set(comments.map((comment) => comment.creator));

  const intentRatio = (intent: CommentUnderstanding["intent"]) =>
    understandings.filter((item) => item.intent === intent).length / total;

  const avg = (values: number[]) =>
    values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;

  return {
    questionDensity: clampScore(intentRatio("question") * 100),
    complaintDensity: clampScore(intentRatio("complaint") * 100),
    comparisonFrequency: clampScore(intentRatio("comparison") * 100),
    purchaseIntent: clampScore(intentRatio("purchase_intent") * 100),
    objectionFrequency: clampScore((understandings.filter((item) => item.objection).length / total) * 100),
    desiredOutcomeFrequency: clampScore(
      (understandings.filter((item) => item.desiredOutcome).length / total) * 100
    ),
    emotionalIntensity: clampScore(avg(understandings.map((item) => item.emotionalIntensity))),
    audienceEngagement: clampScore(Math.log10(commentLikes + comments.length + 1) * 20),
    crossPlatformConfirmation: clampScore((platforms.size / 3) * 100),
    creatorAuthority: clampScore(Math.log10(views + creators.size * 10 + 1) * 12),
    audienceSegmentDistribution: distribution(understandings.map((item) => item.audienceType)),
    geographicDistribution: distribution(understandings.map((item) => item.region ?? "unknown")),
    buyingStageDistribution: distribution(understandings.map((item) => item.buyingStage)),
    insightDepth: clampScore(avg(understandings.map((item) => item.insightDepth))),
    evergreenScore: calculateEvergreenScore(understandings),
    trendMomentum: 50,
    trendVelocity: 50,
    trendAcceleration: 50,
    opportunityDecay: competition?.competitionScore ? clampScore(competition.competitionScore * 0.35) : 18,
    strategicFit: 70,
    commercialIntent: clampScore(avg(understandings.map((item) => item.commercialIntent))),
    actionability: clampScore(avg(understandings.map((item) => item.actionability)))
  };
}

export function calculateCompetitionMetrics(input: Partial<CompetitionMetrics>): CompetitionMetrics {
  const contentDensity = input.contentDensity ?? 40;
  const quality = input.contentQuality ?? 45;
  const depth = input.contentDepth ?? 40;
  const freshness = input.contentFreshness ?? 50;
  const authority = input.authority ?? 35;

  const competitionScore = clampScore(
    contentDensity * 0.2 +
      (input.searchPresence ?? 35) * 0.12 +
      (input.videoPresence ?? 35) * 0.12 +
      (input.articlePresence ?? 35) * 0.12 +
      (input.competitorPresence ?? 30) * 0.12 +
      freshness * 0.1 +
      quality * 0.14 +
      depth * 0.08
  );

  const contentQualityDeficitScore = clampScore(100 - (quality * 0.55 + depth * 0.3 + freshness * 0.15));
  const gapScore = clampScore(contentQualityDeficitScore * 0.55 + (100 - contentDensity) * 0.25 + (100 - authority) * 0.2);
  const difficultyScore = clampScore(competitionScore * 0.68 + authority * 0.32);

  return {
    contentDensity,
    searchPresence: input.searchPresence ?? 35,
    videoPresence: input.videoPresence ?? 35,
    articlePresence: input.articlePresence ?? 35,
    competitorPresence: input.competitorPresence ?? 30,
    contentFreshness: freshness,
    contentQuality: quality,
    contentDepth: depth,
    authority,
    competitionScore,
    contentQualityDeficitScore,
    gapScore,
    difficultyScore,
    whiteSpaceScore: clampScore(gapScore * 0.72 + (100 - competitionScore) * 0.28)
  };
}

function calculateEvergreenScore(understandings: CommentUnderstanding[]) {
  const temporal = understandings.filter((item) => /trend|viral|new/i.test(item.topic)).length;
  const evergreen = Math.max(0, understandings.length - temporal);
  return clampScore((evergreen / Math.max(understandings.length, 1)) * 100);
}

function distribution(values: string[]) {
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});
  const total = Math.max(values.length, 1);

  return Object.fromEntries(Object.entries(counts).map(([key, count]) => [key, clampScore((count / total) * 100)]));
}
