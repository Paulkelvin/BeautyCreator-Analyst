import { env } from "@/lib/env";
import { inngest } from "@/lib/jobs/inngest";
import { fetchAndStoreCompetitionSnapshot, getValidCompetitionSnapshot } from "@/lib/competition/snapshots";
import { applyCompetitionToOpportunities } from "@/lib/competition/apply-to-opportunity";
import { isYouTubeCompetitionConfigured } from "@/lib/competition/youtube-fetch";

export type CompetitionFetchEvent = {
  userId: string;
  topicId: string;
  canonicalTopic: string;
  opportunityId?: string;
  commentCount?: number;
};

export async function requestCompetitionFetch(event: CompetitionFetchEvent) {
  if (!isYouTubeCompetitionConfigured()) {
    return { status: "skipped", reason: "YOUTUBE_API_KEY not configured" as const };
  }

  const cached = await getValidCompetitionSnapshot(event.topicId);
  if (cached) {
    await applyCompetitionToOpportunities({
      userId: event.userId,
      topicId: event.topicId,
      snapshot: cached,
      commentCount: event.commentCount
    });
    return { status: "cached" as const, snapshotId: cached.id };
  }

  if (env.INNGEST_EVENT_KEY) {
    await inngest.send({
      name: "competition/fetch.requested",
      data: event
    });
    return { status: "queued" as const };
  }

  void (async () => {
    try {
      const { snapshot } = await fetchAndStoreCompetitionSnapshot({
        userId: event.userId,
        topicId: event.topicId,
        canonicalTopic: event.canonicalTopic
      });

      await applyCompetitionToOpportunities({
        userId: event.userId,
        topicId: event.topicId,
        snapshot,
        commentCount: event.commentCount
      });
    } catch (error) {
      console.error("Background competition fetch failed", error);
    }
  })();

  return { status: "queued" as const, reason: "background-without-inngest" as const };
}
