"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface StateEntry {
  state_id: string;
  state_name: string;
}

export function StateNav({ states }: { states: StateEntry[] }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden lg:block sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto space-y-0.5 pr-2">
        <Link
          href="/states"
          className={cn(
            "block rounded-md px-3 py-2 text-sm transition-colors",
            pathname === "/states"
              ? "bg-muted font-medium text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          All States
        </Link>
        <div className="my-2 border-t" />
        {states.map((s) => (
          <Link
            key={s.state_id}
            href={`/states/${s.state_id}`}
            className={cn(
              "block rounded-md px-3 py-2 text-sm transition-colors",
              pathname === `/states/${s.state_id}`
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {s.state_name}
          </Link>
        ))}
      </nav>

      {/* Mobile horizontal strip */}
      <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4 scrollbar-none">
        <Link
          href="/states"
          className={cn(
            "shrink-0 rounded-full border px-3 py-1 text-xs transition-colors",
            pathname === "/states"
              ? "bg-foreground text-background border-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          All States
        </Link>
        {states.map((s) => (
          <Link
            key={s.state_id}
            href={`/states/${s.state_id}`}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs transition-colors",
              pathname === `/states/${s.state_id}`
                ? "bg-foreground text-background border-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {s.state_name}
          </Link>
        ))}
      </div>
    </>
  );
}
