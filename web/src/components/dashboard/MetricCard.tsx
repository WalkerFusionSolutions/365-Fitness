export function MetricCard({ label, value, helper }: { label: string; value: number | string; helper: string }) {
  return (
    <div className="border-l border-line px-5 py-2 first:border-l-0">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-2 text-3xl font-black text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted">{helper}</p>
    </div>
  );
}
