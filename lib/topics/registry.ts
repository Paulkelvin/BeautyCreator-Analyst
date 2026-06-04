import { createEmbedding } from "@/lib/ai/openai";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/utils";

const MATCH_THRESHOLD = 0.84;

export type ResolvedTopic = {
  id: string;
  canonicalKey: string;
  label: string;
  matchedExisting: boolean;
  similarity: number;
};

type TopicRow = {
  id: string;
  canonical_key: string;
  label: string;
  embedding: number[] | string | null;
};

/** In-memory fallback when RPC is unavailable (dev without migration). */
async function matchTopicsInMemory(userId: string, embedding: number[]) {
  const supabase = createSupabaseAdminClient();
  const { data } = await supabase
    .from("topics")
    .select("id, canonical_key, label, embedding")
    .eq("user_id", userId)
    .not("embedding", "is", null)
    .limit(200);

  if (!data?.length) {
    return null;
  }

  let best: { row: TopicRow; similarity: number } | null = null;
  for (const row of data as TopicRow[]) {
    const vector = parseEmbedding(row.embedding);
    if (!vector) {
      continue;
    }
    const similarity = cosineSimilarity(embedding, vector);
    if (similarity >= MATCH_THRESHOLD && (!best || similarity > best.similarity)) {
      best = { row, similarity };
    }
  }

  if (!best) {
    return null;
  }

  return {
    id: best.row.id,
    canonicalKey: best.row.canonical_key,
    label: best.row.label,
    matchedExisting: true,
    similarity: best.similarity
  } satisfies ResolvedTopic;
}

function parseEmbedding(value: number[] | string | null): number[] | null {
  if (!value) {
    return null;
  }
  if (Array.isArray(value)) {
    return value;
  }
  try {
    const parsed = JSON.parse(value) as number[];
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function cosineSimilarity(left: number[], right: number[]) {
  const length = Math.min(left.length, right.length);
  let dot = 0;
  let leftMagnitude = 0;
  let rightMagnitude = 0;

  for (let index = 0; index < length; index += 1) {
    dot += left[index] * right[index];
    leftMagnitude += left[index] * left[index];
    rightMagnitude += right[index] * right[index];
  }

  return dot / ((Math.sqrt(leftMagnitude) || 1) * (Math.sqrt(rightMagnitude) || 1));
}

async function matchTopicsByEmbedding(userId: string, embedding: number[]) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.rpc("match_topics", {
    p_user_id: userId,
    p_embedding: embedding,
    p_match_threshold: MATCH_THRESHOLD,
    p_match_count: 1
  });

  if (error) {
    return matchTopicsInMemory(userId, embedding);
  }

  const row = data?.[0] as { id: string; canonical_key: string; label: string; similarity: number } | undefined;
  if (!row) {
    return matchTopicsInMemory(userId, embedding);
  }

  return {
    id: row.id,
    canonicalKey: row.canonical_key,
    label: row.label,
    matchedExisting: true,
    similarity: Number(row.similarity)
  } satisfies ResolvedTopic;
}

export async function resolveOrCreateTopic(userId: string, label: string): Promise<ResolvedTopic> {
  const trimmed = label.trim();
  if (!trimmed) {
    throw new Error("Topic label is required for canonicalization.");
  }

  const embedding = await createEmbedding(trimmed);
  const matched = await matchTopicsByEmbedding(userId, embedding);
  if (matched) {
    return matched;
  }

  const canonicalKey = slugify(trimmed);
  const supabase = createSupabaseAdminClient();
  const { data: existingByKey } = await supabase
    .from("topics")
    .select("id, canonical_key, label")
    .eq("user_id", userId)
    .eq("canonical_key", canonicalKey)
    .maybeSingle();

  if (existingByKey) {
    await supabase.from("topics").update({ embedding }).eq("id", existingByKey.id);
    return {
      id: existingByKey.id,
      canonicalKey: existingByKey.canonical_key,
      label: existingByKey.label,
      matchedExisting: true,
      similarity: 1
    };
  }

  const { data: created, error } = await supabase
    .from("topics")
    .insert({
      user_id: userId,
      canonical_key: canonicalKey,
      label: trimmed,
      embedding,
      metadata: { source: "resolveOrCreateTopic" }
    })
    .select("id, canonical_key, label")
    .single();

  if (error) {
    throw error;
  }

  return {
    id: created.id,
    canonicalKey: created.canonical_key,
    label: created.label,
    matchedExisting: false,
    similarity: 0
  };
}

/** Resolve many comment-level topics in one batch (cached by label). */
export async function resolveTopicsForLabels(userId: string, labels: string[]) {
  const cache = new Map<string, ResolvedTopic>();
  for (const label of labels) {
    const key = label.trim().toLowerCase();
    if (!key || cache.has(key)) {
      continue;
    }
    cache.set(key, await resolveOrCreateTopic(userId, label));
  }
  return cache;
}
