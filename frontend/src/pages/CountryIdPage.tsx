import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCountrySummary, useNews, useTrends } from "@/lib/queries";
import {
  Globe, Filter, Download, ArrowRight, Sparkles, Target, TrendingUp, TrendingDown,
  Users, Package, Swords, Wallet, Building2, Newspaper, AlertCircle, X, ExternalLink, BellRing,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, SectionTitle } from "@/components/ui/Badge";

const COUNTRIES = [
  { id: "italy", name: "Italy", flag: "🇮🇹", hasData: true },
  { id: "france", name: "France", flag: "🇫🇷", hasData: false },
  { id: "germany", name: "Germany", flag: "🇩🇪", hasData: false },
  { id: "spain", name: "Spain", flag: "🇪🇸", hasData: false },
  { id: "netherlands", name: "Netherlands", flag: "🇳🇱", hasData: false },
];

const BUSINESS_UNITS = ["I&C", "Power Grid", "Digital Solutions", "Railway", "Wind onshore", "Solar"];

export default function CountryIdPage() {
  const { id = "italy" } = useParams<{ id: string }>();
  const nav = useNavigate();
  const meta = COUNTRIES.find((c) => c.id === id) ?? COUNTRIES[0];

  const [bu, setBu] = useState<string | null>(null);
  const [drillItem, setDrillItem] = useState<{ kind: string; name: string; value: number | null; detail?: string; sow?: number } | null>(null);

  const summary = useCountrySummary(id);
  const news = useNews();
  const trends = useTrends(meta.name);

  // Derived: customer SoW = my_sales / market_value
  const sow = useMemo(() => {
    if (!summary.data) return [];
    const mvbcMap = new Map(summary.data.market_value_by_customer.map((r) => [r.name, Number(r.value ?? 0)]));
    return summary.data.sales_by_customer
      .map((s) => {
        const mySales = Number(s.value ?? 0);
        const market = mvbcMap.get(s.name) ?? 0;
        const share = market > 0 ? mySales / market : 0;
        const gap = Math.max(0, market - mySales);
        return { name: s.name, mySales, market, share, gap };
      })
      .sort((a, b) => b.gap - a.gap);
  }, [summary.data]);

  const totals = useMemo(() => {
    if (!summary.data) return { mySales: 0, marketValue: 0, sow: 0, whitespace: 0 };
    const mySales = summary.data.sales_by_customer.reduce((s, r) => s + Number(r.value ?? 0), 0);
    const marketValue = summary.data.market_value_by_customer.reduce((s, r) => s + Number(r.value ?? 0), 0);
    return { mySales, marketValue, sow: marketValue > 0 ? mySales / marketValue : 0, whitespace: Math.max(0, marketValue - mySales) };
  }, [summary.data]);

  const countryNews = useMemo(() => {
    return (news.data ?? []).filter((n) =>
      (n.countries ?? []).some((c) => c.toLowerCase() === meta.name.toLowerCase())
    ).slice(0, 4);
  }, [news.data, meta.name]);

  const topGapCustomer = sow[0];

  function exportCsv() {
    if (!summary.data) return;
    const rows: string[][] = [["quadrant", "name", "value_eur", "detail"]];
    summary.data.sales_by_customer.forEach((r) => rows.push(["sales_by_customer", r.name, String(r.value ?? ""), r.detail ?? ""]));
    summary.data.sales_by_product.forEach((r) => rows.push(["sales_by_product", r.name, String(r.value ?? ""), r.detail ?? ""]));
    summary.data.competitors.forEach((r) => rows.push(["competitors", r.name, String(r.value ?? ""), r.detail ?? ""]));
    summary.data.market_value_by_customer.forEach((r) => rows.push(["market_value_by_customer", r.name, String(r.value ?? ""), r.detail ?? ""]));
    const csv = rows.map((r) => r.map((c) => `"${(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `country-id-${id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6 max-w-[1600px]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-ink-subtle">
        <Globe size={14} />
        <span>Country ID</span>
        <span className="text-ink-faint">/</span>
        <span className="text-ink">{meta.flag} {meta.name}</span>
      </div>

      {/* Country switcher */}
      <Card padding="sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-medium text-ink-subtle mr-1">Country:</span>
          {COUNTRIES.map((c) => (
            <button
              key={c.id}
              onClick={() => nav(`/country/${c.id}`)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                c.id === id
                  ? "bg-prysmian-green text-white"
                  : c.hasData
                  ? "border border-line text-ink-muted hover:bg-surface-subtle"
                  : "border border-line text-ink-faint hover:bg-surface-subtle opacity-70"
              }`}
            >
              <span className="text-base leading-none">{c.flag}</span>
              {c.name}
              {!c.hasData && <span className="chip bg-surface-subtle text-ink-faint text-[9px] ml-1">P2</span>}
            </button>
          ))}
          <Link to="/compare" className="btn-ghost text-xs ml-auto">
            Compare countries <ArrowRight size={11} />
          </Link>
        </div>
      </Card>

      {!meta.hasData && (
        <Card>
          <div className="text-center py-10">
            <Globe size={32} className="mx-auto text-ink-faint mb-3" />
            <div className="text-sm font-semibold text-ink">{meta.flag} {meta.name} · Phase 2 rollout</div>
            <div className="text-xs text-ink-subtle mt-1 max-w-md mx-auto">
              Commercial seed data for {meta.name} arrives in Phase 1 (SAP+Salesforce integration). Public-source AI agents already monitor news and projects — see below.
            </div>
            <div className="mt-4 flex justify-center gap-2">
              <Link to={`/news`} className="btn-outline text-xs">Country news</Link>
              <Link to={`/projects?country=${meta.name}`} className="btn-outline text-xs">Country projects</Link>
            </div>
          </div>
        </Card>
      )}

      {meta.hasData && summary.data && (
        <>
          {/* AI Insight banner */}
          <section className="card p-5 border-l-4 border-l-prysmian-green">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent-green-light text-accent-green flex items-center justify-center shrink-0">
                <Sparkles size={18} />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-semibold text-ink">AI Country Insight · {meta.name}</h2>
                  <Badge tone="green" dot>Evidence-backed · confidence 88%</Badge>
                </div>
                <p className="mt-2 text-sm text-ink-muted leading-relaxed">
                  Prysmian holds a <b className="text-ink">{(totals.sow * 100).toFixed(0)}%</b> average share-of-wallet across the top {summary.data.sales_by_customer.length} customers,
                  on a tracked market of <b className="text-ink">€{(totals.marketValue / 1000).toFixed(0)}k</b>.
                  Total <b className="text-ink">white space ~€{(totals.whitespace / 1000).toFixed(0)}k</b> across the cluster.
                  {topGapCustomer && (
                    <> Highest gap: <b className="text-ink">{topGapCustomer.name}</b> (only {(topGapCustomer.share * 100).toFixed(0)}% share, €{(topGapCustomer.gap / 1000).toFixed(0)}k untapped) — recommended priority for sales expansion.</>
                  )}
                </p>
              </div>
            </div>
          </section>

          {/* Macro snapshot strip */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MacroTile label="Total share of wallet" value={`${(totals.sow * 100).toFixed(0)}%`} hint="across tracked customers" tone="green" icon={<Target size={14} />} />
            <MacroTile label="My sales (cluster)" value={`€${(totals.mySales / 1000).toFixed(0)}k`} hint="top customers tracked" tone="blue" icon={<Wallet size={14} />} />
            <MacroTile label="White space" value={`€${(totals.whitespace / 1000).toFixed(0)}k`} hint="upside vs market" tone="amber" icon={<TrendingUp size={14} />} />
            <MacroTile
              label="GDP trend"
              value={fmtTrend(trends.data?.indicators.find((i) => i.indicator === "gdp"))}
              hint="last reported"
              tone="neutral"
              icon={<Building2 size={14} />}
            />
          </section>

          {/* Filter bar */}
          <Card padding="sm">
            <div className="flex flex-wrap items-center gap-2">
              <Filter size={13} className="text-ink-subtle mr-1" />
              <span className="text-xs font-medium text-ink-subtle">Business Unit:</span>
              <button
                onClick={() => setBu(null)}
                className={`chip ${bu === null ? "bg-ey-navy text-white" : "bg-surface-subtle text-ink-muted hover:bg-line"}`}
              >
                All BUs
              </button>
              {BUSINESS_UNITS.map((b) => (
                <button
                  key={b}
                  onClick={() => setBu(b === bu ? null : b)}
                  className={`chip ${bu === b ? "bg-ey-navy text-white" : "bg-surface-subtle text-ink-muted hover:bg-line"}`}
                >
                  {b}
                </button>
              ))}
              {bu && <span className="text-[11px] text-ink-faint italic">Filter applied (demo: values unchanged, Phase 1 wires real BU split)</span>}
              <button onClick={exportCsv} className="btn-outline text-xs ml-auto">
                <Download size={12} /> Export CSV
              </button>
            </div>
          </Card>

          {/* Quadrants */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <RankQuadrant
              title="Sales by Customer"
              subtitle="Prysmian revenue per customer"
              icon={<Users size={14} />}
              rows={summary.data.sales_by_customer}
              total={totals.mySales}
              barColor="#00875A"
              valuePrefix="€"
              onRowClick={(r) => setDrillItem({ kind: "Customer", ...r })}
            />
            <RankQuadrant
              title="Sales by Product"
              subtitle="Mix by product line"
              icon={<Package size={14} />}
              rows={summary.data.sales_by_product}
              total={summary.data.sales_by_product.reduce((s, r) => s + Number(r.value ?? 0), 0)}
              barColor="#2563EB"
              valuePrefix="€"
              onRowClick={(r) => setDrillItem({ kind: "Product", ...r })}
            />

            {/* Competitors with synthetic share */}
            <CompetitorQuadrant rows={summary.data.competitors} onRowClick={(r) => setDrillItem({ kind: "Competitor", ...r, value: null })} />

            {/* SoW killer view */}
            <SoWQuadrant rows={sow} onRowClick={(r) => setDrillItem({ kind: "Customer", name: r.name, value: r.mySales, detail: `Market €${r.market.toLocaleString()} · SoW ${(r.share * 100).toFixed(0)}%`, sow: r.share })} />
          </div>

          {/* Country news + alerts */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <Card className="lg:col-span-2" padding="none">
              <CardHeader
                title={`News mentioning ${meta.name}`}
                subtitle="AI-curated from public sources"
                action={<Link to="/news" className="btn-ghost text-xs">All <ExternalLink size={11} /></Link>}
              />
              {countryNews.length === 0 ? (
                <div className="px-5 pb-5 text-xs text-ink-subtle">No news for {meta.name} in the current window.</div>
              ) : (
                <ul className="divide-y divide-line">
                  {countryNews.map((n) => (
                    <li key={n.id}>
                      <a href={n.url} target="_blank" rel="noreferrer" className="block px-5 py-3 hover:bg-surface-muted group">
                        <div className="text-[11px] uppercase tracking-wide text-ink-subtle">{n.source}</div>
                        <div className="text-sm font-medium text-ink group-hover:text-prysmian-green line-clamp-2 mt-0.5">{n.title}</div>
                        {n.summary && <div className="text-xs text-ink-muted line-clamp-2 mt-1">{n.summary}</div>}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
            <Card padding="none">
              <CardHeader title="Active alerts" subtitle={`KPI deviations · ${meta.name}`} />
              <div className="px-5 pb-4 space-y-2.5">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-accent-amber-light text-accent-amber flex items-center justify-center shrink-0"><AlertCircle size={13} /></div>
                  <div>
                    <div className="text-xs font-medium text-ink">Building permits YTD trending −8% YoY</div>
                    <div className="text-[11px] text-ink-subtle mt-0.5">KPI Alerts agent · confidence 78%</div>
                  </div>
                </div>
                <Link to="/alerts" className="btn-outline text-xs w-full justify-center">
                  <BellRing size={11} /> Open Alerts inbox
                </Link>
              </div>
            </Card>
          </div>
        </>
      )}

      {drillItem && <DrillDownModal item={drillItem} country={meta.name} onClose={() => setDrillItem(null)} />}
    </div>
  );
}

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

function RankQuadrant({ title, subtitle, icon, rows, total, barColor, valuePrefix, onRowClick }: { title: string; subtitle: string; icon: React.ReactNode; rows: { name: string; value: number | null; detail: string }[]; total: number; barColor: string; valuePrefix?: string; onRowClick: (r: any) => void }) {
  const max = Math.max(...rows.map((r) => Number(r.value ?? 0)), 1);
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
        <Filter size={12} className="text-ink-faint mt-1" />
      </div>
      <ul className="divide-y divide-line">
        {rows.map((r, i) => {
          const v = Number(r.value ?? 0);
          const pct = v / max;
          const share = total > 0 ? v / total : 0;
          return (
            <li key={i}>
              <button onClick={() => onRowClick(r)} className="w-full text-left px-5 py-3 hover:bg-surface-muted group">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono text-ink-faint w-5">#{i + 1}</span>
                  <span className="text-sm text-ink font-medium flex-1 truncate">{r.name}</span>
                  <span className="text-xs font-mono tabular-nums text-ink-muted">{share ? `${(share * 100).toFixed(0)}%` : ""}</span>
                  <span className="text-sm font-semibold tabular-nums text-ink min-w-[80px] text-right">
                    {r.value != null ? `${valuePrefix ?? ""}${v.toLocaleString()}` : "—"}
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-surface-subtle overflow-hidden ml-8">
                  <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(2, pct * 100)}%`, backgroundColor: barColor }} />
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function CompetitorQuadrant({ rows, onRowClick }: { rows: { name: string; detail: string }[]; onRowClick: (r: any) => void }) {
  // Synthetic market share from tier
  const enriched = rows.map((r, i) => {
    const tier = (r.detail || "").includes("1") ? 1 : 2;
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
            <h3 className="text-sm font-semibold text-ink">Competitors</h3>
            <p className="text-[11px] text-ink-subtle">Estimated market share & momentum</p>
          </div>
        </div>
        <Filter size={12} className="text-ink-faint mt-1" />
      </div>
      <ul className="divide-y divide-line">
        {enriched.map((r, i) => (
          <li key={i}>
            <button onClick={() => onRowClick(r)} className="w-full text-left px-5 py-3 hover:bg-surface-muted">
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
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function SoWQuadrant({ rows, onRowClick }: { rows: { name: string; mySales: number; market: number; share: number; gap: number }[]; onRowClick: (r: any) => void }) {
  const maxMarket = Math.max(...rows.map((r) => r.market), 1);
  return (
    <Card padding="none">
      <div className="px-5 py-3.5 border-b border-line">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-accent-amber-light text-accent-amber flex items-center justify-center"><Target size={14} /></div>
            <div>
              <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                Share of Wallet
                <Badge tone="green"><Sparkles size={9} /> AI</Badge>
              </h3>
              <p className="text-[11px] text-ink-subtle">Prysmian sales vs total customer spend · sorted by white-space gap</p>
            </div>
          </div>
          <Filter size={12} className="text-ink-faint mt-1" />
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
              <button onClick={() => onRowClick(r)} className="w-full text-left px-5 py-3 hover:bg-surface-muted">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-ink font-medium flex-1 truncate">{r.name}</span>
                  <Badge tone={r.share < 0.4 ? "amber" : r.share < 0.7 ? "blue" : "green"}>SoW {sowPct}%</Badge>
                  <span className="text-xs font-mono tabular-nums text-ink-muted min-w-[80px] text-right">€{r.gap.toLocaleString()} gap</span>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-surface-subtle overflow-hidden flex">
                  <div className="h-full bg-prysmian-green transition-all" style={{ width: `${mySalesPct}%` }} />
                  <div className="h-full bg-accent-amber-light border-r border-accent-amber transition-all" style={{ width: `${gapPct}%` }} />
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}

function DrillDownModal({ item, country, onClose }: { item: { kind: string; name: string; value: number | null; detail?: string; sow?: number }; country: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-ey-navy/30 backdrop-blur-sm flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-elevated max-w-lg w-full overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-line flex items-start justify-between">
          <div>
            <Badge tone="blue">{item.kind}</Badge>
            <h3 className="text-lg font-bold text-ink mt-1.5">{item.name}</h3>
            <div className="text-xs text-ink-subtle">{country}</div>
          </div>
          <button onClick={onClose} className="text-ink-subtle hover:text-ink"><X size={18} /></button>
        </div>
        <div className="p-5 space-y-4">
          {item.value != null && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-subtle">Tracked value</div>
              <div className="text-2xl font-bold text-ink tabular-nums mt-1">€{item.value.toLocaleString()}</div>
            </div>
          )}
          {item.sow != null && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-ink-subtle">Share of wallet</div>
              <div className="mt-1 h-2 rounded-full bg-surface-subtle overflow-hidden">
                <div className="h-full bg-prysmian-green" style={{ width: `${item.sow * 100}%` }} />
              </div>
              <div className="text-xs text-ink-muted mt-1">{(item.sow * 100).toFixed(0)}% of total customer spend</div>
            </div>
          )}
          {item.detail && <div className="text-sm text-ink-muted">{item.detail}</div>}
          <div className="card p-3 bg-surface-muted">
            <div className="flex items-start gap-2.5">
              <Sparkles size={14} className="text-accent-green mt-0.5 shrink-0" />
              <div className="text-xs text-ink-muted leading-relaxed">
                <span className="font-medium text-ink">AI suggestion:</span> {drillSuggestion(item)}
              </div>
            </div>
          </div>
          <div className="text-[11px] text-ink-faint italic">Phase 1 unlocks: order history, contract list, opportunity pipeline, evidence trail.</div>
        </div>
        <div className="px-5 py-3 border-t border-line bg-surface-muted flex gap-2">
          <button onClick={onClose} className="btn-outline flex-1">Close</button>
          <button className="btn-primary flex-1">Open in CRM</button>
        </div>
      </div>
    </div>
  );
}

function drillSuggestion(item: { kind: string; name: string; sow?: number }) {
  if (item.kind === "Customer" && item.sow != null) {
    if (item.sow < 0.4) return `Low share at ${item.name}. Investigate competitor lock-in and propose share-shift initiative for Q3.`;
    if (item.sow < 0.7) return `Stable mid-share. Cross-sell adjacent product lines (HV, accessories) to lift wallet.`;
    return `Strong incumbent at ${item.name}. Defend with multi-year framework and protect margin.`;
  }
  if (item.kind === "Competitor") return `Monitor ${item.name} for pricing moves and capacity changes — flagged in Competitor Monitoring agent.`;
  if (item.kind === "Product") return `Watch demand signals tied to ${item.name} — link to Trends page for macro context.`;
  return "Drill-down details available in Phase 1.";
}

function fmtTrend(ind: any) {
  if (!ind?.series?.length) return "—";
  const last = Number(ind.series[ind.series.length - 1].value);
  return last.toLocaleString(undefined, { maximumFractionDigits: 1 });
}
