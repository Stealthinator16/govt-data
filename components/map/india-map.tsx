"use client";

import { useState, memo } from "react";
import { useRouter } from "next/navigation";
import {
  ComposableMap,
  Geographies,
  Geography,
} from "react-simple-maps";

const TOPO_URL = "/geo/india-states.json";

/** Map TopoJSON st_nm values → our canonical state IDs */
const TOPO_NAME_TO_ID: Record<string, string> = {
  "Andhra Pradesh": "andhra-pradesh",
  "Arunachal Pradesh": "arunachal-pradesh",
  "Assam": "assam",
  "Bihar": "bihar",
  "Chhattisgarh": "chhattisgarh",
  "Goa": "goa",
  "Gujarat": "gujarat",
  "Haryana": "haryana",
  "Himachal Pradesh": "himachal-pradesh",
  "Jharkhand": "jharkhand",
  "Karnataka": "karnataka",
  "Kerala": "kerala",
  "Madhya Pradesh": "madhya-pradesh",
  "Maharashtra": "maharashtra",
  "Manipur": "manipur",
  "Meghalaya": "meghalaya",
  "Mizoram": "mizoram",
  "Nagaland": "nagaland",
  "Odisha": "odisha",
  "Punjab": "punjab",
  "Rajasthan": "rajasthan",
  "Sikkim": "sikkim",
  "Tamil Nadu": "tamil-nadu",
  "Telangana": "telangana",
  "Tripura": "tripura",
  "Uttar Pradesh": "uttar-pradesh",
  "Uttarakhand": "uttarakhand",
  "West Bengal": "west-bengal",
  "Andaman and Nicobar Islands": "andaman-nicobar",
  "Chandigarh": "chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu": "dadra-nagar-haveli-daman-diu",
  "Delhi": "delhi",
  "Jammu and Kashmir": "jammu-kashmir",
  "Ladakh": "ladakh",
  "Lakshadweep": "lakshadweep",
  "Puducherry": "puducherry",
};

const TIER_COLORS: Record<string, string> = {
  Champion: "#10b981",
  Contender: "#3b82f6",
  Rising: "#f59e0b",
  Developing: "#f87171",
};

interface RankingEntry {
  state_id: string;
  score: number;
  tier: string;
  state_name: string;
}

interface IndiaMapProps {
  rankings: RankingEntry[];
}

function IndiaMapInner({ rankings }: IndiaMapProps) {
  const router = useRouter();
  const [tooltip, setTooltip] = useState<{
    name: string;
    score: number;
    tier: string;
    x: number;
    y: number;
  } | null>(null);

  const byId = new Map(rankings.map((r) => [r.state_id, r]));

  return (
    <div className="relative">
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{ center: [78, 22], scale: 1000 }}
        width={600}
        height={600}
        style={{ width: "100%", height: "auto", maxHeight: "600px" }}
      >
        <Geographies geography={TOPO_URL}>
          {({ geographies }) =>
            geographies.map((geo) => {
              const stName = geo.properties.st_nm as string;
              const stateId = TOPO_NAME_TO_ID[stName];
              const entry = stateId ? byId.get(stateId) : undefined;
              const fill = entry ? TIER_COLORS[entry.tier] ?? "#e5e7eb" : "#e5e7eb";

              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill={fill}
                  stroke="#fff"
                  strokeWidth={0.5}
                  style={{
                    default: { outline: "none" },
                    hover: { outline: "none", fill: entry ? fill : "#d1d5db", opacity: 0.8, cursor: "pointer" },
                    pressed: { outline: "none" },
                  }}
                  onMouseEnter={(e) => {
                    if (entry) {
                      setTooltip({
                        name: entry.state_name,
                        score: entry.score,
                        tier: entry.tier,
                        x: e.clientX,
                        y: e.clientY,
                      });
                    }
                  }}
                  onMouseLeave={() => setTooltip(null)}
                  onClick={() => {
                    if (stateId) router.push(`/states/${stateId}`);
                  }}
                />
              );
            })
          }
        </Geographies>
      </ComposableMap>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="pointer-events-none fixed z-50 rounded border bg-popover px-3 py-2 text-sm shadow-md"
          style={{ left: tooltip.x + 12, top: tooltip.y - 10 }}
        >
          <p className="font-medium">{tooltip.name}</p>
          <p className="text-muted-foreground">
            Score: {tooltip.score.toFixed(1)} &middot; {tooltip.tier}
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="mt-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {(["Champion", "Contender", "Rising", "Developing"] as const).map((tier) => (
          <div key={tier} className="flex items-center gap-1.5">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: TIER_COLORS[tier] }}
            />
            {tier}
          </div>
        ))}
      </div>
    </div>
  );
}

export const IndiaMap = memo(IndiaMapInner);
