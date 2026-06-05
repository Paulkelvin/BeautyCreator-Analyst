import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { fetchYouTubeCompetitionVideos } from "@/lib/competition/youtube-fetch";
import { scoreYouTubeResults } from "@/lib/competition/scoring";
import { type StoredCompetitionSnapshot } from "@/lib/competition/types";

const CACHE_DAYS = 7;

function rowToSnapshot(row: Record<string, unknown>): StoredCompetitionSnapshot {
  return {
    id: String(row.id),
    topicId: String(row.topic_id),
    canonicalTopic: String(row.canonical_topic),
    competitionScore: Number(row.competition_score),
    supplyScore: Number(row.supply_score),
    authorityScore: Number(row.authority_score),
    engagementScore: Number(row.engagement_score),
    freshnessScore: Number(row.freshness_score),
    confidenceScore: Number(row.confidence_score),
    fetchedAt: String(row.fetched_at),
    expiresAt: String(row.expires_at),
    metadataJson: (row.metadata_json as Record<string, unknown>) ?? {}
  };
}

export async function getValidCompetitionSnapshot(topicId: string): Promise<StoredCompetitionSnapshot | null> {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();

  const { data } = await supabase
    .from("competition_snapshots")
    .select("*")
    .eq("topic_id", topicId)
    .gt("expires_at", now)
    .maybeSingle();

  return data ? rowToSnapshot(data) : null;
}

export async function fetchAndStoreCompetitionSnapshot({
  userId,
  topicId,
  canonicalTopic
}: {
  userId: string;
  topicId: string;
  canonicalTopic: string;
}) {
  const existing = await getValidCompetitionSnapshot(topicId);
  if (existing) {
    return { snapshot: existing, cached: true };
  }

  const videos = await fetchYouTubeCompetitionVideos(canonicalTopic);
  if (!videos.length) {
    throw new Error(`No YouTube results found for topic: ${canonicalTopic}`);
  }

  const { scores, results } = scoreYouTubeResults(videos);
  const fetchedAt = new Date();
  const expiresAt = new Date(fetchedAt.getTime() + CACHE_DAYS * 86_400_000);

  const supabase = createSupabaseAdminClient();

  const { data: snapshotRow, error: snapshotError } = await supabase
    .from("competition_snapshots")
    .upsert(
      {
        user_id: userId,
        topic_id: topicId,
        canonical_topic: canonicalTopic,
        competition_score: scores.competitionScore,
        supply_score: scores.supplyScore,
        authority_score: scores.authorityScore,
        engagement_score: scores.engagementScore,
        freshness_score: scores.freshnessScore,
        confidence_score: scores.confidenceScore,
        fetched_at: fetchedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        metadata_json: {
          videoCount: videos.length,
          source: "youtube_search",
          query: `${canonicalTopic} review`
        }
      },
      { onConflict: "topic_id" }
    )
    .select("*")
    .single();

  if (snapshotError || !snapshotRow) {
    throw snapshotError ?? new Error("Failed to save competition snapshot.");
  }

  const snapshotId = String(snapshotRow.id);

  await supabase.from("competitor_results").delete().eq("snapshot_id", snapshotId);

  const { error: resultsError } = await supabase.from("competitor_results").insert(
    results.map((row) => ({
      snapshot_id: snapshotId,
      youtube_video_id: row.youtubeVideoId,
      title: row.title,
      channel_name: row.channelName,
      channel_subscribers: row.channelSubscribers,
      views: row.views,
      likes: row.likes,
      comments: row.comments,
      published_at: row.publishedAt,
      engagement_rate: row.engagementRate,
      authority_score: row.authorityScore,
      competition_contribution: row.competitionContribution
    }))
  );

  if (resultsError) {
    throw resultsError;
  }

  return { snapshot: rowToSnapshot(snapshotRow), cached: false };
}

export async function listCompetitorResults(snapshotId: string, limit = 20) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("competitor_results")
    .select(
      "youtube_video_id, title, channel_name, channel_subscribers, views, likes, comments, published_at, engagement_rate, authority_score, competition_contribution"
    )
    .eq("snapshot_id", snapshotId)
    .order("competition_contribution", { ascending: false })
    .limit(limit);

  return data ?? [];
}
