import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { persistAnalysisWithComments } from "@/lib/db/repositories";
import { runOpportunityAnalysis } from "@/lib/intelligence/run-analysis";
import { normalizedCommentSchema } from "@/lib/ingestion/normalization";
import { getPersistConfig } from "@/lib/runtime-env";

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

    const shouldPersist = body.persist !== false;
    const persistConfig = getPersistConfig();

    let opportunityId: string | undefined;
    let persistError: string | undefined;

    if (shouldPersist && persistConfig.canPersist && persistConfig.appOwnerUserId) {
      try {
        const saved = await persistAnalysisWithComments({
          userId: persistConfig.appOwnerUserId,
          topic: body.topic,
          comments: body.comments,
          analysis
        });
        opportunityId = saved.opportunityId;
      } catch (saveError) {
        persistError =
          saveError instanceof Error
            ? saveError.message
            : "Save failed. Check that your APP_OWNER_USER_ID matches a user in Supabase → Authentication → Users.";
      }
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
      opportunityId,
      persistError,
      persistHint: opportunityId
        ? null
        : persistError ?? persistConfig.reason ?? "Save was skipped.",
      saveConfig: {
        appOwnerConfigured: Boolean(persistConfig.appOwnerUserId),
        supabaseUrlConfigured: Boolean(persistConfig.supabaseUrl),
        serviceRoleConfigured: Boolean(persistConfig.serviceRoleKey)
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to analyze opportunity." },
      { status: 400 }
    );
  }
}
