import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t mt-16">
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="flex flex-col sm:flex-row justify-between gap-4 text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground">National Premier League</p>
            <p className="mt-1">
              Ranking Indian states across every measurable dimension of human life.
            </p>
          </div>
          <div className="flex gap-6">
            <Link href="/about" className="hover:text-foreground transition-colors">
              Methodology
            </Link>
            <Link href="/about#sources" className="hover:text-foreground transition-colors">
              Data Sources
            </Link>
          </div>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Data sourced from MoSPI, NFHS, Census, NCRB, RBI, UDISE+, and other government databases.
        </p>
      </div>
    </footer>
  );
}
