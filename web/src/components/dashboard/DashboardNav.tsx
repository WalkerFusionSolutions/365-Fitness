"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const primaryLinks = [
  ["Overview", "/dashboard"],
  ["Clients", "/dashboard/clients"],
  ["Schedule", "/dashboard/schedule"],
  ["Programs", "/dashboard/programs"],
  ["Nutrition", "/dashboard/nutrition"],
  ["Messages", "/dashboard/messages"],
  ["Progress", "/dashboard/progress"],
  ["Reports", "/dashboard/reports"],
];

export function DashboardNav({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className={mobile ? "mx-auto mt-3 flex max-w-6xl gap-2 overflow-x-auto pb-1 lg:hidden" : "mt-8 grid gap-1"}>
      {primaryLinks.map(([label, href]) => {
        const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={
              mobile
                ? `whitespace-nowrap border px-3 py-1.5 text-sm font-semibold ${active ? "border-teal bg-teal text-ink" : "border-line bg-charcoal text-bone-dim"}`
                : `border-l-2 px-3 py-2 text-sm font-semibold transition ${active ? "border-teal-bright bg-white/10 text-bone" : "border-transparent text-bone-dim hover:bg-white/10 hover:text-bone"}`
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
