import Link from "next/link";
import type { ReactNode } from "react";
import { signOut } from "@/lib/actions";
import type { Profile } from "@/types/app";
import { Button } from "@/components/ui/Button";
import { BrandLogo } from "@/components/marketing/BrandLogo";
import { DashboardNav } from "./DashboardNav";
import { initials } from "@/lib/format";

export function DashboardShell({ profile, children }: { profile: Profile; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ink text-bone">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-charcoal p-5 lg:block">
        <Link href="/dashboard" aria-label="365 Fitness dashboard">
          <BrandLogo compact light />
        </Link>
        <DashboardNav />
        <div className="absolute bottom-5 left-5 right-5 grid gap-2 border-t border-line pt-4">
          <Link href="/dashboard/profile" className="px-3 py-2 text-sm font-semibold text-bone-dim transition hover:bg-white/10 hover:text-bone">Profile</Link>
          <form action={signOut}>
            <button className="w-full px-3 py-2 text-left text-sm font-semibold text-bone-dim transition hover:bg-white/10 hover:text-bone" type="submit">Sign Out</button>
          </form>
        </div>
      </aside>
      <div className="lg:pl-64">
        <header className="sticky top-0 z-10 border-b border-line bg-ink/95 px-4 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <div>
              <p className="label-xs text-teal-bright">Coach Portal</p>
              <p className="font-bold">{profile.full_name}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden h-10 w-10 items-center justify-center rounded-full bg-teal text-sm font-black text-ink sm:flex">
                {initials(profile.full_name)}
              </div>
              <form action={signOut} className="lg:hidden">
                <Button type="submit" variant="secondary">Sign out</Button>
              </form>
            </div>
          </div>
          <DashboardNav mobile />
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </div>
    </div>
  );
}
