"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
}

export function CategoryNav({ categories }: { categories: Category[] }) {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden lg:block sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto space-y-0.5 pr-2">
        <Link
          href="/rankings"
          className={cn(
            "block rounded-md px-3 py-2 text-sm transition-colors",
            pathname === "/rankings"
              ? "bg-muted font-medium text-foreground"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          Overall
        </Link>
        <div className="my-2 border-t" />
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/rankings/${cat.id}`}
            className={cn(
              "block rounded-md px-3 py-2 text-sm transition-colors",
              pathname === `/rankings/${cat.id}`
                ? "bg-muted font-medium text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
            )}
          >
            {cat.name}
          </Link>
        ))}
      </nav>

      {/* Mobile horizontal strip */}
      <div className="lg:hidden flex gap-2 overflow-x-auto pb-2 mb-6 -mx-4 px-4 scrollbar-none">
        <Link
          href="/rankings"
          className={cn(
            "shrink-0 rounded-full border px-3 py-1 text-xs transition-colors",
            pathname === "/rankings"
              ? "bg-foreground text-background border-foreground"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Overall
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/rankings/${cat.id}`}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs transition-colors",
              pathname === `/rankings/${cat.id}`
                ? "bg-foreground text-background border-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {cat.name}
          </Link>
        ))}
      </div>
    </>
  );
}
