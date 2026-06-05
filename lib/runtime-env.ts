/**
 * Read env vars at request time. Required on Vercel: vars added in the dashboard after
 * build are not always visible on the Zod-parsed `env` object from build time.
 */
export function readRuntimeEnv(name: string) {
  const value = process.env[name];
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  return value.trim();
}

import { isYouTubeApiConfigured } from "@/lib/ingestion/youtube-api";

export function getIngestCapabilities() {
  const hasInngest = Boolean(readRuntimeEnv("INNGEST_EVENT_KEY"));
  const youtubeApi = isYouTubeApiConfigured();

  return {
    youtube: youtubeApi ? ("api" as const) : ("cli_or_unavailable" as const),
    tiktok: "node_library" as const,
    inngest: hasInngest,
    youtubeSetupHint: youtubeApi
      ? null
      : "Add YOUTUBE_API_KEY in Vercel (Google Cloud → enable YouTube Data API v3 → Create API key), then redeploy."
  };
}

export function getPersistConfig() {
  const appOwnerUserId = readRuntimeEnv("APP_OWNER_USER_ID");
  const supabaseUrl = readRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = readRuntimeEnv("SUPABASE_SERVICE_ROLE_KEY");

  let reason: string | null = null;
  if (!appOwnerUserId) {
    reason = "APP_OWNER_USER_ID is not set on the server (add in Vercel → Environment Variables → Production, then redeploy).";
  } else if (!supabaseUrl) {
    reason = "NEXT_PUBLIC_SUPABASE_URL is missing on the server.";
  } else if (!serviceRoleKey) {
    reason = "SUPABASE_SERVICE_ROLE_KEY is missing on the server.";
  }

  return {
    appOwnerUserId,
    supabaseUrl,
    serviceRoleKey,
    canPersist: Boolean(appOwnerUserId && supabaseUrl && serviceRoleKey),
    reason
  };
}
