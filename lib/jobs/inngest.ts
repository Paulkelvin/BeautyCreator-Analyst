import { Inngest } from "inngest";
import { understandComment } from "@/lib/ai/comment-understanding";
import { createSource, persistCommentUnderstanding, persistNormalizedComments } from "@/lib/db/repositories";
import { extractTikTokComments } from "@/lib/ingestion/tiktok";
import { extractYouTubeComments } from "@/lib/ingestion/youtube";
import { type NormalizedComment } from "@/lib/types";

export const inngest = new Inngest({ id: "content-intelligence-engine" });

export const ingestUploadedComments = inngest.createFunction(
  { id: "ingest-uploaded-comments" },
  { event: "comments/uploaded" },
  async ({ event, step }) => {
    const sourceId = await step.run("create upload source", () =>
      createSource({
        userId: event.data.userId,
        platform: event.data.platform,
        sourceType: "upload",
        name: event.data.name,
        metadata: { fileName: event.data.fileName, storagePath: event.data.storagePath ?? null }
      })
    );

    const inserted = await step.run("persist normalized comments", () =>
      persistNormalizedComments({
        userId: event.data.userId,
        sourceId,
        comments: event.data.comments as NormalizedComment[]
      })
    );

    await step.run("understand comments", async () => {
      await Promise.all(
        inserted.map(async (row, index) => {
          const understanding = await understandComment((event.data.comments as NormalizedComment[])[index]);
          await persistCommentUnderstanding({ commentId: row.id, understanding });
        })
      );
    });

    return { sourceId, comments: inserted.length };
  }
);

export const ingestExternalSource = inngest.createFunction(
  { id: "ingest-external-source" },
  { event: "source/extract.requested" },
  async ({ event, step }) => {
    const comments = await step.run("extract comments", async () => {
      if (event.data.platform === "youtube") {
        return extractYouTubeComments({ url: event.data.url, limit: event.data.limit });
      }

      return extractTikTokComments({ url: event.data.url, limit: event.data.limit });
    });

    const sourceId = await step.run("create external source", () =>
      createSource({
        userId: event.data.userId,
        platform: event.data.platform,
        sourceType: "automatic",
        name: event.data.name ?? event.data.url,
        url: event.data.url
      })
    );

    const inserted = await step.run("persist comments", () =>
      persistNormalizedComments({ userId: event.data.userId, sourceId, comments })
    );

    return { sourceId, comments: inserted.length };
  }
);

export const functions = [ingestUploadedComments, ingestExternalSource];
