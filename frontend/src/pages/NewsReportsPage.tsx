import { useState } from "react";
import { useNews } from "@/lib/queries";
import { FileText, ExternalLink, RefreshCw } from "lucide-react";
import api from "@/lib/api";

export default function NewsReportsPage() {
  const [q, setQ] = useState("");
  const { data, isLoading, refetch } = useNews(q);
  const [refreshing, setRefreshing] = useState(false);
  async function triggerRefresh() {
    setRefreshing(true);
    try {
      await api.post("/agents/news_finder/run", { bounded: true, max_items: 5, timeout_seconds: 30 });
      // wait briefly then refetch
      setTimeout(() => { refetch(); setRefreshing(false); }, 5000);
    } catch (e) { setRefreshing(false); }
  }
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">News & Reports</h1>
        <button onClick={triggerRefresh} disabled={refreshing}
          className="flex items-center gap-2 px-3 py-2 bg-ey-navy text-white rounded text-sm">
          <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing..." : "Refresh from sources"}
        </button>
      </div>
      <input className="w-full border rounded px-3 py-2 mb-4" placeholder="Search..."
             value={q} onChange={(e) => setQ(e.target.value)} />
      {isLoading && <div>Loading...</div>}
      <ul className="divide-y border rounded">
        {data?.map((n) => (
          <li key={n.id} className="p-4 hover:bg-insight-bg">
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 text-ey-navy" size={20} />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <a href={n.url} target="_blank" rel="noopener noreferrer"
                     className="font-semibold hover:underline">{n.title}</a>
                  <ExternalLink size={12} />
                  <span className="text-xs px-2 py-0.5 rounded bg-gray-100">{n.source}</span>
                  <span className={`text-xs px-2 py-0.5 rounded ${n.data_source_label === "seed" ? "bg-yellow-100" : "bg-green-100"}`}>{n.data_source_label}</span>
                </div>
                <p className="text-sm text-gray-700">{n.summary}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
