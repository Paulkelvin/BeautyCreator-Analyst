import { NextRequest, NextResponse } from "next/server";
import { resolveUserId } from "@/lib/auth";
import { env } from "@/lib/env";
import { normalizeRecords } from "@/lib/ingestion/normalization";
import { parseUploadedComments } from "@/lib/ingestion/parsers";
import { processCommentBatch } from "@/lib/ingestion/process-upload";
import { inngest } from "@/lib/jobs/inngest";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const userId = await resolveUserId(request);
    const formData = await request.formData();
    const file = formData.get("file");
    const topic = String(formData.get("topic") ?? "Instagram comment analysis").trim();

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Upload a CSV, XLSX, or JSON file." }, { status: 400 });
    }

    if (topic.length < 2) {
      return NextResponse.json({ error: "Enter a topic for this upload (min 2 characters)." }, { status: 400 });
    }

    const rows = await parseUploadedComments(file);
    const comments = normalizeRecords(rows, "instagram");

    if (comments.length === 0) {
      return NextResponse.json({ error: "No valid comments found in file." }, { status: 400 });
    }

    const storagePath = await uploadOriginalExport(userId, file);
    const name = String(formData.get("name") ?? file.name);

    if (env.INNGEST_EVENT_KEY) {
      await inngest.send({
        name: "comments/uploaded",
        data: {
          userId,
          platform: "instagram",
          name,
          fileName: file.name,
          storagePath,
          comments,
          topic
        }
      });

      return NextResponse.json(
        { status: "queued", comments: comments.length, message: "Processing via Inngest." },
        { status: 202 }
      );
    }

    const result = await processCommentBatch({
      userId,
      topic,
      platform: "instagram",
      name,
      comments,
      metadata: { fileName: file.name, storagePath }
    });

    return NextResponse.json({
      status: "completed",
      comments: comments.length,
      ...result,
      message: "Comments stored and opportunity saved to your dashboard."
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to process Instagram upload." },
      { status: 400 }
    );
  }
}

async function uploadOriginalExport(userId: string, file: File) {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return null;
  }

  const supabase = createSupabaseAdminClient();
  const path = `${userId}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const { error } = await supabase.storage
    .from("instagram-exports")
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type || "application/octet-stream",
      upsert: false
    });

  if (error) {
    throw error;
  }

  return path;
}
