import { OpportunityCard } from "@/components/dashboard/opportunity-card";
import { FeedbackForm } from "@/components/dashboard/feedback-form";
import { Badge } from "@/components/ui/badge";
import { type Opportunity } from "@/lib/types";

export function SavedOpportunitiesSection({
  opportunities,
  isDemoData
}: {
  opportunities: Opportunity[];
  isDemoData: boolean;
}) {
  return (
    <section id="saved-opportunities" className="scroll-mt-8 space-y-4">
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
              : "From your Supabase database. New analyses appear here after save."}
          </p>
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
      <div className="grid gap-6 lg:grid-cols-2">
        {opportunities.map((opportunity) => (
          <OpportunityCard key={opportunity.id} opportunity={opportunity} />
        ))}
      </div>
      {!isDemoData ? <FeedbackForm opportunities={opportunities} /> : null}
    </section>
  );
}
