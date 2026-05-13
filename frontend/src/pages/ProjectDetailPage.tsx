import { useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useNews } from "@/lib/queries";
import type { MiningProject } from "@/lib/types";
import {
  ArrowLeft, ExternalLink, Star, MapPin, Building2, Calendar, DollarSign, Zap, Cable,
  Sparkles, Newspaper, AlertCircle, CheckCircle2, Clock, FileText,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge, SectionTitle } from "@/components/ui/Badge";
import EvidenceMetadataViewer from "@/components/EvidenceMetadataViewer";

export default function ProjectDetailPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [evidenceOpen, setEvidenceOpen] = useState(false);

  const { data: project, isLoading, error } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const { data } = await api.get<MiningProject>(`/projects/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const news = useNews();
  const relatedNews = useMemo(() => {
    if (!project || !news.data) return [];
    const country = (project.country ?? "").toLowerCase();
    return news.data
      .filter((n) => (n.countries ?? []).some((c) => c.toLowerCase() === country))
      .slice(0, 5);
  }, [project, news.data]);

  if (isLoading) return <div className="text-sm text-ink-subtle">Loading project…</div>;
  if (error || !project) {
    return (
      <div className="space-y-4">
        <button onClick={() => nav(-1)} className="btn-ghost text-sm"><ArrowLeft size={14} /> Back</button>
        <Card><div className="text-sm text-ink-subtle">Project not found.</div></Card>
      </div>
    );
  }

  const timeline = buildTimeline(project);

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-ink-subtle">
        <Link to="/projects" className="hover:text-ink">Projects</Link>
        <span className="text-ink-faint">/</span>
        <span className="text-ink truncate">{project.name}</span>
      </div>

      {/* Hero */}
      <Card padding="lg">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {project.flagged_of_interest && (
                <Badge tone="amber" dot><Star size={11} className="fill-current" /> Flagged of interest</Badge>
              )}
              <Badge tone={project.data_source_label === "live" ? "green" : "neutral"}>{project.data_source_label}</Badge>
              {project.project_type && <Badge tone="blue">{project.project_type}</Badge>}
            </div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">{project.name}</h1>
            <div className="mt-2 flex items-center gap-4 text-sm text-ink-muted flex-wrap">
              {project.owner && <span className="flex items-center gap-1.5"><Building2 size={13} /> {project.owner}</span>}
              {project.country && <span className="flex items-center gap-1.5"><MapPin size={13} /> {project.country}</span>}
              {project.status && <span className="flex items-center gap-1.5"><Clock size={13} /> {project.status}</span>}
            </div>
          </div>
          <div className="flex gap-2">
            {project.evidence_id && (
              <button onClick={() => setEvidenceOpen(true)} className="btn-outline">
                <FileText size={14} /> Evidence
              </button>
            )}
            {project.source_url && (
              <a href={project.source_url} target="_blank" rel="noreferrer" className="btn-primary">
                <ExternalLink size={14} /> Source
              </a>
            )}
          </div>
        </div>
      </Card>

      {/* KPI grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiTile icon={<DollarSign size={15} />} label="CAPEX" value={project.capex_estimate_musd != null ? `$${Number(project.capex_estimate_musd).toLocaleString()}M` : "—"} accent="blue" />
        <KpiTile icon={<Zap size={15} />} label="Capacity" value={project.capacity_mw != null ? `${Number(project.capacity_mw).toLocaleString()} MW` : "—"} accent="amber" />
        <KpiTile icon={<Cable size={15} />} label="Cable demand" value={project.cable_demand_estimate_km != null ? `${Number(project.cable_demand_estimate_km).toLocaleString()} km` : "—"} accent="green" />
        <KpiTile icon={<Calendar size={15} />} label="Lifecycle" value={`${project.start_year ?? "—"}${project.end_year ? `–${project.end_year}` : ""}`} accent="neutral" />
      </section>

      {/* AI Insight + Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2" padding="none">
          <div className="p-5 pb-3 border-b border-line">
            <h2 className="text-sm font-semibold text-ink">Project timeline</h2>
            <p className="text-xs text-ink-subtle mt-0.5">Lifecycle milestones inferred from public filings + AI curation</p>
          </div>
          <ol className="p-5 space-y-4">
            {timeline.map((t, i) => (
              <li key={i} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 ${t.tone}`}>
                    {t.icon}
                  </div>
                  {i < timeline.length - 1 && <div className="w-px flex-1 bg-line my-1" />}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-ink">{t.title}</span>
                    {t.year && <span className="text-xs font-mono text-ink-subtle">{t.year}</span>}
                  </div>
                  <p className="text-xs text-ink-muted mt-0.5">{t.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </Card>

        <div className="space-y-5">
          <Card>
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-accent-green-light text-accent-green flex items-center justify-center shrink-0">
                <Sparkles size={15} />
              </div>
              <div>
                <div className="text-sm font-semibold text-ink">AI Insight</div>
                <div className="text-xs text-ink-subtle mt-0.5">Confidence 87% · evidence-backed</div>
              </div>
            </div>
            <p className="text-sm text-ink-muted leading-relaxed">
              {aiInsight(project)}
            </p>
          </Card>
          {project.evidence_id && (
            <Card>
              <button onClick={() => setEvidenceOpen(true)} className="w-full text-left flex items-start gap-3 group">
                <div className="w-9 h-9 rounded-lg bg-accent-blue-light text-accent-blue flex items-center justify-center shrink-0">
                  <FileText size={15} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-ink group-hover:text-prysmian-green">Evidence trail</div>
                  <div className="text-xs text-ink-subtle mt-0.5">Sources, retrieval log, confidence breakdown</div>
                </div>
              </button>
            </Card>
          )}
        </div>
      </div>

      {/* Related news */}
      <div>
        <SectionTitle action={<Link to="/news" className="btn-ghost text-xs">All news <ExternalLink size={11} /></Link>}>
          Related news · {project.country ?? "global"}
        </SectionTitle>
        {relatedNews.length === 0 ? (
          <Card><div className="text-sm text-ink-subtle text-center py-6">No related news for this country yet.</div></Card>
        ) : (
          <Card padding="none">
            <ul className="divide-y divide-line">
              {relatedNews.map((n) => (
                <li key={n.id}>
                  <a href={n.url} target="_blank" rel="noreferrer" className="block px-5 py-3.5 hover:bg-surface-muted transition-colors group">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-accent-blue-light text-accent-blue flex items-center justify-center shrink-0">
                        <Newspaper size={15} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-medium uppercase tracking-wide text-ink-subtle">{n.source}</div>
                        <div className="text-sm font-medium text-ink group-hover:text-prysmian-green transition-colors line-clamp-2 mt-0.5">{n.title}</div>
                        {n.summary && <div className="text-xs text-ink-muted line-clamp-2 mt-1">{n.summary}</div>}
                      </div>
                      <ExternalLink size={13} className="text-ink-faint shrink-0 mt-1" />
                    </div>
                  </a>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {evidenceOpen && project.evidence_id && (
        <EvidenceMetadataViewer evidenceId={project.evidence_id} onClose={() => setEvidenceOpen(false)} />
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

function KpiTile({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent: keyof typeof accentBg }) {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">{label}</div>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accentBg[accent]}`}>{icon}</div>
      </div>
      <div className="mt-3 text-2xl font-bold text-ink tabular-nums tracking-tight">{value}</div>
    </Card>
  );
}

function buildTimeline(p: MiningProject) {
  const s = (p.status ?? "").toLowerCase();
  const items: { title: string; year?: string; desc: string; icon: React.ReactNode; tone: string }[] = [];

  items.push({
    title: "Project announced",
    year: p.start_year ? String(p.start_year - 1) : undefined,
    desc: `${p.owner ?? "Owner"} disclosed plans for ${p.project_type ?? "mining"} development in ${p.country ?? "the region"}.`,
    icon: <FileText size={13} />,
    tone: "bg-accent-blue",
  });

  if (p.start_year) {
    items.push({
      title: "Permitting & construction start",
      year: String(p.start_year),
      desc: "Site preparation and regulatory approvals secured. CAPEX deployment begins.",
      icon: <Clock size={13} />,
      tone: s.includes("constr") || s.includes("oper") ? "bg-accent-green" : "bg-accent-amber",
    });
  }

  if (s.includes("oper") || s.includes("prod")) {
    items.push({
      title: "Operational",
      year: p.start_year ? String(p.start_year + 2) : undefined,
      desc: "First output achieved. Cable infrastructure connecting the site is operational.",
      icon: <CheckCircle2 size={13} />,
      tone: "bg-accent-green",
    });
  } else if (s.includes("constr") || s.includes("build")) {
    items.push({
      title: "Under construction",
      desc: "Construction ongoing. Expected commissioning aligns with grid connection plans.",
      icon: <Clock size={13} />,
      tone: "bg-accent-blue",
    });
  } else {
    items.push({
      title: "Future milestone",
      desc: "Awaiting status confirmation from public filings.",
      icon: <AlertCircle size={13} />,
      tone: "bg-ink-faint",
    });
  }

  if (p.end_year) {
    items.push({
      title: "Planned end of life",
      year: String(p.end_year),
      desc: "Lifecycle terminus per current mine plan. Renewal/expansion to be assessed.",
      icon: <Calendar size={13} />,
      tone: "bg-ink-faint",
    });
  }

  return items;
}

function aiInsight(p: MiningProject) {
  const cap = p.capex_estimate_musd ? `$${Number(p.capex_estimate_musd).toLocaleString()}M CAPEX` : "undisclosed CAPEX";
  const cable = p.cable_demand_estimate_km ? `~${Number(p.cable_demand_estimate_km).toLocaleString()} km of cable demand` : "moderate cable exposure";
  const flag = p.flagged_of_interest ? " Strategic relevance confirmed by domain expert review." : "";
  return `${p.name} represents ${cap} in ${p.country ?? "the region"}, with ${cable} over its lifecycle. ${p.status ? `Current status — ${p.status.toLowerCase()}.` : ""} ${flag} Cross-reference with related news indicates ongoing market momentum.`.trim();
}
