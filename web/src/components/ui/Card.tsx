import type { HTMLAttributes, ReactNode } from "react";

export function Card({ children, className = "", ...props }: { children: ReactNode; className?: string } & HTMLAttributes<HTMLElement>) {
  return <section className={`rounded-sm border border-line bg-panel ${className}`} {...props}>{children}</section>;
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
