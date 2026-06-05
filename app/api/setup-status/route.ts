import { NextResponse } from "next/server";
import {
  getYouTubeApiKeySource,
  isYouTubeCompetitionConfigured
} from "@/lib/competition/youtube-fetch";
import { getPersistConfig } from "@/lib/runtime-env";

export const runtime = "nodejs";

/** Public-safe check: whether the server can save to Supabase (no secrets returned). */
export async function GET() {
  const config = getPersistConfig();

  return NextResponse.json({
    canPersist: config.canPersist,
    appOwnerConfigured: Boolean(config.appOwnerUserId),
    supabaseUrlConfigured: Boolean(config.supabaseUrl),
    serviceRoleConfigured: Boolean(config.serviceRoleKey),
    youtubeCompetitionConfigured: isYouTubeCompetitionConfigured(),
    youtubeKeySource: getYouTubeApiKeySource(),
    hint: config.reason
  });
}
