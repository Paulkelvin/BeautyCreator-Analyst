import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const steps = [
  {
    step: "1",
    title: "Set APP_OWNER_USER_ID in Vercel",
    body: "Create a Supabase Auth user, copy UUID into Vercel env, redeploy. See docs/REAL_DATA.md."
  },
  {
    step: "2",
    title: "Paste comments or upload Instagram export",
    body: "Your analysis saves to Supabase and appears under Saved opportunities after refresh."
  },
  {
    step: "3",
    title: "YouTube/TikTok URLs (later)",
    body: "Needs Inngest + a worker with scrape tools. Charts below may still show demo data until phase B."
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
