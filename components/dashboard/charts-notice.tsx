import { Info } from "lucide-react";

export function ChartsNotice({ fromLiveData }: { fromLiveData: boolean }) {
  if (fromLiveData) {
    return null;
  }

  return (
    <div className="flex gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
      <Info className="h-5 w-5 shrink-0 text-slate-500" />
      <p>
        Trend radar, audience segments, and topic graph below use sample data until you have saved
        comments in the database. Run an analysis or upload comments — then refresh.
      </p>
    </div>
  );
}
