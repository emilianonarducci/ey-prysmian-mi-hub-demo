// Curated industry news per Business Unit + canonical specialized sources.
// Used as a demo overlay on top of /api/news. Real URLs point to the homepage of
// well-known industry publications (the AI agents would deep-link to articles
// when wired to live feeds in Phase 1).

export interface BuNewsItem {
  id: string;
  buId: string;
  title: string;
  source: string;        // publication name
  url: string;           // article (or publication root) URL
  summary: string;
  countries?: string[];
  published_at: string;  // ISO
  relevance_score: number;
  tags?: string[];
}

export interface BuSource {
  name: string;
  url: string;
  focus: string;
  type: "magazine" | "news" | "data" | "association" | "blog";
}

// ────────────────────────────────────────────────────────────────────────────
// Canonical specialized sources monitored per BU
// ────────────────────────────────────────────────────────────────────────────
export const BU_SOURCES: Record<string, BuSource[]> = {
  ic: [
    { name: "Electrical Construction & Maintenance (EC&M)", url: "https://www.ecmweb.com/",                 focus: "Industrial wiring & installation",    type: "magazine"  },
    { name: "Cabling Installation & Maintenance",          url: "https://www.cablinginstall.com/",         focus: "Structured cabling, fiber and copper", type: "magazine"  },
    { name: "Construction Europe",                          url: "https://www.constructioneurope.com/",     focus: "European construction trends",         type: "news"      },
    { name: "Eurostat — Building permits",                  url: "https://ec.europa.eu/eurostat/web/short-term-business-statistics/database", focus: "EU permits & output data", type: "data"   },
    { name: "EU Construction Observatory",                  url: "https://single-market-economy.ec.europa.eu/sectors/construction_en",     focus: "Sector policy & data",     type: "data"   },
    { name: "ELECTRI International",                        url: "https://electri.org/",                    focus: "Electrical contracting research",      type: "association" },
  ],
  mining: [
    { name: "Mining.com",                                   url: "https://www.mining.com/",                 focus: "Global mining headlines",              type: "news"      },
    { name: "Mining Weekly",                                url: "https://www.miningweekly.com/",           focus: "Africa-centric mining intel",          type: "magazine"  },
    { name: "S&P Global Commodity Insights",                url: "https://www.spglobal.com/commodityinsights/en/",  focus: "Metals & minerals data",         type: "data"      },
    { name: "Reuters — Mining",                             url: "https://www.reuters.com/business/energy/", focus: "Breaking mining news",                type: "news"      },
    { name: "London Metal Exchange (LME)",                  url: "https://www.lme.com/",                    focus: "Copper, aluminium, nickel prices",     type: "data"      },
    { name: "BNamericas",                                   url: "https://www.bnamericas.com/",             focus: "LATAM mining projects",                type: "news"      },
  ],
  automotive: [
    { name: "Automotive News Europe",                       url: "https://europe.autonews.com/",            focus: "OEM strategy & supply chain",          type: "magazine"  },
    { name: "EV-Volumes",                                   url: "https://www.ev-volumes.com/",             focus: "EV sales & forecasts",                 type: "data"      },
    { name: "ACEA",                                         url: "https://www.acea.auto/",                  focus: "EU car-makers association",            type: "association" },
    { name: "InsideEVs",                                    url: "https://insideevs.com/",                  focus: "EV models, chargers, market",          type: "news"      },
    { name: "ChargeHub / EAFO",                             url: "https://alternative-fuels-observatory.ec.europa.eu/", focus: "EU charging infrastructure",     type: "data"      },
    { name: "CleanTechnica — Transport",                    url: "https://cleantechnica.com/category/clean-transport-2/", focus: "EV & charging news",            type: "blog"      },
  ],
  renewable: [
    { name: "Renewables Now",                               url: "https://renewablesnow.com/",              focus: "EU renewables pipeline",               type: "news"      },
    { name: "Wind Power Monthly",                           url: "https://www.windpowermonthly.com/",       focus: "Onshore + offshore wind",              type: "magazine"  },
    { name: "PV Magazine",                                  url: "https://www.pv-magazine.com/",            focus: "Solar PV news & projects",             type: "magazine"  },
    { name: "WindEurope",                                   url: "https://windeurope.org/",                 focus: "European wind association",            type: "association" },
    { name: "SolarPower Europe",                            url: "https://www.solarpowereurope.org/",       focus: "European solar association",           type: "association" },
    { name: "BloombergNEF",                                 url: "https://about.bnef.com/",                 focus: "Energy transition research",           type: "data"      },
  ],
  fiber: [
    { name: "Light Reading",                                url: "https://www.lightreading.com/",           focus: "Telecom & fiber infrastructure",       type: "news"      },
    { name: "FibreSystems",                                 url: "https://www.fibre-systems.com/",          focus: "Optical fiber technology",             type: "magazine"  },
    { name: "FTTH Council Europe",                          url: "https://www.ftthcouncil.eu/",             focus: "FTTH rollout in EU",                   type: "association" },
    { name: "Telecompaper",                                 url: "https://www.telecompaper.com/",           focus: "Telecom market news",                  type: "news"      },
    { name: "TeleGeography",                                url: "https://www.telegeography.com/",          focus: "Subsea cable & connectivity data",     type: "data"      },
  ],
  connectivity: [
    { name: "Electrical Wholesaling",                       url: "https://www.ewweb.com/",                  focus: "Distribution & accessories",           type: "magazine"  },
    { name: "T&D World — Components",                       url: "https://www.tdworld.com/",                focus: "MV/HV terminations & joints",          type: "magazine"  },
    { name: "Cable Tech Talk",                              url: "https://www.cabletechtalk.com/",          focus: "Cable accessories deep-dives",         type: "blog"      },
  ],
  "power-grid": [
    { name: "T&D World",                                    url: "https://www.tdworld.com/",                focus: "Transmission & distribution",          type: "magazine"  },
    { name: "Smart Energy International",                   url: "https://www.smart-energy.com/",           focus: "Grid modernization",                   type: "news"      },
    { name: "ENTSO-E",                                      url: "https://www.entsoe.eu/",                  focus: "EU transmission operators",            type: "association" },
    { name: "Power Engineering International",              url: "https://www.powerengineeringint.com/",    focus: "Generation & transmission",            type: "magazine"  },
    { name: "S&P Global — Power",                           url: "https://www.spglobal.com/commodityinsights/en/market-insights/topics/electric-power", focus: "Power market data", type: "data" },
  ],
  submarine: [
    { name: "Subsea World News",                            url: "https://www.offshore-energy.biz/",        focus: "Subsea + offshore energy",             type: "news"      },
    { name: "Offshore Wind Biz",                            url: "https://www.offshorewind.biz/",           focus: "Offshore wind projects",               type: "news"      },
    { name: "4C Offshore",                                  url: "https://www.4coffshore.com/",             focus: "Offshore wind & subsea cable DB",      type: "data"      },
    { name: "Cable Tech Talk",                              url: "https://www.cabletechtalk.com/",          focus: "HVDC & submarine cable deep-dives",    type: "blog"      },
  ],
  building: [
    { name: "Engineering News-Record (ENR)",                url: "https://www.enr.com/",                    focus: "Construction projects & rankings",     type: "magazine"  },
    { name: "Construction Europe",                          url: "https://www.constructioneurope.com/",     focus: "EU construction news",                 type: "news"      },
    { name: "Building",                                     url: "https://www.building.co.uk/",             focus: "UK building sector",                   type: "magazine"  },
    { name: "Eurostat — Construction output",               url: "https://ec.europa.eu/eurostat/web/short-term-business-statistics/database", focus: "EU output data", type: "data" },
  ],
  oilgas: [
    { name: "Offshore Magazine",                            url: "https://www.offshore-mag.com/",           focus: "Upstream offshore O&G",                type: "magazine"  },
    { name: "Oil & Gas Journal",                            url: "https://www.ogj.com/",                    focus: "Global O&G news",                      type: "magazine"  },
    { name: "Upstream Online",                              url: "https://www.upstreamonline.com/",         focus: "Upstream news & analysis",             type: "news"      },
  ],
  railway: [
    { name: "International Railway Journal",                url: "https://www.railjournal.com/",            focus: "Global railway news",                  type: "magazine"  },
    { name: "Railway Gazette",                              url: "https://www.railwaygazette.com/",         focus: "Operators & rolling stock",            type: "magazine"  },
    { name: "Rail Engineer",                                url: "https://www.railengineer.co.uk/",         focus: "Infrastructure & signalling",          type: "blog"      },
  ],
};

