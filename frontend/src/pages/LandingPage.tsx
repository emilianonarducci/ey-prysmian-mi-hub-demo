import { Link } from "react-router-dom";
import { Globe, LineChart, Newspaper, ListChecks, ArrowRight, Pickaxe, Activity, Building2, Sparkles, TrendingUp, AlertCircle } from "lucide-react";
import { useProjects, useNews } from "@/lib/queries";
import { Card, CardHeader } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Badge, SectionTitle } from "@/components/ui/Badge";

export default function LandingPage() {
  const projects = useProjects();
  const news = useNews();
  const userEmail = sessionStorage.getItem("mi_hub_user") || "";
  const firstName = userEmail.split("@")[0].split(".")[0];
  const greet = greeting();

  const projectsTotal = projects.data?.total ?? 0;
  const newsCount = news.data?.length ?? 0;
  const recentNews = (news.data ?? []).slice(0, 5);
  const flaggedProjects = (projects.data?.items ?? []).filter((p) => p.flagged_of_interest).slice(0, 4);

  return (
    <div className="space-y-8 max-w-[1400px]">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ey-navy via-ey-navy to-ey-navy-dark text-white p-8 md:p-10">
        <div
          className="absolute inset-0 opacity-25 mix-blend-screen"
          style={{
            backgroundImage: "url(/mockup-reference/image1.jpg)",
            backgroundSize: "auto 130%",
            backgroundPosition: "right 30% center",
            backgroundRepeat: "no-repeat",
          }}
        />
        <div className="absolute -right-32 -top-32 w-96 h-96 rounded-full bg-prysmian-green/20 blur-3xl" />
        <div className="relative">
          <Badge tone="green" dot>Live · AI agents active</Badge>
          <h1 className="mt-3 text-3xl md:text-4xl font-bold tracking-tight">
            {greet}{firstName ? `, ${capitalize(firstName)}` : ""}
          </h1>
          <p className="mt-2 text-white/70 max-w-2xl">
            Here's what's moving in cable demand, mining commodities and EU energy markets today.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link to="/trends" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-prysmian-green hover:bg-prysmian-green-light text-white font-medium text-sm transition-colors">
              <TrendingUp size={15} /> Today's market brief
            </Link>
            <Link to="/projects" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-sm transition-colors">
              <Pickaxe size={15} /> Mining pipeline
            </Link>
          </div>
        </div>
      </section>

      {/* KPI strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Mining projects" value={projectsTotal} delta={8} deltaLabel="vs last quarter" icon={<Pickaxe size={15} />} accent="green" />
        <Stat label="News tracked (30d)" value={newsCount} delta={12} deltaLabel="vs prev 30d" icon={<Newspaper size={15} />} accent="blue" />
        <Stat label="Countries covered" value={5} hint="EU focus · expanding to MENA" icon={<Globe size={15} />} accent="amber" />
        <Stat label="AI confidence" value="92%" delta={3} deltaLabel="avg evidence score" icon={<Sparkles size={15} />} accent="green" />
      </section>

      {/* Workspace grid */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* News feed */}
        <Card className="lg:col-span-2" padding="none">
          <div className="p-5 pb-3 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-ink">Latest intelligence</h2>
              <p className="text-xs text-ink-subtle mt-0.5">AI-curated from {news.data?.length ?? "—"} sources</p>
            </div>
            <Link to="/news" className="btn-ghost text-xs">View all <ArrowRight size={13} /></Link>
          </div>
          <div className="divide-y divide-line">
            {recentNews.length === 0 && (
              <div className="px-5 py-10 text-center text-sm text-ink-subtle">No news available yet.</div>
            )}
            {recentNews.map((n) => (
              <a key={n.id} href={n.url} target="_blank" rel="noreferrer" className="group block px-5 py-3.5 hover:bg-surface-muted transition-colors">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-accent-blue-light text-accent-blue flex items-center justify-center shrink-0">
                    <Newspaper size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[11px] font-medium text-ink-subtle uppercase tracking-wide">{n.source}</span>
                      {n.countries?.slice(0, 2).map((c) => (
                        <Badge key={c} tone="neutral">{c}</Badge>
                      ))}
                      <span className="text-[11px] text-ink-faint ml-auto">{relTime(n.published_at)}</span>
                    </div>
                    <div className="mt-1 text-sm font-medium text-ink group-hover:text-prysmian-green transition-colors line-clamp-2">{n.title}</div>
                    {n.summary && <div className="mt-1 text-xs text-ink-muted line-clamp-2">{n.summary}</div>}
                  </div>
                </div>
              </a>
            ))}
          </div>
        </Card>

        {/* Side column */}
        <div className="space-y-5">
          <Card padding="none">
            <CardHeader title="Flagged projects" subtitle="High strategic interest" action={<Link to="/projects" className="btn-ghost text-xs">All <ArrowRight size={13} /></Link>} />
            <div className="divide-y divide-line">
              {flaggedProjects.length === 0 && <div className="px-5 py-6 text-xs text-ink-subtle">Nothing flagged yet.</div>}
              {flaggedProjects.map((p) => (
                <div key={p.id} className="px-5 py-3 flex items-center gap-3">
                  <Building2 size={14} className="text-ink-faint shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-ink truncate">{p.name}</div>
                    <div className="text-[11px] text-ink-subtle">{p.country ?? "—"} · {p.status ?? "—"}</div>
                  </div>
                  {p.capex_estimate_musd && (
                    <div className="text-xs font-mono text-ink-muted tabular-nums">${p.capex_estimate_musd}M</div>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent-amber-light text-accent-amber flex items-center justify-center shrink-0">
                <AlertCircle size={15} />
              </div>
              <div>
                <div className="text-sm font-semibold text-ink">EU AI Act compliance</div>
                <div className="text-xs text-ink-muted mt-1">All AI outputs include evidence trail and confidence scoring. Demo build · audit-grade scaffolding.</div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Quick nav */}
      <section>
        <SectionTitle>Explore</SectionTitle>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <NavCard to="/country/italy" label="Country ID" desc="Deep-dive on a single market" Icon={Globe} accent="blue" />
          <NavCard to="/trends" label="Market Trends" desc="Commodity & demand signals" Icon={LineChart} accent="green" />
          <NavCard to="/news" label="News & Reports" desc="AI-curated daily feed" Icon={Newspaper} accent="amber" />
          <NavCard to="/projects" label="Project List" desc="Mining pipeline tracker" Icon={ListChecks} accent="neutral" />
        </div>
      </section>
    </div>
  );
}

const accentBg: Record<string, string> = {
  green: "bg-accent-green-light text-accent-green",
  blue: "bg-accent-blue-light text-accent-blue",
  amber: "bg-accent-amber-light text-accent-amber",
  neutral: "bg-surface-subtle text-ink-muted",
};

function NavCard({ to, label, desc, Icon, accent }: { to: string; label: string; desc: string; Icon: any; accent: keyof typeof accentBg }) {
  return (
    <Link to={to} className="card card-hover p-5 group flex flex-col gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accentBg[accent]}`}>
        <Icon size={18} />
      </div>
      <div>
        <div className="text-sm font-semibold text-ink group-hover:text-prysmian-green transition-colors flex items-center gap-1">
          {label}
          <ArrowRight size={13} className="opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
        </div>
        <div className="text-xs text-ink-subtle mt-0.5">{desc}</div>
      </div>
    </Link>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return "Good night";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function relTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
