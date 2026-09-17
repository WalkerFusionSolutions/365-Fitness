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
    <div className="dashboard-root min-h-screen bg-background text-foreground">
      <aside className="fixed inset-y-0 left-0 hidden w-60 border-r border-line bg-sidebar p-5 lg:block">
        <Link href="/dashboard" aria-label="365 Fitness dashboard">
          <BrandLogo />
        </Link>
        <DashboardNav />
        <div className="absolute bottom-5 left-5 right-5 grid gap-2 border-t border-line pt-4">
          <Link href="/dashboard/profile" className="px-3 py-2 text-sm font-semibold text-muted transition hover:bg-secondary hover:text-foreground">Profile</Link>
          <form action={signOut}>
            <button className="w-full px-3 py-2 text-left text-sm font-semibold text-muted transition hover:bg-secondary hover:text-foreground" type="submit">Sign out</button>
          </form>
        </div>
      </aside>
      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 border-b border-line bg-background/95 px-4 py-3 backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-muted">Coach workspace</p>
              <p className="font-bold text-foreground">{profile.full_name}</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-black text-white sm:flex">
                {initials(profile.full_name)}
              </div>
              <form action={signOut} className="lg:hidden">
                <Button type="submit" variant="secondary">Sign out</Button>
              </form>
            </div>
          </div>
          <DashboardNav mobile />
        </header>
        <main className="mx-auto max-w-7xl px-4 py-7 md:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
