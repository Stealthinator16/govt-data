import Link from "next/link";
import { TierBadge } from "./tier-badge";
import { ScoreBar } from "./score-bar";
import type { Tier } from "@/lib/types";

interface RankingRow {
  rank: number;
  state_id: string;
  state_name: string;
  state_type: string;
  score: number;
  tier: string;
  metrics_count?: number;
}

interface LeagueTableProps {
  rankings: RankingRow[];
  showTier?: boolean;
  limit?: number;
  linkPrefix?: string;
}

export function LeagueTable({
  rankings,
  showTier = true,
  limit,
  linkPrefix = "/states",
}: LeagueTableProps) {
  const rows = limit ? rankings.slice(0, limit) : rankings;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-muted-foreground">
            <th className="py-3 px-2 text-left w-12">#</th>
            <th className="py-3 px-2 text-left">State / UT</th>
            <th className="py-3 px-2 text-left">Score</th>
            {showTier && <th className="py-3 px-2 text-left">Tier</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.state_id}
              className="border-b last:border-0 hover:bg-muted/50 transition-colors"
            >
              <td className="py-3 px-2 font-mono text-muted-foreground tabular-nums">
                {row.rank}
              </td>
              <td className="py-3 px-2">
                <Link
                  href={`${linkPrefix}/${row.state_id}`}
                  className="font-medium hover:underline"
                >
                  {row.state_name}
                </Link>
                {row.state_type === "ut" && (
                  <span className="ml-1.5 text-xs text-muted-foreground">(UT)</span>
                )}
              </td>
              <td className="py-3 px-2">
                <ScoreBar score={row.score} />
              </td>
              {showTier && (
                <td className="py-3 px-2">
                  <TierBadge tier={row.tier as Tier} />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
