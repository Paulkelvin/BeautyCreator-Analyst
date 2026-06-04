import { Inngest } from "inngest";
import { understandComment } from "@/lib/ai/comment-understanding";
import { createSource, persistCommentUnderstanding, persistNormalizedComments } from "@/lib/db/repositories";
import { extractTikTokComments } from "@/lib/ingestion/tiktok";
import { extractYouTubeComments } from "@/lib/ingestion/youtube";
import { type NormalizedComment } from "@/lib/types";

export const inngest = new Inngest({ id: "content-intelligence-engine" });

type UploadedCommentsEvent = {
  userId: string;
  platform: "instagram";
  name: string;
  fileName: string;
  storagePath?: string | null;
  comments: NormalizedComment[];
};

type ExternalSourceEvent = {
  userId: string;
  platform: "youtube" | "tiktok";
  url: string;
  limit?: number;
  name?: string;
};

type PersistedCommentRow = {
  id: string;
};

export const ingestUploadedComments = inngest.createFunction(
  { id: "ingest-uploaded-comments", triggers: { event: "comments/uploaded" } },
  async ({ event, step }) => {
    const data = event.data as UploadedCommentsEvent;
    const sourceId = await step.run("create upload source", () =>
      createSource({
        userId: data.userId,
        platform: data.platform,
        sourceType: "upload",
        name: data.name,
        metadata: { fileName: data.fileName, storagePath: data.storagePath ?? null }
      })
    );

    const inserted = await step.run("persist normalized comments", () =>
      persistNormalizedComments({
        userId: data.userId,
        sourceId,
        comments: data.comments
      })
    );

    await step.run("understand comments", async () => {
      await Promise.all(
        (inserted as PersistedCommentRow[]).map(async (row, index) => {
          const understanding = await understandComment(data.comments[index]);
          await persistCommentUnderstanding({ commentId: row.id, understanding });
        })
      );
    });

    return { sourceId, comments: inserted.length };
  }
);

export const ingestExternalSource = inngest.createFunction(
  { id: "ingest-external-source", triggers: { event: "source/extract.requested" } },
  async ({ event, step }) => {
    const data = event.data as ExternalSourceEvent;
    const comments = await step.run("extract comments", async () => {
      if (data.platform === "youtube") {
        return extractYouTubeComments({ url: data.url, limit: data.limit });
      }

      return extractTikTokComments({ url: data.url, limit: data.limit });
    });

    const sourceId = await step.run("create external source", () =>
      createSource({
        userId: data.userId,
        platform: data.platform,
        sourceType: "automatic",
        name: data.name ?? data.url,
        url: data.url
      })
    );

    const inserted = await step.run("persist comments", () =>
      persistNormalizedComments({ userId: data.userId, sourceId, comments })
    );

    return { sourceId, comments: inserted.length };
  }
);

export const functions = [ingestUploadedComments, ingestExternalSource];