// ────────────────────────────────────────────────────────────────────────────
// Curated articles per BU (4–6 each for I&C, Mining, Automotive; 2–3 for others)
// ────────────────────────────────────────────────────────────────────────────
const D = (offsetDays: number) => new Date(Date.now() - offsetDays * 86400000).toISOString();

export const BU_NEWS: BuNewsItem[] = [
  // ─── I&C ────────────────────────────────────────────────────────────────
  { id: "ic-1", buId: "ic", title: "EU construction PMI dips to 49.1 as residential softens",          source: "Construction Europe",        url: "https://www.constructioneurope.com/", summary: "Industry-wide contraction signal extends to a fourth month, with residential dragging while non-residential (healthcare, education) holds.", countries: ["EU"],     published_at: D(1),  relevance_score: 0.88, tags: ["pmi", "construction"] },
  { id: "ic-2", buId: "ic", title: "CPR Cca + LSZH spec adoption accelerating on EU public tenders",   source: "Cabling Installation & Maintenance", url: "https://www.cablinginstall.com/", summary: "Schools and healthcare procurement now mandate Cca-rated low-smoke cabling — direct tailwind for premium I&C ranges.", countries: ["Italy", "France"], published_at: D(2), relevance_score: 0.91, tags: ["cpr", "lszh", "tenders"] },
  { id: "ic-3", buId: "ic", title: "PNRR M4C1 — Italian school refurbishment pipeline cleared for Q3",  source: "EU Construction Observatory", url: "https://single-market-economy.ec.europa.eu/sectors/construction_en", summary: "€3.9B for school upgrades — mandatory CPR Cca cabling, opening a 12–18 month installation window.", countries: ["Italy"], published_at: D(3), relevance_score: 0.94, tags: ["pnrr", "italy", "education"] },
  { id: "ic-4", buId: "ic", title: "EC&M: industrial wiring shortages ease as copper supply stabilizes", source: "Electrical Construction & Maintenance", url: "https://www.ecmweb.com/", summary: "Distributor lead times back to 4–6 weeks across LV ranges — pricing discipline holding above $9,800/t copper.", countries: ["EU"], published_at: D(4), relevance_score: 0.78, tags: ["supply", "copper"] },
  { id: "ic-5", buId: "ic", title: "Building permits down 4.3% YoY across EU-5 in Q1 2026",            source: "Eurostat",                   url: "https://ec.europa.eu/eurostat/web/short-term-business-statistics/database", summary: "Leading-indicator weakness expected to translate to softer 2026-H2 construction output. Permits → output lag at ~7 months.", countries: ["Italy", "France", "Germany", "Spain", "Netherlands"], published_at: D(5), relevance_score: 0.85, tags: ["permits", "leading-indicator"] },
  { id: "ic-6", buId: "ic", title: "ELECTRI International: contractor staffing pressures persist in DE", source: "ELECTRI International",     url: "https://electri.org/", summary: "Skilled-labor shortages in Germany push project completion timelines by ~3 weeks on average — knock-on for material call-off.", countries: ["Germany"], published_at: D(7), relevance_score: 0.72, tags: ["labor", "germany"] },

  // ─── Mining ─────────────────────────────────────────────────────────────
  { id: "mn-1", buId: "mining", title: "Glencore green-lights $2.4B Argentine copper expansion",         source: "Mining.com",         url: "https://www.mining.com/",         summary: "Phase-1 capex sanctioned for MARA project; 35 kV trailing-cable spec confirmed in tender package.", countries: ["Argentina"], published_at: D(1), relevance_score: 0.96, tags: ["copper", "glencore"] },
  { id: "mn-2", buId: "mining", title: "LME 3-month copper firms above $10,000/t on tightening stocks",  source: "London Metal Exchange", url: "https://www.lme.com/", summary: "Inventories at multi-year lows; supportive for mining capex pipeline and trailing-cable demand into 2027.", countries: [], published_at: D(1), relevance_score: 0.89, tags: ["copper", "lme", "price"] },
  { id: "mn-3", buId: "mining", title: "BHP Olympic Dam smelter modernization moves to FEED",            source: "Mining Weekly",      url: "https://www.miningweekly.com/",   summary: "AU$1.2B program covers MV/HV underground cabling — competitive tender opening Q3 2026.", countries: ["Australia"], published_at: D(2), relevance_score: 0.92, tags: ["bhp", "australia", "smelter"] },
  { id: "mn-4", buId: "mining", title: "Rio Tinto: Mongolian Oyu Tolgoi underground production ramps",   source: "Reuters",            url: "https://www.reuters.com/business/energy/", summary: "Block-cave operations scaling; cable specs migrating to 35 kV trailing — re-orders expected in 2026-H2.", countries: ["Mongolia"], published_at: D(3), relevance_score: 0.90, tags: ["rio-tinto", "mongolia"] },
  { id: "mn-5", buId: "mining", title: "EU Critical Raw Materials Act spurs lithium pipeline in Portugal", source: "S&P Global Commodity Insights", url: "https://www.spglobal.com/commodityinsights/en/", summary: "Savannah Resources and Lusorecursos advancing — early specifications include reeling cables for processing plants.", countries: ["Portugal"], published_at: D(4), relevance_score: 0.83, tags: ["lithium", "eu", "crma"] },
  { id: "mn-6", buId: "mining", title: "First Quantum's Cobre Panama: arbitration update",               source: "BNamericas",         url: "https://www.bnamericas.com/",     summary: "Restart timeline pushed to 2027 in base case — mid-term cable order book on hold but contingency contracts in place.", countries: ["Panama"], published_at: D(6), relevance_score: 0.77, tags: ["first-quantum", "panama"] },

  // ─── Automotive ─────────────────────────────────────────────────────────
  { id: "auto-1", buId: "automotive", title: "EU AFIR: 27 new HPC corridor tenders open in Q2 2026",       source: "EAFO (Alternative Fuels Observatory)", url: "https://alternative-fuels-observatory.ec.europa.eu/", summary: "Required charging-point density along TEN-T corridors drives a wave of CPO procurement; Italy & Spain account for 11.", countries: ["Italy", "Spain", "France"], published_at: D(1), relevance_score: 0.94, tags: ["ev", "charging", "afir"] },
  { id: "auto-2", buId: "automotive", title: "ACEA: passenger EV share at 14.6% in February, mix softening", source: "ACEA",                       url: "https://www.acea.auto/",          summary: "PHEV gains share while BEV cools; OEM mix shifts impact battery interconnect specs in DE plants.", countries: ["EU"], published_at: D(2), relevance_score: 0.85, tags: ["acea", "ev-share"] },
  { id: "auto-3", buId: "automotive", title: "Stellantis to dual-source HV-harness from 2027 in Iberia",     source: "Automotive News Europe",     url: "https://europe.autonews.com/",    summary: "Premium tier supplier qualification opening — counter-positioning vs Yazaki/Sumitomo critical in IT/ES.", countries: ["Spain", "Italy"], published_at: D(3), relevance_score: 0.91, tags: ["stellantis", "harness"] },
  { id: "auto-4", buId: "automotive", title: "InsideEVs: copper-aluminum substitution accelerates in 800V platforms", source: "InsideEVs",          url: "https://insideevs.com/",          summary: "Premium OEMs piloting Al-conductor battery interconnect to offset Cu cost — pricing pressure on incumbent cable suppliers.", countries: [], published_at: D(4), relevance_score: 0.81, tags: ["cu-al", "800v"] },
  { id: "auto-5", buId: "automotive", title: "Iberdrola wins 2,400-point HPC tender in Spain",              source: "EV-Volumes",                 url: "https://www.ev-volumes.com/",     summary: "Multi-year framework — significant LV/MV cable opportunity for incumbent suppliers from Q4 2026.", countries: ["Spain"], published_at: D(5), relevance_score: 0.88, tags: ["iberdrola", "cpo"] },
  { id: "auto-6", buId: "automotive", title: "CleanTechnica: Tesla Supercharger V4 ramp continues in Europe", source: "CleanTechnica",            url: "https://cleantechnica.com/category/clean-transport-2/", summary: "350-kW deployment intensifying; standardized cable assemblies drive volume contracts.", countries: ["EU"], published_at: D(6), relevance_score: 0.74, tags: ["tesla", "hpc"] },

  // ─── Renewable (sample) ─────────────────────────────────────────────────
  { id: "re-1", buId: "renewable", title: "WindEurope: onshore EU additions hit 17 GW in 2025",             source: "WindEurope",          url: "https://windeurope.org/",          summary: "Onshore wind pipeline accelerating in Germany and Spain — array cabling demand pulling forward.", countries: ["EU"], published_at: D(1), relevance_score: 0.9, tags: ["onshore-wind"] },
  { id: "re-2", buId: "renewable", title: "PV Magazine: utility-scale PV plant cost falls 8% YoY",          source: "PV Magazine",         url: "https://www.pv-magazine.com/",     summary: "Capex compression sustains EPC pipeline; LV DC string cables remain a volume play.", countries: ["EU"], published_at: D(3), relevance_score: 0.82, tags: ["solar", "pv"] },
  { id: "re-3", buId: "renewable", title: "BNEF: EU offshore wind FID hits record in 2025",                  source: "BloombergNEF",        url: "https://about.bnef.com/",          summary: "Final investment decisions on track to deliver 11 GW of new capacity — array + export cable demand follows.", countries: ["UK", "Germany", "Netherlands"], published_at: D(5), relevance_score: 0.93, tags: ["offshore-wind"] },

  // ─── Fiber (sample) ─────────────────────────────────────────────────────
  { id: "fb-1", buId: "fiber", title: "FTTH Council Europe: EU coverage crosses 60% homes-passed milestone",  source: "FTTH Council Europe", url: "https://www.ftthcouncil.eu/",      summary: "Pace of rollout slowing in mature markets; Italy and DE still front-loaded — drop-cable demand resilient.", countries: ["EU"], published_at: D(2), relevance_score: 0.86, tags: ["ftth"] },
  { id: "fb-2", buId: "fiber", title: "Light Reading: hyperscaler DC fiber spend up 22% YoY",                source: "Light Reading",       url: "https://www.lightreading.com/",    summary: "Backbone & inside-plant fiber demand from Microsoft/Google/AWS expansions in NL, IE, DE.", countries: ["Netherlands", "Ireland", "Germany"], published_at: D(4), relevance_score: 0.9, tags: ["fiber", "datacenter"] },

  // ─── Connectivity (sample) ──────────────────────────────────────────────
  { id: "cn-1", buId: "connectivity", title: "T&D World: MV joint quality issues drive utility audit waves",  source: "T&D World",          url: "https://www.tdworld.com/",         summary: "DSOs in EU-5 launching factory audits on MV accessories — opportunity to displace lower-tier suppliers.", countries: ["EU"], published_at: D(3), relevance_score: 0.84, tags: ["mv-joints"] },

  // ─── Power Grid (sample) ────────────────────────────────────────────────
  { id: "pg-1", buId: "power-grid", title: "TenneT framework: €23B grid expansion to 2030 confirmed",        source: "ENTSO-E",            url: "https://www.entsoe.eu/",           summary: "Major HVDC + EHV underground programme — multi-year cable order book pipeline.", countries: ["Germany", "Netherlands"], published_at: D(1), relevance_score: 0.96, tags: ["tennet", "grid"] },
  { id: "pg-2", buId: "power-grid", title: "Smart Energy International: DSO MV expansion accelerating in IT", source: "Smart Energy International", url: "https://www.smart-energy.com/", summary: "E-Distribuzione capex up — MV distribution cable opportunity.", countries: ["Italy"], published_at: D(4), relevance_score: 0.88, tags: ["dso", "italy"] },

  // ─── Submarine & HVDC (sample) ─────────────────────────────────────────
  { id: "sm-1", buId: "submarine", title: "Subsea World News: 4 GW UK–DK interconnector enters tender phase", source: "Offshore Energy",   url: "https://www.offshore-energy.biz/", summary: "HVDC submarine cable RFQ expected H2 2026; multi-billion order opportunity.", countries: ["UK", "Denmark"], published_at: D(2), relevance_score: 0.95, tags: ["hvdc", "interconnector"] },
  { id: "sm-2", buId: "submarine", title: "4C Offshore: 2026 array-cable pipeline tops 1,200 km",            source: "4C Offshore",        url: "https://www.4coffshore.com/",      summary: "Offshore wind array cables — UK Round 4 + DE Nordsee leading.", countries: ["UK", "Germany"], published_at: D(5), relevance_score: 0.89, tags: ["offshore-wind"] },

  // ─── Building (sample) ──────────────────────────────────────────────────
  { id: "bd-1", buId: "building", title: "ENR: European hospital construction pipeline accelerates",         source: "Engineering News-Record", url: "https://www.enr.com/",         summary: "PNRR + France 2030 + NL Verduurzaming combine to sustain non-residential building cable demand.", countries: ["Italy", "France", "Netherlands"], published_at: D(2), relevance_score: 0.91, tags: ["healthcare", "non-residential"] },
];

export function buNewsFor(buId: string | null): BuNewsItem[] {
  if (!buId) return [];
  return BU_NEWS.filter((n) => n.buId === buId).sort((a, b) => b.published_at.localeCompare(a.published_at));
}

export function buSourcesFor(buId: string | null): BuSource[] {
  if (!buId) return [];
  return BU_SOURCES[buId] ?? [];
}
