import { Card } from "@/components/ui/Card";
import { requireUserProfile } from "@/lib/data";
import { formatDate } from "@/lib/format";

export default async function ProfileDashboardPage() {
  const { profile } = await requireUserProfile();

  return (
    <div>
      <h1 className="text-3xl font-black">Profile</h1>
      <p className="mt-2 text-muted">Profile details are read from Supabase. Role editing remains out of this web pass.</p>
      <Card className="mt-6 p-6">
        <dl className="grid gap-4 md:grid-cols-2">
          <div>
            <dt className="text-sm font-semibold text-muted">Name</dt>
            <dd className="mt-1 font-bold">{profile?.full_name}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-muted">Role</dt>
            <dd className="mt-1 font-bold">{profile?.role}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-muted">Phone</dt>
            <dd className="mt-1 font-bold">{profile?.phone_number ?? "Not set"}</dd>
          </div>
          <div>
            <dt className="text-sm font-semibold text-muted">Created</dt>
            <dd className="mt-1 font-bold">{formatDate(profile?.created_at ?? null)}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
