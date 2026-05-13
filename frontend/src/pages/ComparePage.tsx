import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useProjects, useNews } from "@/lib/queries";
import { Globe, Pickaxe, Newspaper, DollarSign, Cable, ArrowRight, Plus, X, Star, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge, SectionTitle } from "@/components/ui/Badge";

const AVAILABLE = [
  { id: "italy", name: "Italy", flag: "🇮🇹", focus: "Cable manufacturing hub" },
  { id: "france", name: "France", flag: "🇫🇷", focus: "Nuclear + grid investment" },
  { id: "germany", name: "Germany", flag: "🇩🇪", focus: "Energiewende leader" },
  { id: "spain", name: "Spain", flag: "🇪🇸", focus: "Renewable boom" },
  { id: "netherlands", name: "Netherlands", flag: "🇳🇱", focus: "Offshore wind" },
];

export default function ComparePage() {
  const [selected, setSelected] = useState<string[]>(["Italy", "France", "Germany"]);
  const projects = useProjects();
  const news = useNews();

  const data = useMemo(() => {
    const items = projects.data?.items ?? [];
    const newsItems = news.data ?? [];
    return selected.map((country) => {
      const countryProjects = items.filter((p) => (p.country ?? "").toLowerCase() === country.toLowerCase());
      const countryNews = newsItems.filter((n) => (n.countries ?? []).some((c) => c.toLowerCase() === country.toLowerCase()));
      const capex = countryProjects.reduce((s, p) => s + Number(p.capex_estimate_musd ?? 0), 0);
      const cable = countryProjects.reduce((s, p) => s + Number(p.cable_demand_estimate_km ?? 0), 0);
      const flagged = countryProjects.filter((p) => p.flagged_of_interest).length;
      const meta = AVAILABLE.find((c) => c.name.toLowerCase() === country.toLowerCase());
      return {
        country,
        flag: meta?.flag ?? "🌍",
        focus: meta?.focus ?? "",
        id: meta?.id ?? country.toLowerCase(),
        projectsCount: countryProjects.length,
        capex,
        cable,
        flagged,
        newsCount: countryNews.length,
        recentNews: countryNews.slice(0, 3),
        topProjects: countryProjects.slice(0, 3),
      };
    });
  }, [selected, projects.data, news.data]);

  const maxCapex = Math.max(1, ...data.map((d) => d.capex));
  const maxCable = Math.max(1, ...data.map((d) => d.cable));
  const maxProjects = Math.max(1, ...data.map((d) => d.projectsCount));
  const maxNews = Math.max(1, ...data.map((d) => d.newsCount));

  function toggle(country: string) {
    setSelected((s) => (s.includes(country) ? s.filter((c) => c !== country) : s.length < 4 ? [...s, country] : s));
  }

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div>
        <h1 className="text-2xl font-bold text-ink tracking-tight">Country comparison</h1>
        <p className="text-sm text-ink-subtle mt-1">Side-by-side view across mining pipeline, news intensity, and strategic relevance · select up to 4</p>
      </div>

      {/* Selector */}
      <Card padding="sm">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-ink-subtle mr-1">Countries:</span>
          {AVAILABLE.map((c) => {
            const active = selected.includes(c.name);
            const disabled = !active && selected.length >= 4;
            return (
              <button
                key={c.id}
                onClick={() => toggle(c.name)}
                disabled={disabled}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? "bg-prysmian-green text-white"
                    : disabled
                    ? "border border-line text-ink-faint cursor-not-allowed opacity-50"
                    : "border border-line text-ink-muted hover:bg-surface-subtle"
                }`}
              >
                <span className="text-base leading-none">{c.flag}</span>
                {c.name}
                {active && <X size={12} />}
              </button>
            );
          })}
          {selected.length < 4 && (
            <span className="text-[11px] text-ink-faint ml-2">{4 - selected.length} more slot{selected.length === 3 ? "" : "s"} available</span>
          )}
        </div>
      </Card>

      {selected.length === 0 && (
        <Card>
          <div className="text-center py-10 text-sm text-ink-subtle">Pick at least one country to start comparing.</div>
        </Card>
      )}

      {selected.length > 0 && (
        <>
          {/* Header strip */}
          <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
            {data.map((d) => (
              <Card key={d.country} className="overflow-hidden" padding="none">
                <div className="bg-gradient-to-br from-ey-navy to-ey-navy-dark text-white p-5">
                  <div className="text-3xl mb-2 leading-none">{d.flag}</div>
                  <div className="text-lg font-semibold">{d.country}</div>
                  <div className="text-xs text-white/70 mt-0.5">{d.focus}</div>
                  <div className="mt-3 flex gap-2">
                    <Link to={`/country/${d.id}`} className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded bg-white/15 hover:bg-white/25 transition-colors">
                      Country ID <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Comparable metrics rows */}
          <CompareRow label="Mining projects" icon={<Pickaxe size={14} />} accent="green">
            {data.map((d) => (
              <MetricCell key={d.country} value={d.projectsCount} suffix=" projects" pct={d.projectsCount / maxProjects} barColor="#00875A" />
            ))}
          </CompareRow>
          <CompareRow label="CAPEX exposure" icon={<DollarSign size={14} />} accent="blue">
            {data.map((d) => (
              <MetricCell key={d.country} value={d.capex} prefix="$" suffix="M" pct={d.capex / maxCapex} barColor="#2563EB" format="compact" />
            ))}
          </CompareRow>
          <CompareRow label="Cable demand est." icon={<Cable size={14} />} accent="amber">
            {data.map((d) => (
              <MetricCell key={d.country} value={d.cable} suffix=" km" pct={d.cable / maxCable} barColor="#D97706" format="compact" />
            ))}
          </CompareRow>
          <CompareRow label="News mentions (30d)" icon={<Newspaper size={14} />} accent="neutral">
            {data.map((d) => (
              <MetricCell key={d.country} value={d.newsCount} suffix=" articles" pct={d.newsCount / maxNews} barColor="#7B8497" />
            ))}
          </CompareRow>
          <CompareRow label="Flagged of interest" icon={<Star size={14} />} accent="amber">
            {data.map((d) => (
              <MetricCell key={d.country} value={d.flagged} suffix=" flagged" pct={d.flagged ? 1 : 0} barColor="#D97706" />
            ))}
          </CompareRow>

          {/* Detail row: top projects + recent news */}
          <div>
            <SectionTitle>Top signals per country</SectionTitle>
            <div className={`grid gap-4`} style={{ gridTemplateColumns: `repeat(${data.length}, minmax(0, 1fr))` }}>
              {data.map((d) => (
                <Card key={d.country} padding="none">
                  <div className="px-5 pt-4 pb-2 border-b border-line">
                    <div className="text-xs text-ink-subtle">{d.country}</div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-ink-subtle font-medium mb-2">Top projects</div>
                      {d.topProjects.length === 0 && <div className="text-xs text-ink-faint italic">No projects tracked</div>}
                      <ul className="space-y-1.5">
                        {d.topProjects.map((p) => (
                          <li key={p.id} className="text-xs text-ink truncate">
                            <span className="font-medium">{p.name}</span>
                            <span className="text-ink-subtle"> · {p.status ?? "—"}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <div className="text-[11px] uppercase tracking-wider text-ink-subtle font-medium mb-2">Recent news</div>
                      {d.recentNews.length === 0 && <div className="text-xs text-ink-faint italic">No news for this market</div>}
                      <ul className="space-y-1.5">
                        {d.recentNews.map((n) => (
                          <li key={n.id}>
                            <a href={n.url} target="_blank" rel="noreferrer" className="text-xs text-ink hover:text-prysmian-green line-clamp-2">
                              {n.title}
                            </a>
                            <div className="text-[10px] text-ink-subtle mt-0.5">{n.source}</div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CompareRow({ label, icon, accent, children }: { label: string; icon: React.ReactNode; accent: string; children: React.ReactNode }) {
  const cells = Array.isArray(children) ? children : [children];
  return (
    <Card padding="none">
      <div className="grid" style={{ gridTemplateColumns: `220px repeat(${cells.length}, minmax(0, 1fr))` }}>
        <div className="p-4 border-r border-line flex items-center gap-2.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center bg-surface-subtle text-ink-muted`}>{icon}</div>
          <div className="text-sm font-medium text-ink">{label}</div>
        </div>
        {cells.map((c, i) => (
          <div key={i} className={`p-4 ${i < cells.length - 1 ? "border-r border-line" : ""}`}>{c}</div>
        ))}
      </div>
    </Card>
  );
}

function MetricCell({ value, prefix = "", suffix = "", pct, barColor, format }: { value: number; prefix?: string; suffix?: string; pct: number; barColor: string; format?: "compact" }) {
  const display = format === "compact" && value >= 1000 ? `${prefix}${(value / 1000).toFixed(1)}k${suffix}` : `${prefix}${value.toLocaleString()}${suffix}`;
  return (
    <div>
      <div className="text-2xl font-bold tabular-nums text-ink">{display}</div>
      <div className="mt-2 h-1.5 rounded-full bg-surface-subtle overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(2, pct * 100)}%`, backgroundColor: barColor }} />
      </div>
    </div>
  );
}
