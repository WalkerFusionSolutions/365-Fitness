import { EmptyState } from "@/components/dashboard/EmptyState";

export default function NutritionDashboardPage() {
  return (
    <div>
      <h1 className="text-3xl font-black">Nutrition</h1>
      <p className="mt-2 text-muted">Meal plans, macro targets, supplements, and nutrition notes stay connected to the existing mobile backend.</p>
      <div className="mt-6">
        <EmptyState title="Nutrition workspace ready" body="This page is prepared for real Supabase nutrition records without inventing sample plans or metrics." />
      </div>
    </div>
  );
}
