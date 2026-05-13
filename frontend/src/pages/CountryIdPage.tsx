import { useParams } from "react-router-dom";
import { useCountrySummary } from "@/lib/queries";

export default function CountryIdPage() {
  const { id = "italy" } = useParams<{ id: string }>();
  const { data, isLoading } = useCountrySummary(id);
  if (isLoading) return <div>Loading...</div>;
  if (!data) return <div>No data</div>;
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{data.country} <span className="text-xs ml-2 inline-block bg-yellow-200 px-2 py-1 rounded">Seed sample</span></h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Quadrant title="Sales by Customer" rows={data.sales_by_customer} valueLabel="€" />
        <Quadrant title="Sales by Product" rows={data.sales_by_product} valueLabel="€" />
        <Quadrant title="Competitors" rows={data.competitors} valueLabel="" />
        <Quadrant title="Market Value by Customer" rows={data.market_value_by_customer} valueLabel="€" />
      </div>
    </div>
  );
}

function Quadrant({ title, rows, valueLabel }: { title: string; rows: { name: string; value: number | null; detail: string }[]; valueLabel: string }) {
  return (
    <div className="rounded-lg border">
      <div className="bg-ey-navy text-white px-4 py-2 font-semibold">{title}</div>
      <table className="w-full text-sm">
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t">
              <td className="px-4 py-2">{r.name}</td>
              <td className="px-4 py-2 text-right">{r.value != null ? `${valueLabel} ${r.value.toLocaleString()}` : r.detail}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
