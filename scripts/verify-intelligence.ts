/**
 * Local verification (no Supabase required).
 * Run: npx tsx scripts/verify-intelligence.ts
 */
import { createEmbedding } from "../lib/ai/openai";
import { cosineSimilarity } from "../lib/ai/topic-mapping";
import { calculateTrendSnapshot, classifyTrend } from "../lib/intelligence/trends";
import { calculateCompetitionMetrics } from "../lib/intelligence/signals";
import { discoverWhiteSpace } from "../lib/intelligence/recommendations";

async function main() {
  const a = await createEmbedding("foundation for oily skin in humid weather");
  const b = await createEmbedding("foundation for greasy face humid climate");
  const c = await createEmbedding("bridal makeup kit nigeria");

  const simAB = cosineSimilarity(a, b);
  const simAC = cosineSimilarity(a, c);

  console.log("\n=== Topic canonicalization (embedding similarity) ===");
  console.log("oily foundation vs greasy foundation:", simAB.toFixed(3), simAB >= 0.84 ? "→ MERGE" : "→ new topic");
  console.log("oily foundation vs bridal kit:", simAC.toFixed(3), simAC >= 0.84 ? "→ MERGE" : "→ new topic");

  console.log("\n=== Historical trend (real mention counts example) ===");
  const trend = calculateTrendSnapshot({
    currentMentions: 42,
    previousMentions: 18,
    mentionsThreeMonthsAgo: 10,
    previousVelocity: 22
  });
  console.log(trend);
  console.log("classification:", classifyTrend(trend.monthlyGrowth, trend.acceleration - 50));

  console.log("\n=== Gap metrics (from competition model, not hardcoded UI) ===");
  const competition = calculateCompetitionMetrics({ contentQuality: 45, contentDensity: 40 });
  console.log({
    gapScore: competition.gapScore,
    whiteSpaceScore: competition.whiteSpaceScore,
    difficultyScore: competition.difficultyScore
  });

  console.log("\n=== White space (modifier chain) ===");
  console.log(
    discoverWhiteSpace("Best foundation for dark skin", [
      "in humid weather",
      "that does not oxidize"
    ])
  );

  console.log("\nDone. Apply supabase/migrations/003_topic_intelligence.sql before using match_topics RPC in production.\n");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
