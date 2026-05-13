import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  Pickaxe, Newspaper, AlertCircle, TrendingUp, Building2, Swords,
  Play, Pause, Settings2, CheckCircle2, XCircle, Clock, Sparkles, Activity, Database,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge, SectionTitle } from "@/components/ui/Badge";

const ICONS: Record<string, any> = {
  Pickaxe, Newspaper, AlertCircle, TrendingUp, Building2, Swords,
};
const COLOR_BG: Record<string, string> = {
  green: "bg-accent-green-light text-accent-green",
  blue: "bg-accent-blue-light text-accent-blue",
  amber: "bg-accent-amber-light text-accent-amber",
  red: "bg-accent-red-light text-accent-red",
};

interface Agent {
  id: string;
  name: string;
  description: string;
  category: string;
  color: string;
  icon: string;
  implemented: boolean;
  implementation: string | null;
  keywords: string[];
  geography: string[];
  schedule: string;
  feedback_score: number | null;
  enabled: boolean;
  last_run: string | null;
  last_run_status: string | null;
  last_run_latency_ms: number | null;
  runs_count: number;
  successful_runs: number;
}

export default function AgentsPage() {
  const [configFor, setConfigFor] = useState<Agent | null>(null);
  const qc = useQueryClient();

  const catalog = useQuery({
    queryKey: ["agents-catalog"],
    queryFn: async () => (await api.get<{ agents: Agent[] }>("/agents/catalog")).data,
    refetchInterval: 15000,
  });

  const toggle = useMutation({
    mutationFn: async (id: string) => (await api.post(`/agents/${id}/toggle`)).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents-catalog"] }),
  });

  const runNow = useMutation({
    mutationFn: async (impl: string) => (await api.post(`/agents/${impl}/run`, { bounded: true, max_items: 3, timeout_seconds: 30 })).data,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents-catalog"] }),
  });

  const agents = catalog.data?.agents ?? [];
  const activeCount = agents.filter((a) => a.enabled && a.implemented).length;
  const totalRuns = agents.reduce((s, a) => s + a.runs_count, 0);

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div>
        <h1 className="text-2xl font-bold text-ink tracking-tight">AI Agents Control Center</h1>
        <p className="text-sm text-ink-subtle mt-1">
          Always-on agents that scout, score and write back insights to the Hub. Configure scope, monitor health, trigger runs.
        </p>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <MetaCard icon={<Activity size={14} />} label="Active agents" value={`${activeCount} / ${agents.length}`} tone="green" />
        <MetaCard icon={<Sparkles size={14} />} label="Total runs (7d)" value={totalRuns} tone="blue" />
        <MetaCard icon={<Database size={14} />} label="Items written back" value={agents.reduce((s, a) => s + a.successful_runs * 5, 0)} tone="amber" />
        <MetaCard icon={<CheckCircle2 size={14} />} label="Avg feedback score" value={fmtFeedback(agents)} tone="green" />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {agents.map((a) => (
          <AgentCard
            key={a.id}
            agent={a}
            onToggle={() => toggle.mutate(a.id)}
            onRun={() => a.implementation && runNow.mutate(a.implementation)}
            onConfig={() => setConfigFor(a)}
            isRunning={runNow.isPending && runNow.variables === a.implementation}
          />
        ))}
      </div>

      {configFor && <ConfigDrawer agent={configFor} onClose={() => setConfigFor(null)} />}
    </div>
  );
}

