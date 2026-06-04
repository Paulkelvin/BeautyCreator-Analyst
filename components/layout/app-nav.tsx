import Link from "next/link";
import { Button } from "@/components/ui/button";

export function AppNav() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="text-sm font-bold text-slate-900 md:text-base">
          Content Intelligence Engine
        </Link>
        <nav className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">Home</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">Dashboard</Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/dashboard#saved-opportunities">My saves</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
