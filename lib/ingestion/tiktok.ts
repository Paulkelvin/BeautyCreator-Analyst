import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { env } from "@/lib/env";
import { normalizeRecords } from "@/lib/ingestion/normalization";
import { type NormalizedComment } from "@/lib/types";
import { safeNumber } from "@/lib/utils";

const execFileAsync = promisify(execFile);

export type TikTokExtractionInput = {
  url: string;
  limit?: number;
};

export async function extractTikTokComments(input: TikTokExtractionInput): Promise<NormalizedComment[]> {
  const limit = input.limit ?? 500;
  const { stdout } = await execFileAsync(
    env.TIKTOK_EXTRACTOR_COMMAND,
    ["comments", input.url, "--limit", String(limit), "--json"],
    {
      timeout: 120_000,
      maxBuffer: 20 * 1024 * 1024
    }
  );

  const parsed = JSON.parse(stdout) as Record<string, unknown>[] | { comments?: Record<string, unknown>[] };
  const comments = Array.isArray(parsed) ? parsed : (parsed.comments ?? []);
  const records = comments.map((record) => ({
    platform: "tiktok",
    creator: record.creator ?? record.author ?? record.username ?? "Unknown creator",
    content_title: record.video_title ?? record.title ?? "TikTok video",
    content_url: input.url,
    content_views: safeNumber(record.view_count ?? record.views ?? record.play_count),
    content_likes: safeNumber(record.video_likes ?? record.likes),
    publish_date: record.publish_date ?? record.create_time ?? null,
    comment_text: record.text ?? record.comment ?? record.comment_text,
    comment_likes: safeNumber(record.comment_likes ?? record.like_count),
    comment_date: record.comment_date ?? record.create_time,
    raw: record
  }));

  return normalizeRecords(records, "tiktok");
}
