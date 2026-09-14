import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge, Card } from "@/components/ui/Card";
import { formatDate } from "@/lib/format";
import { getCoachDashboardData } from "@/lib/data";

export default async function ProgramsDashboardPage() {
  const { workouts } = await getCoachDashboardData();

  return (
    <div>
      <h1 className="text-3xl font-black">Programs</h1>
      <p className="mt-2 text-muted">Workout records visible to this coach appear here.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {workouts.length ? workouts.map((workout) => (
          <Card key={workout.id} className="p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">{workout.name}</h2>
                <p className="mt-2 text-sm text-muted">{workout.description ?? "No description"}</p>
                <p className="mt-3 text-sm text-muted">Assigned {formatDate(workout.assigned_date)}</p>
              </div>
              <Badge>{workout.status}</Badge>
            </div>
          </Card>
        )) : <EmptyState title="No programs found" body="The web view is ready for assigned workout records returned by RLS." />}
      </div>
    </div>
  );
}
