import { readRuntimeEnv } from "@/lib/runtime-env";
import { type YouTubeVideoResult } from "@/lib/competition/types";

type YouTubeSearchItem = {
  id?: { videoId?: string };
  snippet?: {
    title?: string;
    channelId?: string;
    channelTitle?: string;
    publishedAt?: string;
  };
};

type YouTubeVideoItem = {
  id?: string;
  snippet?: { publishedAt?: string };
  statistics?: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
};

type YouTubeChannelItem = {
  id?: string;
  statistics?: { subscriberCount?: string };
};

function getApiKey() {
  return readRuntimeEnv("YOUTUBE_API_KEY");
}

async function youtubeGet<T>(path: string, params: Record<string, string>) {
  const apiKey = await getApiKey();
  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY is not configured on the server.");
  }

  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  url.searchParams.set("key", apiKey);

  const response = await fetch(url.toString(), { next: { revalidate: 0 } });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`YouTube API ${path} failed (${response.status}): ${body.slice(0, 240)}`);
  }

  return (await response.json()) as T;
}

export function isYouTubeCompetitionConfigured() {
  return Boolean(getApiKey());
}

export function getYouTubeApiKeySource() {
  return getApiKey() ? "vercel" : "missing";
}

/** Fetch top 20 YouTube videos for a canonical topic query. */
export async function fetchYouTubeCompetitionVideos(canonicalTopic: string): Promise<YouTubeVideoResult[]> {
  const search = await youtubeGet<{ items?: YouTubeSearchItem[] }>("search", {
    part: "snippet",
    q: `${canonicalTopic} review`,
    type: "video",
    maxResults: "20",
    order: "relevance",
    safeSearch: "none"
  });

  const searchItems = search.items ?? [];
  const videoIds = searchItems
    .map((item) => item.id?.videoId)
    .filter((id): id is string => Boolean(id));

  if (!videoIds.length) {
    return [];
  }

  const videosResponse = await youtubeGet<{ items?: YouTubeVideoItem[] }>("videos", {
    part: "snippet,statistics",
    id: videoIds.join(",")
  });

  const videoItems = videosResponse.items ?? [];
  const channelIds = Array.from(
    new Set(
      searchItems
        .map((item) => item.snippet?.channelId)
        .filter((id): id is string => Boolean(id))
    )
  );

  const channelSubs = new Map<string, number>();
  if (channelIds.length) {
    const channelsResponse = await youtubeGet<{ items?: YouTubeChannelItem[] }>("channels", {
      part: "statistics",
      id: channelIds.join(",")
    });

    for (const channel of channelsResponse.items ?? []) {
      if (!channel.id) {
        continue;
      }

      const subs = Number(channel.statistics?.subscriberCount ?? 0);
      channelSubs.set(channel.id, Number.isFinite(subs) ? subs : 0);
    }
  }

  const statsById = new Map(
    videoItems.map((item) => [
      String(item.id),
      {
        views: Number(item.statistics?.viewCount ?? 0),
        likes: Number(item.statistics?.likeCount ?? 0),
        comments: Number(item.statistics?.commentCount ?? 0),
        publishedAt: item.snippet?.publishedAt ?? null
      }
    ])
  );

  return searchItems
    .map((item) => {
      const videoId = item.id?.videoId;
      if (!videoId) {
        return null;
      }

      const stats = statsById.get(videoId);
      const channelId = item.snippet?.channelId ?? "unknown";

      return {
        youtubeVideoId: videoId,
        title: item.snippet?.title ?? "Untitled",
        channelId,
        channelName: item.snippet?.channelTitle ?? "Unknown channel",
        channelSubscribers: channelSubs.get(channelId) ?? null,
        views: stats?.views ?? 0,
        likes: stats?.likes ?? 0,
        comments: stats?.comments ?? 0,
        publishedAt: stats?.publishedAt ?? item.snippet?.publishedAt ?? null
      } satisfies YouTubeVideoResult;
    })
    .filter((row): row is YouTubeVideoResult => row !== null);
}
