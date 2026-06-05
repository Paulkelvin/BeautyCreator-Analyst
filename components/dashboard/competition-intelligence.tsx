import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type CompetitionDashboardData } from "@/lib/db/dashboard-insights";

function scoreBadge(value: number | null) {
  if (value === null) {
    return <Badge variant="muted">—</Badge>;
  }

  return <Badge variant="success">{Math.round(value)}</Badge>;
}

export function CompetitionIntelligence({ data }: { data: CompetitionDashboardData }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Competition Intelligence</CardTitle>
        <CardDescription>
          YouTube supply, authority, engagement, and freshness for your top canonical topic.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!data.available ? (
          <p className="text-sm text-slate-600">Competition data not yet available</p>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Competition score", value: data.competitionScore },
                { label: "Supply score", value: data.supplyScore },
                { label: "Authority score", value: data.authorityScore },
                { label: "Freshness score", value: data.freshnessScore },
                { label: "Confidence score", value: data.confidenceScore },
                { label: "Engagement score", value: data.engagementScore }
              ].map((row) => (
                <div key={row.label} className="rounded-2xl border bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{row.label}</p>
                    {scoreBadge(row.value)}
                  </div>
                </div>
              ))}
            </div>

            {data.demandScore !== null && data.gapScore !== null ? (
              <div className="rounded-2xl border border-violet-100 bg-violet-50 p-4 text-sm text-slate-700">
                <p>
                  <span className="font-semibold">Demand score:</span> {Math.round(data.demandScore)} ·{" "}
                  <span className="font-semibold">Gap score:</span> {Math.round(data.gapScore)} (demand − competition)
                </p>
                {data.canonicalTopic ? (
                  <p className="mt-1 text-slate-600">Topic: {data.canonicalTopic}</p>
                ) : null}
              </div>
            ) : null}

            {data.videos.length ? (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-900">Top competitor videos</p>
                {data.videos.map((video) => (
                  <div key={video.youtubeVideoId} className="rounded-xl border bg-white p-3 text-sm">
                    <p className="font-medium text-slate-900">{video.title}</p>
                    <p className="text-slate-600">
                      {video.channelName}
                      {video.channelSubscribers ? ` · ${video.channelSubscribers.toLocaleString()} subs` : ""}
                    </p>
                    <p className="text-slate-500">
                      {video.views.toLocaleString()} views · {video.likes.toLocaleString()} likes ·{" "}
                      {video.comments.toLocaleString()} comments
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
