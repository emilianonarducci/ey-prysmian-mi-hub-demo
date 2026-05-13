import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import {
  CheckCircle2, XCircle, Pencil, Sparkles, AlertCircle, Newspaper, Pickaxe,
  FileText, ExternalLink, Filter, Clock, ShieldCheck, MessageSquare,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import EvidenceMetadataViewer from "@/components/EvidenceMetadataViewer";

type ItemType = "news" | "project";
type Status = "draft" | "validated" | "rejected" | "published";

interface ReviewItem {
  item_id: string;
  item_type: ItemType;
  title: string;
  original_title: string;
  summary: string;
  source: string;
  url: string | null;
  country: string | null;
  segments: string[];
  confidence: number;
  ai_reason: string;
  agent: string;
  evidence_id: string | null;
  curated_at: string | null;
  status: Status;
  feedback: string | null;
  decided_at: string | null;
  decided_by: string | null;
}

interface ReviewStats {
  by_status: Record<Status, number>;
  total_items: number;
  decisions_logged: number;
}

const STATUS_TONE: Record<Status, "amber" | "green" | "red" | "blue"> = {
  draft: "amber", validated: "green", rejected: "red", published: "blue",
};

export default function ReviewQueuePage() {
  const [filterStatus, setFilterStatus] = useState<Status | "all">("draft");
  const [filterType, setFilterType] = useState<ItemType | "all">("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [evidenceId, setEvidenceId] = useState<string | null>(null);
  const qc = useQueryClient();

  const queue = useQuery({
    queryKey: ["review-queue", filterStatus, filterType],
    queryFn: async () => {
      const params: any = { status_filter: filterStatus, limit: 80 };
      if (filterType !== "all") params.item_type = filterType;
      const { data } = await api.get<{ items: ReviewItem[]; total: number }>("/review/queue", { params });
      return data;
    },
    refetchInterval: 15000,
  });

  const stats = useQuery({
    queryKey: ["review-stats"],
    queryFn: async () => (await api.get<ReviewStats>("/review/stats")).data,
    refetchInterval: 10000,
  });

  const items = queue.data?.items ?? [];
  const active = useMemo(() => items.find((i) => i.item_id === activeId) ?? items[0], [items, activeId]);

  const decide = useMutation({
    mutationFn: async (input: { id: string; status: Status; feedback?: string; edited_title?: string }) => {
      const { data } = await api.post(`/review/${input.id}/decide`, {
        status: input.status,
        feedback: input.feedback,
        edited_title: input.edited_title,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["review-queue"] });
      qc.invalidateQueries({ queryKey: ["review-stats"] });
    },
  });

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight flex items-center gap-2">
            Review queue
            <Badge tone="amber" dot>HITL</Badge>
          </h1>
          <p className="text-sm text-ink-subtle mt-1">
            AI-drafted items awaiting human validation. Accept, edit or reject — feedback is captured to improve agent performance.
          </p>
        </div>
        <Link tone="green" />
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatPill label="Drafts" value={stats.data?.by_status.draft ?? "—"} tone="amber" icon={<AlertCircle size={14} />} active={filterStatus === "draft"} onClick={() => setFilterStatus("draft")} />
        <StatPill label="Validated" value={stats.data?.by_status.validated ?? 0} tone="green" icon={<CheckCircle2 size={14} />} active={filterStatus === "validated"} onClick={() => setFilterStatus("validated")} />
        <StatPill label="Rejected" value={stats.data?.by_status.rejected ?? 0} tone="red" icon={<XCircle size={14} />} active={filterStatus === "rejected"} onClick={() => setFilterStatus("rejected")} />
        <StatPill label="Published" value={stats.data?.by_status.published ?? 0} tone="blue" icon={<ShieldCheck size={14} />} active={filterStatus === "published"} onClick={() => setFilterStatus("published")} />
      </div>

      {/* Type filter */}
      <div className="flex items-center gap-2">
        <Filter size={13} className="text-ink-subtle" />
        <span className="text-xs text-ink-subtle mr-2">Type:</span>
        {(["all", "news", "project"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilterType(t)}
            className={`chip ${filterType === t ? "bg-ey-navy text-white" : "bg-surface-subtle text-ink-muted hover:bg-line"}`}
          >
            {t}
          </button>
        ))}
        <button onClick={() => setFilterStatus("all")} className={`chip ml-auto ${filterStatus === "all" ? "bg-ey-navy text-white" : "bg-surface-subtle text-ink-muted hover:bg-line"}`}>show all statuses</button>
      </div>

      {items.length === 0 && (
        <Card>
          <div className="text-center py-10">
            <CheckCircle2 size={32} className="mx-auto text-accent-green opacity-60 mb-2" />
            <div className="text-sm font-semibold text-ink">No items in this queue</div>
            <div className="text-xs text-ink-subtle mt-1">All caught up — agents will write new drafts as soon as they fire.</div>
          </div>
        </Card>
      )}

      {items.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-5">
          {/* Queue list */}
          <Card padding="none">
            <div className="px-4 py-3 border-b border-line flex items-center justify-between">
              <div className="text-xs font-semibold uppercase tracking-wider text-ink-subtle">
                Queue · {items.length}
              </div>
              {queue.isFetching && <span className="text-[10px] text-ink-faint animate-pulse-soft">refreshing…</span>}
            </div>
            <ul className="divide-y divide-line max-h-[640px] overflow-y-auto">
              {items.map((it) => (
                <li key={it.item_id}>
                  <button
                    onClick={() => setActiveId(it.item_id)}
                    className={`w-full text-left px-4 py-3 transition-colors ${active?.item_id === it.item_id ? "bg-prysmian-green/8" : "hover:bg-surface-muted"}`}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <TypeIcon type={it.item_type} />
                      <span className="text-[10px] font-medium uppercase tracking-wider text-ink-subtle">{it.agent.replace(/_/g, " ")}</span>
                      <Badge tone={STATUS_TONE[it.status]} dot>{it.status}</Badge>
                      <ConfidencePill value={it.confidence} />
                      <span className="text-[10px] text-ink-faint ml-auto">{relTime(it.curated_at)}</span>
                    </div>
                    <div className="mt-1.5 text-sm font-medium text-ink line-clamp-2">{it.title}</div>
                    <div className="mt-1 text-[11px] text-ink-subtle flex items-center gap-2">
                      <span>{it.source}</span>
                      {it.country && <><span>·</span><span>{it.country}</span></>}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          {/* Detail/review panel */}
          {active && (
            <ReviewDetail
              key={active.item_id}
              item={active}
              onDecide={(d) => decide.mutate({ id: active.item_id, ...d })}
              isSubmitting={decide.isPending}
              onOpenEvidence={() => active.evidence_id && setEvidenceId(active.evidence_id)}
            />
          )}
        </div>
      )}

      {evidenceId && <EvidenceMetadataViewer evidenceId={evidenceId} onClose={() => setEvidenceId(null)} />}
    </div>
  );
}

function ReviewDetail({ item, onDecide, isSubmitting, onOpenEvidence }: {
  item: ReviewItem;
  onDecide: (d: { status: Status; feedback?: string; edited_title?: string }) => void;
  isSubmitting: boolean;
  onOpenEvidence: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(item.title);
  const [feedback, setFeedback] = useState("");

  function submit(status: Status) {
    onDecide({
      status,
      feedback: feedback.trim() || undefined,
      edited_title: editing && title.trim() !== item.original_title ? title.trim() : undefined,
    });
    setEditing(false);
    setFeedback("");
  }

  return (
    <Card padding="none">
      <div className="px-5 py-4 border-b border-line">
        <div className="flex items-center gap-2 flex-wrap">
          <TypeIcon type={item.item_type} />
          <Badge tone={STATUS_TONE[item.status]} dot>{item.status}</Badge>
          <Badge tone="neutral"><Sparkles size={10} /> {item.agent.replace(/_/g, " ")}</Badge>
          <ConfidencePill value={item.confidence} />
          {item.country && <Badge tone="blue">{item.country}</Badge>}
          {item.segments.slice(0, 3).map((s) => (
            <Badge key={s} tone="neutral">{s}</Badge>
          ))}
        </div>
        <div className="mt-3">
          {editing ? (
            <input
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-lg font-semibold text-ink border border-prysmian-green/40 rounded-lg px-3 py-2 focus-ring"
            />
          ) : (
            <h2 className="text-lg font-semibold text-ink">{item.title}</h2>
          )}
          {item.title !== item.original_title && !editing && (
            <div className="mt-1 text-[11px] text-ink-subtle italic">
              Edited from: <span className="line-through">{item.original_title}</span>
            </div>
          )}
          <p className="mt-2 text-sm text-ink-muted leading-relaxed">{item.summary}</p>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          {item.url && (
            <a href={item.url} target="_blank" rel="noreferrer" className="btn-outline">
              <ExternalLink size={12} /> Open source
            </a>
          )}
          {item.evidence_id && (
            <button onClick={onOpenEvidence} className="btn-outline">
              <FileText size={12} /> Evidence bundle
            </button>
          )}
          {!editing && item.status === "draft" && (
            <button onClick={() => setEditing(true)} className="btn-outline">
              <Pencil size={12} /> Edit title
            </button>
          )}
        </div>
      </div>

      {/* AI reasoning */}
      <div className="px-5 py-4 bg-surface-muted border-b border-line">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-accent-green-light text-accent-green flex items-center justify-center shrink-0">
            <Sparkles size={14} />
          </div>
          <div className="flex-1">
            <div className="text-xs font-semibold text-ink">Why the agent flagged this</div>
            <p className="text-xs text-ink-muted mt-1 leading-relaxed">{item.ai_reason}</p>
          </div>
        </div>
      </div>

      {/* Decision history (if decided) */}
      {item.decided_at && (
        <div className="px-5 py-3 bg-surface-subtle border-b border-line flex items-start gap-3 text-xs">
          <Clock size={12} className="text-ink-subtle mt-0.5" />
          <div>
            <span className="text-ink-muted">Decided <span className="font-medium text-ink">{relTime(item.decided_at)}</span> by <span className="font-medium text-ink">{item.decided_by}</span></span>
            {item.feedback && (
              <div className="mt-1.5 italic text-ink-muted">"{item.feedback}"</div>
            )}
          </div>
        </div>
      )}

      {/* Feedback + actions */}
      {item.status === "draft" && (
        <div className="p-5 space-y-3">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-ink-subtle flex items-center gap-1.5 mb-1.5">
              <MessageSquare size={11} /> Feedback to agent (optional)
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={2}
              placeholder="e.g. 'Geography filter too broad — restrict to EU+UK only'"
              className="w-full text-sm border border-line rounded-lg px-3 py-2 focus-ring resize-none"
            />
            <div className="text-[10px] text-ink-faint mt-1">Feedback feeds into agent rules/prompts and evaluation set.</div>
          </div>
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <button
              onClick={() => submit("validated")}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-accent-green hover:bg-accent-green/90 text-white font-medium text-sm transition-colors disabled:opacity-50"
            >
              <CheckCircle2 size={15} /> Accept
            </button>
            <button
              onClick={() => submit("validated")}
              disabled={isSubmitting || !editing}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium text-sm transition-colors ${
                editing ? "bg-prysmian-green hover:bg-prysmian-green-dark text-white" : "bg-surface-subtle text-ink-faint cursor-not-allowed"
              }`}
            >
              <Pencil size={15} /> Save edits + Accept
            </button>
            <button
              onClick={() => submit("rejected")}
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-line hover:border-accent-red/40 hover:text-accent-red text-ink-muted font-medium text-sm transition-colors disabled:opacity-50"
            >
              <XCircle size={15} /> Reject
            </button>
            <span className="text-[11px] text-ink-faint ml-auto">Validated → Published happens via newsletter workflow.</span>
          </div>
        </div>
      )}
      {item.status === "validated" && (
        <div className="p-5 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm text-ink-muted">Item validated and queued for publishing.</div>
          <button onClick={() => onDecide({ status: "published", feedback: "Auto-published from validated state" })} disabled={isSubmitting} className="btn-primary">
            <ShieldCheck size={14} /> Publish now
          </button>
        </div>
      )}
      {item.status === "rejected" && (
        <div className="p-5 flex items-center justify-between gap-3 flex-wrap">
          <div className="text-sm text-ink-muted">Item rejected. Agent will learn from this feedback.</div>
          <button onClick={() => onDecide({ status: "draft" })} disabled={isSubmitting} className="btn-outline">
            Restore to queue
          </button>
        </div>
      )}
    </Card>
  );
}

function TypeIcon({ type }: { type: ItemType }) {
  if (type === "news") return <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-accent-blue-light text-accent-blue"><Newspaper size={11} /></span>;
  return <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-accent-green-light text-accent-green"><Pickaxe size={11} /></span>;
}

function ConfidencePill({ value }: { value: number }) {
  const tone = value >= 85 ? "green" : value >= 70 ? "blue" : "amber";
  return <Badge tone={tone as any}><Sparkles size={9} /> {value}%</Badge>;
}

function StatPill({ label, value, tone, icon, active, onClick }: { label: string; value: number | string; tone: "amber" | "green" | "red" | "blue"; icon: React.ReactNode; active?: boolean; onClick: () => void }) {
  const ring = active ? "ring-2 ring-prysmian-green ring-offset-2" : "";
  return (
    <button onClick={onClick} className={`card p-4 text-left transition-all hover:shadow-card-hover ${ring}`}>
      <div className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wider text-ink-subtle">
        <span className={`w-5 h-5 rounded flex items-center justify-center ${tone === "amber" ? "bg-accent-amber-light text-accent-amber" : tone === "green" ? "bg-accent-green-light text-accent-green" : tone === "red" ? "bg-accent-red-light text-accent-red" : "bg-accent-blue-light text-accent-blue"}`}>{icon}</span>
        {label}
      </div>
      <div className="mt-2 text-2xl font-bold tabular-nums text-ink">{value}</div>
    </button>
  );
}

function Link(_: any) { return null; }

function relTime(iso: string | null | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
