import fs from "fs";
import path from "path";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { CategoryNav } from "@/components/rankings/category-nav";

export default function RankingsLayout({ children }: { children: React.ReactNode }) {
  const categories = JSON.parse(
    fs.readFileSync(path.join(process.cwd(), "data/reference/categories.json"), "utf-8")
  ) as Array<{ id: string; name: string }>;

  return (
    <>
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8 flex gap-8 flex-1">
        <aside className="w-52 shrink-0">
          <CategoryNav categories={categories} />
        </aside>
        <main className="flex-1 min-w-0">
          {children}
        </main>
      </div>
      <Footer />
    </>
  );
}
