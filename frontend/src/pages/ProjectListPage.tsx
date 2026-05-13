import { useState } from "react";
import { useProjects } from "@/lib/queries";

export default function ProjectListPage() {
  const [filters, setFilters] = useState<Record<string, string>>({});
  const { data, isLoading } = useProjects(filters);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Project List</h1>
      <div className="flex gap-6">
        <aside className="w-56 shrink-0">
          <h2 className="text-sm font-semibold mb-2">Filters</h2>
          <Field label="Status" onChange={(v) => setFilters({ ...filters, status: v })} />
          <Field label="Owner" onChange={(v) => setFilters({ ...filters, owner: v })} />
          <Field label="Country" onChange={(v) => setFilters({ ...filters, country: v })} />
          <Field label="Start year (min)" onChange={(v) => setFilters({ ...filters, start_year_min: v })} />
        </aside>
        <section className="flex-1">
          {isLoading && <div>Loading...</div>}
          {data && (
            <table className="w-full text-sm">
              <thead className="bg-ey-navy text-white">
                <tr>
                  <th className="px-3 py-2 text-left">Project name</th>
                  <th className="px-3 py-2 text-right">CAPEX (M$)</th>
                  <th className="px-3 py-2 text-right">Capacity (MW)</th>
                  <th className="px-3 py-2 text-left">Owner</th>
                  <th className="px-3 py-2 text-left">Country</th>
                  <th className="px-3 py-2 text-right">Start</th>
                  <th className="px-3 py-2 text-right">End</th>
                  <th className="px-3 py-2 text-left">Status</th>
                  <th className="px-3 py-2 text-right">Cable km</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((p) => (
                  <tr key={p.id} className="border-t hover:bg-insight-bg">
                    <td className="px-3 py-2">{p.name}</td>
                    <td className="px-3 py-2 text-right">{p.capex_estimate_musd?.toLocaleString()}</td>
                    <td className="px-3 py-2 text-right">{p.capacity_mw?.toLocaleString()}</td>
                    <td className="px-3 py-2">{p.owner}</td>
                    <td className="px-3 py-2">{p.country}</td>
                    <td className="px-3 py-2 text-right">{p.start_year}</td>
                    <td className="px-3 py-2 text-right">{p.end_year}</td>
                    <td className="px-3 py-2">{p.status}</td>
                    <td className="px-3 py-2 text-right">{p.cable_demand_estimate_km}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}

function Field({ label, onChange }: { label: string; onChange: (v: string) => void }) {
  return (
    <div className="mb-3">
      <label className="block text-xs text-gray-600 mb-1">{label}</label>
      <input className="w-full border rounded px-2 py-1 text-sm" onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
