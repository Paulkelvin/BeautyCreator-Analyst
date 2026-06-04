import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUserId } from "@/lib/auth";
import { env } from "@/lib/env";
import { normalizeRecords } from "@/lib/ingestion/normalization";
import { parseUploadedComments } from "@/lib/ingestion/parsers";
import { inngest } from "@/lib/jobs/inngest";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Upload a CSV, XLSX, or JSON file." }, { status: 400 });
    }

    const rows = await parseUploadedComments(file);
    const comments = normalizeRecords(rows, "instagram");
    const storagePath = await uploadOriginalExport(userId, file);

    await inngest.send({
      name: "comments/uploaded",
      data: {
        userId,
        platform: "instagram",
        name: String(formData.get("name") ?? file.name),
        fileName: file.name,
        storagePath,
        comments
      }
    });

    return NextResponse.json({ status: "queued", comments: comments.length }, { status: 202 });
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
