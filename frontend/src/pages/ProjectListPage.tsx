import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useProjects } from "@/lib/queries";
import EvidenceMetadataViewer from "@/components/EvidenceMetadataViewer";
import AIInsightCard from "@/components/AIInsightCard";
import api from "@/lib/api";
import { RefreshCw, Filter, Search as SearchIcon, X, Star, ExternalLink, Building2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge, SectionTitle } from "@/components/ui/Badge";

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
                      <Link to={`/projects/${p.id}`} className="flex items-center gap-2 group" onClick={(e) => { e.preventDefault(); p.evidence_id && setEvidenceId(p.evidence_id); }}>
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

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-ink-faint">—</span>;
  const s = status.toLowerCase();
  const tone = s.includes("oper") ? "green" : s.includes("constr") || s.includes("build") ? "blue" : s.includes("plan") || s.includes("explor") ? "amber" : "neutral";
  return <Badge tone={tone as any} dot>{status}</Badge>;
}
