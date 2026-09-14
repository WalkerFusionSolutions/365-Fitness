import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-sm border border-line bg-panel ${className}`}>{children}</section>;
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "good" | "warn" | "danger" }) {
  const colors = {
    neutral: "bg-black/5 text-muted",
    good: "bg-emerald-50 text-brand",
    warn: "bg-amber-50 text-amber-800",
    danger: "bg-red-50 text-danger",
  };

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${colors[tone]}`}>{children}</span>;
}
