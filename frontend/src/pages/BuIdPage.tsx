import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Briefcase, Filter, Download, Sparkles, Target, TrendingUp, TrendingDown,
  Users, Package, Swords, Wallet, Globe, ArrowRight,
  Factory, ArrowUpDown, Car, Pickaxe, Wind, Network, Cable, Zap, Waves, Building2, Fuel, TrainFront,
} from "lucide-react";

const BU_ICONS: Record<string, any> = {
  Factory, ArrowUpDown, Car, Pickaxe, Wind, Network, Cable, Zap, Waves, Building2, Fuel, TrainFront, Briefcase,
};
function BuIcon({ name, size = 14, className = "" }: { name: string; size?: number; className?: string }) {
  const Cmp = BU_ICONS[name] || Briefcase;
  return <Cmp size={size} className={className} />;
}
import { Card } from "@/components/ui/Card";
import { Badge, SectionTitle } from "@/components/ui/Badge";
import { BUSINESS_UNITS, findBu } from "@/lib/bus";

const COUNTRIES = ["Italy", "France", "Germany", "Spain", "Netherlands", "UK", "Poland"];

// Deterministic synth: stable per (bu, country) ----------------------------
function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h) + s.charCodeAt(i);
  return Math.abs(h | 0);
}
function pick<T>(seed: number, arr: T[]): T { return arr[seed % arr.length]; }

// Synthesizes BU-level dataset (sales by country, by product, competitors, SoW)
function buDataset(buId: string, countryFilter: string | null) {
  const seed = hash(buId);
  const mult = countryFilter ? 0.18 : 1; // when filtered, scale down to a single country slice

  const productsCatalog: Record<string, string[]> = {
    ic:          ["LV power cables", "MV distribution", "Control & instrumentation", "Halogen-free LSZH", "Armoured cables", "Fire-resistant"],
    elevators:   ["Travelling cables", "Flat elevator cables", "Crane reeling", "Festoon systems", "Suspension cables"],
    automotive:  ["EV charging cables", "Battery interconnect", "High-voltage harness", "Sensor wiring", "Charging station LV"],
    mining:      ["Trailing cables", "Reeling cables", "Shaft cables", "Heavy mining MV", "Drilling cables"],
    renewable:   ["Solar DC strings", "Wind tower cables", "Offshore wind array", "Inverter cables", "Energy storage links"],
    fiber:       ["Single-mode OF", "Multi-mode OF", "FTTH drop", "DC backbone", "Loose tube", "Ribbon cable"],
    connectivity:["MV joints", "HV terminations", "LV accessories", "Pre-mold kits", "Cable glands"],
    "power-grid":["HV overhead", "EHV underground", "MV distribution", "Joints & terminations", "DC link cables"],
    submarine:   ["HVDC submarine", "Array offshore", "Export cables", "Umbilicals", "Repeaters"],
    building:    ["LSZH residential", "CPR Cca", "CPR B2ca", "Flexible cords", "Fire safety"],
    oilgas:      ["Subsea umbilicals", "DHV flowlines", "Wellhead cables", "Platform LV"],
    railway:     ["Traction power", "Signalling", "Rolling stock", "Catenary feeders"],
  };
  const competitorsCatalog: Record<string, string[]> = {
    ic:          ["Nexans", "NKT", "General Cable", "Top Cable", "Lapp"],
    elevators:   ["Nexans", "Drahtex", "Schöller", "Tractel"],
    automotive:  ["Leoni", "Sumitomo Wiring", "Yazaki", "Lear", "Aptiv"],
    mining:      ["Nexans", "Hellenic Cables", "Ducab", "TF Kable"],
    renewable:   ["Nexans", "NKT", "Hellenic Cables", "Tratos", "Top Cable"],
    fiber:       ["Corning", "OFS (Furukawa)", "Fujikura", "Sumitomo Electric", "CommScope"],
    connectivity:["TE Connectivity", "3M", "ABB", "Nexans"],
    "power-grid":["Nexans", "NKT", "ABB", "Hellenic Cables", "LS Cable"],
    submarine:   ["Nexans", "NKT", "Sumitomo Electric", "JDR"],
    building:    ["Nexans", "Top Cable", "General Cable", "Lapp", "TFKable"],
    oilgas:      ["Nexans", "JDR", "Aker Solutions", "TechnipFMC"],
    railway:     ["Nexans", "Lapp", "Helkama", "TFKable"],
  };

  // Sales by country (Prysmian revenue per country, in €k)
  const sales_by_country = COUNTRIES.map((c, i) => {
    const v = ((hash(buId + c) % 800) + 120) * mult;
    return { name: c, value: Math.round(v * 1000), detail: pick(seed + i, ["Strong account base", "Growing pipeline", "Stable demand", "Tender opportunities"]) };
  })
    .filter((r) => !countryFilter || r.name === countryFilter)
    .sort((a, b) => b.value - a.value);

  // Sales by product within BU
  const products = productsCatalog[buId] || ["Cable A", "Cable B", "Cable C", "Cable D"];
  const sales_by_product = products.map((p, i) => {
    const v = ((hash(buId + p) % 600) + 80) * mult;
    return { name: p, value: Math.round(v * 1000), detail: pick(seed + i + 7, ["Top-margin", "Volume seller", "Growth product", "Niche specialty"]) };
  }).sort((a, b) => b.value - a.value);

  // Competitors
  const competitorsRaw = competitorsCatalog[buId] || ["Nexans", "Generic Cable Co"];
  const competitors = competitorsRaw.map((c, i) => ({
    name: c,
    detail: i < 2 ? "Tier 1 · Global" : "Tier 2 · Regional",
  }));

  // Market value by country (total addressable for this BU)
  const market_value_by_country = sales_by_country.map((r) => {
    const factor = 1.4 + ((hash(buId + r.name) % 80) / 100); // 1.4–2.2x
    return { name: r.name, value: Math.round(r.value * factor), detail: r.detail };
  });

  return { sales_by_country, sales_by_product, competitors, market_value_by_country };
}

