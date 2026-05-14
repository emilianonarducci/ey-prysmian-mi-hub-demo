import { ReactNode } from "react";

export function Card({
  children,
  className = "",
  as: As = "div",
  interactive = false,
  padding = "md",
}: {
  children: ReactNode;
  className?: string;
  as?: any;
  interactive?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}) {
  const pad = padding === "none" ? "" : padding === "sm" ? "p-4" : padding === "lg" ? "p-7" : "p-5";
  return (
    <As className={`card ${interactive ? "card-hover" : ""} ${pad} ${className}`}>
      {children}
    </As>
  );
}

export function CardHeader({ title, subtitle, action, center }: { title: ReactNode; subtitle?: ReactNode; action?: ReactNode; center?: boolean }) {
  if (center) {
    return (
      <div className="px-5 pt-5 pb-3 border-b border-line">
        <div className="flex items-center justify-between gap-3 mb-1">
          <span className="w-[60px]" />
          <h3 className="text-sm font-semibold text-ink text-center flex-1">{title}</h3>
          <div className="w-[60px] flex justify-end">{action}</div>
        </div>
        {subtitle && <p className="text-xs text-ink-subtle text-center">{subtitle}</p>}
      </div>
    );
  }
  return (
    <div className="flex items-start justify-between gap-3 mb-4">
      <div>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {subtitle && <p className="text-xs text-ink-subtle mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
