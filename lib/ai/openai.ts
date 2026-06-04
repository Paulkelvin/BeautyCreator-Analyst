import OpenAI from "openai";
import { env } from "@/lib/env";

let openai: OpenAI | null = null;

export function getOpenAIClient() {
  if (!env.OPENAI_API_KEY) {
    return null;
  }

  openai ??= new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return openai;
}

export async function createEmbedding(input: string) {
  const client = getOpenAIClient();
  if (!client) {
    return deterministicEmbedding(input);
  }

  const response = await client.embeddings.create({
    model: env.OPENAI_EMBEDDING_MODEL,
    input
  });

  return response.data[0]?.embedding ?? deterministicEmbedding(input);
}

function deterministicEmbedding(input: string, dimensions = 1536) {
  const vector = new Array<number>(dimensions).fill(0);
  const normalized = input.toLowerCase();

  for (let index = 0; index < normalized.length; index += 1) {
    const bucket = normalized.charCodeAt(index) % dimensions;
    vector[bucket] += 1;
  }

  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0)) || 1;
  return vector.map((value) => value / magnitude);
}
