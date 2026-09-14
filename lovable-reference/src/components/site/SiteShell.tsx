import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ink text-bone">
      <Header />
      <main>{children}</main>
      <Footer />
    </div>
  );
}
