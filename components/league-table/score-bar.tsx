import { cn } from "@/lib/utils";
import { getTier, TIER_CONFIG } from "@/lib/constants";

export function ScoreBar({ score }: { score: number }) {
  const tier = getTier(score);
  const colors: Record<string, string> = {
    Champion: "bg-emerald-500",
    Contender: "bg-blue-500",
    Rising: "bg-amber-500",
    Developing: "bg-red-400",
  };

  return (
    <div className="flex items-center gap-2">
      <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", colors[tier])}
          style={{ width: `${score}%` }}
        />
      </div>
      <span className={cn("text-sm font-mono tabular-nums", TIER_CONFIG[tier].color)}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}
