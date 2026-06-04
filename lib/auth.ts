import { NextRequest } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

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
