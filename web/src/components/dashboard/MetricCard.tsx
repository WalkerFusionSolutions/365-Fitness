import { Card } from "@/components/ui/Card";

export function MetricCard({ label, value, helper }: { label: string; value: number | string; helper: string }) {
  return (
    <Card className="p-5">
      <p className="text-sm font-semibold text-muted">{label}</p>
      <p className="mt-3 text-3xl font-black">{value}</p>
      <p className="mt-2 text-sm text-muted">{helper}</p>
    </Card>
  );
}
