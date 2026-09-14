import { ScheduleBoard } from "@/components/dashboard/ScheduleBoard";
import { getCoachDashboardData } from "@/lib/data";

export default async function SchedulePage() {
  const { appointments, clients, user } = await getCoachDashboardData();

  return (
    <div className="grid gap-6">
      <div>
        <h1 className="text-3xl font-black">Schedule</h1>
        <p className="mt-2 text-muted">Appointments use the existing Phase 7 database model, reminders, and RLS.</p>
      </div>
      <ScheduleBoard initialAppointments={appointments} clients={clients} coachId={user.id} />
    </div>
  );
}
