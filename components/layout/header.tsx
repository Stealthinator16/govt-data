"use client";

import { useState } from "react";
import Link from "next/link";
import { SearchIcon, MenuIcon, XIcon } from "@/components/icons";

const NAV_LINKS = [
  { href: "/rankings", label: "Rankings" },
  { href: "/states", label: "States" },
  { href: "/compare", label: "Compare" },
  { href: "/about", label: "About" },
] as const;

function openSearch() {
  document.dispatchEvent(
    new KeyboardEvent("keydown", { key: "k", metaKey: true })
  );
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="text-lg">NPL</span>
          <span className="hidden sm:inline text-sm font-normal text-muted-foreground">
            National Premier League
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-4 text-sm">
          {/* Search button */}
          <button
            onClick={openSearch}
            className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-1.5 text-muted-foreground hover:bg-muted transition-colors"
          >
            <SearchIcon className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline-flex h-5 items-center rounded border bg-background px-1.5 text-[10px] font-medium">
              ⌘K
            </kbd>
          </button>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden p-1.5 rounded-md hover:bg-muted transition-colors"
            aria-label="Toggle menu"
          >
            {menuOpen ? <XIcon className="h-5 w-5" /> : <MenuIcon className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <nav className="md:hidden border-t px-4 py-3 space-y-1 bg-background">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="block rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
