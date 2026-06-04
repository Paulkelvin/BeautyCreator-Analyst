import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type Edge = {
  parent: string;
  child: string;
};

export function TopicGraph({ edges }: { edges: Edge[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Topic Graph Explorer</CardTitle>
        <CardDescription>Canonical topics and modifier relationships forming the knowledge graph.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 sm:grid-cols-2">
          {edges.map((edge) => (
            <div
              key={`${edge.parent}-${edge.child}`}
              className="flex items-center justify-between rounded-2xl border bg-slate-50 px-4 py-3 text-sm"
            >
              <span className="font-medium text-slate-900">{edge.parent}</span>
              <span className="text-slate-400">-&gt;</span>
              <span className="text-violet-700">{edge.child}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
