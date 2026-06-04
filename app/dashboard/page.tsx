import Link from "next/link";
import { Suspense } from "react";
import { Globe2, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { AnalyzeComments } from "@/components/dashboard/analyze-comments";
import { InstagramUpload } from "@/components/dashboard/instagram-upload";
import { UrlIngest } from "@/components/dashboard/url-ingest";
import { ChartsNotice } from "@/components/dashboard/charts-notice";
import { DemoBanner } from "@/components/dashboard/demo-banner";
import { HowItWorks } from "@/components/dashboard/how-it-works";
import { PostSaveNotice } from "@/components/dashboard/post-save-notice";
import { SavedOpportunitiesSection } from "@/components/dashboard/saved-opportunities-section";
import { TopicGraph } from "@/components/dashboard/topic-graph";
import { TrendRadar } from "@/components/dashboard/trend-radar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/lib/db/repositories";

/** Always load fresh opportunities from Supabase (never static demo HTML). */
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const data = await getDashboardData();

  const savedSection = (
    <SavedOpportunitiesSection opportunities={data.opportunities} isDemoData={data.isDemoData} />
  );

  const analyzeSection = (
    <>
      {data.isDemoData ? <DemoBanner /> : null}
      <AnalyzeComments />
      {!data.isDemoData ? <ChartsNotice fromLiveData={data.chartsFromLiveData ?? false} /> : null}
    </>
  );

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-6 py-8">
      <header className="flex flex-col justify-between gap-5 rounded-[2rem] border bg-white/85 p-8 shadow-sm md:flex-row md:items-center">
        <div className="space-y-3">
          <Badge variant="default">Market intelligence analyst mode</Badge>
          <div>
            <h1 className="text-4xl font-black tracking-tight">Content Intelligence Engine</h1>
            <p className="mt-2 max-w-3xl text-slate-600">
              Transform audience conversations into opportunities, gaps, trends, audience insights,
              revenue signals, and strategic content recommendations.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="outline" asChild>
            <Link href="/">Home</Link>
          </Button>
          <Button asChild>
            <Link href={data.isDemoData ? "#analyze" : "#saved-opportunities"}>
              {data.isDemoData ? "Analyze my comments" : "View my opportunities"}
            </Link>
          </Button>
        </div>
      </header>

      <Suspense fallback={null}>
        <PostSaveNotice />
      </Suspense>

      <HowItWorks />

      {data.isDemoData ? (
        <>
          {analyzeSection}
          {savedSection}
        </>
      ) : (
        <>
          {savedSection}
          {analyzeSection}
        </>
      )}

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <TrendRadar trends={data.trendRadar} />
        <Card>
          <CardHeader>
            <CardTitle>Audience Intelligence</CardTitle>
            <CardDescription>Pain points, objections, desires, and inferred audience segments.</CardDescription>
          </CardHeader>
          <CardContent>
            {data.segments.map((segment) => (
              <div key={segment.segment} className="rounded-2xl border bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{segment.segment}</p>
                  <Badge variant="muted">{segment.share}%</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600">{segment.pain}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <TopicGraph edges={data.graph} />
        <Card>
          <CardHeader>
            <CardTitle>Gap and Competitor Intelligence</CardTitle>
            <CardDescription>
              Saturation is modeled through quality, depth, freshness, authority, and density.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {[
              ["Content quality deficit", "High", "Existing articles are broad and lack regional testing."],
              ["White space score", "91", "Niche combinations are visible but underserved."],
              ["Difficulty score", "38", "Competition exists, but authoritative content is thin."],
              ["Commercial intent", "84", "Comments include purchase questions, objections, and comparison language."]
            ].map(([label, value, description]) => (
              <div key={label} className="rounded-2xl border bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{label}</p>
                  <Badge variant="success">{value}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600">{description}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section id="ingestion" className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Import more data</h2>
          <p className="mt-1 text-sm text-slate-600">Instagram export upload or video URLs (when CLI tools are available).</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <InstagramUpload />
          <UrlIngest platform="youtube" />
          <UrlIngest platform="tiktok" />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <Globe2 className="h-7 w-7 text-violet-600" />
            <CardTitle>Geographic Insights</CardTitle>
            <CardDescription>
              Detects region-specific demand across Nigeria, Ghana, Kenya, South Africa, and UK-based African audiences.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <SlidersHorizontal className="h-7 w-7 text-violet-600" />
            <CardTitle>Configurable Scoring</CardTitle>
            <CardDescription>
              Admin weights control the master formula for demand, gap, commercial, trend, difficulty, and saturation.
            </CardDescription>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <ShieldCheck className="h-7 w-7 text-violet-600" />
            <CardTitle>Feedback Learning</CardTitle>
            <CardDescription>
              Record outcomes so future opportunity scores can learn from traffic, leads, sales, revenue, and rankings.
            </CardDescription>
          </CardHeader>
        </Card>
      </section>
    </main>
  );
}
