import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { readRuntimeEnv } from "@/lib/runtime-env";

const cache = new Map<string, string>();

/** Resolve secret from Vercel env first, then app_runtime_secrets (service role). */
export async function resolveServerSecret(name: string): Promise<string | undefined> {
  const fromEnv = readRuntimeEnv(name);
  if (fromEnv) {
    return fromEnv;
  }

  if (cache.has(name)) {
    return cache.get(name);
  }

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("app_runtime_secrets").select("value").eq("key", name).maybeSingle();

  if (data?.value) {
    cache.set(name, String(data.value));
    return String(data.value);
  }

  return undefined;
}

export async function isYouTubeApiKeyConfigured() {
  return Boolean(await resolveServerSecret("YOUTUBE_API_KEY"));
}
