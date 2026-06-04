import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { understandComment } from "@/lib/ai/comment-understanding";
import { calculateCompetitionMetrics, calculateSignals } from "@/lib/intelligence/signals";
import { calculateOpportunityScore, defaultScoringWeights } from "@/lib/intelligence/scoring";
import { calculateTrendSnapshot } from "@/lib/intelligence/trends";
import { discoverWhiteSpace, generateContentRecommendations } from "@/lib/intelligence/recommendations";
import { normalizedCommentSchema } from "@/lib/ingestion/normalization";

export const runtime = "nodejs";

const schema = z.object({
  topic: z.string().min(2),
  comments: z.array(normalizedCommentSchema).min(1).max(200),
  modifiers: z.array(z.string()).optional(),
  competition: z.record(z.string(), z.number()).optional(),
  trend: z
    .object({
      currentMentions: z.number(),
      previousMentions: z.number(),
      mentionsThreeMonthsAgo: z.number().optional(),
      previousVelocity: z.number().optional()
    })
    .optional(),
  weights: z.record(z.string(), z.number()).optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const understandings = await Promise.all(body.comments.map((comment) => understandComment(comment)));
    const competition = calculateCompetitionMetrics(body.competition ?? {});
    const signals = calculateSignals({ comments: body.comments, understandings, competition });
    const trend = calculateTrendSnapshot(
      body.trend ?? {
        currentMentions: body.comments.length,
        previousMentions: Math.max(1, Math.floor(body.comments.length * 0.72))
      }
    );

    signals.trendMomentum = trend.monthlyGrowth;
    signals.trendVelocity = trend.monthlyGrowth;
    signals.trendAcceleration = trend.acceleration;

    const score = calculateOpportunityScore({
      signals,
      competition,
      weights: { ...defaultScoringWeights, ...body.weights }
    });
    const segments = Array.from(new Set(understandings.map((item) => item.audienceType)));

    return NextResponse.json({
      title: body.topic,
      description: `Opportunity analysis for ${body.topic} based on ${body.comments.length} normalized audience comments.`,
      signals,
      competition,
      trend,
      scores: score,
      audienceSegments: segments,
      whiteSpace: discoverWhiteSpace(body.topic, body.modifiers ?? []),
      recommendations: generateContentRecommendations(body.topic, segments)
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to analyze opportunity." },
      { status: 400 }
    );
  }
}
