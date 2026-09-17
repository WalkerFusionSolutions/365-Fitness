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
    <nav aria-label="Coach workspace" className={mobile ? "mx-auto mt-3 flex max-w-7xl gap-1 overflow-x-auto pb-1 lg:hidden" : "mt-8 grid gap-1"}>
      {primaryLinks.map(([label, href]) => {
        const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={
              mobile
                ? `whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold transition ${active ? "border-brand text-brand" : "border-transparent text-muted hover:text-foreground"}`
                : `border-l-2 px-3 py-2 text-sm font-semibold transition ${active ? "border-brand bg-secondary text-foreground" : "border-transparent text-muted hover:bg-secondary hover:text-foreground"}`
            }
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