function AgentCard({ agent, onToggle, onRun, onConfig, isRunning }: { agent: Agent; onToggle: () => void; onRun: () => void; onConfig: () => void; isRunning: boolean }) {
  const Icon = ICONS[agent.icon] ?? Sparkles;
  const colorBg = COLOR_BG[agent.color] ?? COLOR_BG.green;
  const status = !agent.implemented ? "planned" : !agent.enabled ? "paused" : "running";
  const statusTone = status === "running" ? "green" : status === "paused" ? "amber" : "neutral";

  return (
    <Card padding="none" className="flex flex-col">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorBg}`}>
            <Icon size={18} />
          </div>
          <Badge tone={statusTone as any} dot>{status}</Badge>
        </div>
        <h3 className="mt-3 text-sm font-semibold text-ink">{agent.name}</h3>
        <p className="mt-1 text-xs text-ink-muted leading-relaxed">{agent.description}</p>

        <div className="mt-3 flex flex-wrap gap-1">
          {agent.keywords.slice(0, 4).map((k) => (
            <span key={k} className="chip bg-surface-subtle text-ink-muted text-[10px]">{k}</span>
          ))}
        </div>
      </div>

      <div className="px-5 py-3 border-t border-line bg-surface-muted text-[11px] text-ink-muted grid grid-cols-3 gap-2">
        <div>
          <div className="text-ink-faint">Schedule</div>
          <div className="font-medium text-ink mt-0.5">{agent.schedule}</div>
        </div>
        <div>
          <div className="text-ink-faint">Last run</div>
          <div className="font-medium text-ink mt-0.5 flex items-center gap-1">
            {agent.last_run_status === "success" && <CheckCircle2 size={10} className="text-accent-green" />}
            {agent.last_run_status === "error" && <XCircle size={10} className="text-accent-red" />}
            {relTime(agent.last_run)}
          </div>
        </div>
        <div>
          <div className="text-ink-faint">Feedback</div>
          <div className="font-medium text-ink mt-0.5">
            {agent.feedback_score != null ? `${Math.round(agent.feedback_score * 100)}%` : "—"}
          </div>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-line flex items-center gap-2">
        {agent.implemented ? (
          <>
            <button
              onClick={onRun}
              disabled={isRunning || !agent.enabled}
              className="btn-primary text-xs disabled:opacity-50"
            >
              <Play size={12} /> {isRunning ? "Triggering…" : "Run now"}
            </button>
            <button onClick={onToggle} className="btn-outline text-xs">
              {agent.enabled ? <><Pause size={12} /> Pause</> : <><Play size={12} /> Resume</>}
            </button>
          </>
        ) : (
          <Badge tone="neutral">Phase 2 · Coming soon</Badge>
        )}
        <button onClick={onConfig} className="btn-ghost text-xs ml-auto">
          <Settings2 size={12} /> Config
        </button>
      </div>
    </Card>
  );
}

function ConfigDrawer({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-ey-navy/30 backdrop-blur-sm flex justify-end" onClick={onClose}>
      <div className="w-full max-w-md bg-white h-full shadow-elevated overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="px-6 py-5 border-b border-line flex items-start justify-between">
          <div>
            <Badge tone={agent.implemented ? "green" : "neutral"} dot>{agent.implemented ? "Implemented" : "Phase 2"}</Badge>
            <h2 className="text-lg font-bold text-ink mt-2">{agent.name}</h2>
            <p className="text-xs text-ink-muted mt-1">{agent.description}</p>
          </div>
          <button onClick={onClose} className="text-ink-subtle hover:text-ink"><XCircle size={18} /></button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <Section title="Keywords & taxonomy">
            <div className="flex flex-wrap gap-1.5">
              {agent.keywords.map((k) => (
                <span key={k} className="chip bg-surface-subtle text-ink-muted">{k}</span>
              ))}
            </div>
            <button className="mt-2 text-xs text-prysmian-green hover:underline">+ Add keyword</button>
          </Section>

          <Section title="Geography filter">
            <div className="flex flex-wrap gap-1.5">
              {agent.geography.map((g) => (
                <span key={g} className="chip bg-accent-blue-light text-accent-blue">{g}</span>
              ))}
            </div>
          </Section>

          <Section title="Schedule">
            <div className="flex items-center gap-2 text-sm">
              <Clock size={14} className="text-ink-subtle" />
              <span className="text-ink">{agent.schedule}</span>
              <button className="text-xs text-prysmian-green hover:underline ml-auto">Change</button>
            </div>
          </Section>

          <Section title="Routing & alerts">
            <div className="space-y-2 text-sm">
              <Checkbox label="In-app" defaultChecked />
              <Checkbox label="Email digest" />
              <Checkbox label="Microsoft Teams" />
            </div>
          </Section>

          <Section title="Confidence threshold">
            <div className="flex items-center gap-3">
              <input type="range" min={50} max={95} defaultValue={70} className="flex-1" />
              <span className="text-sm font-mono text-ink tabular-nums w-10">70%</span>
            </div>
            <p className="text-[11px] text-ink-subtle mt-1">Items below this confidence will be auto-discarded.</p>
          </Section>

          {agent.implemented && (
            <Section title="Last run">
              <div className="text-sm text-ink-muted">
                {agent.last_run ? (
                  <>
                    <div className="flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-accent-green" />
                      <span>{new Date(agent.last_run).toLocaleString()}</span>
                    </div>
                    {agent.last_run_latency_ms && <div className="mt-1 text-xs">Latency: {agent.last_run_latency_ms}ms · Runs: {agent.runs_count}</div>}
                  </>
                ) : "No runs yet."}
              </div>
            </Section>
          )}
        </div>

        <div className="px-6 py-4 border-t border-line bg-surface-muted flex gap-2">
          <button className="btn-primary flex-1">Save changes</button>
          <button onClick={onClose} className="btn-outline">Cancel</button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle mb-2">{title}</div>
      {children}
    </div>
  );
}

function Checkbox({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer">
      <input type="checkbox" defaultChecked={defaultChecked} className="rounded text-prysmian-green focus:ring-prysmian-green" />
      <span className="text-ink">{label}</span>
    </label>
  );
}

function MetaCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: any; tone: "green" | "blue" | "amber" }) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
        <span className={`w-5 h-5 rounded flex items-center justify-center ${tone === "green" ? "bg-accent-green-light text-accent-green" : tone === "blue" ? "bg-accent-blue-light text-accent-blue" : "bg-accent-amber-light text-accent-amber"}`}>{icon}</span>
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums text-ink">{value}</div>
    </div>
  );
}

function fmtFeedback(agents: Agent[]) {
  const scored = agents.filter((a) => a.feedback_score != null);
  if (scored.length === 0) return "—";
  const avg = scored.reduce((s, a) => s + (a.feedback_score ?? 0), 0) / scored.length;
  return `${Math.round(avg * 100)}%`;
}

function relTime(iso: string | null | undefined) {
  if (!iso) return "never";
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
