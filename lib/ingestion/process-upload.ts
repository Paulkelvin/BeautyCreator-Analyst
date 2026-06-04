import { understandComment } from "@/lib/ai/comment-understanding";
import { analyzeAndPersist } from "@/lib/topics/persist-analysis";
import {
  createSource,
  persistCommentUnderstanding,
  persistNormalizedComments
} from "@/lib/db/repositories";
import { type NormalizedComment } from "@/lib/types";

export async function processCommentBatch({
  userId,
  topic,
  platform,
  name,
  comments,
  metadata = {},
  persistOpportunity = true
}: {
  userId: string;
  topic: string;
  platform: "youtube" | "tiktok" | "instagram";
  name: string;
  comments: NormalizedComment[];
  metadata?: Record<string, unknown>;
  persistOpportunity?: boolean;
}) {
  if (persistOpportunity && comments.length > 0) {
    const saved = await analyzeAndPersist({
      userId,
      topic,
      comments,
      source: {
        platform,
        name,
        sourceType: metadata.sourceType === "automatic" ? "automatic" : "upload",
        metadata
      }
    });

    return {
      sourceId: saved.sourceId,
      commentsStored: comments.length,
      opportunityId: saved.opportunityId,
      topicId: saved.canonicalTopic.id,
      deduplicated: saved.deduplicated
    };
  }

  const sourceId = await createSource({
    userId,
    platform,
    sourceType: "upload",
    name,
    metadata
  });

  const inserted = await persistNormalizedComments({ userId, sourceId, comments });

  await Promise.all(
    inserted.map(async (row, index) => {
      const understanding = await understandComment(comments[index]);
      await persistCommentUnderstanding({
        commentId: String(row.id),
        understanding
      });
    })
  );

  return {
    sourceId,
    commentsStored: inserted.length,
    opportunityId: undefined
  };
}
