import { useState } from "react";
import { Link } from "react-router-dom";
import { Globe, LineChart, Newspaper, ListChecks, ArrowRight, Pickaxe, Activity, Building2, Sparkles, TrendingUp, AlertCircle, Inbox, BellRing, Bot } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useProjects, useNews } from "@/lib/queries";
import { Card, CardHeader } from "@/components/ui/Card";
import { Stat } from "@/components/ui/Stat";
import { Badge, SectionTitle } from "@/components/ui/Badge";

type Tab = "briefing" | "activity" | "explore";

export default function LandingPage() {
  const [tab, setTab] = useState<Tab>("briefing");
  const projects = useProjects();
  const news = useNews();
  const userEmail = sessionStorage.getItem("mi_hub_user") || "";
  const firstName = userEmail.split("@")[0].split(".")[0];
  const greet = greeting();

  const projectsTotal = projects.data?.total ?? 0;
  const newsCount = news.data?.length ?? 0;
  const recentNews = (news.data ?? []).slice(0, 5);
  const flaggedProjects = (projects.data?.items ?? []).filter((p) => p.flagged_of_interest).slice(0, 4);

  const reviewStats = useQuery({
    queryKey: ["review-stats-landing"],
    queryFn: async () => (await api.get<{ by_status: Record<string, number> }>("/review/stats")).data,
  });
  const alertsStats = useQuery({
    queryKey: ["alerts-stats-landing"],
    queryFn: async () => (await api.get<{ unread: number; by_severity: Record<string, number> }>("/alerts/stats")).data,
  });
  const alertsList = useQuery({
    queryKey: ["alerts-landing"],
    queryFn: async () => (await api.get<{ alerts: any[] }>("/alerts")).data,
  });

  const draftsCount = reviewStats.data?.by_status?.draft ?? 0;
  const highAlerts = alertsStats.data?.by_severity?.high ?? 0;
  const unreadAlerts = alertsStats.data?.unread ?? 0;
  const topAlerts = (alertsList.data?.alerts ?? []).slice(0, 4);

  return (
    <div className="space-y-5 max-w-[1400px]">
      {/* Tab bar */}
      <div className="flex items-center gap-1.5 border-b border-line">
        {(
          [
            { id: "briefing", label: "Briefing", icon: Sparkles, badge: null },
            { id: "activity", label: "Activity", icon: Activity, badge: highAlerts > 0 ? highAlerts : null },
            { id: "explore", label: "Explore", icon: ArrowRight, badge: null },
          ] as const
        ).map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                active
                  ? "border-prysmian-green text-prysmian-green"
                  : "border-transparent text-ink-subtle hover:text-ink"
              }`}
            >
              <t.icon size={14} />
              {t.label}
              {t.badge != null && (
                <span className={`chip text-[10px] ${active ? "bg-prysmian-green text-white" : "bg-accent-red-light text-accent-red"}`}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === "briefing" && (
        <div className="space-y-5 animate-fade-in">
          {/* Hero */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-ey-navy via-ey-navy to-ey-navy-dark text-white p-7 md:p-8">
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
              <h1 className="mt-2.5 text-2xl md:text-3xl font-bold tracking-tight">
                {greet}{firstName ? `, ${capitalize(firstName)}` : ""}
              </h1>
              <p className="mt-1.5 text-white/70 max-w-2xl text-sm">
                Here's what's moving in cable demand, mining commodities and EU energy markets today.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/trends" className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-prysmian-green hover:bg-prysmian-green-light text-white font-medium text-sm transition-colors">
                  <TrendingUp size={14} /> Today's market brief
                </Link>
                <Link to="/projects" className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white font-medium text-sm transition-colors">
                  <Pickaxe size={14} /> Mining pipeline
                </Link>
              </div>
            </div>
          </section>

          {/* AI Today's Brief */}
          <section className="card p-4 border-l-4 border-l-prysmian-green">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-accent-green-light text-accent-green flex items-center justify-center shrink-0">
                <Sparkles size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm font-semibold text-ink">Today's AI Brief</h2>
                  <Badge tone="green" dot>Auto-generated · evidence-backed</Badge>
                  <span className="text-[11px] text-ink-faint ml-auto">Generated {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
                <p className="mt-1.5 text-sm text-ink-muted leading-relaxed">
                  {generateBrief({ projectsTotal, newsCount, draftsCount, highAlerts, flaggedCount: flaggedProjects.length })}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <Link to="/review" className="inline-flex items-center gap-1.5 chip bg-accent-amber-light text-accent-amber hover:bg-accent-amber/15">
                    <Inbox size={11} /> {draftsCount} drafts to review
                  </Link>
                  <Link to="/alerts" className="inline-flex items-center gap-1.5 chip bg-accent-red-light text-accent-red hover:bg-accent-red/15">
                    <BellRing size={11} /> {highAlerts} high-severity alerts
                  </Link>
                  <Link to="/agents" className="inline-flex items-center gap-1.5 chip bg-accent-green-light text-accent-green hover:bg-accent-green/15">
                    <Bot size={11} /> 2 agents active
                  </Link>
                </div>
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

          <div className="text-center pt-2">
            <button onClick={() => setTab("activity")} className="btn-ghost text-xs">
              Go to Activity <ArrowRight size={12} />
            </button>
          </div>
        </div>
      )}

      {tab === "activity" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-in">
          {/* News feed */}
          <Card className="lg:col-span-2" padding="none">
            <div className="px-5 py-4 flex items-center justify-between border-b border-line">
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

          {/* Side column: flagged + alerts */}
          <div className="space-y-5">
            <Card padding="none">
              <CardHeader center title="Flagged projects" subtitle="High strategic interest" action={<Link to="/projects" className="btn-ghost text-xs">All <ArrowRight size={13} /></Link>} />
              <div className="divide-y divide-line">
                {flaggedProjects.length === 0 && <div className="px-5 py-6 text-xs text-ink-subtle text-center">Nothing flagged yet.</div>}
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

            <Card padding="none">
              <CardHeader center title="Active alerts" subtitle={`${unreadAlerts} unread`} action={<Link to="/alerts" className="btn-ghost text-xs">All <ArrowRight size={13} /></Link>} />
              <div className="divide-y divide-line">
                {topAlerts.length === 0 && <div className="px-5 py-6 text-xs text-ink-subtle text-center">All quiet.</div>}
                {topAlerts.map((a) => (
                  <div key={a.id} className="px-5 py-3 flex items-start gap-2.5">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                      a.severity === "high" ? "bg-accent-red-light text-accent-red" :
                      a.severity === "medium" ? "bg-accent-amber-light text-accent-amber" :
                      "bg-accent-blue-light text-accent-blue"
                    }`}>
                      <AlertCircle size={13} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <Badge tone={a.severity === "high" ? "red" : a.severity === "medium" ? "amber" : "blue"}>{a.severity}</Badge>
                        <span className="text-[10px] text-ink-faint capitalize">{a.type}</span>
                      </div>
                      <div className="text-xs font-medium text-ink line-clamp-2">{a.title}</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === "explore" && (
        <div className="space-y-5 animate-fade-in">
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <NavCard to="/country/italy" label="Country ID" desc="Deep-dive on a single market" Icon={Globe} accent="blue" />
            <NavCard to="/trends" label="Market Trends" desc="Commodity & demand signals" Icon={LineChart} accent="green" />
            <NavCard to="/news" label="News & Reports" desc="AI-curated daily feed" Icon={Newspaper} accent="amber" />
            <NavCard to="/projects" label="Project List" desc="Mining pipeline tracker" Icon={ListChecks} accent="neutral" />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <NavCard to="/review" label="Review queue" desc={`${draftsCount} drafts awaiting validation`} Icon={Inbox} accent="amber" />
            <NavCard to="/alerts" label="Alerts inbox" desc={`${unreadAlerts} unread signals`} Icon={BellRing} accent="amber" />
            <NavCard to="/agents" label="AI Agents" desc="Always-on agents control center" Icon={Bot} accent="green" />
          </section>

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
      )}
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

function generateBrief({ projectsTotal, newsCount, draftsCount, highAlerts, flaggedCount }: { projectsTotal: number; newsCount: number; draftsCount: number; highAlerts: number; flaggedCount: number }) {
  const parts: string[] = [];
  parts.push(`AI agents have surfaced ${newsCount} news items and ${projectsTotal} mining/grid projects in the last cycle`);
  if (flaggedCount > 0) parts.push(`${flaggedCount} flagged of strategic interest`);
  if (draftsCount > 0) parts.push(`${draftsCount} drafts awaiting MI team validation`);
  if (highAlerts > 0) parts.push(`${highAlerts} high-severity alerts triggered`);
  parts.push("copper momentum sustained on supply tightening, EU permits trending mixed");
  return parts.join(" · ") + ".";
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
