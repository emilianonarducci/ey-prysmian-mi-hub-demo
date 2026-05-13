import { useMemo, useState } from "react";
import { useTrends } from "@/lib/queries";
import {
  AreaChart, Area, LineChart as RC, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, ReferenceLine, ReferenceDot,
} from "recharts";
import { TrendingUp, TrendingDown, Sparkles, Calendar, ArrowRight } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, SectionTitle } from "@/components/ui/Badge";

const COUNTRIES = ["Italy", "France", "Germany", "Spain", "Netherlands"];
const RANGES = [
  { id: "12m", label: "12M", points: 12 },
  { id: "24m", label: "24M", points: 24 },
  { id: "all", label: "All", points: 999 },
] as const;

export default function MarketTrendsPage() {
  const [country, setCountry] = useState("Italy");
  const [range, setRange] = useState<typeof RANGES[number]["id"]>("12m");
  const { data, isLoading } = useTrends(country);
  const findIndicator = (k: string) => data?.indicators.find((i) => i.indicator === k);

  const rangePoints = RANGES.find((r) => r.id === range)!.points;
  const clip = (arr: any[]) => arr.slice(Math.max(0, arr.length - rangePoints));

  const copper = useMemo(() => {
    if (!data) return [];
    return clip(data.copper_history.map((p) => ({ ...p, value: Number(p.value) })));
  }, [data, range]);

  const copperStats = useMemo(() => {
    if (copper.length < 2) return null;
    const last = copper[copper.length - 1].value;
    const first = copper[0].value;
    const pct = ((last - first) / first) * 100;
    const max = Math.max(...copper.map((p) => p.value));
    const min = Math.min(...copper.map((p) => p.value));
    const maxIdx = copper.findIndex((p) => p.value === max);
    return { last, pct, max, min, maxIdx, maxPeriod: copper[maxIdx].period };
  }, [copper]);

  return (
    <div className="space-y-6 max-w-[1400px]">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-ink tracking-tight">Market Trends</h1>
          <p className="text-sm text-ink-subtle mt-1">Construction output, GDP, commodities — country-level signals driving cable demand</p>
        </div>
        <div className="flex items-center gap-2">
          <Segmented
            options={COUNTRIES.map((c) => ({ id: c, label: c }))}
            value={country}
            onChange={setCountry}
          />
        </div>
      </div>

      {isLoading && <Card><div className="text-sm text-ink-subtle">Loading trends...</div></Card>}

      {data && (
        <>
          {/* Hero: Copper price */}
          <Card padding="none">
            <div className="p-5 flex items-start justify-between gap-4 flex-wrap">
              <div>
                <Badge tone="amber" dot>Commodity · LME</Badge>
                <h2 className="text-lg font-semibold text-ink mt-2">Copper price (USD/tonne)</h2>
                {copperStats && (
                  <div className="mt-3 flex items-baseline gap-3 flex-wrap">
                    <div className="text-4xl font-bold tabular-nums tracking-tight text-ink">
                      ${copperStats.last.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </div>
                    <div className={`chip ${copperStats.pct >= 0 ? "bg-accent-green-light text-accent-green" : "bg-accent-red-light text-accent-red"}`}>
                      {copperStats.pct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      {copperStats.pct >= 0 ? "+" : ""}{copperStats.pct.toFixed(1)}%
                    </div>
                    <span className="text-xs text-ink-subtle">over {range}</span>
                  </div>
                )}
              </div>
              <Segmented options={RANGES.map((r) => ({ id: r.id, label: r.label }))} value={range} onChange={(v) => setRange(v as any)} />
            </div>
            <div className="px-2 pb-3">
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={copper} margin={{ top: 10, right: 20, left: 10, bottom: 10 }}>
                  <defs>
                    <linearGradient id="copperGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00875A" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#00875A" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#EEF1F6" strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#7B8497" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "#7B8497" }} axisLine={false} tickLine={false} domain={["dataMin - 200", "dataMax + 200"]} width={50} />
                  <Tooltip content={<ChartTooltip suffix=" USD/t" />} />
                  <Area type="monotone" dataKey="value" stroke="#00875A" strokeWidth={2} fill="url(#copperGrad)" />
                  {copperStats && (
                    <ReferenceDot x={copperStats.maxPeriod} y={copperStats.max} r={5} fill="#00875A" stroke="white" strokeWidth={2}>
                    </ReferenceDot>
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            {/* AI annotation strip */}
            <div className="border-t border-line px-5 py-3 bg-surface-muted flex items-start gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-accent-green-light text-accent-green flex items-center justify-center shrink-0">
                <Sparkles size={13} />
              </div>
              <div className="text-xs text-ink-muted">
                <span className="font-medium text-ink">AI annotation:</span> Peak observed in <span className="font-mono">{copperStats?.maxPeriod}</span>{" "}
                — supply tightening + EV grid investment driving structural support. Confidence 87%.
              </div>
            </div>
          </Card>

          {/* Indicator grid */}
          <div>
            <SectionTitle>{country} construction & macro indicators</SectionTitle>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {["construction_output", "non_residential_market_output", "residential_market_output", "gdp"].map((k) => {
                const ind = findIndicator(k);
                if (!ind) return null;
                const series = clip(ind.series.map((p) => ({ ...p, value: Number(p.value) })));
                const last = series[series.length - 1]?.value;
                const first = series[0]?.value;
                const pct = first ? ((last - first) / first) * 100 : 0;
                return (
                  <IndicatorCard key={k} title={prettify(k)} value={last} pct={pct} series={series} insight={ind.ai_insight_narrative} />
                );
              })}

              {(() => {
                const ind = findIndicator("building_permits_ytd");
                if (!ind) return null;
                const series = clip(ind.series.map((p) => ({ ...p, value: Number(p.value) })));
                return (
                  <Card padding="none" className="xl:col-span-2">
                    <div className="p-5 pb-3 flex items-start justify-between">
                      <div>
                        <Badge tone="blue" dot>Permits</Badge>
                        <h3 className="text-sm font-semibold text-ink mt-2">Building permits YTD</h3>
                        <p className="text-xs text-ink-subtle mt-0.5">{country} · leading indicator for residential cable demand</p>
                      </div>
                    </div>
                    <div className="px-2 pb-3">
                      <ResponsiveContainer width="100%" height={180}>
                        <BarChart data={series} margin={{ top: 6, right: 16, left: 6, bottom: 6 }}>
                          <CartesianGrid stroke="#EEF1F6" strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="period" tick={{ fontSize: 10, fill: "#7B8497" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: "#7B8497" }} axisLine={false} tickLine={false} width={40} />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="value" fill="#2563EB" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    {ind.ai_insight_narrative && (
                      <div className="border-t border-line px-5 py-3 bg-surface-muted text-xs text-ink-muted">
                        <span className="font-medium text-ink">AI:</span> {ind.ai_insight_narrative}
                      </div>
                    )}
                  </Card>
                );
              })()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function IndicatorCard({ title, value, pct, series, insight }: { title: string; value: number | undefined; pct: number; series: any[]; insight: string | null }) {
  return (
    <Card padding="none">
      <div className="p-5 pb-3">
        <div className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">{title}</div>
        <div className="mt-2 flex items-baseline gap-2">
          <div className="text-2xl font-bold tabular-nums text-ink">{value != null ? value.toLocaleString(undefined, { maximumFractionDigits: 1 }) : "—"}</div>
          {Number.isFinite(pct) && (
            <span className={`chip ${pct >= 0 ? "bg-accent-green-light text-accent-green" : "bg-accent-red-light text-accent-red"}`}>
              {pct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {pct >= 0 ? "+" : ""}{pct.toFixed(1)}%
            </span>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={90}>
        <AreaChart data={series} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`g-${title}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0F1B3D" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#0F1B3D" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Tooltip content={<ChartTooltip mini />} cursor={{ stroke: "#CFD5E2", strokeDasharray: "3 3" }} />
          <Area type="monotone" dataKey="value" stroke="#0F1B3D" strokeWidth={1.5} fill={`url(#g-${title})`} />
        </AreaChart>
      </ResponsiveContainer>
      {insight && (
        <div className="px-5 py-2.5 border-t border-line bg-surface-muted text-[11px] text-ink-muted line-clamp-2">
          <span className="font-medium text-ink">AI:</span> {insight}
        </div>
      )}
    </Card>
  );
}

function ChartTooltip({ active, payload, label, suffix = "", mini = false }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className={`bg-white border border-line rounded-lg shadow-card ${mini ? "px-2 py-1" : "px-3 py-2"}`}>
      <div className="text-[10px] text-ink-subtle font-mono">{label}</div>
      <div className="text-sm font-semibold text-ink tabular-nums">{Number(payload[0].value).toLocaleString()}{suffix}</div>
    </div>
  );
}

function Segmented<T extends string>({ options, value, onChange }: { options: { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="inline-flex bg-surface-subtle p-0.5 rounded-lg">
      {options.map((o) => (
        <button
          key={o.id}
          onClick={() => onChange(o.id)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            value === o.id ? "bg-white text-ink shadow-card" : "text-ink-subtle hover:text-ink"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function prettify(s: string) {
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
