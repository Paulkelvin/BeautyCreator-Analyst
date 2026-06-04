"use client";

import { useState } from "react";
import { FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function InstagramUpload() {
  const [topic, setTopic] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!file) {
      setError("Choose a CSV, XLSX, or JSON export file.");
      return;
    }

    if (topic.trim().length < 2) {
      setError("Enter a topic for this file.");
      return;
    }

    setLoading(true);
    setError(null);
    setMessage(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("topic", topic.trim());
    formData.append("name", file.name);

    try {
      const response = await fetch("/api/ingest/instagram-upload", {
        method: "POST",
        body: formData
      });
      const payload = (await response.json()) as {
        error?: string;
        message?: string;
        comments?: number;
        opportunityId?: string;
        status?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Upload failed.");
      }

      setMessage(
        payload.message ??
          `Processed ${payload.comments ?? 0} comments (${payload.status ?? "done"}). Refresh the page to see saved opportunities.`
      );
      if (payload.opportunityId) {
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <FileUp className="h-7 w-7 text-violet-600" />
        <CardTitle>Upload Instagram comments</CardTitle>
        <CardDescription>
          Import a CSV, XLSX, or JSON export. Comments are stored in Supabase and scored as one opportunity
          (works on Vercel without Inngest).
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <label className="block space-y-2 text-sm">
            <span className="font-semibold">Topic</span>
            <input
              className="w-full rounded-xl border px-4 py-3"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Bridal makeup kit questions"
            />
          </label>
          <label className="block space-y-2 text-sm">
            <span className="font-semibold">Export file</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.json"
              className="w-full text-sm"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          {message ? <p className="text-sm text-emerald-800">{message}</p> : null}
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Processing…
              </>
            ) : (
              "Upload and analyze"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
