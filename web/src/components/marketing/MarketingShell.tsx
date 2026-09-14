import type { ReactNode } from "react";
import { MarketingFooter } from "./MarketingFooter";
import { MarketingNav } from "./MarketingNav";

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ink text-bone">
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
