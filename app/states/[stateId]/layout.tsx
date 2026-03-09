import fs from "fs";
import path from "path";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StateNav } from "@/components/states/state-nav";

export default function StateProfileLayout({ children }: { children: React.ReactNode }) {
  const overall = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "public/data/overall.json"), "utf-8")
  ) as {
    rankings: Array<{ state_id: string; state_name: string; rank: number; tier: string }>;
  };

  const states = overall.rankings.sort((a, b) => a.state_name.localeCompare(b.state_name));

  return (
    <>
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8 flex-1">
        <div className="lg:flex gap-8">
          <aside className="hidden lg:block w-52 shrink-0">
            <StateNav states={states} />
          </aside>
          <main className="flex-1 min-w-0">
            {children}
          </main>
        </div>
      </div>
      <Footer />
    </>
  );
}
