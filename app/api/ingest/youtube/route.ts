import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveUserId } from "@/lib/auth";
import { env } from "@/lib/env";
import { extractYouTubeComments } from "@/lib/ingestion/youtube";
import { processCommentBatch } from "@/lib/ingestion/process-upload";
import { inngest } from "@/lib/jobs/inngest";

export const runtime = "nodejs";
export const maxDuration = 120;

const schema = z.object({
  url: z.string().url(),
  limit: z.number().int().positive().max(2000).optional(),
  name: z.string().optional(),
  topic: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    const body = schema.parse(await request.json());
    const topic = body.topic ?? body.name ?? "YouTube audience topic";

    if (env.INNGEST_EVENT_KEY) {
      await inngest.send({
        name: "source/extract.requested",
        data: {
          userId,
          platform: "youtube",
          url: body.url,
          limit: body.limit,
          name: body.name,
          topic
        }
      });

      return NextResponse.json(
        {
          status: "queued",
          platform: "youtube",
          message: "Extraction queued via Inngest."
        },
        { status: 202 }
      );
    }

    const comments = await extractYouTubeComments({ url: body.url, limit: body.limit });

    if (!comments.length) {
      return NextResponse.json({ error: "No comments extracted from this URL." }, { status: 400 });
    }

    const result = await processCommentBatch({
      userId,
      topic,
      platform: "youtube",
      name: body.name ?? body.url,
      comments,
      metadata: { url: body.url }
    });

    return NextResponse.json({
      status: "completed",
      platform: "youtube",
      comments: comments.length,
      ...result,
      message: "YouTube comments imported and opportunity saved."
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to process YouTube URL.";
    const hint = message.includes("ENOENT") || message.includes("not found")
      ? " Set YOUTUBE_API_KEY in Vercel (YouTube Data API v3) — see docs/URL_INGEST.md — or install youtube-comment-downloader on the server."
      : message.includes("YOUTUBE_API_KEY")
        ? " Add YOUTUBE_API_KEY in Vercel → Production and redeploy."
        : "";

    return NextResponse.json({ error: message + hint }, { status: 400 });
  }
}
