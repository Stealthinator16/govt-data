import { cn } from "@/lib/utils";
import { TIER_CONFIG } from "@/lib/constants";
import type { Tier } from "@/lib/types";

const TIER_DESCRIPTIONS: Record<Tier, { range: string; description: string }> = {
  Champion: { range: "75–100", description: "Top-performing states with strong outcomes" },
  Contender: { range: "60–74", description: "Above-average states steadily improving" },
  Rising: { range: "45–59", description: "States making progress but with gaps" },
  Developing: { range: "0–44", description: "States needing focused attention" },
};

export function TierLegend({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-lg border p-4", className)}>
      <h3 className="text-sm font-semibold mb-2">Tier Guide</h3>
      <div className="grid gap-1.5 sm:grid-cols-2">
        {(["Champion", "Contender", "Rising", "Developing"] as const).map((tier) => {
          const config = TIER_CONFIG[tier];
          const desc = TIER_DESCRIPTIONS[tier];
          return (
            <div key={tier} className="flex items-start gap-2 text-sm">
              <span
                className={cn(
                  "inline-block rounded px-1.5 py-0.5 text-xs font-medium shrink-0 mt-0.5",
                  config.bg,
                  config.color
                )}
              >
                {tier}
              </span>
              <span className="text-muted-foreground">
                ({desc.range}) {desc.description}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
