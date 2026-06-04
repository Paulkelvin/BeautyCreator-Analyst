"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { AnalysisResult } from "@/components/dashboard/analysis-result";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { platforms, type Platform } from "@/lib/types";

type AnalysisResponse = {
  title: string;
  description: string;
  persisted?: boolean;
  opportunityId?: string;
  scores: {
    demandScore: number;
    gapScore: number;
    commercialScore: number;
    momentumScore: number;
    strategicFitScore: number;
    actionabilityScore: number;
    difficultyScore: number;
    competitionScore: number;
    confidenceScore: number;
    opportunityScore: number;
  };
  audienceSegments: string[];
  trend: { classification: string; monthlyGrowth: number };
  recommendations: Record<string, string[]>;
  whiteSpace: string[];
};

const defaultComments = `Does this foundation oxidize in Lagos humidity?
Which shade works for dark skin without turning orange?
I need a bridal kit that survives heat and flash photography.
What's the best drugstore option under 15k naira?`;

export function AnalyzeComments() {
  const [topic, setTopic] = useState("Foundation for dark skin in humid weather");
  const [contentUrl, setContentUrl] = useState("");
  const [platform, setPlatform] = useState<Platform>("youtube");
  const [commentsText, setCommentsText] = useState(defaultComments);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function handleAnalyze(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);
    setResult(null);

    const lines = commentsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

    if (lines.length === 0) {
      setError("Add at least one comment (one per line).");
      setLoading(false);
      return;
    }

    if (topic.trim().length < 2) {
      setError("Enter a topic to analyze (at least 2 characters).");
      setLoading(false);
      return;
    }

    const url =
      contentUrl.trim() ||
      (platform === "youtube"
        ? "https://www.youtube.com/watch?v=placeholder"
        : platform === "tiktok"
          ? "https://www.tiktok.com/@placeholder/video/0"
          : "https://www.instagram.com/p/placeholder");

    const comments = lines.map((commentText) => ({
      platform,
      creator: "Audience",
      contentTitle: topic.trim(),
      contentUrl: url,
      contentViews: 0,
      contentLikes: 0,
      commentText,
      commentLikes: 0
    }));

    try {
      const response = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: topic.trim(), comments, persist: true })
      });

      const payload = (await response.json()) as AnalysisResponse & {
        error?: string;
        persisted?: boolean;
        opportunityId?: string;
      };
      if (!response.ok) {
        throw new Error(payload.error ?? "Analysis failed.");
      }

      setResult(payload);
      if (payload.persisted) {
        setMessage(
          "Saved to your dashboard. Refreshing in a moment to show your real opportunities…"
        );
        setTimeout(() => window.location.reload(), 2000);
      } else {
        setMessage(
          "Analysis complete. To save to the dashboard, set APP_OWNER_USER_ID in Vercel (see docs/REAL_DATA.md)."
        );
      }
      document.getElementById("analysis-result")?.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Analysis failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="analyze" className="scroll-mt-8 space-y-6">
      <Card className="border-violet-200 bg-gradient-to-br from-violet-50/80 to-white">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-violet-600" />
            <CardTitle>Analyze your comments</CardTitle>
          </div>
          <CardDescription>
            Paste audience comments from any video or post (one comment per line). The engine scores demand,
            gaps, commercial intent, and suggests content ideas. No URL scraping yet — you provide the text.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={handleAnalyze}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block space-y-2 text-sm">
                <span className="font-semibold text-slate-800">Topic to analyze</span>
                <input
                  className="w-full rounded-xl border bg-white px-4 py-3 outline-none ring-violet-500 focus:ring-2"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g. Foundation for oily skin in humidity"
                />
              </label>
              <label className="block space-y-2 text-sm">
                <span className="font-semibold text-slate-800">Platform</span>
                <select
                  className="w-full rounded-xl border bg-white px-4 py-3 outline-none ring-violet-500 focus:ring-2"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value as Platform)}
                >
                  {platforms.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block space-y-2 text-sm">
              <span className="font-semibold text-slate-800">Content URL (optional)</span>
              <input
                className="w-full rounded-xl border bg-white px-4 py-3 outline-none ring-violet-500 focus:ring-2"
                value={contentUrl}
                onChange={(e) => setContentUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... (helps you track the source)"
              />
            </label>

            <label className="block space-y-2 text-sm">
              <span className="font-semibold text-slate-800">Audience comments (one per line)</span>
              <textarea
                className="min-h-40 w-full rounded-xl border bg-white px-4 py-3 font-mono text-sm outline-none ring-violet-500 focus:ring-2"
                value={commentsText}
                onChange={(e) => setCommentsText(e.target.value)}
                placeholder="Paste comments here..."
              />
              <span className="text-slate-500">
                Tip: copy comments from YouTube, TikTok, or Instagram manually. Automatic URL extraction is
                coming (needs Inngest setup).
              </span>
            </label>

            {error ? (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">
                {error}
              </p>
            ) : null}
            {message ? (
              <p className="rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">{message}</p>
            ) : null}

            <Button type="submit" size="lg" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing…
                </>
              ) : (
                "Run opportunity analysis"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result ? (
        <div id="analysis-result">
          <AnalysisResult result={result} />
        </div>
      ) : null}
    </section>
  );
}
