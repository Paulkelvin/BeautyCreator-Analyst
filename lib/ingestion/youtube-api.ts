import { normalizeRecords } from "@/lib/ingestion/normalization";
import { parseYouTubeVideoId } from "@/lib/ingestion/youtube-video-id";
import { readRuntimeEnv } from "@/lib/runtime-env";
import { type NormalizedComment } from "@/lib/types";
import { safeNumber } from "@/lib/utils";

type CommentThreadItem = {
  snippet?: {
    topLevelComment?: {
      snippet?: {
        textDisplay?: string;
        authorDisplayName?: string;
        likeCount?: number;
        publishedAt?: string;
      };
    };
    totalReplyCount?: number;
  };
};

export function isYouTubeApiConfigured() {
  return Boolean(readRuntimeEnv("YOUTUBE_API_KEY"));
}

export async function extractYouTubeCommentsViaApi(input: {
  url: string;
  limit?: number;
}): Promise<NormalizedComment[]> {
  const apiKey = readRuntimeEnv("YOUTUBE_API_KEY");
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY is not configured.");
  }

  const videoId = parseYouTubeVideoId(input.url);
  if (!videoId) {
    throw new Error("Could not parse a YouTube video ID from this URL.");
  }

  const limit = Math.min(input.limit ?? 500, 2000);
  let videoTitle = "YouTube video";
  let channelTitle = "Unknown channel";
  let viewCount = 0;

  const videoRes = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${encodeURIComponent(videoId)}&key=${encodeURIComponent(apiKey)}`
  );
  const videoJson = (await videoRes.json()) as {
    error?: { message?: string };
    items?: Array<{
      snippet?: { title?: string; channelTitle?: string };
      statistics?: { viewCount?: string };
    }>;
  };

  if (!videoRes.ok) {
    throw new Error(videoJson.error?.message ?? `YouTube videos.list failed (${videoRes.status})`);
  }

  const videoItem = videoJson.items?.[0];
  if (videoItem) {
    videoTitle = videoItem.snippet?.title ?? videoTitle;
    channelTitle = videoItem.snippet?.channelTitle ?? channelTitle;
    viewCount = safeNumber(videoItem.statistics?.viewCount);
  }

  const records: Record<string, unknown>[] = [];
  let pageToken: string | undefined;

  while (records.length < limit) {
    const maxResults = Math.min(100, limit - records.length);
    const params = new URLSearchParams({
      part: "snippet",
      videoId,
      maxResults: String(maxResults),
      order: "relevance",
      textFormat: "plainText",
      key: apiKey
    });
    if (pageToken) {
      params.set("pageToken", pageToken);
    }

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/commentThreads?${params.toString()}`
    );
    const body = (await res.json()) as {
      error?: { message?: string };
      items?: CommentThreadItem[];
      nextPageToken?: string;
    };

    if (!res.ok) {
      const message = body.error?.message ?? `YouTube commentThreads.list failed (${res.status})`;
      if (message.includes("disabled") || message.includes("commentsDisabled")) {
        throw new Error("Comments are disabled on this video.");
      }
      throw new Error(message);
    }

    for (const item of body.items ?? []) {
      const commentSnippet = item.snippet?.topLevelComment?.snippet;
      const text = commentSnippet?.textDisplay?.trim();
      if (!text || !commentSnippet) {
        continue;
      }

      records.push({
        platform: "youtube",
        creator: channelTitle,
        content_title: videoTitle,
        content_url: input.url,
        content_views: viewCount,
        content_likes: 0,
        comment_text: text,
        comment_likes: safeNumber(commentSnippet.likeCount),
        comment_date: commentSnippet.publishedAt ?? null,
        reply_count: safeNumber(item.snippet?.totalReplyCount),
        raw: item
      });
    }

    pageToken = body.nextPageToken;
    if (!pageToken || !body.items?.length) {
      break;
    }
  }

  return normalizeRecords(records, "youtube");
}
