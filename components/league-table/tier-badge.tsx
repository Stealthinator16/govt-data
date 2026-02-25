import { cn } from "@/lib/utils";
import { TIER_CONFIG } from "@/lib/constants";
import type { Tier } from "@/lib/types";

const TIER_TOOLTIPS: Record<Tier, string> = {
  Champion: "Champion (75–100): Top-performing states with strong outcomes",
  Contender: "Contender (60–74): Above-average states steadily improving",
  Rising: "Rising (45–59): States making progress but with gaps",
  Developing: "Developing (0–44): States needing focused attention",
};

export function TierBadge({ tier }: { tier: Tier }) {
  const config = TIER_CONFIG[tier];
  return (
    <span
      title={TIER_TOOLTIPS[tier]}
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
