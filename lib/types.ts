export const platforms = ["youtube", "tiktok", "instagram"] as const;
export type Platform = (typeof platforms)[number];

export const intentCategories = [
  "question",
  "complaint",
  "comparison",
  "recommendation",
  "purchase_intent",
  "confusion",
  "success_story",
  "feature_request",
  "trend_mention"
] as const;
export type IntentCategory = (typeof intentCategories)[number];

export const buyingStages = ["awareness", "consideration", "purchase", "post_purchase"] as const;
export type BuyingStage = (typeof buyingStages)[number];

export const audienceSegments = [
  "beginner",
  "professional",
  "bridal_makeup",
  "luxury_buyer",
  "budget_buyer",
  "teen",
  "mature_audience"
] as const;
export type AudienceSegment = (typeof audienceSegments)[number];

export type NormalizedComment = {
  platform: Platform;
  creator: string;
  contentTitle: string;
  contentUrl: string;
  contentViews: number;
  contentLikes: number;
  publishDate: string | null;
  commentText: string;
  commentLikes: number;
  commentDate: string | null;
  replyCount?: number;
  raw?: Record<string, unknown>;
};

export type CommentUnderstanding = {
  intent: IntentCategory;
  sentiment: "negative" | "neutral" | "positive";
  topic: string;
  canonicalTopic: string;
  audienceType: AudienceSegment;
  buyingStage: BuyingStage;
  region: string | null;
  desiredOutcome: string | null;
  objection: string | null;
  emotionalIntensity: number;
  commercialIntent: number;
  actionability: number;
  insightDepth: number;
};

export type SignalMetrics = {
  questionDensity: number;
  complaintDensity: number;
  comparisonFrequency: number;
  purchaseIntent: number;
  objectionFrequency: number;
  desiredOutcomeFrequency: number;
  emotionalIntensity: number;
  audienceEngagement: number;
  crossPlatformConfirmation: number;
  creatorAuthority: number;
  audienceSegmentDistribution: Record<string, number>;
  geographicDistribution: Record<string, number>;
  buyingStageDistribution: Record<string, number>;
  insightDepth: number;
  evergreenScore: number;
  trendMomentum: number;
  trendVelocity: number;
  trendAcceleration: number;
  opportunityDecay: number;
  strategicFit: number;
  commercialIntent: number;
  actionability: number;
};

export type CompetitionMetrics = {
  contentDensity: number;
  searchPresence: number;
  videoPresence: number;
  articlePresence: number;
  competitorPresence: number;
  contentFreshness: number;
  contentQuality: number;
  contentDepth: number;
  authority: number;
  competitionScore: number;
  contentQualityDeficitScore: number;
  gapScore: number;
  difficultyScore: number;
  whiteSpaceScore: number;
};

export type ScoringWeights = {
  demand: number;
  purchaseIntent: number;
  commercialIntent: number;
  questionDensity: number;
  complaintDensity: number;
  comparisonDensity: number;
  desiredOutcomeFrequency: number;
  emotionalIntensity: number;
  trendGrowth: number;
  trendAcceleration: number;
  creatorAuthority: number;
  crossPlatformValidation: number;
  gapScore: number;
  contentQualityDeficit: number;
  strategicFit: number;
  actionability: number;
  competition: number;
  difficulty: number;
  contentSaturation: number;
};

export type Opportunity = {
  id: string;
  title: string;
  description: string;
  demandScore: number;
  gapScore: number;
  commercialScore: number;
  momentumScore: number;
  strategicFitScore: number;
  actionabilityScore: number;
  difficultyScore: number;
  competitionScore: number;
  confidenceScore: number;
  audienceSegments: AudienceSegment[];
  trendClassification: "emerging" | "stable" | "declining" | "exploding";
  recommendedContentTypes: string[];
};
