import { notFound } from "next/navigation";
import { Badge, Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { formatDate, formatDateTime } from "@/lib/format";
import { getClientDetail } from "@/lib/data";

export default async function ClientDetailPage({ params }: PageProps<"/dashboard/clients/[clientId]">) {
  const { clientId } = await params;
  const data = await getClientDetail(clientId);

  if (!data.client) {
    notFound();
  }

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-black">{data.client.full_name}</h1>
        <p className="mt-2 text-muted">{data.client.phone_number ?? "No phone number on profile"}</p>
      </div>
      <nav className="flex gap-2 overflow-x-auto border-y border-line py-3 text-sm font-black text-muted">
        {["Overview", "Assessment", "Workouts", "Nutrition", "Progress", "Photos", "Messages", "Appointments"].map((item) => (
          <span key={item} className="whitespace-nowrap px-2 py-1 first:text-brand">{item}</span>
        ))}
      </nav>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-xl font-bold">Appointments</h2>
          <div className="mt-4 grid gap-3">
            {data.appointments.length ? data.appointments.map((appointment) => (
              <div key={appointment.id} className="rounded-lg border border-line p-4">
                <div className="flex justify-between gap-3">
                  <div>
                    <p className="font-bold">{appointment.title}</p>
                    <p className="text-sm text-muted">{formatDateTime(appointment.starts_at)}</p>
                  </div>
                  <Badge>{appointment.status}</Badge>
                </div>
              </div>
            )) : <EmptyState title="No appointments found" body="Schedule records visible to this coach will appear here." />}
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="text-xl font-bold">Latest measurements</h2>
          <div className="mt-4 grid gap-3">
            {data.measurements.length ? data.measurements.map((measurement) => (
              <div key={measurement.id} className="rounded-lg border border-line p-4 text-sm">
                <p className="font-bold">{formatDate(measurement.date)}</p>
                <p className="mt-1 text-muted">Weight: {measurement.weight ?? "n/a"}</p>
                <p className="text-muted">Body fat: {measurement.body_fat ?? "n/a"}</p>
              </div>
            )) : <EmptyState title="No measurements found" body="Measurement history remains based on measurement date." />}
          </div>
        </Card>
      </div>
      <Card className="p-6">
        <h2 className="text-xl font-bold">Assigned workouts</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {data.workouts.length ? data.workouts.map((workout) => (
            <div key={workout.id} className="rounded-lg border border-line p-4">
              <p className="font-bold">{workout.name}</p>
              <p className="text-sm text-muted">{workout.status} · {workout.estimated_minutes ?? "No"} min</p>
            </div>
          )) : <EmptyState title="No workouts found" body="Assigned workout records returned by RLS will appear here." />}
        </div>
      </Card>
    </div>
  );
}
