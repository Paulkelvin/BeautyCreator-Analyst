import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedUserId } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  opportunityId: z.string().uuid(),
  traffic: z.number().nonnegative().default(0),
  leads: z.number().nonnegative().default(0),
  sales: z.number().nonnegative().default(0),
  engagement: z.number().nonnegative().default(0),
  rankings: z.number().nonnegative().default(0),
  revenue: z.number().nonnegative().default(0),
  notes: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId(request);
    const body = schema.parse(await request.json());
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.from("feedback_results").insert({
      user_id: userId,
      opportunity_id: body.opportunityId,
      traffic: body.traffic,
      leads: body.leads,
      sales: body.sales,
      engagement: body.engagement,
      rankings: body.rankings,
      revenue: body.revenue,
      notes: body.notes ?? null
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({ status: "recorded" }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to record feedback." },
      { status: 400 }
    );
  }
}
