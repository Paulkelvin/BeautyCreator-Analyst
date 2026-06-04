import { createClient } from "@supabase/supabase-js";
import { env, requireServerEnv } from "@/lib/env";

export function createSupabaseAdminClient() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required for admin database access.");
  }

  return createClient(url, requireServerEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
