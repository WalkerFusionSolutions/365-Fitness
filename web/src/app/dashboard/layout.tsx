import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { StaffOnly } from "@/components/dashboard/StaffOnly";
import { requireUserProfile } from "@/lib/data";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: LayoutProps<"/dashboard">) {
  const { profile } = await requireUserProfile();

  if (!profile || profile.role !== "coach") {
    return <StaffOnly />;
  }

  return <DashboardShell profile={profile}>{children}</DashboardShell>;
}
