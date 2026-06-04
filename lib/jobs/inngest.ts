import { Inngest } from "inngest";
import { extractTikTokComments } from "@/lib/ingestion/tiktok";
import { extractYouTubeComments } from "@/lib/ingestion/youtube";
import { analyzeAndPersist } from "@/lib/topics/persist-analysis";
import { type NormalizedComment } from "@/lib/types";

export const inngest = new Inngest({ id: "content-intelligence-engine" });

type UploadedCommentsEvent = {
  userId: string;
  platform: "instagram";
  name: string;
  fileName: string;
  storagePath?: string | null;
  comments: NormalizedComment[];
  topic?: string;
};

type ExternalSourceEvent = {
  userId: string;
  platform: "youtube" | "tiktok";
  url: string;
  limit?: number;
  name?: string;
  topic?: string;
};

export const ingestUploadedComments = inngest.createFunction(
  { id: "ingest-uploaded-comments", triggers: { event: "comments/uploaded" } },
  async ({ event, step }) => {
    const data = event.data as UploadedCommentsEvent;
    const topic = data.topic ?? data.name;

    const result = await step.run("analyze and persist", async () => {
      if (data.comments.length === 0) {
        return null;
      }

      return analyzeAndPersist({
        userId: data.userId,
        topic,
        comments: data.comments,
        source: {
          platform: data.platform,
          name: data.name,
          sourceType: "upload",
          metadata: { fileName: data.fileName, storagePath: data.storagePath ?? null }
        }
      });
    });

    return {
      sourceId: result?.sourceId,
      comments: data.comments.length,
      opportunityId: result?.opportunityId,
      topicId: result?.canonicalTopic.id,
      deduplicated: result?.deduplicated
    };
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

    const topic = data.topic ?? data.name ?? comments[0]?.contentTitle ?? "Imported audience topic";

    const result = await step.run("analyze and persist", async () => {
      if (comments.length === 0) {
        return null;
      }

      return analyzeAndPersist({
        userId: data.userId,
        topic,
        comments,
        source: {
          platform: data.platform,
          name: data.name ?? data.url,
          url: data.url,
          sourceType: "automatic"
        }
      });
    });

    return {
      sourceId: result?.sourceId,
      comments: comments.length,
      opportunityId: result?.opportunityId,
      topicId: result?.canonicalTopic?.id,
      deduplicated: result?.deduplicated
    };
  }
);

export const functions = [ingestUploadedComments, ingestExternalSource];
