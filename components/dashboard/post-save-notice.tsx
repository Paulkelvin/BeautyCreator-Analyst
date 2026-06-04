"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function PostSaveNotice() {
  const searchParams = useSearchParams();
  const saved = searchParams.get("saved") === "1";

  useEffect(() => {
    if (saved) {
      document.getElementById("saved-opportunities")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [saved]);

  if (!saved) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
      <strong>Saved successfully.</strong> Your opportunities are in the section below — scroll down if you
      do not see them yet.
    </div>
  );
}
