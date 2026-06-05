import { z } from "zod";

/** Vercel/Cursor often inject empty strings for unset vars; treat as missing. */
function emptyToUndefined(value: unknown) {
  if (value === "" || value === undefined || value === null) {
    return undefined;
  }

  return value;
}

const optionalUrl = z.preprocess(emptyToUndefined, z.string().url().optional());
const optionalString = z.preprocess(emptyToUndefined, z.string().optional());

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.preprocess(
    emptyToUndefined,
    z.string().url().default("http://localhost:3000")
  ),
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString,
  SUPABASE_SERVICE_ROLE_KEY: optionalString,
  OPENAI_API_KEY: optionalString,
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  OPENAI_ANALYSIS_MODEL: z.string().default("gpt-4.1-mini"),
  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: optionalString,
  INNGEST_EVENT_KEY: optionalString,
  INNGEST_SIGNING_KEY: optionalString,
  /** Supabase Auth user UUID for single-tenant saves (see docs/REAL_DATA.md) */
  APP_OWNER_USER_ID: optionalString,
  YOUTUBE_API_KEY: optionalString,
  YOUTUBE_COMMENT_DOWNLOADER_COMMAND: z.string().default("youtube-comment-downloader"),
  TIKTOK_EXTRACTOR_COMMAND: z.string().default("tiktok-scraper")
});

export const env = envSchema.parse(process.env);

export function requireServerEnv(name: keyof typeof env) {
  const value = env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
