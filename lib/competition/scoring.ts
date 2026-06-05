import { clampScore } from "@/lib/utils";
import {
  type CompetitionSnapshotScores,
  type ScoredCompetitorResult,
  type YouTubeVideoResult
} from "@/lib/competition/types";

const MS_DAY = 86_400_000;

function daysSince(iso: string | null) {
  if (!iso) {
    return 365;
  }

  return Math.max(0, (Date.now() - new Date(iso).getTime()) / MS_DAY);
}

function channelAuthority(subscribers: number | null) {
  if (subscribers === null || subscribers <= 0) {
    return 25;
  }

  return clampScore(Math.log10(subscribers + 1) * 18);
}

function videoEngagement(video: YouTubeVideoResult) {
  const views = Math.max(video.views, 1);
  const likeRate = video.likes / views;
  const commentRate = video.comments / views;
  return clampScore(likeRate * 1200 + commentRate * 6000);
}

function videoFreshness(publishedAt: string | null) {
  const age = daysSince(publishedAt);
  if (age <= 30) {
    return 100;
  }

  if (age <= 90) {
    return 70;
  }

  if (age <= 180) {
    return 40;
  }

  return 15;
}

function median(values: number[]) {
  if (!values.length) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function scoreYouTubeResults(videos: YouTubeVideoResult[]): {
  scores: CompetitionSnapshotScores;
  results: ScoredCompetitorResult[];
} {
  const resultCount = videos.length;
  const uniqueChannels = new Set(videos.map((video) => video.channelId)).size;

  const videoDensity = clampScore((resultCount / 20) * 100);
  const channelDensity = clampScore((uniqueChannels / 20) * 100);
  const supplyScore = clampScore(videoDensity * 0.55 + channelDensity * 0.45);

  const authorityValues = videos.map((video) => channelAuthority(video.channelSubscribers));
  const authorityScore = clampScore(
    (authorityValues.reduce((sum, value) => sum + value, 0) / Math.max(authorityValues.length, 1)) * 0.5 +
      median(authorityValues) * 0.5
  );

  const engagementValues = videos.map((video) => videoEngagement(video));
  const engagementScore = clampScore(
    engagementValues.reduce((sum, value) => sum + value, 0) / Math.max(engagementValues.length, 1)
  );

  const within30 = videos.filter((video) => daysSince(video.publishedAt) <= 30).length;
  const within90 = videos.filter((video) => daysSince(video.publishedAt) <= 90).length;
  const within180 = videos.filter((video) => daysSince(video.publishedAt) <= 180).length;
  const denom = Math.max(resultCount, 1);
  const pct30 = (within30 / denom) * 100;
  const pct90 = (within90 / denom) * 100;
  const pct180 = (within180 / denom) * 100;
  const freshnessScore = clampScore(pct30 * 0.5 + pct90 * 0.3 + pct180 * 0.2);

  const competitionScore = clampScore(
    supplyScore * 0.25 + authorityScore * 0.3 + engagementScore * 0.25 + freshnessScore * 0.2
  );

  const missingSubs = videos.filter((video) => !video.channelSubscribers).length;
  const confidenceScore = clampScore(Math.min(100, resultCount * 5) - missingSubs * 3);

  const results: ScoredCompetitorResult[] = videos.map((video) => {
    const engagementRate = videoEngagement(video);
    const auth = channelAuthority(video.channelSubscribers);
    const fresh = videoFreshness(video.publishedAt);
    const videoSupply = clampScore(videoDensity * 0.55 + channelDensity * 0.45);
    const competitionContribution = clampScore(
      videoSupply * 0.25 + auth * 0.3 + engagementRate * 0.25 + fresh * 0.2
    );

    return {
      ...video,
      engagementRate,
      authorityScore: auth,
      competitionContribution
    };
  });

  return {
    scores: {
      competitionScore,
      supplyScore,
      authorityScore,
      engagementScore,
      freshnessScore,
      confidenceScore
    },
    results
  };
}

/** Gap = demand minus YouTube competition (documented in docs/COMPETITION_FORMULA.md). */
export function calculateYoutubeGapScore({
  commentCount,
  monthlyGrowthPercent,
  commercialIntent,
  competitionScore
}: {
  commentCount: number;
  monthlyGrowthPercent: number;
  commercialIntent: number;
  competitionScore: number;
}) {
  const commentVolumeScore = clampScore(Math.log10(commentCount + 1) * 28);
  const trendGrowthScore = clampScore(monthlyGrowthPercent);
  const commercialScore = clampScore(commercialIntent);

  const demandScore = clampScore(
    commentVolumeScore * 0.35 + trendGrowthScore * 0.35 + commercialScore * 0.3
  );

  const gapScore = clampScore(demandScore - competitionScore);

  return { demandScore, gapScore };
}
