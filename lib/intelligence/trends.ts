import { clampScore } from "@/lib/utils";

export type TrendSnapshotInput = {
  currentMentions: number;
  previousMentions: number;
  mentionsThreeMonthsAgo?: number;
  previousVelocity?: number;
};

export function calculateTrendSnapshot(input: TrendSnapshotInput) {
  const previous = Math.max(input.previousMentions, 1);
  const currentVelocity = ((input.currentMentions - input.previousMentions) / previous) * 100;
  const quarterlyBase = Math.max(input.mentionsThreeMonthsAgo ?? input.previousMentions, 1);
  const quarterlyGrowth = ((input.currentMentions - quarterlyBase) / quarterlyBase) * 100;
  const acceleration = currentVelocity - (input.previousVelocity ?? 0);

  return {
    currentMentions: input.currentMentions,
    previousMentions: input.previousMentions,
    monthlyGrowth: clampScore(currentVelocity),
    quarterlyGrowth: clampScore(quarterlyGrowth),
    acceleration: clampScore(acceleration + 50),
    classification: classifyTrend(currentVelocity, acceleration)
  };
}

export function classifyTrend(velocity: number, acceleration: number) {
  if (velocity > 75 && acceleration > 20) return "exploding" as const;
  if (velocity > 18) return "emerging" as const;
  if (velocity < -15) return "declining" as const;
  return "stable" as const;
}
