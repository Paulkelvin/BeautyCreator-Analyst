"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type Opportunity } from "@/lib/types";

export function FeedbackForm({ opportunities }: { opportunities: Opportunity[] }) {
  const [opportunityId, setOpportunityId] = useState(opportunities[0]?.id ?? "");
  const [notes, setNotes] = useState("");
  const [traffic, setTraffic] = useState(0);
  const [leads, setLeads] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!opportunities.length || opportunities[0]?.id.startsWith("opp_")) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          opportunityId,
          traffic,
          leads,
          notes: notes || undefined
        })
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save feedback.");
      }

      setMessage("Feedback recorded for this opportunity.");
      setNotes("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to save feedback.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Record performance feedback</CardTitle>
        <CardDescription>
          Track traffic and leads for a saved opportunity so future scoring can learn from outcomes.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2 text-sm">
            <span className="font-semibold">Opportunity</span>
            <select
              className="w-full rounded-xl border px-4 py-3"
              value={opportunityId}
              onChange={(e) => setOpportunityId(e.target.value)}
            >
              {opportunities.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block space-y-2 text-sm">
              <span className="font-semibold">Traffic</span>
              <input
                type="number"
                min={0}
                className="w-full rounded-xl border px-4 py-3"
                value={traffic}
                onChange={(e) => setTraffic(Number(e.target.value))}
              />
            </label>
            <label className="block space-y-2 text-sm">
              <span className="font-semibold">Leads</span>
              <input
                type="number"
                min={0}
                className="w-full rounded-xl border px-4 py-3"
                value={leads}
                onChange={(e) => setLeads(Number(e.target.value))}
              />
            </label>
          </div>
          <label className="block space-y-2 text-sm">
            <span className="font-semibold">Notes</span>
            <textarea
              className="min-h-20 w-full rounded-xl border px-4 py-3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What happened after you published content for this opportunity?"
            />
          </label>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-800">{message}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving…
              </>
            ) : (
              "Save feedback"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
