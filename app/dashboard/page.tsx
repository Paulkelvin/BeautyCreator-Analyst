import Link from "next/link";
import { Database, FileUp, LineChart, Globe2, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { AnalyzeComments } from "@/components/dashboard/analyze-comments";
import { DemoBanner } from "@/components/dashboard/demo-banner";
import { HowItWorks } from "@/components/dashboard/how-it-works";
import { OpportunityCard } from "@/components/dashboard/opportunity-card";
import { TopicGraph } from "@/components/dashboard/topic-graph";
import { TrendRadar } from "@/components/dashboard/trend-radar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/lib/db/repositories";

export default async function DashboardPage() {
  const data = await getDashboardData();

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
            <Link href="#analyze">Analyze my comments</Link>
          </Button>
        </div>
      </header>

      <HowItWorks />

      {data.isDemoData ? <DemoBanner /> : null}

      <AnalyzeComments />

      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {data.isDemoData ? "Example opportunities (demo)" : "Saved opportunities"}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {data.isDemoData
              ? "Illustrative beauty-creator research until you save analyses to your database."
              : "Loaded from your Supabase project."}
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {data.opportunities.map((opportunity) => (
            <OpportunityCard key={opportunity.id} opportunity={opportunity} />
          ))}
        </div>
      </section>

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
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">Automatic ingestion (advanced)</h2>
          <p className="mt-1 text-sm text-slate-600">
            These APIs pull comments from URLs but require Inngest and authentication — not wired to buttons
            yet. Use &quot;Analyze your comments&quot; above for now.
          </p>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {[
            {
              title: "YouTube extraction",
              description: "Queue automatic collection of titles, URLs, channel metadata, counts, comments, likes, dates, and replies.",
              icon: Database,
              endpoint: "POST /api/ingest/youtube"
            },
            {
              title: "TikTok extraction",
              description: "Queue open-source extraction for video metadata and audience comments with engagement metrics.",
              icon: LineChart,
              endpoint: "POST /api/ingest/tiktok"
            },
            {
              title: "Instagram upload",
              description: "Upload CSV, XLSX, or JSON exports and normalize them to the unified conversation schema.",
              icon: FileUp,
              endpoint: "POST /api/ingest/instagram-upload"
            }
          ].map((source) => (
            <Card key={source.title}>
              <CardHeader>
                <source.icon className="h-7 w-7 text-violet-600" />
                <CardTitle>{source.title}</CardTitle>
                <CardDescription>{source.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <code className="rounded-lg bg-slate-950 px-3 py-2 text-xs text-white">{source.endpoint}</code>
              </CardContent>
            </Card>
          ))}
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
