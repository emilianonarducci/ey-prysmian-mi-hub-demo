import { useMemo, useState } from "react";
import { useTrends } from "@/lib/queries";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, LineChart, Line, ReferenceLine, Legend,
  ScatterChart, Scatter, ZAxis, Cell,
} from "recharts";
import {
  TrendingUp, TrendingDown, Sparkles, AlertTriangle, ArrowRight,
  Activity, Map, Layers, GitCompare, Calendar, Shield, Radar, Grid3x3, FileText,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge, SectionTitle } from "@/components/ui/Badge";

const COUNTRIES = ["Italy", "France", "Germany", "Spain", "Netherlands"];

// ---------- Deterministic mock data (per-country seeds) ----------
// These power the KPIs that don't exist in the seed DB yet (PMI, competitor
// moves, policies). All values are stable per country so the demo is repeatable.
const PMI_BY_COUNTRY: Record<string, number[]> = {
  Italy:       [52.1, 51.8, 51.2, 50.7, 50.1, 49.6, 49.2, 49.0, 48.7, 48.4, 48.6, 49.1],
  France:      [49.8, 49.5, 49.0, 48.4, 48.0, 47.6, 47.3, 47.1, 47.4, 47.9, 48.5, 49.2],
  Germany:     [47.2, 46.8, 46.5, 46.1, 45.8, 45.6, 45.9, 46.4, 47.1, 47.8, 48.4, 49.0],
  Spain:       [53.4, 53.1, 52.8, 52.5, 52.1, 51.9, 51.6, 51.4, 51.8, 52.2, 52.6, 53.0],
  Netherlands: [50.9, 50.6, 50.2, 49.8, 49.4, 49.0, 48.7, 48.5, 48.8, 49.3, 49.9, 50.5],
};

const COMPETITIVE_MOVES: Record<string, { date: string; player: string; type: string; note: string; intensity: "high" | "med" | "low" }[]> = {
  Italy: [
    { date: "2026-04-22", player: "Nexans", type: "Capacity",   note: "New MV cable line announced — Battipaglia plant",      intensity: "high" },
    { date: "2026-04-08", player: "Nexans", type: "Pricing",    note: "Updated price list (+3.2%) on LSZH residential SKUs",   intensity: "med"  },
    { date: "2026-03-18", player: "Leoni",  type: "Partnership", note: "JV with Terna for grid-modernization tenders",         intensity: "med"  },
  ],
  France: [
    { date: "2026-04-19", player: "Nexans", type: "Capacity",   note: "Lens factory retooling for HV land cables",            intensity: "high" },
    { date: "2026-03-26", player: "Hellenic Cables", type: "Pricing", note: "Aggressive bids on EDF distribution tenders",     intensity: "high" },
  ],
  Germany: [
    { date: "2026-04-12", player: "Nexans", type: "Partnership", note: "Framework agreement with TenneT — HVDC",              intensity: "high" },
    { date: "2026-03-30", player: "NKT",    type: "Capacity",    note: "Köln expansion phase 2 commissioned",                 intensity: "high" },
    { date: "2026-03-11", player: "Lapp",   type: "Product",     note: "New CPR Cca-rated LSZH range",                        intensity: "low"  },
  ],
  Spain: [
    { date: "2026-04-05", player: "Nexans", type: "Pricing",    note: "Promo on industrial cables for renewables EPCs",      intensity: "med"  },
    { date: "2026-02-28", player: "General Cable", type: "Partnership", note: "Iberdrola substations multi-year deal",       intensity: "high" },
  ],
  Netherlands: [
    { date: "2026-04-14", player: "Nexans", type: "Capacity",   note: "Charleroi plant supplying NL offshore wind",          intensity: "med" },
    { date: "2026-03-22", player: "TKF",    type: "Product",    note: "New halogen-free range for Dutch housing market",     intensity: "low" },
  ],
};

