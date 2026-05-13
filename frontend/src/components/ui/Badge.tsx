import { ReactNode } from "react";

type Tone = "neutral" | "green" | "blue" | "amber" | "red" | "navy";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-subtle text-ink-muted",
  green: "bg-accent-green-light text-accent-green",
  blue: "bg-accent-blue-light text-accent-blue",
  amber: "bg-accent-amber-light text-accent-amber",
  red: "bg-accent-red-light text-accent-red",
  navy: "bg-ey-navy text-white",
};

export function Badge({ children, tone = "neutral", dot = false }: { children: ReactNode; tone?: Tone; dot?: boolean }) {
  return (
    <span className={`chip ${tones[tone]}`}>
      {dot && <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />}
      {children}
    </span>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="text-base font-semibold text-ink">{children}</h2>
      </div>
      {action}
    </div>
  );
}
