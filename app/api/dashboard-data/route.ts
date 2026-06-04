import { NextResponse } from "next/server";
import { getDashboardData } from "@/lib/db/repositories";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const data = await getDashboardData();

  return NextResponse.json({
    isDemoData: data.isDemoData,
    count: data.opportunities.length,
    opportunities: data.opportunities.map((item) => ({
      id: item.id,
      title: item.title,
      opportunityScore: item.demandScore
    }))
  });
}
