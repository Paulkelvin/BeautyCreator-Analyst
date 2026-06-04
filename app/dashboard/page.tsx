import Link from "next/link";
import { Database, FileUp, Globe2, LineChart, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { OpportunityCard } from "@/components/dashboard/opportunity-card";
import { TopicGraph } from "@/components/dashboard/topic-graph";
import { TrendRadar } from "@/components/dashboard/trend-radar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardData } from "@/lib/db/repositories";

const modules = [
  "Opportunity Discovery",
  "Gap Analysis",
  "Trend Radar",
  "Audience Intelligence",
  "Competitor Intelligence",
  "Topic Graph Explorer",
  "Content Cluster Builder",
  "Geographic Insights",
  "Strategic Fit Dashboard",
  "Performance Feedback"
];

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
            <Link href="#ingestion">Connect sources</Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {modules.map((module) => (
          <div key={module} className="rounded-2xl border bg-white/80 p-4 text-sm font-semibold text-slate-700">
            {module}
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {data.opportunities.map((opportunity) => (
          <OpportunityCard key={opportunity.id} opportunity={opportunity} />
        ))}
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

      <section id="ingestion" className="grid gap-6 lg:grid-cols-3">
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
