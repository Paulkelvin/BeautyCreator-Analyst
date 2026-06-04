import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
  {
    step: "1",
    title: "Sample dashboard (what you see now)",
    body: "Demo cards show how opportunities look for beauty creators. This is not from your URLs."
  },
  {
    step: "2",
    title: "Analyze your comments (ready today)",
    body: "Paste real comments under “Analyze your comments”. The app scores the topic and suggests content."
  },
  {
    step: "3",
    title: "Auto-pull from URLs (setup required)",
    body: "YouTube/TikTok/Instagram ingest APIs exist but need Inngest + auth. No one-click URL box yet."
  }
];

export function HowItWorks() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>How to use this app</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-3">
        {steps.map((item) => (
          <div key={item.step} className="rounded-2xl border bg-slate-50 p-4">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-violet-600 text-sm font-bold text-white">
              {item.step}
            </span>
            <p className="mt-3 font-semibold text-slate-900">{item.title}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.body}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
