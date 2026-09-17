import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge } from "@/components/ui/Card";
import { formatDate } from "@/lib/format";
import { getCoachDashboardData } from "@/lib/data";

export default async function ProgramsDashboardPage() {
  const { workouts } = await getCoachDashboardData();

  return (
    <div>
      <h1 className="text-3xl font-black">Programs</h1>
      <p className="mt-2 text-muted">Workout records visible to this coach appear here.</p>
      <div className="mt-6 overflow-hidden border border-line bg-panel">
        {workouts.length ? <div className="hidden grid-cols-[1.2fr_2fr_9rem_8rem] gap-4 border-b border-line bg-secondary px-5 py-2 text-xs font-semibold text-muted md:grid"><span>Program</span><span>Description</span><span>Assigned</span><span>Status</span></div> : null}
        {workouts.length ? workouts.map((workout) => (
          <div key={workout.id} className="grid gap-2 border-b border-line px-5 py-4 last:border-b-0 md:grid-cols-[1.2fr_2fr_9rem_8rem] md:items-center md:gap-4">
            <h2 className="font-bold">{workout.name}</h2>
            <p className="text-sm text-muted">{workout.description ?? "No description added"}</p>
            <p className="text-sm text-muted">{formatDate(workout.assigned_date)}</p>
            <Badge>{workout.status}</Badge>
          </div>
        )) : <EmptyState title="No programs found" body="The web view is ready for assigned workout records returned by RLS." />}
      </div>
    </div>
  );
}
