import { understandComment } from "@/lib/ai/comment-understanding";
import { runOpportunityAnalysis } from "@/lib/intelligence/run-analysis";
import {
  createSource,
  persistCommentUnderstanding,
  persistNormalizedComments,
  persistOpportunityAnalysis
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

  let opportunityId: string | undefined;
  if (persistOpportunity && comments.length > 0) {
    const analysis = await runOpportunityAnalysis({ topic, comments });
    const saved = await persistOpportunityAnalysis({ userId, analysis });
    opportunityId = saved.opportunityId;
  }

  return {
    sourceId,
    commentsStored: inserted.length,
    opportunityId
  };
}
