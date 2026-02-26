/**
 * Shared state name mapping for all ingestion scripts.
 *
 * Maps various spellings/abbreviations found in government publications
 * to our canonical state IDs (from data/reference/states.json).
 */

export const STATE_NAME_MAP: Record<string, string> = {
  // --- States ---
  "andhra pradesh": "andhra-pradesh",
  ap: "andhra-pradesh",
  "arunachal pradesh": "arunachal-pradesh",
  arunachal: "arunachal-pradesh",
  assam: "assam",
  bihar: "bihar",
  chhattisgarh: "chhattisgarh",
  chattisgarh: "chhattisgarh", // MoSPI ASI spelling
  chattisgrah: "chhattisgarh",
  goa: "goa",
  gujarat: "gujarat",
  haryana: "haryana",
  "himachal pradesh": "himachal-pradesh",
  hp: "himachal-pradesh",
  jharkhand: "jharkhand",
  karnataka: "karnataka",
  kerala: "kerala",
  "madhya pradesh": "madhya-pradesh",
  mp: "madhya-pradesh",
  maharashtra: "maharashtra",
  manipur: "manipur",
  meghalaya: "meghalaya",
  mizoram: "mizoram",
  nagaland: "nagaland",
  odisha: "odisha",
  orissa: "odisha",
  punjab: "punjab",
  rajasthan: "rajasthan",
  sikkim: "sikkim",
  "tamil nadu": "tamil-nadu",
  tamilnadu: "tamil-nadu", // DFI ICT spelling
  tn: "tamil-nadu",
  telangana: "telangana",
  tripura: "tripura",
  "uttar pradesh": "uttar-pradesh",
  "uttar prdesh": "uttar-pradesh", // DFI ICT typo
  up: "uttar-pradesh",
  uttarakhand: "uttarakhand",
  uttaranchal: "uttarakhand",
  uttrakhand: "uttarakhand", // DFI ICT typo
  "west bengal": "west-bengal",
  wb: "west-bengal",

  // --- Union Territories ---
  "andaman & nicobar islands": "andaman-nicobar",
  "andaman & nicobar": "andaman-nicobar",
  "andaman % nicobar islands": "andaman-nicobar", // DFI typo
  "andaman and nicobar islands": "andaman-nicobar",
  "a & n islands": "andaman-nicobar",
  "a&n islands": "andaman-nicobar",
  "a&n": "andaman-nicobar",
  chandigarh: "chandigarh",
  "dadra & nagar haveli and daman & diu": "dadra-nagar-haveli-daman-diu",
  "dadra & nagar haveli & daman & diu": "dadra-nagar-haveli-daman-diu",
  "dadra & nagar havelli and daman & diu": "dadra-nagar-haveli-daman-diu",
  "dadra & nagar haveli": "dadra-nagar-haveli-daman-diu",
  "dadra and nagar haveli": "dadra-nagar-haveli-daman-diu",
  "daman & diu": "dadra-nagar-haveli-daman-diu",
  "daman and diu": "dadra-nagar-haveli-daman-diu",
  "d & n haveli and daman & diu": "dadra-nagar-haveli-daman-diu",
  "d & n haveli": "dadra-nagar-haveli-daman-diu",
  "d&nh and d&d": "dadra-nagar-haveli-daman-diu",
  "dnhdd": "dadra-nagar-haveli-daman-diu",
  "nct of delhi": "delhi",
  delhi: "delhi",
  "jammu & kashmir": "jammu-kashmir",
  "jammu and kashmir": "jammu-kashmir",
  "jammu & kashmir and ladakh": "jammu-kashmir", // GBD malaria data
  "j&k": "jammu-kashmir",
  ladakh: "ladakh",
  lakshadweep: "lakshadweep",
  puducherry: "puducherry",
  pondicherry: "puducherry",
};

/**
 * Resolve a state name string to our canonical state ID.
 * Returns null for aggregate rows like "All India" or unrecognized names.
 */
export function resolveStateId(name: string): string | null {
  const normalized = name.toLowerCase().trim();
  if (STATE_NAME_MAP[normalized]) return STATE_NAME_MAP[normalized];

  // Try collapsing multiple spaces
  const cleaned = normalized.replace(/\s+/g, " ");
  if (STATE_NAME_MAP[cleaned]) return STATE_NAME_MAP[cleaned];

  // Skip aggregate / national rows
  if (
    cleaned.includes("all india") ||
    cleaned === "india" ||
    cleaned === "all states" ||
    cleaned === "total" ||
    cleaned === "" ||
    cleaned.includes("north-eastern states") ||
    cleaned.includes("northeastern states") ||
    cleaned.includes("other union territories") ||
    cleaned.includes("other states")
  )
    return null;

  console.warn(`  Unknown state name: "${name}"`);
  return null;
}
