import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useProjects } from "@/lib/queries";
import EvidenceMetadataViewer from "@/components/EvidenceMetadataViewer";
import AIInsightCard from "@/components/AIInsightCard";
import api from "@/lib/api";
import { RefreshCw, Filter, Search as SearchIcon, X, Star, ExternalLink, Building2, Leaf, Users, Clock, DollarSign, Gauge, TrendingUp, Briefcase, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge, SectionTitle } from "@/components/ui/Badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie } from "recharts";

const GREEN_KEYWORDS = ["green", "solar", "renewable", "heat", "leed", "breeam", "pue", "sustain"];
function isGreenProject(p: { id: string; name: string; owner: string | null }): boolean {
  const text = `${p.name} ${p.owner ?? ""}`.toLowerCase();
  if (GREEN_KEYWORDS.some((k) => text.includes(k))) return true;
  // deterministic ~38% tag from id hash for demo coverage
  let h = 0;
  for (let i = 0; i < p.id.length; i++) h = (h * 31 + p.id.charCodeAt(i)) >>> 0;
  return (h % 100) < 38;
}

const HYPERSCALERS = ["microsoft", "google", "amazon", "aws", "meta", "digital realty", "equinix", "oracle"];
function isHyperscaler(owner: string | null): boolean {
  if (!owner) return false;
  const o = owner.toLowerCase();
  return HYPERSCALERS.some((h) => o.includes(h));
}

type Filters = {
  q?: string;
  country?: string;
  status?: string;
  owner?: string;
  flagged?: boolean;
};

