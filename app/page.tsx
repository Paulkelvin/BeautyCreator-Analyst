import Link from "next/link";
import { ArrowRight, BarChart3, BrainCircuit, Network, Radar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const pillars = [
  {
    title: "Opportunity Discovery",
    description: "Ranks content opportunities by demand, gaps, commercial intent, trend momentum, and competition.",
    icon: Radar
  },
  {
    title: "Audience Intelligence",
    description: "Extracts pain points, objections, desires, buying stages, regions, and audience segments from comments.",
    icon: BrainCircuit
  },
  {
    title: "Topic Knowledge Graph",
    description: "Maps messy audience language into canonical topics and relationships for strategic planning.",
    icon: Network
  },
  {
    title: "Feedback Learning",
    description: "Connects recommendations to traffic, leads, revenue, rankings, and engagement outcomes.",
    icon: BarChart3
  }
];

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-10">
      <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-8">
          <div className="inline-flex rounded-full bg-violet-100 px-4 py-2 text-sm font-semibold text-violet-700">
            Market intelligence from real audience conversations
          </div>
          <div className="space-y-5">
            <h1 className="text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              Find the content gaps competitors are missing.
            </h1>
            <p className="max-w-2xl text-lg leading-8 text-slate-600">
              Analyze YouTube, TikTok, and Instagram conversations to uncover profitable topics,
              emerging trends, underserved segments, objections, and strategic content recommendations.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button size="lg" asChild>
              <Link href="/dashboard#analyze">
                Analyze my comments <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/dashboard#saved-opportunities">My saved opportunities</Link>
            </Button>
          </div>
        </div>

        <div className="rounded-[2rem] border bg-white/80 p-6 shadow-2xl">
          <div className="rounded-[1.5rem] bg-slate-950 p-6 text-white">
            <p className="text-sm text-violet-300">Top opportunity</p>
            <h2 className="mt-3 text-3xl font-bold">
              Foundation for dark skin that does not oxidize in humid weather
            </h2>
            <div className="mt-8 grid grid-cols-2 gap-3 text-sm">
              {[
                ["Demand", "88"],
                ["Gap", "91"],
                ["Commercial", "84"],
                ["Difficulty", "38"]
              ].map(([label, score]) => (
                <div key={label} className="rounded-2xl bg-white/10 p-4">
                  <p className="text-slate-300">{label}</p>
                  <p className="text-3xl font-black">{score}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 pb-16 md:grid-cols-2 lg:grid-cols-4">
        {pillars.map((pillar) => (
          <Card key={pillar.title}>
            <CardHeader>
              <pillar.icon className="h-7 w-7 text-violet-600" />
              <CardTitle>{pillar.title}</CardTitle>
              <CardDescription>{pillar.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </main>
  );
}
