import { cn } from "@/lib/utils";
import { TIER_CONFIG } from "@/lib/constants";
import type { Tier } from "@/lib/types";

export function TierBadge({ tier }: { tier: Tier }) {
  const config = TIER_CONFIG[tier];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.bg,
        config.color
      )}
    >
      {tier}
    </span>
  );
}
