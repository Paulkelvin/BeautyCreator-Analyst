import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveUserId } from "@/lib/auth";
import { inngest } from "@/lib/jobs/inngest";

export const runtime = "nodejs";

const schema = z.object({
  url: z.string().url(),
  limit: z.number().int().positive().max(2000).optional(),
  name: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    const body = schema.parse(await request.json());

    await inngest.send({
      name: "source/extract.requested",
      data: {
        userId,
        platform: "youtube",
        ...body
      }
    });

    return NextResponse.json({ status: "queued", platform: "youtube" }, { status: 202 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to queue YouTube ingestion." },
      { status: 400 }
    );
  }
}
