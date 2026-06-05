import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe2 } from "lucide-react";
import { type GeoRegionRow } from "@/lib/db/dashboard-insights";

export function GeographicInsights({ regions, isDemoData }: { regions: GeoRegionRow[]; isDemoData: boolean }) {
  return (
    <Card>
      <CardHeader>
        <Globe2 className="h-7 w-7 text-violet-600" />
        <CardTitle>Geographic Insights</CardTitle>
        <CardDescription>
          Regions mentioned in audience comments (keyword detection on saved intelligence).
        </CardDescription>
      </CardHeader>
      <CardContent>
        {regions.length ? (
          <div className="space-y-3">
            {regions.map((row) => (
              <div key={row.region} className="flex items-center justify-between rounded-xl border bg-slate-50 px-4 py-3">
                <span className="font-medium text-slate-900">{row.region}</span>
                <Badge variant="muted">{row.share}%</Badge>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-600">
            {isDemoData
              ? "No regional keywords detected yet."
              : "Mention Nigeria, Ghana, Kenya, South Africa, UK, or city names in comments to see distribution."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
