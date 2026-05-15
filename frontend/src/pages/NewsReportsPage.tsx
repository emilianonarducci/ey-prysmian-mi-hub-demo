import { useMemo, useState } from "react";
import { useNews } from "@/lib/queries";
import { FileText, ExternalLink, RefreshCw, Search, X, Newspaper, Filter, Briefcase, Sparkles, Globe, BookOpen, Building2 } from "lucide-react";
import api from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Badge, SectionTitle } from "@/components/ui/Badge";
import { BUSINESS_UNITS, findBu } from "@/lib/bus";
import { BU_NEWS, buNewsFor, buSourcesFor, BuNewsItem } from "@/lib/bu-news";
import { currentSession } from "@/lib/users";

// BUs that have curated demo content
const ACTIVE_BU_TABS = ["ic", "mining", "automotive", "renewable", "fiber", "connectivity", "power-grid", "submarine", "building"];

export default function NewsReportsPage() {
  const session = currentSession();
  const defaultBu = session.role === "admin" ? null : session.buId;
  const [bu, setBu] = useState<string | null>(defaultBu);
  const [q, setQ] = useState("");
  const apiNews = useNews(q);
  const [refreshing, setRefreshing] = useState(false);

  async function triggerRefresh() {
    setRefreshing(true);
    try {
      await api.post("/agents/news_finder/run", { bounded: true, max_items: 5, timeout_seconds: 30 });
      setTimeout(() => { apiNews.refetch(); setRefreshing(false); }, 5000);
    } catch { setRefreshing(false); }
  }

  // Merge API news (mostly mining seed) + curated BU news
  const merged: BuNewsItem[] = useMemo(() => {
    const curated = bu ? buNewsFor(bu) : BU_NEWS;
    // The mining BU also includes the API news (live agent output); other BUs hide API news to avoid mining contamination
    const wantApi = !bu || bu === "mining";
    const apiItems: BuNewsItem[] = wantApi
      ? (apiNews.data ?? []).map((n) => ({
          id: `api-${n.id}`,
          buId: "mining",
          title: n.title,
          source: n.source,
          url: n.url,
          summary: n.summary,
          countries: n.countries ?? [],
          published_at: n.published_at ?? n.curated_at,
          relevance_score: n.relevance_score,
          tags: n.segments ?? [],
        }))
      : [];
    const all = [...curated, ...apiItems];
    const ql = q.toLowerCase().trim();
    const filtered = ql
      ? all.filter((n) => [n.title, n.summary, n.source, ...(n.tags ?? [])].some((v) => v.toLowerCase().includes(ql)))
      : all;
    return filtered.sort((a, b) => (b.published_at ?? "").localeCompare(a.published_at ?? ""));
  }, [bu, apiNews.data, q]);

  const sources = bu ? buSourcesFor(bu) : [];
  const buMeta = bu ? findBu(bu) : null;

  return (
    <div className="space-y-5 max-w-[1500px]">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-ey-navy to-ey-navy-dark text-white flex items-center justify-center shadow-card">
            <Newspaper size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">News & Reports</h1>
            <p className="text-sm text-ink-subtle mt-0.5">
              AI-curated headlines from <b className="text-ink">{Object.values({...{} as Record<string, unknown>}).length || (sources.length || BU_NEWS.length)}</b> specialized industry sources.
            </p>
          </div>
        </div>
        <button onClick={triggerRefresh} disabled={refreshing} className="btn-primary">
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh from sources"}
        </button>
      </div>

      {/* BU tab bar */}
      <div className="flex items-center gap-1.5 flex-wrap p-1 rounded-xl bg-surface-subtle">
        <BuTab active={bu === null} onClick={() => setBu(null)} label="All BUs" hint="cross-BU view" count={BU_NEWS.length + (apiNews.data?.length ?? 0)} />
        {ACTIVE_BU_TABS.map((id) => {
          const b = findBu(id);
          if (!b) return null;
          const count = buNewsFor(id).length + (id === "mining" ? (apiNews.data?.length ?? 0) : 0);
          return <BuTab key={id} active={bu === id} onClick={() => setBu(id)} label={b.short} hint={b.description} count={count} />;
        })}
      </div>

      {/* Sources panel for the selected BU */}
      {buMeta && sources.length > 0 && (
        <Card padding="md" className="bg-gradient-to-br from-prysmian-green/5 to-transparent">
          <div className="flex items-start gap-3 mb-3">
            <div className="w-8 h-8 rounded-lg bg-accent-green-light text-accent-green flex items-center justify-center shrink-0">
              <BookOpen size={14} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">Specialized sources for {buMeta.name}</h3>
              <p className="text-xs text-ink-subtle mt-0.5">Canonical industry publications & data feeds monitored by the News Finder agent for this BU.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {sources.map((s) => (
              <a key={s.url} href={s.url} target="_blank" rel="noreferrer"
                className="flex items-start gap-2.5 p-2.5 rounded-lg border border-line hover:border-prysmian-green/40 hover:bg-white transition-colors group">
                <div className="w-7 h-7 rounded-md bg-surface-subtle text-ink-muted flex items-center justify-center shrink-0">
                  <SourceIcon type={s.type} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-ink truncate group-hover:text-prysmian-green">{s.name}</span>
                    <ExternalLink size={10} className="text-ink-faint shrink-0" />
                  </div>
                  <div className="text-[11px] text-ink-subtle truncate">{s.focus}</div>
                </div>
                <Badge tone="neutral">{s.type}</Badge>
              </a>
            ))}
          </div>
        </Card>
      )}

      {/* Filter bar */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-line bg-surface-muted flex-1 min-w-[220px] max-w-md">
            <Search size={14} className="text-ink-subtle" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search headlines, sources, tags..." className="flex-1 bg-transparent outline-none text-sm" />
            {q && <button onClick={() => setQ("")} className="text-ink-faint hover:text-ink"><X size={13} /></button>}
          </div>
          {bu && (
            <Badge tone="navy" dot>
              <Briefcase size={11} /> {buMeta?.name}
            </Badge>
          )}
          <span className="text-xs text-ink-subtle ml-auto">{merged.length} article{merged.length === 1 ? "" : "s"}</span>
        </div>
      </Card>

      {/* News list */}
      <Card padding="none">
        {apiNews.isLoading && bu === null && (
          <div className="px-5 py-10 text-center text-sm text-ink-subtle">Loading curated intelligence…</div>
        )}
        {merged.length === 0 && !apiNews.isLoading && (
          <div className="px-5 py-14 text-center">
            <Newspaper size={28} className="mx-auto text-ink-faint mb-2" />
            <div className="text-sm text-ink">No articles match your filters</div>
            <button onClick={() => { setQ(""); }} className="btn-ghost text-xs mt-2">Clear search</button>
          </div>
        )}
        <ul className="divide-y divide-line">
          {merged.map((n) => {
            const tone = n.relevance_score >= 0.9 ? "green" : n.relevance_score >= 0.75 ? "blue" : "neutral";
            return (
              <li key={n.id}>
                <a href={n.url} target="_blank" rel="noreferrer" className="block px-5 py-4 hover:bg-surface-muted group transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      tone === "green" ? "bg-accent-green-light text-accent-green" :
                      tone === "blue"  ? "bg-accent-blue-light text-accent-blue" :
                                          "bg-surface-subtle text-ink-muted"
                    }`}>
                      <FileText size={15} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap text-[11px] uppercase tracking-wider text-ink-subtle">
                        <span className="font-semibold text-ink">{n.source}</span>
                        <span className="text-ink-faint">·</span>
                        <span>{relTime(n.published_at)}</span>
                        {n.countries?.slice(0, 3).map((c) => <Badge key={c} tone="neutral">{c}</Badge>)}
                        {n.relevance_score >= 0.9 && <Badge tone="green"><Sparkles size={9} /> High</Badge>}
                        <BuChip buId={n.buId} />
                      </div>
                      <div className="text-sm font-semibold text-ink mt-1.5 group-hover:text-prysmian-green transition-colors line-clamp-2">
                        {n.title}
                        <ExternalLink size={11} className="inline ml-1.5 -mt-0.5 text-ink-faint" />
                      </div>
                      {n.summary && <div className="text-xs text-ink-muted mt-1 line-clamp-2 leading-relaxed">{n.summary}</div>}
                      {n.tags && n.tags.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {n.tags.slice(0, 5).map((t) => <span key={t} className="chip bg-surface-subtle text-ink-muted text-[10px]">{t}</span>)}
                        </div>
                      )}
                    </div>
                  </div>
                </a>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}

function BuTab({ active, onClick, label, hint, count }: { active: boolean; onClick: () => void; label: string; hint?: string; count?: number }) {
  return (
    <button
      onClick={onClick}
      title={hint}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
        active
          ? "bg-white text-ey-navy shadow-card border border-line"
          : "text-ink-muted hover:text-ink hover:bg-white/60"
      }`}
    >
      {label}
      {count != null && <span className={`chip text-[10px] ${active ? "bg-prysmian-green text-white" : "bg-surface-subtle text-ink-muted"}`}>{count}</span>}
    </button>
  );
}

function BuChip({ buId }: { buId: string }) {
  const b = findBu(buId);
  if (!b) return null;
  return <span className="chip bg-ey-navy/8 text-ey-navy"><Briefcase size={10} /> {b.short}</span>;
}

function SourceIcon({ type }: { type: string }) {
  const sz = 13;
  if (type === "data")        return <Globe size={sz} />;
  if (type === "association") return <Building2 size={sz} />;
  if (type === "magazine")    return <BookOpen size={sz} />;
  if (type === "blog")        return <FileText size={sz} />;
  return <Newspaper size={sz} />;
}

function relTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
