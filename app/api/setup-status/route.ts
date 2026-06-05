import { NextResponse } from "next/server";
import { isOpenAIConfigured } from "@/lib/ai/openai";
import { getIngestCapabilities, getPersistConfig } from "@/lib/runtime-env";

export const runtime = "nodejs";

/** Public-safe check: whether the server can save to Supabase (no secrets returned). */
export async function GET() {
  const config = getPersistConfig();
  const ingest = getIngestCapabilities();

  return NextResponse.json({
    canPersist: config.canPersist,
    appOwnerConfigured: Boolean(config.appOwnerUserId),
    supabaseUrlConfigured: Boolean(config.supabaseUrl),
    serviceRoleConfigured: Boolean(config.serviceRoleKey),
    hint: config.reason,
    dashboardPath: "/dashboard#saved-opportunities",
    openaiConfigured: isOpenAIConfigured(),
    openaiNote:
      "Analysis still runs without OpenAI (built-in heuristics). Billing must be active on your OpenAI account or API calls fall back automatically.",
    youtubeCommentPull: ingest.youtube,
    youtubeSetupHint: ingest.youtubeSetupHint,
    tiktokCommentPull: ingest.tiktok,
    inngestConfigured: ingest.inngest
  });
}
