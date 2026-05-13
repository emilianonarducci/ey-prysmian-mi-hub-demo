import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { X } from "lucide-react";

interface Props {
  evidenceId: string;
  onClose: () => void;
}

export default function EvidenceMetadataViewer({ evidenceId, onClose }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["evidence", evidenceId],
    queryFn: async () => (await api.get(`/evidence/${evidenceId}`)).data,
  });
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <header className="bg-ey-navy text-white px-6 py-3 flex items-center justify-between sticky top-0">
          <h2 className="font-semibold">Evidence Metadata</h2>
          <button onClick={onClose}><X size={18} /></button>
        </header>
        <div className="p-6">
          {isLoading && <div>Loading...</div>}
          {data && (
            <dl className="space-y-3 text-sm">
              <Field label="Agent" value={`${data.agent_name} v${data.agent_version}`} />
              <Field label="Prompt version" value={data.prompt_version} />
              <Field label="Model" value={data.model_id} />
              <Field label="Sources" value={(data.source_urls || []).join("\n")} mono />
              <Field label="Source snapshots (SHA-256)" value={(data.source_snapshots_hash || []).join("\n")} mono />
              <Field label="Tool calls" value={JSON.stringify(data.tool_calls || [], null, 2)} mono />
              <Field label="Validation checks" value={JSON.stringify(data.validation_checks || {}, null, 2)} mono />
              <Field label="Structured output" value={JSON.stringify(data.structured_output || {}, null, 2)} mono />
              <Field label="Confidence summary" value={data.confidence_summary || ""} />
              <Field label="Latency / Tokens" value={`${data.latency_ms}ms · ${data.tokens_used} tokens`} />
              <Field label="Started / Completed" value={`${data.started_at} → ${data.completed_at}`} />
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <dt className="text-xs uppercase text-gray-500">{label}</dt>
      <dd className={`mt-1 ${mono ? "font-mono text-xs bg-gray-50 p-2 rounded whitespace-pre-wrap" : ""}`}>{value}</dd>
    </div>
  );
}
