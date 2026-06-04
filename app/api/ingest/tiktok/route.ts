import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUserId } from "@/lib/auth";
import { inngest } from "@/lib/jobs/inngest";

export const runtime = "nodejs";

const schema = z.object({
  url: z.string().url(),
  limit: z.number().int().positive().max(2000).optional(),
  name: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const body = schema.parse(await request.json());

    await inngest.send({
      name: "source/extract.requested",
      data: {
        userId,
        platform: "tiktok",
        ...body
      }
    });

    return NextResponse.json({ status: "queued", platform: "tiktok" }, { status: 202 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to queue TikTok ingestion." },
      { status: 400 }
    );
  }
}
