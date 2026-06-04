import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAppOwnerUserId } from "@/lib/auth";
import { persistOpportunityAnalysis } from "@/lib/db/repositories";
import { env } from "@/lib/env";
import { runOpportunityAnalysis } from "@/lib/intelligence/run-analysis";
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
  weights: z.record(z.string(), z.number()).optional(),
  persist: z.boolean().optional()
});

export async function POST(request: NextRequest) {
  try {
    const body = schema.parse(await request.json());
    const analysis = await runOpportunityAnalysis({
      topic: body.topic,
      comments: body.comments,
      modifiers: body.modifiers,
      competition: body.competition,
      trend: body.trend,
      weights: body.weights as Record<string, number> | undefined
    });

    let opportunityId: string | undefined;
    const shouldPersist = body.persist !== false;
    const ownerId = getAppOwnerUserId();

    if (
      shouldPersist &&
      ownerId &&
      env.NEXT_PUBLIC_SUPABASE_URL &&
      env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      const saved = await persistOpportunityAnalysis({ userId: ownerId, analysis });
      opportunityId = saved.opportunityId;
    }

    return NextResponse.json({
      title: analysis.title,
      description: analysis.description,
      signals: analysis.signals,
      competition: analysis.competition,
      trend: analysis.trend,
      scores: analysis.scores,
      audienceSegments: analysis.audienceSegments,
      whiteSpace: analysis.whiteSpace,
      recommendations: analysis.recommendations,
      persisted: Boolean(opportunityId),
      opportunityId
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to analyze opportunity." },
      { status: 400 }
    );
  }
}
