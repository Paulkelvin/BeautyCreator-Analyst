import { createClient } from "@supabase/supabase-js";
import { readRuntimeEnv } from "@/lib/runtime-env";

export function createSupabaseAdminClient() {
  const url = readRuntimeEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = readRuntimeEnv("SUPABASE_SERVICE_ROLE_KEY");

  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL is required for admin database access.");
  }

  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin database access.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}
