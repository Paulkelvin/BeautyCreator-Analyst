import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
  {
    step: "1",
    title: "APP_OWNER_USER_ID in Vercel",
    body: "You added this — redeploy if you have not since. Saves attach to your Supabase user."
  },
  {
    step: "2",
    title: "Paste, Instagram file, or video URL",
    body: "Analyze comments or upload/import. Saved opportunities appear after refresh."
  },
  {
    step: "3",
    title: "Record feedback",
    body: "After you publish content, log traffic/leads on a saved opportunity."
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
