import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

/**
 * Single-tenant mode: set APP_OWNER_USER_ID in Vercel to your Supabase Auth user UUID.
 * All saves and ingests attach to that user without login UI.
 */
export function getAppOwnerUserId() {
  return env.APP_OWNER_USER_ID ?? null;
}

export async function resolveUserId(request: NextRequest) {
  const ownerId = getAppOwnerUserId();
  if (ownerId) {
    return ownerId;
  }

  return getAuthenticatedUserId(request);
}

export async function getAuthenticatedUserId(request: NextRequest) {
  const devUser = request.headers.get("x-user-id");
  if (devUser && process.env.NODE_ENV !== "production") {
    return devUser;
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token || !env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Authentication required.");
  }

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw new Error("Authentication required.");
  }

  return data.user.id;
}
