import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-4">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="text-lg">NPL</span>
          <span className="hidden sm:inline text-sm font-normal text-muted-foreground">
            National Premier League
          </span>
        </Link>
        <nav className="ml-auto flex items-center gap-4 text-sm">
          <Link href="/rankings" className="text-muted-foreground hover:text-foreground transition-colors">
            Rankings
          </Link>
          <Link href="/states" className="text-muted-foreground hover:text-foreground transition-colors">
            States
          </Link>
          <Link href="/compare" className="text-muted-foreground hover:text-foreground transition-colors">
            Compare
          </Link>
          <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors">
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}