export default function BuIdPage() {
  const { id = "ic" } = useParams<{ id: string }>();
  const nav = useNavigate();
  const meta = findBu(id) ?? BUSINESS_UNITS[0];

  const [countryFilter, setCountryFilter] = useState<string | null>(null);

  const dataset = useMemo(() => buDataset(meta.id, countryFilter), [meta.id, countryFilter]);

  // SoW: my sales / market value, per country
  const sow = useMemo(() => {
    const mvMap = new Map(dataset.market_value_by_country.map((r) => [r.name, r.value]));
    return dataset.sales_by_country
      .map((s) => {
        const market = mvMap.get(s.name) ?? 0;
        const share = market > 0 ? s.value / market : 0;
        const gap = Math.max(0, market - s.value);
        return { name: s.name, mySales: s.value, market, share, gap };
      })
      .sort((a, b) => b.gap - a.gap);
  }, [dataset]);

  const totals = useMemo(() => {
    const mySales = dataset.sales_by_country.reduce((s, r) => s + r.value, 0);
    const marketValue = dataset.market_value_by_country.reduce((s, r) => s + r.value, 0);
    return {
      mySales,
      marketValue,
      sow: marketValue > 0 ? mySales / marketValue : 0,
      whitespace: Math.max(0, marketValue - mySales),
    };
  }, [dataset]);

  const topGap = sow[0];

  function exportCsv() {
    const rows: string[][] = [["quadrant", "name", "value_eur", "detail"]];
    dataset.sales_by_country.forEach((r) => rows.push(["sales_by_country", r.name, String(r.value), r.detail]));
    dataset.sales_by_product.forEach((r) => rows.push(["sales_by_product", r.name, String(r.value), r.detail]));
    dataset.competitors.forEach((r) => rows.push(["competitors", r.name, "", r.detail]));
    dataset.market_value_by_country.forEach((r) => rows.push(["market_value_by_country", r.name, String(r.value), r.detail]));
    const csv = rows.map((r) => r.map((c) => `"${(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bu-id-${meta.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-ink-subtle">
        <Briefcase size={14} />
        <span>Business Unit ID</span>
        <span className="text-ink-faint">/</span>
        <span className="text-ink inline-flex items-center gap-1.5"><BuIcon name={meta.iconName} size={13} className="text-ink-subtle" /> {meta.name}</span>
      </div>

      {/* BU switcher */}
      <Card padding="sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-ink-subtle mr-1">Business Unit:</span>
          {BUSINESS_UNITS.map((b) => (
            <button
              key={b.id}
              onClick={() => nav(`/bu/${b.id}`)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                b.id === meta.id
                  ? "bg-prysmian-green text-white"
                  : b.hasData
                  ? "border border-line text-ink-muted hover:bg-surface-subtle"
                  : "border border-line text-ink-faint hover:bg-surface-subtle opacity-70"
              }`}
              title={b.description}
            >
              <BuIcon name={b.iconName} size={14} />
              {b.short}
              {!b.hasData && <span className="chip bg-surface-subtle text-ink-faint text-[9px] ml-1">P2</span>}
            </button>
          ))}
          <Link to="/country/italy" className="btn-ghost text-xs ml-auto">
            View by Country <ArrowRight size={11} />
          </Link>
        </div>
      </Card>

      {!meta.hasData && (
        <Card>
          <div className="text-center py-10">
            <BuIcon name={meta.iconName} size={32} className="mx-auto text-ink-faint mb-3" />
            <div className="text-sm font-semibold text-ink">{meta.name} · Phase 2 rollout</div>
            <div className="text-xs text-ink-subtle mt-1 max-w-md mx-auto">
              Commercial seed data for {meta.name} will arrive in Phase 1 (SAP+Salesforce integration).
            </div>
          </div>
        </Card>
      )}

      {meta.hasData && (
        <>
          {/* AI Insight banner */}
          <section className="card p-5 border-l-4 border-l-prysmian-green">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-green-light text-accent-green flex items-center justify-center shrink-0">
                <Sparkles size={18} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-semibold text-ink">AI Business Unit Insight · {meta.name}</h2>
                  <Badge tone="green" dot>Evidence-backed · confidence 86%</Badge>
                </div>
                <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                  In <b className="text-ink">{meta.name}</b>{countryFilter ? <> · <b className="text-ink">{countryFilter}</b></> : ""}, Prysmian holds an average share-of-wallet of <b className="text-ink">{(totals.sow * 100).toFixed(0)}%</b>{" "}
                  on a tracked market of <b className="text-ink">€{(totals.marketValue / 1000).toFixed(0)}k</b>.
                  Total <b className="text-ink">white space ~€{(totals.whitespace / 1000).toFixed(0)}k</b> across the country cluster.
                  {topGap && (
                    <> Highest gap in <b className="text-ink">{topGap.name}</b> (only {(topGap.share * 100).toFixed(0)}% share, €{(topGap.gap / 1000).toFixed(0)}k untapped) — recommended priority for {meta.short} acceleration.</>
                  )}
                </p>
                <div className="mt-2 text-xs text-ink-subtle italic">{meta.description}</div>
              </div>
            </div>
          </section>

          {/* Macro snapshot strip */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MacroTile label="Share of wallet" value={`${(totals.sow * 100).toFixed(0)}%`} hint="across countries tracked" tone="green" icon={<Target size={14} />} />
            <MacroTile label="My sales (BU)"   value={`€${(totals.mySales / 1000).toFixed(0)}k`} hint={countryFilter ?? "all countries"} tone="blue" icon={<Wallet size={14} />} />
            <MacroTile label="White space"     value={`€${(totals.whitespace / 1000).toFixed(0)}k`} hint="upside vs market" tone="amber" icon={<TrendingUp size={14} />} />
            <MacroTile label="Active countries" value={`${dataset.sales_by_country.length}`} hint={countryFilter ? "filtered" : "EU footprint"} tone="neutral" icon={<Globe size={14} />} />
          </section>

          {/* Country filter bar */}
          <Card padding="sm">
            <div className="flex flex-wrap items-center gap-2">
              <Filter size={13} className="text-ink-subtle mr-1" />
              <span className="text-xs font-medium text-ink-subtle">Country:</span>
              <button
                onClick={() => setCountryFilter(null)}
                className={`chip ${countryFilter === null ? "bg-ey-navy text-white" : "bg-surface-subtle text-ink-muted hover:bg-line"}`}
              >
                All countries
              </button>
              {COUNTRIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCountryFilter(c === countryFilter ? null : c)}
                  className={`chip ${countryFilter === c ? "bg-ey-navy text-white" : "bg-surface-subtle text-ink-muted hover:bg-line"}`}
                >
                  {c}
                </button>
              ))}
              {countryFilter && <span className="text-[11px] text-ink-faint italic">Showing {countryFilter} slice for {meta.name}</span>}
              <button onClick={exportCsv} className="btn-outline text-xs ml-auto">
                <Download size={12} /> Export CSV
              </button>
            </div>
          </Card>

          {/* Quadrants */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <RankQuadrant
              title="Sales by Country"
              subtitle={`Prysmian ${meta.short} revenue per country`}
              icon={<Globe size={14} />}
              rows={dataset.sales_by_country}
              total={totals.mySales}
              barColor="#00875A"
              valuePrefix="€"
            />
            <RankQuadrant
              title="Sales by Product"
              subtitle={`${meta.name} product mix`}
              icon={<Package size={14} />}
              rows={dataset.sales_by_product}
              total={dataset.sales_by_product.reduce((s, r) => s + r.value, 0)}
              barColor="#2563EB"
              valuePrefix="€"
            />

            <CompetitorQuadrant rows={dataset.competitors} />

            <SoWQuadrant rows={sow} />
          </div>

          {/* AI suggestions */}
          <Card padding="md">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-amber-light text-accent-amber flex items-center justify-center shrink-0">
                <Sparkles size={14} />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-ink">Recommended actions for {meta.short}</h3>
                <ul className="mt-2 space-y-1.5 text-xs text-ink-muted">
                  <li>→ Accelerate coverage in <b className="text-ink">{topGap?.name ?? "highest-gap country"}</b> — €{((topGap?.gap ?? 0) / 1000).toFixed(0)}k untapped.</li>
                  <li>→ Defend share against <b className="text-ink">{dataset.competitors[0]?.name}</b> through long-term framework agreements.</li>
                  <li>→ Push the top-3 products ({dataset.sales_by_product.slice(0, 3).map((p) => p.name).join(", ")}) — highest margin pool.</li>
                </ul>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

// ---------- Sub-components ----------
function MacroTile({ label, value, hint, tone, icon }: { label: string; value: string; hint: string; tone: "green" | "blue" | "amber" | "neutral"; icon: React.ReactNode }) {
  const bg = tone === "green" ? "bg-accent-green-light text-accent-green" : tone === "blue" ? "bg-accent-blue-light text-accent-blue" : tone === "amber" ? "bg-accent-amber-light text-accent-amber" : "bg-surface-subtle text-ink-muted";
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">{label}</div>
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${bg}`}>{icon}</div>
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums text-ink">{value}</div>
      <div className="mt-1 text-[11px] text-ink-subtle">{hint}</div>
    </div>
  );
}

function RankQuadrant({ title, subtitle, icon, rows, total, barColor, valuePrefix }: { title: string; subtitle: string; icon: React.ReactNode; rows: { name: string; value: number; detail: string }[]; total: number; barColor: string; valuePrefix?: string }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <Card padding="none">
      <div className="px-5 py-3.5 border-b border-line flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-surface-subtle text-ink-muted flex items-center justify-center">{icon}</div>
          <div>
            <h3 className="text-sm font-semibold text-ink">{title}</h3>
            <p className="text-[11px] text-ink-subtle">{subtitle}</p>
          </div>
        </div>
      </div>
      <ul className="divide-y divide-line">
        {rows.map((r, i) => {
          const v = r.value;
          const pct = v / max;
          const share = total > 0 ? v / total : 0;
          return (
            <li key={i}>
              <div className="w-full text-left px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-ink-faint w-5">#{i + 1}</span>
                  <span className="text-sm text-ink font-medium flex-1 truncate">{r.name}</span>
                  <span className="text-xs font-mono tabular-nums text-ink-muted">{share ? `${(share * 100).toFixed(0)}%` : ""}</span>
                  <span className="text-sm font-semibold tabular-nums text-ink min-w-[80px] text-right">
                    {valuePrefix ?? ""}{v.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-surface-subtle overflow-hidden ml-8">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(2, pct * 100)}%`, backgroundColor: barColor }} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function CompetitorQuadrant({ rows }: { rows: { name: string; detail: string }[] }) {
  const enriched = rows.map((r, i) => {
    const tier = r.detail.includes("1") ? 1 : 2;
    const baseShare = tier === 1 ? 18 - i * 2 : 9 - i;
    const share = Math.max(2, baseShare + (i % 2 === 0 ? 1 : -1));
    const trend = i % 3 === 0 ? "up" : i % 3 === 1 ? "down" : "flat";
    return { ...r, tier, share, trend };
  });
  const max = Math.max(...enriched.map((r) => r.share), 1);
  return (
    <Card padding="none">
      <div className="px-5 py-3.5 border-b border-line flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent-red-light text-accent-red flex items-center justify-center"><Swords size={14} /></div>
          <div>
            <h3 className="text-sm font-semibold text-ink">Competitors in this BU</h3>
            <p className="text-[11px] text-ink-subtle">Estimated market share & momentum</p>
          </div>
        </div>
      </div>
      <ul className="divide-y divide-line">
        {enriched.map((r, i) => (
          <li key={i}>
            <div className="w-full text-left px-5 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono text-ink-faint w-5">#{i + 1}</span>
                <span className="text-sm text-ink font-medium flex-1 truncate">{r.name}</span>
                <Badge tone={r.tier === 1 ? "red" : "neutral"}>Tier {r.tier}</Badge>
                <span className="text-xs font-mono tabular-nums text-ink-muted min-w-[40px] text-right">~{r.share}%</span>
                <span className={`chip text-[10px] ${r.trend === "up" ? "bg-accent-red-light text-accent-red" : r.trend === "down" ? "bg-accent-green-light text-accent-green" : "bg-surface-subtle text-ink-muted"}`}>
                  {r.trend === "up" ? <TrendingUp size={10} /> : r.trend === "down" ? <TrendingDown size={10} /> : "·"}
                </span>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-surface-subtle overflow-hidden ml-8">
                <div className="h-full rounded-full bg-accent-red transition-all" style={{ width: `${Math.max(2, (r.share / max) * 100)}%` }} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function SoWQuadrant({ rows }: { rows: { name: string; mySales: number; market: number; share: number; gap: number }[] }) {
  const maxMarket = Math.max(...rows.map((r) => r.market), 1);
  return (
    <Card padding="none">
      <div className="px-5 py-3.5 border-b border-line">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent-amber-light text-accent-amber flex items-center justify-center"><Target size={14} /></div>
            <div>
              <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                Share of Wallet by Country
                <Badge tone="green"><Sparkles size={9} /> AI</Badge>
              </h3>
              <p className="text-[11px] text-ink-subtle">Prysmian sales vs total BU market spend · sorted by white-space gap</p>
            </div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-4 text-[11px]">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-prysmian-green" /> My sales</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-sm bg-accent-amber-light border border-accent-amber" /> Untapped market</span>
        </div>
      </div>
      <ul className="divide-y divide-line">
        {rows.map((r, i) => {
          const mySalesPct = (r.mySales / maxMarket) * 100;
          const gapPct = (r.gap / maxMarket) * 100;
          const sowPct = (r.share * 100).toFixed(0);
          return (
            <li key={i}>
              <div className="w-full text-left px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-ink font-medium flex-1 truncate">{r.name}</span>
                  <Badge tone={r.share < 0.4 ? "amber" : r.share < 0.7 ? "blue" : "green"}>SoW {sowPct}%</Badge>
                  <span className="text-xs font-mono tabular-nums text-ink-muted min-w-[80px] text-right">€{r.gap.toLocaleString()} gap</span>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-surface-subtle overflow-hidden flex">
                  <div className="h-full bg-prysmian-green transition-all" style={{ width: `${mySalesPct}%` }} />
                  <div className="h-full bg-accent-amber-light border-r border-accent-amber transition-all" style={{ width: `${gapPct}%` }} />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
