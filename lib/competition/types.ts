export type YouTubeVideoResult = {
  youtubeVideoId: string;
  title: string;
  channelId: string;
  channelName: string;
  channelSubscribers: number | null;
  views: number;
  likes: number;
  comments: number;
  publishedAt: string | null;
};

export type CompetitionSnapshotScores = {
  competitionScore: number;
  supplyScore: number;
  authorityScore: number;
  engagementScore: number;
  freshnessScore: number;
  confidenceScore: number;
};

export type ScoredCompetitorResult = YouTubeVideoResult & {
  engagementRate: number;
  authorityScore: number;
  competitionContribution: number;
};

export type StoredCompetitionSnapshot = CompetitionSnapshotScores & {
  id: string;
  topicId: string;
  canonicalTopic: string;
  fetchedAt: string;
  expiresAt: string;
  metadataJson: Record<string, unknown>;
};
