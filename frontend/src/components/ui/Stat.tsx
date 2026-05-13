import { ReactNode } from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface StatProps {
  label: string;
  value: ReactNode;
  delta?: number | null;
  deltaLabel?: string;
  icon?: ReactNode;
  hint?: string;
  accent?: "green" | "blue" | "amber" | "red" | "neutral";
}

const accentBg: Record<string, string> = {
  green: "bg-accent-green-light text-accent-green",
  blue: "bg-accent-blue-light text-accent-blue",
  amber: "bg-accent-amber-light text-accent-amber",
  red: "bg-accent-red-light text-accent-red",
  neutral: "bg-surface-subtle text-ink-muted",
};

export function Stat({ label, value, delta, deltaLabel, icon, hint, accent = "neutral" }: StatProps) {
  const trend = delta == null ? null : delta > 0 ? "up" : delta < 0 ? "down" : "flat";
  return (
    <div className="card p-5 group">
      <div className="flex items-start justify-between">
        <div className="text-[11px] font-medium uppercase tracking-wider text-ink-subtle">{label}</div>
        {icon && (
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${accentBg[accent]}`}>
            {icon}
          </div>
        )}
      </div>
      <div className="mt-3 flex items-baseline gap-2">
        <div className="text-3xl font-bold text-ink tabular-nums tracking-tight">{value}</div>
        {trend && (
          <div
            className={`chip ${
              trend === "up"
                ? "bg-accent-green-light text-accent-green"
                : trend === "down"
                ? "bg-accent-red-light text-accent-red"
                : "bg-surface-subtle text-ink-muted"
            }`}
          >
            {trend === "up" ? <ArrowUpRight size={12} /> : trend === "down" ? <ArrowDownRight size={12} /> : <Minus size={12} />}
            {delta! > 0 ? "+" : ""}
            {delta}%
          </div>
        )}
      </div>
      {(deltaLabel || hint) && (
        <div className="mt-1.5 text-xs text-ink-subtle">{deltaLabel || hint}</div>
      )}
    </div>
  );
}
