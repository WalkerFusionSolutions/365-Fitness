import { EmptyState } from "@/components/dashboard/EmptyState";

export default function ReportsDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-black">Reports</h1>
      <p className="mt-2 text-muted">Reports will summarize real client records once report generation is expanded for web.</p>
      <div className="mt-6">
        <EmptyState title="Reports workspace ready" body="No fake performance charts or invented client metrics were added." />
      </div>
    </div>
  );
}
