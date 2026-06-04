"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

export function PostSaveNotice() {
  const searchParams = useSearchParams();
  const saved = searchParams.get("saved") === "1";

  useEffect(() => {
    if (!saved) {
      return;
    }
    const target =
      document.getElementById("latest-save") ??
      document.getElementById("saved-opportunities");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [saved]);

  if (!saved) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
      <strong>Saved successfully.</strong> Your opportunity is in{" "}
      <strong>Your saved opportunities</strong> at the top of this page (highlighted if you just saved).
      Use <strong>My saves</strong> in the top navigation anytime.
    </div>
  );
}
