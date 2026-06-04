import { z } from "zod";
import { platforms, type NormalizedComment, type Platform } from "@/lib/types";
import { safeNumber } from "@/lib/utils";

export const normalizedCommentSchema = z.object({
  platform: z.enum(platforms),
  creator: z.string().default("Unknown creator"),
  contentTitle: z.string().default("Untitled content"),
  contentUrl: z.string().url().or(z.string().length(0)).default(""),
  contentViews: z.number().nonnegative().default(0),
  contentLikes: z.number().nonnegative().default(0),
  publishDate: z.string().nullable().default(null),
  commentText: z.string().min(1),
  commentLikes: z.number().nonnegative().default(0),
  commentDate: z.string().nullable().default(null),
  replyCount: z.number().nonnegative().optional(),
  raw: z.record(z.string(), z.unknown()).optional()
});

const aliases: Record<keyof NormalizedComment, string[]> = {
  platform: ["platform"],
  creator: ["creator", "channel", "channel_name", "author", "username"],
  contentTitle: ["content_title", "video_title", "title", "post_title"],
  contentUrl: ["content_url", "video_url", "url", "post_url", "permalink"],
  contentViews: ["content_views", "view_count", "views", "play_count"],
  contentLikes: ["content_likes", "like_count", "likes", "video_likes"],
  publishDate: ["publish_date", "published_at", "date", "created_at"],
  commentText: ["comment_text", "comment", "text", "body"],
  commentLikes: ["comment_likes", "comment_like_count", "likes_count", "like_count"],
  commentDate: ["comment_date", "commented_at", "created_time", "timestamp"],
  replyCount: ["reply_count", "replies"],
  raw: []
};

export function normalizeRecord(record: Record<string, unknown>, fallbackPlatform?: Platform) {
  const normalized: Partial<NormalizedComment> = {
    platform: normalizePlatform(readValue(record, aliases.platform), fallbackPlatform),
    creator: String(readValue(record, aliases.creator) ?? "Unknown creator"),
    contentTitle: String(readValue(record, aliases.contentTitle) ?? "Untitled content"),
    contentUrl: String(readValue(record, aliases.contentUrl) ?? ""),
    contentViews: safeNumber(readValue(record, aliases.contentViews)),
    contentLikes: safeNumber(readValue(record, aliases.contentLikes)),
    publishDate: normalizeDate(readValue(record, aliases.publishDate)),
    commentText: String(readValue(record, aliases.commentText) ?? "").trim(),
    commentLikes: safeNumber(readValue(record, aliases.commentLikes)),
    commentDate: normalizeDate(readValue(record, aliases.commentDate)),
    replyCount: safeNumber(readValue(record, aliases.replyCount)),
    raw: record
  };

  return normalizedCommentSchema.parse(normalized);
}

function normalizePlatform(value: unknown, fallbackPlatform?: Platform): Platform {
  if (fallbackPlatform) {
    return fallbackPlatform;
  }

  const platform = String(value ?? "instagram").toLowerCase();
  return platforms.includes(platform as Platform) ? (platform as Platform) : "instagram";
}

export function normalizeRecords(records: Record<string, unknown>[], fallbackPlatform?: Platform) {
  return records
    .map((record) => normalizeRecord(record, fallbackPlatform))
    .filter((record) => record.commentText.length > 0);
}

function readValue(record: Record<string, unknown>, keys: string[]) {
  const normalizedKeys = new Map(Object.keys(record).map((key) => [key.toLowerCase().trim(), key]));
  for (const key of keys) {
    const actual = normalizedKeys.get(key.toLowerCase());
    if (actual && record[actual] !== undefined && record[actual] !== null) {
      return record[actual];
    }
  }

  return undefined;
}

function normalizeDate(value: unknown) {
  if (!value) {
    return null;
  }

  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
