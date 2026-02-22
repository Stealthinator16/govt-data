import Link from "next/link";
import { cn } from "@/lib/utils";

interface CategoryCardProps {
  id: string;
  name: string;
  description: string;
  topState?: { name: string; score: number };
}

export function CategoryCard({ id, name, description, topState }: CategoryCardProps) {
  return (
    <Link href={`/rankings/${id}`}>
      <div className="group rounded-lg border p-4 hover:border-foreground/20 hover:bg-muted/50 transition-all">
        <h3 className="font-medium text-sm group-hover:underline">{name}</h3>
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{description}</p>
        {topState && (
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Top:</span>
            <span className="font-medium">
              {topState.name}{" "}
              <span className="text-emerald-600">{topState.score.toFixed(1)}</span>
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
