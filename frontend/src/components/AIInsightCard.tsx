import { Sparkles } from "lucide-react";

export default function AIInsightCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="bg-insight-bg border-l-4 border-ey-navy rounded-r p-4 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={16} className="text-ey-navy" />
        <span className="font-semibold text-sm">{title}</span>
      </div>
      <p className="text-sm text-gray-700">{body}</p>
    </div>
  );
}
