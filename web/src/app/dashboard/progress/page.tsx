import { EmptyState } from "@/components/dashboard/EmptyState";
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
      <div className="mt-6 overflow-hidden border border-line bg-panel">
        {measurements?.length ? <div className="hidden grid-cols-4 gap-4 border-b border-line bg-secondary px-5 py-2 text-xs font-semibold text-muted md:grid"><span>Date</span><span>Weight</span><span>Body fat</span><span>Waist</span></div> : null}
        {measurements?.length ? measurements.map((measurement) => (
          <div key={measurement.id} className="grid grid-cols-2 gap-3 border-b border-line px-5 py-4 text-sm last:border-b-0 md:grid-cols-4 md:gap-4">
            <h2 className="font-bold">{formatDate(measurement.date)}</h2>
            <p className="text-muted"><span className="md:hidden">Weight: </span>{measurement.weight ?? "n/a"}</p>
            <p className="text-muted"><span className="md:hidden">Body fat: </span>{measurement.body_fat ?? "n/a"}</p>
            <p className="text-muted"><span className="md:hidden">Waist: </span>{measurement.waist ?? "n/a"}</p>
          </div>
        )) : <EmptyState title="No progress records found" body="Measurements returned by RLS will appear here. Progress photos should continue using private storage paths and signed URLs." />}
      </div>
    </div>
  );
}