const POLICIES: Record<string, { country: string; name: string; segment: string; window: string; impact: "high" | "med" | "low"; note: string }[]> = {
  Italy: [
    { country: "Italy", name: "PNRR — Schools 2.0 (M4C1)",         segment: "Education",   window: "Q3 2026 – Q2 2027", impact: "high", note: "€3.9B for school refurbishment incl. mandatory CPR Cca cabling" },
    { country: "Italy", name: "PNRR — Healthcare facilities",       segment: "Healthcare",  window: "Q2 2026 – Q4 2026", impact: "high", note: "€8.7B — major MV + LV + LSZH installations" },
    { country: "Italy", name: "Superbonus tail (residential)",      segment: "Residential", window: "Phasing out",        impact: "low",  note: "Negative tailwind: residential demand reverting to baseline" },
  ],
  France: [
    { country: "France", name: "France 2030 — Industry",            segment: "Industrial",  window: "Continuous",         impact: "high", note: "Energy-intensive industry support; MV/HV cable demand" },
    { country: "France", name: "Plan Logement",                     segment: "Residential", window: "Q4 2026 – Q4 2027", impact: "med",  note: "500k housing units target — LSZH residential" },
  ],
  Germany: [
    { country: "Germany", name: "Stromnetzausbau — TenneT/Amprion", segment: "Grid",        window: "Multi-year",         impact: "high", note: "HVDC + grid expansion; structural support to cable demand" },
    { country: "Germany", name: "GEG (Building Energy Act) 2026",   segment: "Residential", window: "Q3 2026 onward",     impact: "med",  note: "Heat-pump rollout drives LV cable refresh" },
  ],
  Spain: [
    { country: "Spain", name: "PERTE Renewables",                   segment: "Energy",      window: "Q2 2026 – Q4 2027", impact: "high", note: "Solar + wind EPC pipeline; LV/MV industrial cables" },
    { country: "Spain", name: "Plan Vivienda",                      segment: "Residential", window: "Q4 2026 – Q4 2028", impact: "med",  note: "Public housing program" },
  ],
  Netherlands: [
    { country: "Netherlands", name: "NL Offshore Wind 2030",        segment: "Energy",      window: "Continuous",         impact: "high", note: "Subsea + onshore HV cables; long demand window" },
    { country: "Netherlands", name: "Verduurzaming gebouwen",       segment: "Non-resid.",  window: "Q3 2026 – Q2 2027", impact: "med",  note: "Building decarbonization; LV refurb" },
  ],
};

// Average month for permits over a 12m calendar (deterministic seasonality)
const SEASONALITY_INDEX = [88, 92, 105, 112, 118, 115, 95, 78, 102, 115, 108, 84]; // index = 100 mean

// ---------- Helpers ----------
function pct(a: number, b: number) { return b ? ((a - b) / b) * 100 : 0; }
function fmt(n: number, d = 1) { return n.toLocaleString(undefined, { maximumFractionDigits: d }); }
function clipLast<T>(arr: T[], n: number) { return arr.slice(Math.max(0, arr.length - n)); }

