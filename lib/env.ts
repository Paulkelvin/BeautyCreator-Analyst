import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_EMBEDDING_MODEL: z.string().default("text-embedding-3-small"),
  OPENAI_ANALYSIS_MODEL: z.string().default("gpt-4.1-mini"),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),
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
