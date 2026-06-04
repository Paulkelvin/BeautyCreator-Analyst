"use client";

import { useState } from "react";
import { Database, LineChart, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Platform = "youtube" | "tiktok";

export function UrlIngest({ platform }: { platform: Platform }) {
  const [url, setUrl] = useState("");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const label = platform === "youtube" ? "YouTube" : "TikTok";
  const Icon = platform === "youtube" ? Database : LineChart;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      const response = await fetch(`/api/ingest/${platform}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: url.trim(),
          topic: topic.trim() || undefined,
          name: topic.trim() || url.trim()
        })
      });

      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        status?: string;
        comments?: number;
        opportunityId?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? `${label} ingest failed.`);
      }

      if (payload.status === "completed") {
        setMessage(
          payload.message ??
            `Imported ${payload.comments ?? 0} comments. Refreshing dashboard…`
        );
        setTimeout(() => window.location.reload(), 2000);
        return;
      }

      setMessage(
        payload.message ??
          `${label} job queued. If nothing appears, Inngest and scrape tools may not be configured on Vercel — use paste or Instagram upload instead.`
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : `${label} ingest failed.`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <Icon className="h-7 w-7 text-violet-600" />
        <CardTitle>{label} URL</CardTitle>
        <CardDescription>
          Paste a video URL. Works on Vercel only if the comment downloader CLI is available; otherwise
          use paste-comments or Instagram upload.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-3" onSubmit={handleSubmit}>
          <input
            className="w-full rounded-xl border px-4 py-3 text-sm"
            placeholder={`https://${platform === "youtube" ? "www.youtube.com/watch?v=..." : "www.tiktok.com/..."}`}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />
          <input
            className="w-full rounded-xl border px-4 py-3 text-sm"
            placeholder="Topic label (optional)"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-800">{message}</p> : null}
          <Button type="submit" disabled={loading} variant="outline" className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Importing…
              </>
            ) : (
              `Import ${label} comments`
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