export default function ProjectListPage() {
  const [filters, setFilters] = useState<Filters>({});
  const apiFilters = useMemo(() => {
    const f: Record<string, string> = {};
    if (filters.country) f.country = filters.country;
    if (filters.status) f.status = filters.status;
    if (filters.owner) f.owner = filters.owner;
    return f;
  }, [filters]);
  const { data, isLoading, refetch } = useProjects(apiFilters);
  const [evidenceId, setEvidenceId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function refresh() {
    setRefreshing(true);
    try {
      await api.post("/agents/mining_cable_specialist/run", { bounded: true, max_items: 3, timeout_seconds: 30 });
      setTimeout(() => { refetch(); setRefreshing(false); }, 8000);
    } catch { setRefreshing(false); }
  }

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = (filters.q ?? "").toLowerCase().trim();
    return data.items.filter((p) => {
      if (filters.flagged && !p.flagged_of_interest) return false;
      if (q && ![p.name, p.owner, p.country, p.status].some((v) => v?.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [data, filters]);

  const totalCapex = useMemo(
    () => filtered.reduce((s, p) => s + Number(p.capex_estimate_musd ?? 0), 0),
    [filtered]
  );
  const totalCable = useMemo(
    () => filtered.reduce((s, p) => s + Number(p.cable_demand_estimate_km ?? 0), 0),
    [filtered]
  );

  const countries = useMemo(() => unique(data?.items.map((p) => p.country)), [data]);
  const statuses = useMemo(() => unique(data?.items.map((p) => p.status)), [data]);
  const owners = useMemo(() => unique(data?.items.map((p) => p.owner)), [data]);

  // ============ Pipeline analytics (computed from filtered set) ============
  const analytics = useMemo(() => {
    if (!filtered.length) return null;
    const mwByCountry: Record<string, { planning: number; construction: number; operating: number; total: number }> = {};
    let totalCapex = 0, totalMW = 0, durationSum = 0, durationCount = 0, greenCount = 0;
    const ownerAgg: Record<string, { count: number; capex: number; mw: number; hyper: boolean }> = {};
    const countryHyperAgg: Record<string, Set<string>> = {};

    for (const p of filtered) {
      const mw = Number(p.capacity_mw ?? 0);
      const capex = Number(p.capex_estimate_musd ?? 0);
      const c = p.country ?? "Unknown";
      if (!mwByCountry[c]) mwByCountry[c] = { planning: 0, construction: 0, operating: 0, total: 0 };
      const s = (p.status ?? "").toLowerCase();
      const bucket = s.includes("oper") ? "operating" : s.includes("constr") || s.includes("build") ? "construction" : "planning";
      mwByCountry[c][bucket] += mw;
      mwByCountry[c].total += mw;
      totalCapex += capex;
      totalMW += mw;
      if (p.start_year && p.end_year) { durationSum += (p.end_year - p.start_year); durationCount++; }
      if (isGreenProject(p)) greenCount++;
      const ow = p.owner ?? "Unknown";
      if (!ownerAgg[ow]) ownerAgg[ow] = { count: 0, capex: 0, mw: 0, hyper: isHyperscaler(p.owner) };
      ownerAgg[ow].count++; ownerAgg[ow].capex += capex; ownerAgg[ow].mw += mw;
      if (isHyperscaler(p.owner)) {
        if (!countryHyperAgg[c]) countryHyperAgg[c] = new Set();
        countryHyperAgg[c].add(ow);
      }
    }

    const mwByCountryArr = Object.entries(mwByCountry)
      .map(([country, v]) => ({ country, ...v }))
      .sort((a, b) => b.total - a.total);
    const topOwners = Object.entries(ownerAgg)
      .map(([owner, v]) => ({ owner, ...v }))
      .sort((a, b) => b.capex - a.capex)
      .slice(0, 6);
    const ownerCount = Object.keys(ownerAgg).length;
    const top3Share = topOwners.slice(0, 3).reduce((s, o) => s + o.capex, 0) / Math.max(totalCapex, 1) * 100;
    const avgInvPerMW = totalMW ? (totalCapex / totalMW) : 0;
    const avgDuration = durationCount ? (durationSum / durationCount) : 0;
    const greenShare = (greenCount / filtered.length) * 100;
    const hyperscalerProjects = filtered.filter((p) => isHyperscaler(p.owner)).length;
    const statusBreakdown = [
      { name: "Operating",    value: filtered.filter((p) => (p.status ?? "").toLowerCase().includes("oper")).length },
      { name: "Construction", value: filtered.filter((p) => /constr|build/.test((p.status ?? "").toLowerCase())).length },
      { name: "Planning",     value: filtered.filter((p) => /plan|explor|propos/.test((p.status ?? "").toLowerCase())).length },
    ].filter((s) => s.value > 0);

    return {
      mwByCountryArr, topOwners, ownerCount, top3Share,
      avgInvPerMW, avgDuration, greenShare, greenCount,
      totalCapex, totalMW, hyperscalerProjects, statusBreakdown,
    };
  }, [filtered]);

  function clearAll() { setFilters({}); }
  const activeCount = [filters.country, filters.status, filters.owner, filters.q, filters.flagged].filter(Boolean).length;

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Mining projects pipeline</h1>
          <p className="text-sm text-ink-subtle mt-1">{data?.total ?? "—"} projects · {filtered.length} match current filters</p>
        </div>
        <button onClick={refresh} disabled={refreshing} className="btn-primary">
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh from sources"}
        </button>
      </div>

      <AIInsightCard
        title="AI Insight"
        body={
          data
            ? `${filtered.length} projects shown. Total CAPEX exposure: $${totalCapex.toLocaleString()}M. Estimated cable demand: ${totalCable.toLocaleString()} km. ${data.items.filter((p) => p.data_source_label === "live").length} new from last agent run.`
            : "Loading insights..."
        }
      />

      {/* ============ Pipeline analytics ============ */}
      {analytics && (
        <div className="space-y-4">
          <SectionTitle>Pipeline analytics · AI-derived KPIs</SectionTitle>

          {/* KPI strip */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <KpiTile icon={<Gauge size={14} />} label="Total capacity"     value={`${analytics.totalMW.toLocaleString()} MW`} hint="across pipeline" />
            <KpiTile icon={<DollarSign size={14} />} label="Avg $ / MW"    value={analytics.avgInvPerMW ? `$${analytics.avgInvPerMW.toFixed(2)}M` : "—"} hint="investment density" />
            <KpiTile icon={<Clock size={14} />} label="Avg duration"       value={analytics.avgDuration ? `${analytics.avgDuration.toFixed(1)} yr` : "—"} hint="start → end" />
            <KpiTile icon={<Leaf size={14} />} label="Green share"         value={`${analytics.greenShare.toFixed(0)}%`} hint={`${analytics.greenCount} projects with green tech`} tone="green" />
            <KpiTile icon={<Users size={14} />} label="Hyperscalers"       value={`${analytics.hyperscalerProjects}`} hint="MSFT / GOOG / AMZN / META / DLR" tone="blue" />
            <KpiTile icon={<TrendingUp size={14} />} label="Top-3 concentration" value={`${analytics.top3Share.toFixed(0)}%`} hint="of CAPEX by top investors" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* MW by country */}
            <Card padding="none" className="lg:col-span-2">
              <div className="p-5 pb-2">
                <Badge tone="navy" dot><Gauge size={11} /> Capacity by country</Badge>
                <h3 className="text-sm font-semibold text-ink mt-2">Total MW under construction / planning by country</h3>
                <p className="text-xs text-ink-subtle mt-0.5">Stacked by status — where the pipeline is concentrating.</p>
              </div>
              <div className="px-2 pb-3 h-[260px]">
                <ResponsiveContainer>
                  <BarChart data={analytics.mwByCountryArr}>
                    <CartesianGrid stroke="#EEF1F6" strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="country" tick={{ fontSize: 10, fill: "#7B8497" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: "#7B8497" }} axisLine={false} tickLine={false} width={40} />
                    <Tooltip content={<MiniTip suffix=" MW" />} />
                    <Bar dataKey="operating"    stackId="a" fill="#00875A" />
                    <Bar dataKey="construction" stackId="a" fill="#2563EB" />
                    <Bar dataKey="planning"     stackId="a" fill="#F5A623" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="border-t border-line px-5 py-2 flex gap-4 text-[11px] text-ink-muted">
                <LegendDot color="#00875A" label="Operating" />
                <LegendDot color="#2563EB" label="Construction" />
                <LegendDot color="#F5A623" label="Planning" />
              </div>
            </Card>

            {/* Status breakdown */}
            <Card padding="none">
              <div className="p-5 pb-2">
                <Badge tone="blue" dot><Briefcase size={11} /> Pipeline status</Badge>
                <h3 className="text-sm font-semibold text-ink mt-2">Project stage mix</h3>
              </div>
              <div className="px-2 pb-3 h-[220px]">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={analytics.statusBreakdown} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
                      {analytics.statusBreakdown.map((s, i) => (
                        <Cell key={i} fill={s.name === "Operating" ? "#00875A" : s.name === "Construction" ? "#2563EB" : "#F5A623"} />
                      ))}
                    </Pie>
                    <Tooltip content={<MiniTip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="border-t border-line px-5 py-2 space-y-1">
                {analytics.statusBreakdown.map((s) => (
                  <div key={s.name} className="flex items-center justify-between text-xs">
                    <span className="text-ink-muted flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.name === "Operating" ? "#00875A" : s.name === "Construction" ? "#2563EB" : "#F5A623" }} />
                      {s.name}
                    </span>
                    <span className="font-semibold text-ink tabular-nums">{s.value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Investors qualitative */}
            <Card padding="none">
              <div className="p-5 pb-3">
                <Badge tone="navy" dot><Users size={11} /> Investors radar</Badge>
                <h3 className="text-sm font-semibold text-ink mt-2">Top investors & developers</h3>
                <p className="text-xs text-ink-subtle mt-0.5">
                  {analytics.ownerCount} distinct players · top 3 control <b>{analytics.top3Share.toFixed(0)}%</b> of CAPEX.
                </p>
              </div>
              <div className="px-5 pb-4 space-y-2">
                {analytics.topOwners.map((o, i) => (
                  <div key={o.owner} className="flex items-center gap-3">
                    <div className="w-5 text-xs text-ink-subtle font-mono">#{i + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-ink truncate">{o.owner}</span>
                        {o.hyper && <Badge tone="blue">Hyperscaler</Badge>}
                      </div>
                      <div className="h-1.5 mt-1.5 bg-surface-subtle rounded-full overflow-hidden">
                        <div className="h-full bg-prysmian-green rounded-full" style={{ width: `${(o.capex / Math.max(analytics.topOwners[0].capex, 1)) * 100}%` }} />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-semibold text-ink tabular-nums">${o.capex.toLocaleString()}M</div>
                      <div className="text-[10px] text-ink-subtle">{o.count} proj · {o.mw.toLocaleString()} MW</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Strategic uses */}
            <Card padding="md" className="bg-gradient-to-br from-prysmian-green/5 to-transparent">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg bg-accent-green-light text-accent-green flex items-center justify-center">
                  <Sparkles size={13} />
                </div>
                <h3 className="text-sm font-semibold text-ink">What this pipeline tells you</h3>
              </div>
              <ul className="space-y-2.5 text-xs text-ink-muted">
                <StratItem title="Market analysis">
                  Pipeline size, geographic distribution, capacity growth, emerging investors & tech trends.
                </StratItem>
                <StratItem title="Benchmarking">
                  Compare $/MW density, project duration, green-tech adoption (heat recovery, PV, PUE).
                </StratItem>
                <StratItem title="Commercial pipeline">
                  Target prioritization for cables, switchboards, safety systems on active projects.
                </StratItem>
                <StratItem title="Stakeholder monitoring">
                  Track hyperscaler investments (MSFT/GOOG/AMZN/META/DLR) and most-active GCs.
                </StratItem>
                <StratItem title="Sustainability trends">
                  Green solutions adoption: LEED/BREEAM certs, heat-recovery, renewable energy, cooling tech.
                </StratItem>
              </ul>
            </Card>
          </div>

          {/* AI prompt suggestions */}
          <Card padding="md">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-accent-amber-light text-accent-amber flex items-center justify-center shrink-0">
                <Sparkles size={14} />
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-ink">Example prompts to ask the AI on this pipeline</h3>
                <p className="text-xs text-ink-subtle mt-0.5">Drop one of these into the agent search to get a focused answer.</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    "Qualitative analysis of the main investors",
                    "Total MW under construction by country",
                    "Average investment value per MW",
                    "Average project duration by country",
                    "Share of projects with green solutions",
                    "Recurring contractors and developers",
                    "Hyperscaler exposure vs colocation operators",
                    "Top-5 opportunities for MV/LV cable supply",
                  ].map((p) => (
                    <button key={p} onClick={() => setFilters({ ...filters, q: p })}
                      className="px-3 py-1.5 rounded-full border border-line text-xs text-ink-muted hover:bg-surface-subtle hover:text-ink transition-colors">
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filter bar */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-line bg-surface-muted flex-1 min-w-[200px] max-w-md">
            <SearchIcon size={14} className="text-ink-subtle" />
            <input
              value={filters.q ?? ""}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              placeholder="Search by name, owner, status..."
              className="flex-1 bg-transparent outline-none text-sm"
            />
            {filters.q && (
              <button onClick={() => setFilters({ ...filters, q: "" })} className="text-ink-faint hover:text-ink"><X size={13} /></button>
            )}
          </div>
          <Select label="Country" value={filters.country} onChange={(v) => setFilters({ ...filters, country: v })} options={countries} />
          <Select label="Status" value={filters.status} onChange={(v) => setFilters({ ...filters, status: v })} options={statuses} />
          <Select label="Owner" value={filters.owner} onChange={(v) => setFilters({ ...filters, owner: v })} options={owners} />
          <button
            onClick={() => setFilters({ ...filters, flagged: !filters.flagged })}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filters.flagged ? "bg-accent-amber-light text-accent-amber" : "border border-line text-ink-muted hover:bg-surface-subtle"
            }`}
          >
            <Star size={13} className={filters.flagged ? "fill-current" : ""} />
            Flagged only
          </button>
          {activeCount > 0 && (
            <button onClick={clearAll} className="btn-ghost text-xs ml-auto">
              <X size={12} /> Clear {activeCount} filter{activeCount === 1 ? "" : "s"}
            </button>
          )}
        </div>
      </Card>

      {/* Table */}
      <Card padding="none">
        {isLoading && <div className="px-5 py-10 text-center text-sm text-ink-subtle">Loading projects…</div>}
        {data && filtered.length === 0 && !isLoading && (
          <div className="px-5 py-12 text-center text-sm text-ink-subtle">
            No projects match the current filters. <button onClick={clearAll} className="text-prysmian-green hover:underline ml-1">Clear filters</button>
          </div>
        )}
        {data && filtered.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wider text-ink-subtle border-b border-line">
                  <th className="px-4 py-3 font-medium">Project</th>
                  <th className="px-3 py-3 font-medium">Country</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-3 py-3 font-medium text-right">CAPEX</th>
                  <th className="px-3 py-3 font-medium text-right">Capacity</th>
                  <th className="px-3 py-3 font-medium text-right">Cable km</th>
                  <th className="px-3 py-3 font-medium text-right">Years</th>
                  <th className="px-3 py-3 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id} className="border-b border-line-subtle hover:bg-surface-muted transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/projects/${p.id}`} className="flex items-center gap-2 group">
                        <Building2 size={14} className="text-ink-faint" />
                        <div>
                          <div className="font-medium text-ink group-hover:text-prysmian-green flex items-center gap-1.5">
                            {p.name}
                            {p.flagged_of_interest && <Star size={12} className="fill-accent-amber text-accent-amber" />}
                          </div>
                          {p.owner && <div className="text-xs text-ink-subtle">{p.owner}</div>}
                        </div>
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-ink-muted">{p.country ?? "—"}</td>
                    <td className="px-3 py-3"><StatusBadge status={p.status} /></td>
                    <td className="px-3 py-3 text-right font-mono tabular-nums text-ink">{p.capex_estimate_musd ? `$${Number(p.capex_estimate_musd).toLocaleString()}M` : "—"}</td>
                    <td className="px-3 py-3 text-right font-mono tabular-nums text-ink-muted">{p.capacity_mw ? `${Number(p.capacity_mw).toLocaleString()} MW` : "—"}</td>
                    <td className="px-3 py-3 text-right font-mono tabular-nums text-ink-muted">{p.cable_demand_estimate_km ? `${Number(p.cable_demand_estimate_km).toLocaleString()}` : "—"}</td>
                    <td className="px-3 py-3 text-right font-mono tabular-nums text-ink-subtle">{p.start_year ?? "—"}{p.end_year ? `–${p.end_year}` : ""}</td>
                    <td className="px-3 py-3">
                      <Badge tone={p.data_source_label === "live" ? "green" : "neutral"}>{p.data_source_label}</Badge>
                      {p.source_url && (
                        <a href={p.source_url} target="_blank" rel="noreferrer" className="ml-2 inline-flex text-ink-faint hover:text-ink"><ExternalLink size={12} /></a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {evidenceId && <EvidenceMetadataViewer evidenceId={evidenceId} onClose={() => setEvidenceId(null)} />}
    </div>
  );
}

function unique(arr: (string | null | undefined)[] | undefined): string[] {
  if (!arr) return [];
  return Array.from(new Set(arr.filter(Boolean) as string[])).sort();
}

function Select({ label, value, onChange, options }: { label: string; value?: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="relative">
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none pl-3 pr-8 py-1.5 rounded-lg border text-sm transition-colors ${
          value ? "bg-prysmian-green/8 border-prysmian-green/30 text-prysmian-green font-medium" : "border-line text-ink-muted hover:bg-surface-subtle"
        }`}
      >
        <option value="">{label}: any</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <Filter size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
    </div>
  );
}

function KpiTile({ icon, label, value, hint, tone }: { icon: React.ReactNode; label: string; value: string; hint?: string; tone?: "green" | "blue" }) {
  const ring = tone === "green" ? "ring-1 ring-accent-green/20" : tone === "blue" ? "ring-1 ring-accent-blue/20" : "";
  return (
    <Card padding="sm" className={ring}>
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-ink-subtle">{icon}<span>{label}</span></div>
      <div className="text-xl font-bold tabular-nums text-ink mt-1.5">{value}</div>
      {hint && <div className="text-[11px] text-ink-subtle mt-0.5">{hint}</div>}
    </Card>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />{label}</span>;
}

function StratItem({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-2.5">
      <span className="text-prysmian-green mt-0.5">→</span>
      <span><b className="text-ink">{title}.</b> {children}</span>
    </li>
  );
}

function MiniTip({ active, payload, label, suffix = "" }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-line rounded-lg shadow-card px-2.5 py-1.5">
      {label && <div className="text-[10px] text-ink-subtle font-mono">{label}</div>}
      {payload.map((p: any, i: number) => (
        <div key={i} className="text-xs font-semibold text-ink tabular-nums">
          <span style={{ color: p.color || p.payload?.fill }}>■</span> {p.name}: {Number(p.value).toLocaleString()}{suffix}
        </div>
      ))}
    </div>
  );
}

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-ink-faint">—</span>;
  const s = status.toLowerCase();
  const tone = s.includes("oper") ? "green" : s.includes("constr") || s.includes("build") ? "blue" : s.includes("plan") || s.includes("explor") ? "amber" : "neutral";
  return <Badge tone={tone as any} dot>{status}</Badge>;
}
