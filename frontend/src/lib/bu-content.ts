// Per-BU dashboard content. Only I&C, Mining, Automotive have rich content;
// other BUs fall back to the generic Mining-pipeline view.

export interface BuDashboardContent {
  headline: string;
  subhead: string;
  briefParagraph: string;
  kpis: { label: string; value: string; delta?: number; hint?: string; accent?: "green" | "blue" | "amber" }[];
  primaryCta: { label: string; to: string };
  secondaryCta: { label: string; to: string };
  watchlist: string[];               // segments / keywords to highlight
  recommendedActions: string[];
  newsFilterKeywords: string[];      // used to filter news on the landing page
  projectFilterKeyword: string | null;
}

const CONTENT: Record<string, BuDashboardContent> = {
  ic: {
    headline: "Industrial & Construction outlook",
    subhead: "LV/MV demand, building output, CPR/LSZH specs and construction PMI signals.",
    briefParagraph:
      "Construction PMI mixed across EU-5; permits softening in residential while non-residential (healthcare, education, grid) accelerates on PNRR / France 2030 / TenneT pipelines. Watch CPR Cca + LSZH spec migration on public tenders. Copper firming above $9,800/t supports margin discipline.",
    kpis: [
      { label: "EU construction PMI",       value: "49.1",  delta: -0.7, hint: "below 50 — contraction", accent: "amber" },
      { label: "Non-resid. output YoY",     value: "+4.2%", delta: 4.2, hint: "strongest segment",       accent: "green" },
      { label: "Residential permits YoY",   value: "-4.3%", delta: -4.3, hint: "leading indicator",      accent: "amber" },
      { label: "CPR Cca tender hit-rate",   value: "62%",   delta: 5,    hint: "vs 57% Q4",              accent: "green" },
    ],
    primaryCta: { label: "Open I&C demand brief", to: "/bu/ic" },
    secondaryCta: { label: "Trends · macro signals", to: "/trends" },
    watchlist: ["Healthcare", "Education", "Grid modernization", "LSZH/CPR migration"],
    recommendedActions: [
      "Re-allocate sales coverage from residential to non-residential (healthcare, education, grid).",
      "Lock multi-year framework agreements on CPR Cca / LSZH ranges in IT + DE.",
      "Sync proposals to the 6–9 month permits → output lag — push pricing in Q3 to capture early movers.",
    ],
    newsFilterKeywords: ["construction", "building", "permits", "cpr", "lszh", "infrastructure"],
    projectFilterKeyword: null,
  },
  mining: {
    headline: "Mining pipeline outlook",
    subhead: "Copper & critical minerals projects, reeling/trailing cable demand, commodity prices.",
    briefParagraph:
      "Global copper, lithium and rare-earth projects continue to expand — strong tailwind for reeling/trailing/shaft cable demand. Mongolian and Chilean copper expansions in advanced planning; African manganese and Australian lithium pipelines maturing. Spec migration toward higher-voltage trailing cables (35 kV).",
    kpis: [
      { label: "Active mining projects",   value: "—",      hint: "from pipeline", accent: "green" },
      { label: "Copper price (LME)",       value: "$9,995", delta: 7.2,  hint: "+7.2% YTD",       accent: "green" },
      { label: "Cable demand est.",        value: "—",      hint: "km across pipeline",          accent: "blue" },
      { label: "Avg project duration",     value: "—",      hint: "from start–end years",         accent: "amber" },
    ],
    primaryCta: { label: "Open Mining pipeline", to: "/projects" },
    secondaryCta: { label: "Mining BU detail", to: "/bu/mining" },
    watchlist: ["Copper", "Lithium", "Rare earths", "35kV trailing cables"],
    recommendedActions: [
      "Prioritize quotes on the 5 top-CAPEX flagged projects — long sales cycle, lock early.",
      "Track Nexans / Hellenic moves on high-voltage trailing cables — defend share on 35 kV specs.",
      "Build relationship map with top developers (BHP, Rio Tinto, Glencore, First Quantum).",
    ],
    newsFilterKeywords: ["mining", "copper", "lithium", "rare earth", "ore", "smelter"],
    projectFilterKeyword: null,
  },
  automotive: {
    headline: "Automotive & EV outlook",
    subhead: "EV charging infra, OEM battery interconnect, HV harness — and the cooling cycle.",
    briefParagraph:
      "EU EV-charging rollout accelerating despite a soft passenger-EV demand cycle; CPO capex resilient on motorway HPC corridors. OEM HV-harness business stable in DE, growing on the Iberian premium tier. Watch copper-aluminum substitution and the EU CBAM impact on battery interconnect pricing.",
    kpis: [
      { label: "EU charging points YoY",   value: "+34%", delta: 34,   hint: "AFIR pipeline",              accent: "green" },
      { label: "EV share new cars (EU)",   value: "14.6%", delta: -1.2, hint: "soft passenger cycle",     accent: "amber" },
      { label: "HPC corridor projects",    value: "27",    delta: 6,    hint: "active tenders",            accent: "blue" },
      { label: "OEM HV-harness margin",    value: "Stable", hint: "DE OEMs · IT/ES OEMs growing",         accent: "green" },
    ],
    primaryCta: { label: "Open Automotive BU", to: "/bu/automotive" },
    secondaryCta: { label: "Trends · macro signals", to: "/trends" },
    watchlist: ["EV charging", "HPC corridors", "Battery interconnect", "OEM HV harness"],
    recommendedActions: [
      "Push CPO framework agreements in IT/ES — AFIR window closes for premium positioning.",
      "Engage premium OEMs on HV-harness Cu→Al substitution pilots — counter Yazaki/Sumitomo.",
      "Sync sales push to HPC corridor tender calendar (Q2 + Q4 peaks).",
    ],
    newsFilterKeywords: ["ev", "electric vehicle", "charging", "battery", "oem", "automotive"],
    projectFilterKeyword: null,
  },
};

export function getBuContent(buId: string | null): BuDashboardContent | null {
  if (!buId) return null;
  return CONTENT[buId] ?? null;
}

export function hasRichDashboard(buId: string | null): boolean {
  return !!buId && !!CONTENT[buId];
}
