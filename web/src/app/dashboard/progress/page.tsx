import { EmptyState } from "@/components/dashboard/EmptyState";
import { Card } from "@/components/ui/Card";
import { requireUserProfile } from "@/lib/data";
import { formatDate } from "@/lib/format";
import type { Measurement } from "@/types/app";

export default async function ProgressDashboardPage() {
  const { supabase, profile } = await requireUserProfile();

  if (!supabase || !profile || profile.role !== "coach") {
    return <EmptyState title="Progress is coach-only" body="Sign in with a coach account to view real client progress records." />;
  }

  const { data: measurements } = await supabase
    .from("measurements")
    .select("id, client_id, weight, body_fat, waist, date, notes, created_at")
    .order("date", { ascending: false })
    .limit(12)
    .returns<Measurement[]>();

  return (
    <div>
      <h1 className="text-3xl font-black">Progress</h1>
      <p className="mt-2 text-muted">Measurement chronology uses the historical measurement date.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {measurements?.length ? measurements.map((measurement) => (
          <Card key={measurement.id} className="p-5">
            <h2 className="font-bold">{formatDate(measurement.date)}</h2>
            <p className="mt-2 text-sm text-muted">Weight: {measurement.weight ?? "n/a"}</p>
            <p className="text-sm text-muted">Body fat: {measurement.body_fat ?? "n/a"}</p>
            <p className="text-sm text-muted">Waist: {measurement.waist ?? "n/a"}</p>
          </Card>
        )) : <EmptyState title="No progress records found" body="Measurements returned by RLS will appear here. Progress photos should continue using private storage paths and signed URLs." />}
      </div>
    </div>
  );
}
