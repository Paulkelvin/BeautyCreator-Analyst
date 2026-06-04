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