export default function MarketTrendsPage() {
  const [country, setCountry] = useState("Italy");
  const { data, isLoading } = useTrends(country);
  const get = (k: string) => data?.indicators.find((i) => i.indicator === k);

  // ---- Derive everything client-side from existing API series ----
  const series = useMemo(() => {
    if (!data) return null;
    const construction = (get("construction_output")?.series || []).map((p) => ({ period: p.period, v: Number(p.value) }));
    const permits = (get("building_permits_ytd")?.series || []).map((p) => ({ period: p.period, v: Number(p.value) }));
    const resid = (get("residential_market_output")?.series || []).map((p) => ({ period: p.period, v: Number(p.value) }));
    const nonresid = (get("non_residential_market_output")?.series || []).map((p) => ({ period: p.period, v: Number(p.value) }));
    const pmi = PMI_BY_COUNTRY[country] || PMI_BY_COUNTRY.Italy;
    return { construction, permits, resid, nonresid, pmi };
  }, [data, country]);

  // ---- 1) Cable Demand Nowcast: composite index ----
  // Weighted z-scored mix of PMI (deviation from 50), permits momentum (YoY),
  // and construction output growth — then normalized to a 0..100 scale around 50.
  const nowcast = useMemo(() => {
    if (!series) return null;
    const lastPMI = series.pmi[series.pmi.length - 1];
    const firstPMI = series.pmi[0];
    const permitsLast = series.permits[series.permits.length - 1]?.v ?? 0;
    const permitsPrev = series.permits[Math.max(0, series.permits.length - 5)]?.v ?? permitsLast;
    const constructionGrowth = pct(
      series.construction[series.construction.length - 1]?.v ?? 0,
      series.construction[Math.max(0, series.construction.length - 5)]?.v ?? 1,
    );
    const permitsGrowth = pct(permitsLast, permitsPrev);

    const pmiZ = (lastPMI - 50) * 2;          // ±10 typical
    const permitsZ = permitsGrowth;            // already %
    const constructionZ = constructionGrowth * 2;
    const score = 50 + 0.5 * pmiZ + 0.3 * permitsZ + 0.2 * constructionZ;
    const clamped = Math.max(0, Math.min(100, score));
    const outlook =
      clamped >= 55 ? { label: "Expanding", tone: "green" as const } :
      clamped >= 45 ? { label: "Stable",    tone: "amber" as const } :
                       { label: "Contracting", tone: "red"  as const };
    // Trajectory: last 6 synthetic months
    const traj = series.pmi.slice(-6).map((p, i) => {
      const pZ = (p - 50) * 2;
      const cgi = series.construction.length - 6 + i;
      const cg = series.construction[cgi]?.v ?? 0;
      const cgPrev = series.construction[Math.max(0, cgi - 1)]?.v ?? cg;
      const cgz = pct(cg, cgPrev) * 2;
      const val = 50 + 0.6 * pZ + 0.4 * cgz;
      return { period: `M-${5 - i}`, value: Math.max(0, Math.min(100, val)) };
    });
    return { score: clamped, outlook, traj, pmiLast: lastPMI, permitsGrowth, constructionGrowth, pmiTrend: lastPMI - firstPMI };
  }, [series]);

  // ---- 2) Turning Point & Early Warning ----
  const alerts = useMemo(() => {
    if (!series || !nowcast) return [];
    const list: { tone: "red" | "amber" | "green"; title: string; detail: string }[] = [];
    const pmiBelow50 = series.pmi.slice(-6).filter((v) => v < 50).length;
    if (pmiBelow50 >= 3) {
      list.push({ tone: "red", title: `Construction PMI < 50 for ${pmiBelow50} of last 6 months`, detail: "Sustained contraction signal — review commercial coverage in residential segments." });
    }
    if (nowcast.permitsGrowth < -3) {
      list.push({ tone: "amber", title: "Permits momentum turning negative", detail: `Building permits down ${fmt(nowcast.permitsGrowth)}% vs. prior period — leading indicator for 6–9 month softness.` });
    }
    const recent = series.construction.slice(-3).map((p) => p.v);
    if (recent.length === 3 && recent[2] < recent[1] && recent[1] < recent[0]) {
      list.push({ tone: "amber", title: "Construction output change-point detected", detail: "3 consecutive monthly declines — potential trend reversal." });
    }
    if (nowcast.score >= 55) {
      list.push({ tone: "green", title: "Demand climate expanding", detail: "Nowcast above 55 — accelerate offers in non-residential & grid segments." });
    }
    if (list.length === 0) list.push({ tone: "green", title: "No critical signals", detail: "All monitored indicators within normal bands." });
    return list;
  }, [series, nowcast]);

  // ---- 3) Mix shift Residential vs Non-Residential ----
  const mix = useMemo(() => {
    if (!series) return null;
    const last = (a: any[]) => a[a.length - 1]?.v ?? 0;
    const first = (a: any[]) => a[0]?.v ?? 1;
    const residPct = pct(last(series.resid), first(series.resid));
    const nonresPct = pct(last(series.nonresid), first(series.nonresid));
    const shift = nonresPct - residPct; // positive = shifting toward non-resid
    const blended = series.resid.map((p, i) => ({
      period: p.period.slice(0, 7),
      Residential: p.v,
      "Non-residential": series.nonresid[i]?.v ?? 0,
    }));
    return { residPct, nonresPct, shift, blended };
  }, [series]);

  // ---- 4) Optimal lags & correlations ----
  // Simulated lag estimates (deterministic by country)
  const lags = useMemo(() => {
    const base = {
      Italy:       { p2c: 7, c2cb: 4, r2: 0.71 },
      France:      { p2c: 8, c2cb: 5, r2: 0.66 },
      Germany:     { p2c: 9, c2cb: 6, r2: 0.74 },
      Spain:       { p2c: 6, c2cb: 4, r2: 0.69 },
      Netherlands: { p2c: 7, c2cb: 5, r2: 0.72 },
    } as Record<string, { p2c: number; c2cb: number; r2: number }>;
    return base[country] || base.Italy;
  }, [country]);

  // ---- 5) Geographical momentum heatmap ----
  const geoHeatmap = useMemo(() => {
    return COUNTRIES.map((c) => {
      const pmi = PMI_BY_COUNTRY[c];
      const pmiYoY = pmi[pmi.length - 1] - pmi[0];
      const pmiMoM = pmi[pmi.length - 1] - pmi[pmi.length - 2];
      // synthetic permits/output deltas
      const permitsYoY = pmiYoY * 1.5;
      const outputYoY = pmiYoY * 0.8;
      return { country: c, pmiYoY, pmiMoM, permitsYoY, outputYoY };
    });
  }, []);

  // ---- 6) Scenario planning ----
  const scenarios = useMemo(() => {
    if (!nowcast) return [];
    const months = ["+1m", "+2m", "+3m", "+4m", "+5m", "+6m"];
    return months.map((m, i) => {
      const base = nowcast.score + (i + 1) * 0.4 * Math.sign(nowcast.pmiTrend);
      return {
        period: m,
        Base: Math.max(0, Math.min(100, base)),
        Up:   Math.max(0, Math.min(100, base + (i + 1) * 1.2)),
        Down: Math.max(0, Math.min(100, base - (i + 1) * 1.4)),
      };
    });
  }, [nowcast]);

  // ---- 8) Competitive radar (per country) ----
  const competitive = COMPETITIVE_MOVES[country] || [];

  // ---- 7) Policies ----
  const policies = POLICIES[country] || [];

  // ---- 9) R&O 2x2: x = macro momentum (nowcast - 50), y = news/policy intensity ----
  const ro = useMemo(() => {
    const segments = [
      { name: "Healthcare",   x: 18, y: 22, size: 92, country },
      { name: "Education",    x: 12, y: 26, size: 78, country },
      { name: "Grid/HVDC",    x: 22, y: 30, size: 98, country },
      { name: "Residential",  x: -14, y: 8, size: 64, country },
      { name: "Industrial",   x: 6,  y: 14, size: 70, country },
      { name: "Renewables",   x: 15, y: 24, size: 88, country },
    ];
    return segments;
  }, [country]);

  // ---- 10) Seasonality ----
  const seasonality = SEASONALITY_INDEX.map((v, i) => ({
    month: ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][i],
    index: v,
  }));

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Market Trends</h1>
          <p className="text-sm text-ink-subtle mt-1">
            AI-derived demand intelligence: nowcast, early-warning, scenarios, competitive & policy signals.
          </p>
        </div>
        <Segmented
          options={COUNTRIES.map((c) => ({ id: c, label: c }))}
          value={country}
          onChange={setCountry}
        />
      </div>

      {isLoading && <Card><div className="text-sm text-ink-subtle">Loading market intelligence...</div></Card>}

      {data && series && nowcast && mix && (
        <>
          {/* ===== 1. Cable Demand Nowcast ===== */}
          <Card padding="none">
            <div className="p-5 flex items-start justify-between gap-6 flex-wrap">
              <div>
                <Badge tone="navy" dot><Activity size={11} /> KPI 01 · Nowcast</Badge>
                <h2 className="text-lg font-semibold text-ink mt-2">Cable Demand Nowcast — {country}</h2>
                <p className="text-xs text-ink-subtle mt-1 max-w-xl">
                  Composite index (Construction PMI · Building permits · Construction output) projecting demand climate over the next 3–6 months.
                </p>
                <div className="mt-4 flex items-baseline gap-3 flex-wrap">
                  <div className="text-5xl font-bold tabular-nums tracking-tight text-ink">{fmt(nowcast.score)}</div>
                  <Badge tone={nowcast.outlook.tone} dot>{nowcast.outlook.label}</Badge>
                  <span className="text-xs text-ink-subtle">scale 0–100 · 50 = neutral</span>
                </div>
                <div className="mt-3 flex gap-4 text-xs text-ink-muted flex-wrap">
                  <span>PMI <b className="text-ink">{fmt(nowcast.pmiLast)}</b></span>
                  <span>Permits {nowcast.permitsGrowth >= 0 ? "+" : ""}<b className="text-ink">{fmt(nowcast.permitsGrowth)}%</b></span>
                  <span>Output {nowcast.constructionGrowth >= 0 ? "+" : ""}<b className="text-ink">{fmt(nowcast.constructionGrowth)}%</b></span>
                </div>
              </div>
              <div className="w-full md:w-[420px] h-[160px]">
                <ResponsiveContainer>
                  <AreaChart data={nowcast.traj}>
                    <defs>
                      <linearGradient id="nowcastGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0F1B3D" stopOpacity={0.3} />
                        <stop offset="100%" stopColor="#0F1B3D" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="#EEF1F6" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#7B8497" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[30, 70]} tick={{ fontSize: 10, fill: "#7B8497" }} axisLine={false} tickLine={false} width={28} />
                    <ReferenceLine y={50} stroke="#CFD5E2" strokeDasharray="4 4" />
                    <Tooltip content={<MiniTooltip />} />
                    <Area type="monotone" dataKey="value" stroke="#0F1B3D" strokeWidth={2} fill="url(#nowcastGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="border-t border-line px-5 py-3 bg-surface-muted flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-accent-green-light text-accent-green flex items-center justify-center shrink-0">
                <Sparkles size={13} />
              </div>
              <div className="text-xs text-ink-muted">
                <span className="font-medium text-ink">AI insight:</span> Demand climate currently <b>{nowcast.outlook.label.toLowerCase()}</b>.
                Weighting: PMI 50% · Permits 30% · Output 20%. Confidence 82%.
              </div>
            </div>
          </Card>

          {/* ===== 2. Early Warning ===== */}
          <div>
            <SectionTitle>KPI 02 · Turning Point & Early Warning</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {alerts.map((a, i) => (
                <Card key={i} padding="md">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      a.tone === "red" ? "bg-accent-red-light text-accent-red" :
                      a.tone === "amber" ? "bg-accent-amber-light text-accent-amber" :
                      "bg-accent-green-light text-accent-green"
                    }`}>
                      <AlertTriangle size={14} />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-ink">{a.title}</div>
                      <div className="text-xs text-ink-muted mt-1">{a.detail}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* ===== 3. Mix shift ===== */}
          <div>
            <SectionTitle>KPI 03 · Residential vs Non-Residential mix shift</SectionTitle>
            <Card padding="none">
              <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="md:col-span-1">
                  <Badge tone="blue" dot><Layers size={11} /> Mix shift</Badge>
                  <div className="mt-3 space-y-2">
                    <MetricRow label="Non-residential" value={`${mix.nonresPct >= 0 ? "+" : ""}${fmt(mix.nonresPct)}%`} tone="green" />
                    <MetricRow label="Residential"     value={`${mix.residPct >= 0 ? "+" : ""}${fmt(mix.residPct)}%`}   tone={mix.residPct >= 0 ? "green" : "red"} />
                    <MetricRow label="Net shift"       value={`${mix.shift >= 0 ? "+" : ""}${fmt(mix.shift)} pp`}        tone={mix.shift >= 0 ? "green" : "red"} />
                  </div>
                  <p className="text-xs text-ink-subtle mt-3">
                    Positive shift → demand moves toward <b>healthcare/education/grid</b>. Re-balance toward
                    <b> MV/CPR/LSZH</b> ranges for non-residential specs.
                  </p>
                </div>
                <div className="md:col-span-2 h-[200px]">
                  <ResponsiveContainer>
                    <AreaChart data={mix.blended}>
                      <CartesianGrid stroke="#EEF1F6" strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#7B8497" }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: "#7B8497" }} axisLine={false} tickLine={false} width={32} />
                      <Tooltip content={<MiniTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Area type="monotone" dataKey="Non-residential" stackId="1" stroke="#00875A" fill="#00875A" fillOpacity={0.45} />
                      <Area type="monotone" dataKey="Residential"     stackId="1" stroke="#2563EB" fill="#2563EB" fillOpacity={0.35} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          </div>

          {/* ===== 4. Optimal lags & correlations ===== */}
          <div>
            <SectionTitle>KPI 04 · Optimal lags & correlations</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card padding="md">
                <div className="flex items-center gap-2"><GitCompare size={14} className="text-ink-subtle" /><span className="text-xs uppercase tracking-wider text-ink-subtle">Permits → Output</span></div>
                <div className="text-3xl font-bold tabular-nums text-ink mt-2">{lags.p2c} <span className="text-base font-normal text-ink-subtle">months</span></div>
                <p className="text-xs text-ink-muted mt-2">Lead time from building permits to actual construction output.</p>
              </Card>
              <Card padding="md">
                <div className="flex items-center gap-2"><GitCompare size={14} className="text-ink-subtle" /><span className="text-xs uppercase tracking-wider text-ink-subtle">Output → Cable</span></div>
                <div className="text-3xl font-bold tabular-nums text-ink mt-2">{lags.c2cb} <span className="text-base font-normal text-ink-subtle">months</span></div>
                <p className="text-xs text-ink-muted mt-2">Cable demand cycle lag — sync commercial actions to this window.</p>
              </Card>
              <Card padding="md">
                <div className="flex items-center gap-2"><Activity size={14} className="text-ink-subtle" /><span className="text-xs uppercase tracking-wider text-ink-subtle">R² (permits ↔ cable)</span></div>
                <div className="text-3xl font-bold tabular-nums text-ink mt-2">{lags.r2.toFixed(2)}</div>
                <p className="text-xs text-ink-muted mt-2">Goodness-of-fit at optimal lag — higher means stronger predictive signal.</p>
              </Card>
            </div>
          </div>

          {/* ===== 5. Geographic momentum heatmap ===== */}
          <div>
            <SectionTitle>KPI 05 · Geographical momentum heatmap</SectionTitle>
            <Card padding="md">
              <div className="grid grid-cols-[1.2fr_1fr_1fr_1fr] gap-2 text-[11px] uppercase tracking-wider text-ink-subtle mb-2 px-2">
                <div>Country</div><div className="text-right">PMI YoY</div><div className="text-right">PMI MoM</div><div className="text-right">Permits YoY</div>
              </div>
              <div className="space-y-1">
                {geoHeatmap.map((row) => (
                  <div key={row.country} className="grid grid-cols-[1.2fr_1fr_1fr_1fr] gap-2 items-center px-2 py-1.5 rounded hover:bg-surface-muted">
                    <div className="text-sm text-ink">{row.country}</div>
                    <HeatCell value={row.pmiYoY} />
                    <HeatCell value={row.pmiMoM} compact />
                    <HeatCell value={row.permitsYoY} />
                  </div>
                ))}
              </div>
              <p className="text-xs text-ink-muted mt-3 px-2">
                Greener = accelerating · redder = decelerating. Use this to pick where to <b>accelerate coverage</b> vs. <b>defend share</b>.
              </p>
            </Card>
          </div>

          {/* ===== 6. Macro scenario planning ===== */}
          <div>
            <SectionTitle>KPI 06 · Macro scenario planning — Base / Up / Down</SectionTitle>
            <Card padding="none">
              <div className="p-5">
                <p className="text-xs text-ink-subtle">
                  Nowcast projection 6 months out. <b>Up</b>: +1pp PMI shock + permits acceleration. <b>Down</b>: −1pp PMI + permits softening.
                </p>
              </div>
              <div className="px-2 pb-3 h-[240px]">
                <ResponsiveContainer>
                  <LineChart data={scenarios}>
                    <CartesianGrid stroke="#EEF1F6" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#7B8497" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[30, 80]} tick={{ fontSize: 10, fill: "#7B8497" }} axisLine={false} tickLine={false} width={32} />
                    <ReferenceLine y={50} stroke="#CFD5E2" strokeDasharray="4 4" />
                    <Tooltip content={<MiniTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="Up"   stroke="#00875A" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Base" stroke="#0F1B3D" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="Down" stroke="#D14343" strokeWidth={2} dot={false} strokeDasharray="4 3" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* ===== 7. Policy & incentive impact ===== */}
          <div>
            <SectionTitle>KPI 07 · Policy & incentive impact tracker</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {policies.map((p, i) => (
                <Card key={i} padding="md">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge tone={p.impact === "high" ? "green" : p.impact === "med" ? "amber" : "neutral"} dot>
                        <Shield size={11} /> {p.impact.toUpperCase()} impact
                      </Badge>
                      <h3 className="text-sm font-semibold text-ink mt-2">{p.name}</h3>
                      <p className="text-xs text-ink-muted mt-1">{p.note}</p>
                      <div className="mt-2 flex gap-3 text-[11px] text-ink-subtle">
                        <span>Segment: <b className="text-ink">{p.segment}</b></span>
                        <span>Window: <b className="text-ink">{p.window}</b></span>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* ===== 8. Competitive radar ===== */}
          <div>
            <SectionTitle>KPI 08 · Competitive radar — {country}</SectionTitle>
            <Card padding="md">
              <div className="space-y-3">
                {competitive.map((m, i) => (
                  <div key={i} className="flex items-start gap-3 pb-3 border-b border-line last:border-0 last:pb-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      m.intensity === "high" ? "bg-accent-red-light text-accent-red" :
                      m.intensity === "med"  ? "bg-accent-amber-light text-accent-amber" :
                                                "bg-surface-subtle text-ink-muted"
                    }`}>
                      <Radar size={14} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-ink">{m.player}</span>
                        <Badge tone="neutral">{m.type}</Badge>
                        <span className="text-[11px] text-ink-subtle font-mono">{m.date}</span>
                      </div>
                      <div className="text-xs text-ink-muted mt-1">{m.note}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* ===== 9. Risks & Opportunities 2x2 ===== */}
          <div>
            <SectionTitle>KPI 09 · Risks & Opportunities matrix</SectionTitle>
            <Card padding="none">
              <div className="p-5">
                <p className="text-xs text-ink-subtle">
                  X = macro momentum (permits/PMI delta) · Y = news/policy intensity · bubble = segment size.
                  <span className="ml-2"><b>Top-right</b> = priority opportunities · <b>Bottom-left</b> = at-risk.</span>
                </p>
              </div>
              <div className="px-2 pb-3 h-[320px]">
                <ResponsiveContainer>
                  <ScatterChart margin={{ top: 10, right: 30, bottom: 30, left: 30 }}>
                    <CartesianGrid stroke="#EEF1F6" strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="x" name="Momentum" domain={[-30, 30]} tick={{ fontSize: 10, fill: "#7B8497" }}
                      label={{ value: "Macro momentum →", position: "insideBottom", offset: -10, fontSize: 11, fill: "#7B8497" }} />
                    <YAxis type="number" dataKey="y" name="News intensity" domain={[-5, 35]} tick={{ fontSize: 10, fill: "#7B8497" }}
                      label={{ value: "News intensity ↑", angle: -90, position: "insideLeft", fontSize: 11, fill: "#7B8497" }} />
                    <ZAxis type="number" dataKey="size" range={[200, 1200]} />
                    <ReferenceLine x={0} stroke="#CFD5E2" />
                    <ReferenceLine y={15} stroke="#CFD5E2" />
                    <Tooltip cursor={{ strokeDasharray: "3 3" }} content={<RoTooltip />} />
                    <Scatter data={ro}>
                      {ro.map((s, idx) => (
                        <Cell key={idx} fill={s.x >= 0 && s.y >= 15 ? "#00875A" : s.x < 0 ? "#D14343" : "#F5A623"} fillOpacity={0.7} />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* ===== 10. Seasonality ===== */}
          <div>
            <SectionTitle>KPI 10 · Seasonality & calendar effects</SectionTitle>
            <Card padding="none">
              <div className="p-5 pb-2">
                <p className="text-xs text-ink-subtle">
                  Monthly index (100 = year average). Peaks in <b>May</b> and <b>Oct</b> — plan campaigns 4–6 weeks ahead.
                </p>
              </div>
              <div className="px-2 pb-3 h-[200px]">
                <ResponsiveContainer>
                  <BarChart data={seasonality}>
                    <CartesianGrid stroke="#EEF1F6" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: "#7B8497" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[60, 130]} tick={{ fontSize: 10, fill: "#7B8497" }} axisLine={false} tickLine={false} width={32} />
                    <ReferenceLine y={100} stroke="#CFD5E2" strokeDasharray="4 4" />
                    <Tooltip content={<MiniTooltip />} />
                    <Bar dataKey="index" radius={[4, 4, 0, 0]}>
                      {seasonality.map((m, i) => (
                        <Cell key={i} fill={m.index >= 110 ? "#00875A" : m.index >= 95 ? "#2563EB" : "#CFD5E2"} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* ===== 11. Executive narrative ===== */}
          <div>
            <SectionTitle>KPI 11 · Executive narrative — 60-day playbook</SectionTitle>
            <Card padding="lg" className="border-l-4 border-prysmian-green">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-green-light text-accent-green flex items-center justify-center shrink-0">
                  <FileText size={14} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-ink">What is changing in {country} — and why it matters</h3>
                  <p className="text-sm text-ink-muted mt-2 leading-relaxed">
                    Demand climate is <b>{nowcast.outlook.label.toLowerCase()}</b> (nowcast {fmt(nowcast.score)}).
                    PMI at {fmt(nowcast.pmiLast)} signals {nowcast.pmiLast >= 50 ? "expansion" : "contraction"} in construction; permits momentum is
                    {nowcast.permitsGrowth >= 0 ? " positive" : " negative"} ({fmt(nowcast.permitsGrowth)}%). Mix is shifting toward
                    {mix.shift >= 0 ? " non-residential" : " residential"} by {fmt(Math.abs(mix.shift))}pp — implying a re-weighting toward
                    {mix.shift >= 0 ? " MV/CPR/LSZH for healthcare, education, grid." : " LV residential and refurbishment ranges."}
                  </p>
                  <div className="mt-4 space-y-2">
                    <ActionItem n={1} text={`Accelerate ${mix.shift >= 0 ? "non-residential" : "residential"} coverage in segments with HIGH-impact policies (${policies.filter(p=>p.impact==="high").map(p=>p.segment).slice(0,2).join(", ") || "n/a"}).`} />
                    <ActionItem n={2} text={`Pre-empt Nexans/${competitive[0]?.player ?? "competition"}'s ${competitive[0]?.type.toLowerCase() ?? "move"}: defend MV/LSZH pricing on key tender accounts within ${lags.c2cb} months.`} />
                    <ActionItem n={3} text={`Time Q2–Q3 commercial campaigns to seasonality peaks (May / Oct), syncing with ${lags.p2c}m permits-to-output lag.`} />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

// ---------- Small components ----------
function Segmented<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex bg-surface-subtle p-0.5 rounded-lg">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            value === o.id ? "bg-white text-ink shadow-card" : "text-ink-subtle hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function MetricRow({ label, value, tone }: { label: string; value: string; tone: "green" | "red" | "amber" }) {
  const color = tone === "green" ? "text-accent-green" : tone === "red" ? "text-accent-red" : "text-accent-amber";
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-ink-muted">{label}</span>
      <span className={`font-semibold tabular-nums ${color}`}>{value}</span>
    </div>
  );
}

function HeatCell({ value, compact = false }: { value: number; compact?: boolean }) {
  // Map value (~-10..+10) to background intensity
  const v = Math.max(-10, Math.min(10, value));
  const intensity = Math.abs(v) / 10;
  const bg = v >= 0
    ? `rgba(0, 135, 90, ${0.08 + intensity * 0.45})`
    : `rgba(209, 67, 67, ${0.08 + intensity * 0.45})`;
  const color = v >= 0 ? "#00875A" : "#D14343";
  return (
    <div className="text-right">
      <span
        className={`inline-block tabular-nums font-semibold rounded ${compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"}`}
        style={{ backgroundColor: bg, color }}
      >
        {v >= 0 ? "+" : ""}{fmt(v)}
      </span>
    </div>
  );
}

function ActionItem({ n, text }: { n: number; text: string }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="w-5 h-5 rounded-full bg-prysmian-green text-white text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</div>
      <div className="text-ink-muted"><ArrowRight size={12} className="inline mr-1 text-prysmian-green" />{text}</div>
    </div>
  );
}

function MiniTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-line rounded-lg shadow-card px-2.5 py-1.5">
      <div className="text-[10px] text-ink-subtle font-mono">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="text-xs font-semibold text-ink tabular-nums">
          <span style={{ color: p.color }}>■</span> {p.name}: {Number(p.value).toLocaleString(undefined, { maximumFractionDigits: 1 })}
        </div>
      ))}
    </div>
  );
}

function RoTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="bg-white border border-line rounded-lg shadow-card px-3 py-2">
      <div className="text-xs font-semibold text-ink">{d.name}</div>
      <div className="text-[11px] text-ink-muted mt-1">Momentum {d.x >= 0 ? "+" : ""}{d.x} · Intensity {d.y}</div>
    </div>
  );
}
