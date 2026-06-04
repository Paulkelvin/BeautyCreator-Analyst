import { Progress } from "@/components/ui/progress";

type ScorePillProps = {
  label: string;
  value: number;
};

export function ScorePill({ label, value }: ScorePillProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs font-medium text-slate-500">
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <Progress value={value} />
    </div>
  );
}
