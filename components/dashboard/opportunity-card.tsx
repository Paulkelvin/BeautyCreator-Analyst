import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScorePill } from "@/components/dashboard/score-pill";
import { type Opportunity } from "@/lib/types";

export function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle>{opportunity.title}</CardTitle>
            <CardDescription>{opportunity.description}</CardDescription>
          </div>
          <Badge
            variant={
              opportunity.trendClassification === "exploding"
                ? "danger"
                : opportunity.trendClassification === "emerging"
                  ? "success"
                  : "muted"
            }
          >
            {opportunity.trendClassification}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          <ScorePill label="Demand" value={opportunity.demandScore} />
          <ScorePill label="Gap" value={opportunity.gapScore} />
          <ScorePill label="Commercial" value={opportunity.commercialScore} />
          <ScorePill label="Confidence" value={opportunity.confidenceScore} />
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {opportunity.audienceSegments.map((segment) => (
            <Badge key={segment} variant="default">
              {segment.replaceAll("_", " ")}
            </Badge>
          ))}
        </div>
        <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
          <p className="font-semibold text-slate-900">Recommended content types</p>
          <p>{opportunity.recommendedContentTypes.join(", ")}</p>
        </div>
      </CardContent>
    </Card>
  );
}
