import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { env } from "@/lib/env";
import { normalizeRecords } from "@/lib/ingestion/normalization";
import { type NormalizedComment } from "@/lib/types";
import { safeNumber } from "@/lib/utils";

const execFileAsync = promisify(execFile);

export type YouTubeExtractionInput = {
  url: string;
  limit?: number;
};

export async function extractYouTubeComments(input: YouTubeExtractionInput): Promise<NormalizedComment[]> {
  const limit = input.limit ?? 500;
  const { stdout } = await execFileAsync(
    env.YOUTUBE_COMMENT_DOWNLOADER_COMMAND,
    ["--url", input.url, "--limit", String(limit), "--output", "-"],
    {
      timeout: 120_000,
      maxBuffer: 20 * 1024 * 1024
    }
  );

  const records = parseJsonLines(stdout).map((record) => ({
    platform: "youtube",
    creator: record.channel ?? record.channel_name ?? record.author ?? "Unknown channel",
    content_title: record.video_title ?? record.title ?? "YouTube video",
    content_url: input.url,
    content_views: safeNumber(record.view_count ?? record.views),
    content_likes: safeNumber(record.video_likes ?? record.likes),
    publish_date: record.publish_date ?? record.published_at ?? null,
    comment_text: record.text ?? record.comment ?? record.comment_text,
    comment_likes: safeNumber(record.votes ?? record.comment_likes),
    comment_date: record.time ?? record.comment_date,
    reply_count: safeNumber(record.reply_count ?? record.replies),
    raw: record
  }));

  return normalizeRecords(records, "youtube");
}

function parseJsonLines(output: string) {
  return output
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => JSON.parse(line) as Record<string, unknown>);
}
