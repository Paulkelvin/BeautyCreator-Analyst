import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type GapMetricRow } from "@/lib/db/dashboard-insights";

export function GapIntelligence({ metrics, isDemoData }: { metrics: GapMetricRow[]; isDemoData: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gap and Competitor Intelligence</CardTitle>
        <CardDescription>
          {isDemoData
            ? "Run an analysis to populate scores from your saved opportunity reasoning."
            : "Scores from your top saved opportunity (competition + gap breakdown in Supabase)."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {metrics.length ? (
          <div className="space-y-3">
            {metrics.map((row) => (
              <div key={row.label} className="rounded-2xl border bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">{row.label}</p>
                  <Badge variant="success">{row.value}</Badge>
                </div>
                <p className="mt-2 text-sm text-slate-600">{row.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600">No saved opportunity reasoning yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
