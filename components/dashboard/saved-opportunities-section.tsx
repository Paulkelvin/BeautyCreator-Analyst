import Link from "next/link";
import { OpportunityCard } from "@/components/dashboard/opportunity-card";
import { FeedbackForm } from "@/components/dashboard/feedback-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { type Opportunity } from "@/lib/types";

export function SavedOpportunitiesSection({
  opportunities,
  isDemoData,
  highlightId,
  dataLoadError
}: {
  opportunities: Opportunity[];
  isDemoData: boolean;
  highlightId?: string | null;
  dataLoadError?: string | null;
}) {
  return (
    <section id="saved-opportunities" className="scroll-mt-24 space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              {isDemoData ? "Example opportunities (demo)" : "Your saved opportunities"}
            </h2>
            {!isDemoData ? <Badge variant="success">Live data</Badge> : null}
          </div>
          <p className="mt-1 text-sm text-slate-600">
            {isDemoData
              ? "Sample beauty-creator research — run an analysis below to replace with your data."
              : "This is your dashboard: saved analyses from Supabase. The green “Your analysis” card after a run is temporary — your permanent list is here."}
          </p>
          {dataLoadError ? (
            <p className="mt-2 text-sm text-red-800" role="alert">
              Could not load saves: {dataLoadError}
            </p>
          ) : null}
        </div>
        {!isDemoData ? (
          <a
            href="#analyze"
            className="text-sm font-semibold text-violet-700 underline-offset-2 hover:underline"
          >
            Run another analysis ↓
          </a>
        ) : null}
      </div>
      {!isDemoData && opportunities.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-violet-200 bg-violet-50/50 p-8 text-center">
          <p className="font-semibold text-slate-900">No saved opportunities yet</p>
          <p className="mt-2 text-sm text-slate-600">
            Run an analysis below. When save succeeds, your opportunity card will appear in this section
            (not in the temporary green result box).
          </p>
          <Button className="mt-4" asChild>
            <Link href="#analyze">Analyze comments</Link>
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {opportunities.map((opportunity) => (
            <OpportunityCard
              key={opportunity.id}
              opportunity={opportunity}
              highlighted={highlightId === opportunity.id}
            />
          ))}
        </div>
      )}
      {!isDemoData ? <FeedbackForm opportunities={opportunities} /> : null}
    </section>
  );
}
