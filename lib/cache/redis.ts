import { Redis } from "@upstash/redis";
import { env } from "@/lib/env";

let redis: Redis | null = null;

export function getRedis() {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  redis ??= new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN
  });

  return redis;
}

export async function cachedJson<T>(key: string, ttlSeconds: number, factory: () => Promise<T>) {
  const client = getRedis();
  if (!client) {
    return factory();
  }

  const cached = await client.get<T>(key);
  if (cached) {
    return cached;
  }

  const value = await factory();
  await client.set(key, value, { ex: ttlSeconds });
  return value;
}
