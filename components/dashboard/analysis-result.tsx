import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScorePill } from "@/components/dashboard/score-pill";

type AnalysisResponse = {
  title: string;
  description: string;
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

const recommendationLabels: Record<string, string> = {
  blogTopics: "Blog topics",
  videoIdeas: "Video ideas",
  shortFormContent: "Short-form content",
  faqs: "FAQs",
  leadMagnets: "Lead magnets",
  landingPageIdeas: "Landing pages"
};

export function AnalysisResult({ result }: { result: AnalysisResponse }) {
  return (
    <Card className="border-emerald-200 bg-emerald-50/40">
      <CardHeader>
        <Badge variant="success">Your analysis</Badge>
        <CardTitle className="mt-2">{result.title}</CardTitle>
        <CardDescription>{result.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded-2xl bg-white p-4">
          <p className="text-sm font-semibold text-slate-500">Overall opportunity score</p>
          <p className="text-5xl font-black text-violet-700">{Math.round(result.scores.opportunityScore)}</p>
          <p className="mt-1 text-sm text-slate-600">
            Trend: {result.trend.classification} ({result.trend.monthlyGrowth > 0 ? "+" : ""}
            {Math.round(result.trend.monthlyGrowth)}% momentum)
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <ScorePill label="Demand" value={result.scores.demandScore} />
          <ScorePill label="Gap" value={result.scores.gapScore} />
          <ScorePill label="Commercial" value={result.scores.commercialScore} />
          <ScorePill label="Confidence" value={result.scores.confidenceScore} />
          <ScorePill label="Difficulty" value={result.scores.difficultyScore} />
          <ScorePill label="Competition" value={result.scores.competitionScore} />
          <ScorePill label="Actionability" value={result.scores.actionabilityScore} />
          <ScorePill label="Strategic fit" value={result.scores.strategicFitScore} />
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-slate-900">Audience segments detected</p>
          <div className="flex flex-wrap gap-2">
            {result.audienceSegments.map((segment) => (
              <Badge key={segment} variant="default">
                {segment.replaceAll("_", " ")}
              </Badge>
            ))}
          </div>
        </div>

        {result.whiteSpace.length > 0 ? (
          <div>
            <p className="mb-2 text-sm font-semibold text-slate-900">White-space angles</p>
            <ul className="list-inside list-disc space-y-1 text-sm text-slate-700">
              {result.whiteSpace.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="grid gap-4 md:grid-cols-2">
          {Object.entries(recommendationLabels).map(([key, label]) => {
            const items = result.recommendations[key];
            if (!items?.length) return null;
            return (
              <div key={key} className="rounded-2xl border bg-white p-4">
                <p className="font-semibold text-slate-900">{label}</p>
                <ul className="mt-2 space-y-1 text-sm text-slate-600">
                  {items.slice(0, 4).map((item) => (
                    <li key={item}>• {item}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
