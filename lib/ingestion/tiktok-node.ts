import { normalizeRecords } from "@/lib/ingestion/normalization";
import { type NormalizedComment } from "@/lib/types";
import { safeNumber } from "@/lib/utils";

export async function extractTikTokCommentsViaNode(input: {
  url: string;
  limit?: number;
}): Promise<NormalizedComment[]> {
  const Tiktok = (await import("@tobyg74/tiktok-api-dl")).default;
  const limit = Math.min(input.limit ?? 200, 500);

  const result = await Tiktok.GetVideoComments(input.url, {
    commentLimit: limit
  });

  if (result.status !== "success" || !result.result?.length) {
    throw new Error(result.message ?? "No TikTok comments returned for this URL.");
  }

  const records = result.result.map((comment) => ({
    platform: "tiktok",
    creator: comment.user?.nickname ?? comment.user?.username ?? "Unknown creator",
    content_title: "TikTok video",
    content_url: input.url,
    content_views: 0,
    content_likes: 0,
    comment_text: comment.text,
    comment_likes: safeNumber(comment.likeCount),
    comment_date: comment.createTime ? new Date(comment.createTime * 1000).toISOString() : null,
    reply_count: safeNumber(comment.replyCommentTotal),
    raw: comment
  }));

  return normalizeRecords(records, "tiktok");
}
