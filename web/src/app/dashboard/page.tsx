import Link from "next/link";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { Badge, Card } from "@/components/ui/Card";
import { formatDateTime } from "@/lib/format";
import { getCoachDashboardData } from "@/lib/data";

export default async function DashboardPage() {
  const data = await getCoachDashboardData();
  const metrics = [
    ["Visible clients", data.clients.length],
    ["Upcoming", data.appointments.length],
    ["Unread", data.notifications.length],
    ["Programs", data.workouts.length],
  ];

  return (
    <div className="grid gap-6">
      <header className="grid gap-4 border-b border-line pb-6 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <h1 className="text-3xl font-black">Overview</h1>
          <p className="mt-2 text-muted">Real data returned through existing Supabase RLS.</p>
        </div>
        <div className="grid grid-cols-4 gap-px border border-line bg-line">
          {metrics.map(([label, value]) => (
            <div key={label} className="bg-panel px-4 py-3">
              <p className="text-xl font-black">{value}</p>
              <p className="text-xs font-semibold text-muted">{label}</p>
            </div>
          ))}
        </div>
      </header>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-black">Upcoming appointments</h2>
            <Link className="text-sm font-black text-brand" href="/dashboard/schedule">Schedule</Link>
          </div>
          <div className="mt-4 divide-y divide-line">
            {data.appointments.length ? data.appointments.map((appointment) => (
              <div key={appointment.id} className="grid gap-3 py-4 md:grid-cols-[1fr_auto] md:items-center">
                <div>
                  <p className="font-bold">{appointment.title}</p>
                  <p className="mt-1 text-sm text-muted">{formatDateTime(appointment.starts_at)}</p>
                </div>
                <Badge tone="good">{appointment.status}</Badge>
              </div>
            )) : <EmptyState title="No upcoming appointments" body="Create appointments from the Schedule page when clients are ready." />}
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-lg font-black">Recent signals</h2>
          <div className="mt-4 divide-y divide-line">
            {data.notifications.length ? data.notifications.map((notification) => (
              <div key={notification.id} className="py-4">
                <p className="font-bold">{notification.title}</p>
                <p className="mt-1 text-sm text-muted">{notification.body}</p>
              </div>
            )) : data.conversations.length ? data.conversations.map((conversation) => (
              <div key={conversation.id} className="py-4">
                <p className="font-bold">Conversation</p>
                <p className="mt-1 text-sm text-muted">{conversation.last_message_preview ?? "No preview available"}</p>
              </div>
            )) : <EmptyState title="No recent activity" body="Notifications and conversation previews will appear here when RLS returns them." />}
          </div>
        </Card>
      </section>
    </div>
  );
}
