import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import api from "@/lib/api";
import {
  BellRing, AlertTriangle, TrendingUp, Building2, Newspaper, Swords, CheckCheck,
  Settings2, MailCheck, Slack, MessageSquare, Filter, Sparkles, ExternalLink,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge, SectionTitle } from "@/components/ui/Badge";

interface Alert {
  id: string;
  type: "kpi" | "project" | "news" | "competitor";
  severity: "high" | "medium" | "low";
  title: string;
  body: string;
  country: string | null;
  agent: string;
  trigger_reason: string;
  timestamp: string;
  read: boolean;
  link: string | null;
  confidence: number;
}

interface Subscriptions {
  channels: { in_app: boolean; email: boolean; teams: boolean };
  bu: string[];
  countries: string[];
  topics: string[];
  min_severity: string;
}

const TYPE_ICON: Record<string, any> = { kpi: TrendingUp, project: Building2, news: Newspaper, competitor: Swords };
const SEV_TONE: Record<string, "red" | "amber" | "blue"> = { high: "red", medium: "amber", low: "blue" };

export default function AlertsPage() {
  const [type, setType] = useState<string | "all">("all");
  const [severity, setSeverity] = useState<string | "all">("all");
  const [showSubs, setShowSubs] = useState(false);
  const qc = useQueryClient();

  const alerts = useQuery({
    queryKey: ["alerts", type, severity],
    queryFn: async () => {
      const params: any = {};
      if (type !== "all") params.type_filter = type;
      if (severity !== "all") params.severity = severity;
      return (await api.get<{ alerts: Alert[]; total: number }>("/alerts", { params })).data;
    },
    refetchInterval: 20000,
  });

  const stats = useQuery({
    queryKey: ["alerts-stats"],
    queryFn: async () => (await api.get("/alerts/stats")).data,
  });

  const markRead = useMutation({
    mutationFn: async (a: { id: string; read: boolean }) => (await api.post(`/alerts/${encodeURIComponent(a.id)}/read`, { read: a.read })).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts"] });
      qc.invalidateQueries({ queryKey: ["alerts-stats"] });
      qc.invalidateQueries({ queryKey: ["alerts-count-nav"] });
    },
  });

  const items = alerts.data?.alerts ?? [];

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
            Alerts inbox
            <BellRing size={18} className="text-prysmian-green" />
          </h1>
          <p className="text-sm text-ink-subtle mt-1">
            KPI deviations, competitor moves, new flagged projects — routed by your subscriptions.
          </p>
        </div>
        <button onClick={() => setShowSubs(true)} className="btn-outline">
          <Settings2 size={14} /> Subscriptions
        </button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="High severity" value={stats.data?.by_severity?.high ?? 0} tone="red" />
        <StatCard label="Medium" value={stats.data?.by_severity?.medium ?? 0} tone="amber" />
        <StatCard label="Unread" value={stats.data?.unread ?? 0} tone="blue" />
        <StatCard label="Total" value={stats.data?.total ?? 0} tone="neutral" />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter size={13} className="text-ink-subtle" />
        <span className="text-xs text-ink-subtle mr-1">Type:</span>
        {["all", "kpi", "project", "news", "competitor"].map((t) => (
          <button key={t} onClick={() => setType(t)} className={`chip ${type === t ? "bg-ey-navy text-white" : "bg-surface-subtle text-ink-muted hover:bg-line"}`}>
            {t}
          </button>
        ))}
        <span className="text-xs text-ink-subtle ml-3 mr-1">Severity:</span>
        {["all", "high", "medium", "low"].map((s) => (
          <button key={s} onClick={() => setSeverity(s)} className={`chip ${severity === s ? "bg-ey-navy text-white" : "bg-surface-subtle text-ink-muted hover:bg-line"}`}>
            {s}
          </button>
        ))}
      </div>

      {/* List */}
      {items.length === 0 && (
        <Card><div className="text-center py-10 text-sm text-ink-subtle">No alerts match these filters.</div></Card>
      )}
      <div className="space-y-2">
        {items.map((a) => {
          const Icon = TYPE_ICON[a.type] ?? BellRing;
          return (
            <Card key={a.id} padding="none" interactive className={a.read ? "opacity-60" : ""}>
              <div className="flex items-start gap-3 p-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  a.severity === "high" ? "bg-accent-red-light text-accent-red" :
                  a.severity === "medium" ? "bg-accent-amber-light text-accent-amber" :
                  "bg-accent-blue-light text-accent-blue"
                }`}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge tone={SEV_TONE[a.severity]} dot>{a.severity}</Badge>
                    <Badge tone="neutral">{a.type}</Badge>
                    {a.country && <Badge tone="blue">{a.country}</Badge>}
                    <Badge tone="neutral"><Sparkles size={10} /> {a.confidence}%</Badge>
                    {!a.read && <span className="chip bg-prysmian-green/10 text-prysmian-green text-[10px]">NEW</span>}
                    <span className="text-[11px] text-ink-faint ml-auto">{relTime(a.timestamp)}</span>
                  </div>
                  <div className="mt-2 text-sm font-semibold text-ink">{a.title}</div>
                  <p className="mt-1 text-xs text-ink-muted line-clamp-2">{a.body}</p>
                  <div className="mt-2 flex items-start gap-1.5 text-[11px] text-ink-subtle">
                    <Sparkles size={11} className="text-accent-green mt-0.5 shrink-0" />
                    <span><span className="font-medium text-ink">Trigger:</span> {a.trigger_reason}</span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    {a.link && (
                      a.link.startsWith("/") ? (
                        <Link to={a.link} className="btn-ghost text-xs">
                          Open <ExternalLink size={11} />
                        </Link>
                      ) : (
                        <a href={a.link} target="_blank" rel="noreferrer" className="btn-ghost text-xs">
                          Open <ExternalLink size={11} />
                        </a>
                      )
                    )}
                    <button
                      onClick={() => markRead.mutate({ id: a.id, read: !a.read })}
                      className="btn-ghost text-xs ml-auto"
                    >
                      {a.read ? "Mark unread" : <><CheckCheck size={12} /> Mark read</>}
                    </button>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {showSubs && <SubscriptionsPanel onClose={() => setShowSubs(false)} />}
    </div>
  );
}

function SubscriptionsPanel({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data: subs } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: async () => (await api.get<Subscriptions>("/alerts/subscriptions")).data,
  });
  const update = useMutation({
    mutationFn: async (s: Partial<Subscriptions>) => (await api.put("/alerts/subscriptions", s)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["subscriptions"] }),
  });

  if (!subs) return null;

  function toggleChannel(k: keyof Subscriptions["channels"]) {
    update.mutate({ channels: { ...subs!.channels, [k]: !subs!.channels[k] } });
  }
  function toggleListItem(field: "bu" | "countries" | "topics", v: string) {
    const list = subs![field];
    update.mutate({ [field]: list.includes(v) ? list.filter((x) => x !== v) : [...list, v] } as any);
  }

  const BUs = ["I&C", "Elevators", "Automotive", "Mining", "Renewable", "Fiber", "Connectivity", "Power Grid", "Submarine", "B&C"];
  const COUNTRIES = ["Italy", "France", "Germany", "Spain", "Netherlands", "UK"];
  const TOPICS = ["copper", "permits", "new_projects", "competitor_moves", "EV_demand", "subsea"];

  return (
    <div className="fixed inset-0 z-50 bg-ey-navy/30 backdrop-blur-sm flex justify-end" onClick={onClose}>
      <div className="w-full max-w-md bg-white h-full shadow-elevated overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-line">
          <h2 className="text-lg font-bold text-ink">Alert subscriptions</h2>
          <p className="text-xs text-ink-muted mt-1">Choose how, where and what you want to be alerted about.</p>
        </div>

        <div className="px-6 py-5 space-y-5">
          <Section title="Channels">
            <ChannelRow icon={<BellRing size={14} />} label="In-app" enabled={subs.channels.in_app} onClick={() => toggleChannel("in_app")} />
            <ChannelRow icon={<MailCheck size={14} />} label="Email digest" enabled={subs.channels.email} onClick={() => toggleChannel("email")} />
            <ChannelRow icon={<MessageSquare size={14} />} label="Microsoft Teams" enabled={subs.channels.teams} onClick={() => toggleChannel("teams")} />
          </Section>

          <Section title="Business units">
            <ChipGroup all={BUs} selected={subs.bu} onToggle={(v) => toggleListItem("bu", v)} />
          </Section>

          <Section title="Countries">
            <ChipGroup all={COUNTRIES} selected={subs.countries} onToggle={(v) => toggleListItem("countries", v)} />
          </Section>

          <Section title="Topics">
            <ChipGroup all={TOPICS} selected={subs.topics} onToggle={(v) => toggleListItem("topics", v)} />
          </Section>

          <Section title="Minimum severity">
            <div className="flex gap-2">
              {["low", "medium", "high"].map((s) => (
                <button
                  key={s}
                  onClick={() => update.mutate({ min_severity: s })}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                    subs.min_severity === s ? "border-prysmian-green bg-prysmian-green/8 text-prysmian-green" : "border-line text-ink-muted hover:bg-surface-subtle"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </Section>
        </div>

        <div className="px-6 py-4 border-t border-line bg-surface-muted flex gap-2">
          <button onClick={onClose} className="btn-primary flex-1">Done</button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle mb-2">{title}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function ChannelRow({ icon, label, enabled, onClick }: { icon: React.ReactNode; label: string; enabled: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-line hover:bg-surface-subtle">
      <span className="flex items-center gap-2 text-sm text-ink">{icon} {label}</span>
      <span className={`w-9 h-5 rounded-full p-0.5 transition-colors ${enabled ? "bg-prysmian-green" : "bg-line-strong"}`}>
        <span className={`block w-4 h-4 rounded-full bg-white transition-transform ${enabled ? "translate-x-4" : ""}`} />
      </span>
    </button>
  );
}

function ChipGroup({ all, selected, onToggle }: { all: string[]; selected: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {all.map((v) => {
        const on = selected.includes(v);
        return (
          <button
            key={v}
            onClick={() => onToggle(v)}
            className={`chip ${on ? "bg-prysmian-green text-white" : "bg-surface-subtle text-ink-muted hover:bg-line"}`}
          >
            {v}
          </button>
        );
      })}
    </div>
  );
}

function StatCard({ label, value, tone }: { label: string; value: number; tone: "red" | "amber" | "blue" | "neutral" }) {
  const bg = tone === "red" ? "bg-accent-red-light text-accent-red" : tone === "amber" ? "bg-accent-amber-light text-accent-amber" : tone === "blue" ? "bg-accent-blue-light text-accent-blue" : "bg-surface-subtle text-ink-muted";
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
        <span className={`w-5 h-5 rounded ${bg}`} />
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums text-ink">{value}</div>
    </div>
  );
}

function relTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
