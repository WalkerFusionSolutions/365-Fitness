import { EmptyState } from "@/components/dashboard/EmptyState";
import { ClientDirectory } from "@/components/dashboard/ClientDirectory";
import { getCoachDashboardData } from "@/lib/data";

export default async function ClientsPage() {
  const { clients } = await getCoachDashboardData();

  return (
    <div>
      <h1 className="text-3xl font-black">Clients</h1>
      <p className="mt-2 text-muted">Only clients visible through the active coach policies are listed.</p>
      <div className="mt-6">
        {clients.length ? <ClientDirectory clients={clients} /> : <EmptyState title="No clients available" body="RLS did not return client profiles for this coach account." />}
      </div>
    </div>
  );
}
