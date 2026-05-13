import { useTrends } from "@/lib/queries";
import { LineChart as RC, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

export default function MarketTrendsPage() {
  const { data, isLoading } = useTrends("Italy");
  if (isLoading || !data) return <div>Loading...</div>;
  const findIndicator = (k: string) => data.indicators.find((i) => i.indicator === k);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Italy — Market Trends</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {["construction_output", "non_residential_market_output", "gdp", "residential_market_output"].map((k) => {
          const ind = findIndicator(k);
          if (!ind) return null;
          return (
            <ChartCard title={k.replace(/_/g, " ")} key={k}>
              <ResponsiveContainer width="100%" height={180}>
                <RC data={ind.series.map(p => ({ ...p, value: Number(p.value) }))}>
                  <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#1E2A4A" strokeWidth={2} dot={false} />
                </RC>
              </ResponsiveContainer>
            </ChartCard>
          );
        })}
        <ChartCard title="Copper (USD/tonne)">
          <ResponsiveContainer width="100%" height={180}>
            <RC data={data.copper_history.map(p => ({ ...p, value: Number(p.value) }))}>
              <XAxis dataKey="period" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} domain={["auto", "auto"]} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="#1E2A4A" strokeWidth={2} dot={false} />
            </RC>
          </ResponsiveContainer>
        </ChartCard>
        <ChartCard title="Building permits YTD">
          {(() => {
            const ind = findIndicator("building_permits_ytd");
            if (!ind) return null;
            return (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={ind.series.map(p => ({ ...p, value: Number(p.value) }))}>
                  <XAxis dataKey="period" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#1E2A4A" />
                </BarChart>
              </ResponsiveContainer>
            );
          })()}
        </ChartCard>
      </div>
      <div className="mt-6 bg-insight-bg border-l-4 border-ey-navy rounded-r p-4">
        <div className="font-semibold mb-2">AI Insights</div>
        {data.indicators.filter(i => i.ai_insight_narrative).map((i) => (
          <p key={i.indicator} className="text-sm mb-2">
            <span className="font-medium">{i.indicator.replace(/_/g, " ")}:</span> {i.ai_insight_narrative}
          </p>
        ))}
      </div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border">
      <div className="bg-ey-navy text-white px-3 py-2 text-sm font-semibold">{title}</div>
      <div className="p-2">{children}</div>
    </div>
  );
}
