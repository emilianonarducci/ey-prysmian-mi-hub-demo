import { useMemo, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useCountrySummary, useNews, useTrends } from "@/lib/queries";
import {
  Globe, Filter, Download, ArrowRight, Sparkles, Target, TrendingUp, TrendingDown,
  Users, Package, Swords, Wallet, Building2, Newspaper, AlertCircle, X, ExternalLink, BellRing,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, SectionTitle } from "@/components/ui/Badge";
import { BUSINESS_UNITS as BU_LIST } from "@/lib/bus";

const COUNTRIES = [
  { id: "italy", name: "Italy", flag: "🇮🇹", hasData: true },
  { id: "france", name: "France", flag: "🇫🇷", hasData: false },
  { id: "germany", name: "Germany", flag: "🇩🇪", hasData: false },
  { id: "spain", name: "Spain", flag: "🇪🇸", hasData: false },
  { id: "netherlands", name: "Netherlands", flag: "🇳🇱", hasData: false },
];

const BUSINESS_UNITS = BU_LIST.map((b) => b.short);

export default function CountryIdPage() {
  const { id = "italy" } = useParams<{ id: string }>();
  const nav = useNavigate();
  const meta = COUNTRIES.find((c) => c.id === id) ?? COUNTRIES[0];

  const [bu, setBu] = useState<string | null>(null);
  const [drillItem, setDrillItem] = useState<{ kind: string; name: string; value: number | null; detail?: string; sow?: number } | null>(null);

  const summary = useCountrySummary(id);
  const news = useNews();
  const trends = useTrends(meta.name);

  const alerts = useQuery({
    queryKey: ["country-alerts", meta.name],
    queryFn: async () => {
      const { data } = await api.get<{ alerts: any[] }>("/alerts");
      return data.alerts.filter((a) => !a.country || a.country.toLowerCase() === meta.name.toLowerCase()).slice(0, 4);
    },
  });

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
              <div className="px-5 py-4 border-b border-line flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-ink">Latest news</h3>
                  <p className="text-xs text-ink-subtle mt-0.5">
                    {countryNews.length} article{countryNews.length === 1 ? "" : "s"} mentioning {meta.name} · curated by News Finder agent
                  </p>
                </div>
                <Link to="/news" className="btn-ghost text-xs shrink-0">View all <ExternalLink size={11} /></Link>
              </div>
              {countryNews.length === 0 ? (
                <div className="px-5 py-8 text-center text-xs text-ink-subtle">
                  No recent news for {meta.name}. Agents will pick up new items as they're published.
                </div>
              ) : (
                <ul className="divide-y divide-line">
                  {countryNews.map((n) => (
                    <li key={n.id}>
                      <a href={n.url} target="_blank" rel="noreferrer" className="block px-5 py-3 hover:bg-surface-muted group">
                        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wide text-ink-subtle">
                          <span className="font-medium">{n.source}</span>
                          <span className="text-ink-faint">·</span>
                          <span>{relTimeShort(n.published_at)}</span>
                          {n.relevance_score >= 0.7 && <Badge tone="green"><Sparkles size={9} /> High</Badge>}
                        </div>
                        <div className="text-sm font-medium text-ink group-hover:text-prysmian-green line-clamp-2 mt-1">{n.title}</div>
                        {n.summary && <div className="text-xs text-ink-muted line-clamp-2 mt-1 leading-relaxed">{n.summary}</div>}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card padding="none">
              <div className="px-5 py-4 border-b border-line flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-ink">Active alerts</h3>
                  <p className="text-xs text-ink-subtle mt-0.5">
                    {alerts.data?.length ?? 0} signal{alerts.data?.length === 1 ? "" : "s"} for {meta.name}
                  </p>
                </div>
              </div>
              <div className="p-4 space-y-2.5">
                {(alerts.data ?? []).length === 0 && (
                  <div className="text-center py-4 text-xs text-ink-subtle">All quiet — no active alerts.</div>
                )}
                {(alerts.data ?? []).map((a) => {
                  const sevTone: any = a.severity === "high" ? "red" : a.severity === "medium" ? "amber" : "blue";
                  const sevBg = a.severity === "high" ? "bg-accent-red-light text-accent-red" : a.severity === "medium" ? "bg-accent-amber-light text-accent-amber" : "bg-accent-blue-light text-accent-blue";
                  return (
                    <div key={a.id} className="flex items-start gap-2.5">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${sevBg}`}>
                        <AlertCircle size={13} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <Badge tone={sevTone}>{a.severity}</Badge>
                          <span className="text-[10px] text-ink-faint capitalize">{a.type}</span>
                        </div>
                        <div className="text-xs font-medium text-ink line-clamp-2">{a.title}</div>
                        <div className="text-[10px] text-ink-subtle mt-0.5">{a.agent?.replace(/_/g, " ")} · {a.confidence}%</div>
                      </div>
                    </div>
                  );
                })}
                <Link to="/alerts" className="btn-outline text-xs w-full justify-center mt-2">
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
  const [tab, setTab] = useState<"overview" | "record">("overview");

  return (
    <div className="fixed inset-0 z-50 bg-ey-navy/40 backdrop-blur-sm flex items-center justify-center px-4 py-8" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-elevated max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-line flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.kind === "Customer" ? "bg-accent-blue-light text-accent-blue" : item.kind === "Product" ? "bg-accent-green-light text-accent-green" : "bg-accent-red-light text-accent-red"}`}>
              {item.kind === "Customer" ? <Users size={18} /> : item.kind === "Product" ? <Package size={18} /> : <Swords size={18} />}
            </div>
            <div>
              <Badge tone="neutral">{item.kind}</Badge>
              <h3 className="text-lg font-bold text-ink mt-0.5">{item.name}</h3>
              <div className="text-xs text-ink-subtle">{country}</div>
            </div>
          </div>
          <button onClick={onClose} className="text-ink-subtle hover:text-ink"><X size={18} /></button>
        </div>

        {/* Tabs */}
        {(item.kind === "Customer" || item.kind === "Product") && (
          <div className="px-6 border-b border-line flex gap-1">
            <TabBtn active={tab === "overview"} onClick={() => setTab("overview")}>MI Hub overview</TabBtn>
            <TabBtn active={tab === "record"} onClick={() => setTab("record")}>
              {item.kind === "Customer" ? "Salesforce record" : "SAP material master"}
            </TabBtn>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {tab === "overview" && <OverviewTab item={item} country={country} />}
          {tab === "record" && item.kind === "Customer" && <SalesforceRecord item={item} country={country} />}
          {tab === "record" && item.kind === "Product" && <SapMaterialMaster item={item} country={country} />}
        </div>

        <div className="px-6 py-3 border-t border-line bg-surface-muted flex gap-2">
          <button onClick={onClose} className="btn-outline flex-1">Close</button>
          {item.kind === "Customer" && (
            <button onClick={() => setTab(tab === "record" ? "overview" : "record")} className="btn-primary flex-1">
              <Users size={13} /> {tab === "record" ? "Back to overview" : "View Salesforce account"}
            </button>
          )}
          {item.kind === "Product" && (
            <button onClick={() => setTab(tab === "record" ? "overview" : "record")} className="btn-primary flex-1">
              <Package size={13} /> {tab === "record" ? "Back to overview" : "View SAP material"}
            </button>
          )}
          {item.kind === "Competitor" && (
            <button className="btn-primary flex-1">
              <Swords size={13} /> Open competitor dossier
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TabBtn({ children, active, onClick }: { children: React.ReactNode; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active ? "border-prysmian-green text-prysmian-green" : "border-transparent text-ink-subtle hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function OverviewTab({ item, country }: { item: any; country: string }) {
  return (
    <div className="p-6 space-y-4">
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
    </div>
  );
}

// ───────── Salesforce-style account record ─────────

function SalesforceRecord({ item, country }: { item: any; country: string }) {
  // Deterministic synthetic data based on name hash
  const seed = hashCode(item.name);
  const accountId = `0015e0000${(Math.abs(seed) % 99999).toString().padStart(5, "0")}AAA`;
  const industry = pick(seed, ["Utility · Transmission", "Utility · Distribution", "Renewable energy", "Industrial · OEM", "Data center operator", "Infrastructure contractor"]);
  const tier = pick(seed, ["Tier 1 · Strategic", "Tier 1 · Key", "Tier 2 · Growth"]);
  const owner = pick(seed, ["Marco Bianchi", "Giulia Romano", "Luca Ferrari", "Sofia Conti"]);
  const sinceYear = 2005 + (Math.abs(seed) % 18);
  const employees = (5 + (Math.abs(seed) % 95)) * 100;
  const annualRev = (Math.abs(seed) % 4500) + 200;
  const openOpps = (Math.abs(seed) % 7) + 1;
  const ytdWins = Math.round(((item.value ?? 0) / 1000) * 0.6) || 12;
  const phone = `+39 0${(Math.abs(seed) % 9) + 1} ${1000000 + (Math.abs(seed) % 8999999)}`;

  return (
    <div className="bg-[#F3F3F3]">
      {/* SF-style account header */}
      <div className="bg-white px-6 py-4 border-b border-line">
        <div className="flex items-center gap-2 text-[11px] text-[#006DCC]">
          <span>Accounts</span>
          <span className="text-ink-faint">›</span>
          <span className="text-ink font-medium">{item.name}</span>
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded bg-[#006DCC]/10 flex items-center justify-center text-[#006DCC] font-bold text-lg">
              {item.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-ink-subtle">Account</div>
              <div className="text-lg font-semibold text-ink">{item.name}</div>
            </div>
          </div>
          <div className="text-[10px] text-ink-faint">ID: <span className="font-mono">{accountId}</span></div>
        </div>
        {/* SF highlight tiles */}
        <div className="mt-4 grid grid-cols-4 border-y border-line divide-x divide-line text-center -mx-6">
          <SfHighlight label="Type" value={tier} />
          <SfHighlight label="Account Owner" value={owner} />
          <SfHighlight label="Industry" value={industry} />
          <SfHighlight label="Customer since" value={String(sinceYear)} />
        </div>
      </div>

      <div className="p-6 grid grid-cols-2 gap-4">
        <SfPanel title="Account information">
          <SfField label="Account name" value={item.name} />
          <SfField label="Phone" value={phone} />
          <SfField label="Website" value={`www.${item.name.toLowerCase().replace(/\s+/g, "")}.com`} link />
          <SfField label="Billing country" value={country} />
          <SfField label="Annual revenue" value={`€${annualRev}M`} />
          <SfField label="Employees" value={employees.toLocaleString()} />
        </SfPanel>

        <SfPanel title="Prysmian relationship">
          <SfField label="Customer tier" value={tier} highlight />
          <SfField label="Sales YTD" value={item.value ? `€${item.value.toLocaleString()}` : "—"} />
          <SfField label="Share of wallet" value={item.sow != null ? `${(item.sow * 100).toFixed(0)}%` : "—"} />
          <SfField label="Open opportunities" value={`${openOpps}`} />
          <SfField label="Closed/Won YTD" value={`${ytdWins}`} />
          <SfField label="Last activity" value={`${(Math.abs(seed) % 14) + 1} days ago`} />
        </SfPanel>

        <SfPanel title="Key contacts" colSpan>
          <div className="divide-y divide-line">
            {[
              { name: pick(seed * 2, ["Roberto Marchetti", "Elena Greco", "Davide Russo"]), role: "Procurement Director", email: "r.marchetti@" + item.name.toLowerCase().replace(/\s+/g, "") + ".com" },
              { name: pick(seed * 3, ["Chiara Esposito", "Andrea Galli", "Federica Moretti"]), role: "Technical Buyer", email: "c.esposito@" + item.name.toLowerCase().replace(/\s+/g, "") + ".com" },
            ].map((c, i) => (
              <div key={i} className="py-2 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-[#006DCC]/10 text-[#006DCC] flex items-center justify-center text-[10px] font-semibold">
                  {c.name.split(" ").map((w: string) => w[0]).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-ink">{c.name}</div>
                  <div className="text-[11px] text-ink-subtle">{c.role}</div>
                </div>
                <a className="text-[11px] text-[#006DCC] hover:underline truncate">{c.email}</a>
              </div>
            ))}
          </div>
        </SfPanel>

        <SfPanel title="Open opportunities" colSpan>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-ink-subtle border-b border-line">
                <th className="py-2 font-medium">Opportunity</th>
                <th className="py-2 font-medium">Stage</th>
                <th className="py-2 font-medium text-right">Amount</th>
                <th className="py-2 font-medium text-right">Close date</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.min(3, openOpps) }).map((_, i) => {
                const stages = ["Qualification", "Proposal", "Negotiation"];
                const amt = ((Math.abs(seed) + i * 37) % 800 + 50) * 1000;
                return (
                  <tr key={i} className="border-b border-line-subtle">
                    <td className="py-2 text-ink">{country} · HV cable framework {2026 + i}</td>
                    <td className="py-2"><Badge tone={i === 0 ? "amber" : i === 1 ? "blue" : "green"}>{stages[i]}</Badge></td>
                    <td className="py-2 text-right font-mono tabular-nums text-ink">€{amt.toLocaleString()}</td>
                    <td className="py-2 text-right text-ink-muted">Q{(i % 4) + 1} 2026</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </SfPanel>
      </div>

      <div className="px-6 pb-4 text-[10px] text-ink-faint italic flex items-center gap-2">
        <ExternalLink size={10} />
        Demo view · in Phase 1 this opens the live record at {item.name.toLowerCase().replace(/\s+/g, "")}.my.salesforce.com
      </div>
    </div>
  );
}

function SfHighlight({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-3 px-3">
      <div className="text-[10px] uppercase tracking-wider text-ink-subtle">{label}</div>
      <div className="text-xs font-medium text-ink mt-0.5 truncate">{value}</div>
    </div>
  );
}

function SfPanel({ title, children, colSpan }: { title: string; children: React.ReactNode; colSpan?: boolean }) {
  return (
    <div className={`bg-white rounded border border-line ${colSpan ? "col-span-2" : ""}`}>
      <div className="px-4 py-2.5 border-b border-line bg-surface-muted">
        <div className="text-xs font-semibold text-ink">{title}</div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function SfField({ label, value, link, highlight }: { label: string; value: string; link?: boolean; highlight?: boolean }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 py-1.5 border-b border-line-subtle last:border-0">
      <div className="text-[11px] text-ink-subtle">{label}</div>
      <div className={`text-xs ${highlight ? "font-semibold text-prysmian-green" : "text-ink"} ${link ? "text-[#006DCC] hover:underline cursor-pointer" : ""}`}>{value}</div>
    </div>
  );
}

// ───────── SAP-style material master ─────────

function SapMaterialMaster({ item, country }: { item: any; country: string }) {
  const seed = hashCode(item.name);
  const matNo = `PRY-${pick(seed, ["MV", "HV", "LV", "OPT"])}-${(Math.abs(seed) % 99999).toString().padStart(5, "0")}`;
  const matType = pick(seed, ["FERT — Finished good", "HALB — Semi-finished", "ROH — Raw material"]);
  const matGroup = pick(seed, ["CBL-MV-EU", "CBL-HV-EU", "CBL-LV-EU", "OPT-FBR-EU", "ACC-MV-EU"]);
  const unit = pick(seed, ["KM", "M", "KG"]);
  const stdPrice = (Math.abs(seed) % 5000) + 500;
  const movingAvg = stdPrice + (((seed % 200) - 100));
  const plants = country === "Italy" ? ["IT01 — Pignataro Maggiore", "IT02 — Battipaglia", "IT05 — Livorno"] : ["DE01 — Berlin", "FR01 — Calais"];
  const volumeYtd = ((Math.abs(seed) % 1500) + 100) * 10;

  return (
    <div className="bg-[#F7F7F7]">
      {/* SAP-Fiori-ish header */}
      <div className="bg-[#0070F2] text-white px-6 py-2 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2">
          <span className="opacity-80">SAP</span>
          <span className="opacity-60">›</span>
          <span>Material Master · Display</span>
          <span className="opacity-60">›</span>
          <span className="font-mono">{matNo}</span>
        </div>
        <div className="opacity-70 font-mono">Client 100 · EUR</div>
      </div>

      <div className="bg-white px-6 py-4 border-b border-line">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-ink-subtle">Material</div>
            <div className="text-xl font-semibold text-ink mt-0.5 flex items-center gap-3">
              <span className="font-mono text-[#0070F2]">{matNo}</span>
              <span className="text-ink-faint">·</span>
              <span>{item.name}</span>
            </div>
          </div>
          <Badge tone="blue">{matType}</Badge>
        </div>
        <div className="mt-3 grid grid-cols-4 gap-4 text-[11px]">
          <div><span className="text-ink-subtle">Material group:</span> <span className="font-mono text-ink ml-1">{matGroup}</span></div>
          <div><span className="text-ink-subtle">Base UoM:</span> <span className="font-mono text-ink ml-1">{unit}</span></div>
          <div><span className="text-ink-subtle">Industry sector:</span> <span className="text-ink ml-1">M (Mechanical Eng.)</span></div>
          <div><span className="text-ink-subtle">Plant scope:</span> <span className="text-ink ml-1">{plants.length} plants</span></div>
        </div>
      </div>

      <div className="p-6 grid grid-cols-2 gap-4">
        <SapPanel title="Basic data 1">
          <SapField label="Material number" value={matNo} mono />
          <SapField label="Description" value={item.name} />
          <SapField label="Material type" value={matType} />
          <SapField label="Material group" value={matGroup} mono />
          <SapField label="Base unit of measure" value={unit} />
          <SapField label="Gross weight" value={`${Math.round(stdPrice / 12)} KG / ${unit}`} />
        </SapPanel>

        <SapPanel title="Sales: sales org. data">
          <SapField label="Sales org." value={country === "Italy" ? "IT00 — Prysmian Italia" : "EU00 — Prysmian Europe"} />
          <SapField label="Distribution channel" value="10 — Direct sales" />
          <SapField label="Standard price" value={`€${stdPrice.toLocaleString()} / ${unit}`} highlight />
          <SapField label="Moving avg. price" value={`€${movingAvg.toLocaleString()} / ${unit}`} />
          <SapField label="Tax classification" value="1 — Full tax" />
          <SapField label="Sales status" value="01 — Released" />
        </SapPanel>

        <SapPanel title="Plants & storage" colSpan>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] uppercase tracking-wider text-ink-subtle border-b border-line">
                <th className="py-2 font-medium">Plant</th>
                <th className="py-2 font-medium">Storage loc.</th>
                <th className="py-2 font-medium">MRP type</th>
                <th className="py-2 font-medium text-right">Stock {unit}</th>
                <th className="py-2 font-medium text-right">Lead time</th>
              </tr>
            </thead>
            <tbody>
              {plants.map((p, i) => (
                <tr key={p} className="border-b border-line-subtle">
                  <td className="py-2 font-mono text-ink">{p}</td>
                  <td className="py-2 font-mono text-ink-muted">SL{(i + 1).toString().padStart(2, "0")}</td>
                  <td className="py-2 font-mono text-ink-muted">PD — MRP</td>
                  <td className="py-2 text-right font-mono tabular-nums text-ink">{(((Math.abs(seed) + i * 17) % 5000) + 100).toLocaleString()}</td>
                  <td className="py-2 text-right text-ink-muted">{(i + 1) * 7} days</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SapPanel>

        <SapPanel title="MI Hub link" colSpan>
          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <div className="text-[10px] uppercase tracking-wider text-ink-subtle">Sales YTD ({country})</div>
              <div className="text-base font-bold text-ink tabular-nums mt-0.5">€{item.value?.toLocaleString() ?? "—"}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-ink-subtle">Volume YTD</div>
              <div className="text-base font-bold text-ink tabular-nums mt-0.5">{volumeYtd.toLocaleString()} {unit}</div>
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-wider text-ink-subtle">Top customer</div>
              <div className="text-sm font-medium text-ink mt-0.5">Customer {pick(seed, ["A", "B", "C", "D"])}</div>
            </div>
          </div>
        </SapPanel>
      </div>

      <div className="px-6 pb-4 text-[10px] text-ink-faint italic flex items-center gap-2">
        <ExternalLink size={10} />
        Demo view · in Phase 1 this calls SAP RFC <span className="font-mono">BAPI_MATERIAL_GET_DETAIL</span> for live data
      </div>
    </div>
  );
}

function SapPanel({ title, children, colSpan }: { title: string; children: React.ReactNode; colSpan?: boolean }) {
  return (
    <div className={`bg-white border border-line ${colSpan ? "col-span-2" : ""}`}>
      <div className="px-4 py-2 bg-[#EAEAEA] border-b border-line">
        <div className="text-[11px] font-semibold text-ink uppercase tracking-wide">{title}</div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function SapField({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: boolean }) {
  return (
    <div className="grid grid-cols-[160px_1fr] gap-2 py-1.5 border-b border-line-subtle last:border-0">
      <div className="text-[11px] text-ink-subtle">{label}</div>
      <div className={`text-xs ${highlight ? "font-semibold text-[#0070F2]" : "text-ink"} ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return h;
}

function pick<T>(seed: number, arr: T[]): T {
  return arr[Math.abs(seed) % arr.length];
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

function relTimeShort(iso: string | null | undefined) {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function fmtTrend(ind: any) {
  if (!ind?.series?.length) return "—";
  const last = Number(ind.series[ind.series.length - 1].value);
  return last.toLocaleString(undefined, { maximumFractionDigits: 1 });
}
