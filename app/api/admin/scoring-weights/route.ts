import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUserId } from "@/lib/auth";
import { defaultScoringWeights } from "@/lib/intelligence/scoring";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

const schema = z.object(
  Object.fromEntries(Object.keys(defaultScoringWeights).map((key) => [key, z.number().min(0).max(5)]))
);

export async function GET() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(defaultScoringWeights);
  }

  const supabase = createSupabaseAdminClient();
  const { data } = await supabase.from("scoring_weights").select("weights").eq("active", true).maybeSingle();
  return NextResponse.json(data?.weights ?? defaultScoringWeights);
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const weights = schema.parse(await request.json());

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("scoring_weights").insert({
      created_by: userId,
      active: true,
      weights
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ status: "updated", weights });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to update scoring weights." },
      { status: 400 }
    );
  }
}
