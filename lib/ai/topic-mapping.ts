import { createEmbedding } from "@/lib/ai/openai";
import { type CommentUnderstanding } from "@/lib/types";
import { slugify } from "@/lib/utils";

export type TopicCandidate = {
  label: string;
  canonical: string;
  embedding: number[];
};

export async function canonicalizeTopic(understanding: CommentUnderstanding, candidates: TopicCandidate[]) {
  const label = understanding.topic || understanding.canonicalTopic;
  const embedding = await createEmbedding(label);
  const closest = candidates
    .map((candidate) => ({
      candidate,
      similarity: cosineSimilarity(embedding, candidate.embedding)
    }))
    .sort((a, b) => b.similarity - a.similarity)[0];

  if (closest && closest.similarity > 0.84) {
    return {
      canonical: closest.candidate.canonical,
      embedding,
      matchedExistingTopic: true,
      confidence: closest.similarity
    };
  }

  return {
    canonical: slugify(label),
    embedding,
    matchedExistingTopic: false,
    confidence: closest?.similarity ?? 0
  };
}

export function buildTopicRelationships(topics: TopicCandidate[]) {
  const relationships: Array<{
    parent: string;
    child: string;
    relationship: "parent_child" | "related" | "modifier";
    strength: number;
  }> = [];

  for (const topic of topics) {
    const parts = topic.canonical.split("_");
    if (parts.length > 1) {
      relationships.push({
        parent: parts[0],
        child: topic.canonical,
        relationship: "parent_child",
        strength: 0.72
      });
    }
  }

  for (let left = 0; left < topics.length; left += 1) {
    for (let right = left + 1; right < topics.length; right += 1) {
      const similarity = cosineSimilarity(topics[left].embedding, topics[right].embedding);
      if (similarity > 0.78) {
        relationships.push({
          parent: topics[left].canonical,
          child: topics[right].canonical,
          relationship: "related",
          strength: similarity
        });
      }
    }
  }

  return relationships;
}

export function cosineSimilarity(left: number[], right: number[]) {
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
