import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runOpportunityAnalysis } from "@/lib/intelligence/run-analysis";
import { normalizedCommentSchema } from "@/lib/ingestion/normalization";
import { getPersistConfig } from "@/lib/runtime-env";
import { analyzeAndPersist } from "@/lib/topics/persist-analysis";
import { resolveOrCreateTopic } from "@/lib/topics/registry";
import { getTrendInputForTopic } from "@/lib/topics/trend-snapshots";

export const runtime = "nodejs";

const schema = z.object({
  topic: z.string().min(2),
  comments: z.array(normalizedCommentSchema).min(1).max(200),
  modifiers: z.array(z.string()).optional(),
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
    const shouldPersist = body.persist !== false;
    const persistConfig = getPersistConfig();

    if (shouldPersist && persistConfig.canPersist && persistConfig.appOwnerUserId) {
      try {
        const saved = await analyzeAndPersist({
          userId: persistConfig.appOwnerUserId,
          topic: body.topic,
          comments: body.comments,
          modifiers: body.modifiers,
          weights: body.weights as Record<string, number> | undefined
        });

        return NextResponse.json({
          title: saved.analysis.title,
          description: saved.analysis.description,
          signals: saved.analysis.signals,
          competition: saved.analysis.competition,
          trend: saved.analysis.trend,
          scores: saved.analysis.scores,
          audienceSegments: saved.analysis.audienceSegments,
          whiteSpace: saved.analysis.whiteSpace,
          recommendations: saved.analysis.recommendations,
          persisted: true,
          opportunityId: saved.opportunityId,
          topicId: saved.canonicalTopic.id,
          canonicalTopic: saved.canonicalTopic,
          deduplicated: saved.deduplicated,
          competitionPending: saved.analysis.competitionPending ?? false,
          competitionFetch: saved.competitionFetch,
          persistError: null,
          persistHint: saved.deduplicated
            ? "Updated existing opportunity for this canonical topic (no duplicate row)."
            : null,
          saveConfig: {
            appOwnerConfigured: true,
            supabaseUrlConfigured: Boolean(persistConfig.supabaseUrl),
            serviceRoleConfigured: Boolean(persistConfig.serviceRoleKey)
          }
        });
      } catch (saveError) {
        const persistError =
          saveError instanceof Error
            ? saveError.message
            : "Save failed. Check that your APP_OWNER_USER_ID matches a user in Supabase → Authentication → Users.";

        return NextResponse.json(
          {
            error: persistError,
            persisted: false,
            saveConfig: {
              appOwnerConfigured: Boolean(persistConfig.appOwnerUserId),
              supabaseUrlConfigured: Boolean(persistConfig.supabaseUrl),
              serviceRoleConfigured: Boolean(persistConfig.serviceRoleKey)
            }
          },
          { status: 400 }
        );
      }
    }

    let trendInput = body.trend;
    if (persistConfig.appOwnerUserId && !trendInput) {
      const canonicalTopic = await resolveOrCreateTopic(persistConfig.appOwnerUserId, body.topic);
      trendInput = (await getTrendInputForTopic(canonicalTopic.id)) ?? undefined;
    }

    const analysis = await runOpportunityAnalysis({
      topic: body.topic,
      comments: body.comments,
      modifiers: body.modifiers,
      competitionPending: true,
      trend: trendInput,
      weights: body.weights as Record<string, number> | undefined
    });

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
      persisted: false,
      persistHint: persistConfig.reason ?? "Save was skipped.",
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
