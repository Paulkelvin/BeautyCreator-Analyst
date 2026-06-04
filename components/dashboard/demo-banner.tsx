import { Info } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DemoBanner() {
  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex gap-3">
          <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
          <div className="space-y-2 text-sm leading-relaxed">
            <p className="font-semibold text-amber-950">You are viewing sample beauty-market data</p>
            <p>
              The opportunity cards, trend radar, audience segments, and topic graph below are built-in demo
              examples for the beauty creator niche. No YouTube, TikTok, or Instagram URL has been analyzed yet.
            </p>
            <p>
              To analyze <strong>your</strong> audience comments, scroll to{" "}
              <strong>Analyze your comments</strong> and paste real comments (or upload a file in a future step).
            </p>
          </div>
        </div>
        <Button asChild size="sm" className="shrink-0 bg-amber-900 text-white hover:bg-amber-800">
          <a href="#analyze">Analyze my comments</a>
        </Button>
      </div>
    </div>
  );
}
