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
      <nav aria-label="Client record" className="flex gap-1 overflow-x-auto border-y border-line py-2 text-sm font-semibold text-muted">
        <a className="whitespace-nowrap px-3 py-2 hover:text-brand" href="#overview">Overview</a>
        <a className="whitespace-nowrap px-3 py-2 hover:text-brand" href="#appointments">Appointments</a>
        <a className="whitespace-nowrap px-3 py-2 hover:text-brand" href="#progress">Progress</a>
        <a className="whitespace-nowrap px-3 py-2 hover:text-brand" href="#workouts">Workouts</a>
        <a className="whitespace-nowrap px-3 py-2 hover:text-brand" href="/dashboard/messages">Messages</a>
        <a className="whitespace-nowrap px-3 py-2 hover:text-brand" href="/dashboard/nutrition">Nutrition</a>
      </nav>
      <div id="overview" className="grid gap-6 lg:grid-cols-3">
        <Card id="appointments" className="scroll-mt-28 p-6 lg:col-span-2">
          <h2 className="text-xl font-bold">Appointments</h2>
          <div className="mt-4 grid gap-3">
            {data.appointments.length ? data.appointments.map((appointment) => (
              <div key={appointment.id} className="border-b border-line py-4 last:border-b-0">
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
        <Card id="progress" className="scroll-mt-28 p-6">
          <h2 className="text-xl font-bold">Latest measurements</h2>
          <div className="mt-4 grid gap-3">
            {data.measurements.length ? data.measurements.map((measurement) => (
              <div key={measurement.id} className="border-b border-line py-3 text-sm last:border-b-0">
                <p className="font-bold">{formatDate(measurement.date)}</p>
                <p className="mt-1 text-muted">Weight: {measurement.weight ?? "n/a"}</p>
                <p className="text-muted">Body fat: {measurement.body_fat ?? "n/a"}</p>
              </div>
            )) : <EmptyState title="No measurements found" body="Measurement history remains based on measurement date." />}
          </div>
        </Card>
      </div>
      <Card id="workouts" className="scroll-mt-28 p-6">
        <h2 className="text-xl font-bold">Assigned workouts</h2>
        <div className="mt-4 divide-y divide-line">
          {data.workouts.length ? data.workouts.map((workout) => (
            <div key={workout.id} className="grid gap-1 py-4 md:grid-cols-[1fr_auto] md:items-center">
              <p className="font-bold">{workout.name}</p>
              <p className="text-sm text-muted">{workout.status} · {workout.estimated_minutes ?? "No"} min</p>
            </div>
          )) : <EmptyState title="No workouts found" body="Assigned workout records returned by RLS will appear here." />}
        </div>
      </Card>
    </div>
  );
}
