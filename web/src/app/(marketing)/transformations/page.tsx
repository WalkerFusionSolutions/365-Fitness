import type { Metadata } from "next";
import { assets } from "@/components/marketing/LovableAssets";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { PageHead } from "@/components/marketing/PageHead";
import { Reveal } from "@/components/marketing/Reveal";
import { SiteButtonLink } from "@/components/marketing/SiteButton";

export const metadata: Metadata = {
  title: "Results — Real Progress, Tracked | 365 Fitness",
  description: "How progress is measured at 365 Fitness: consistent training, tracked measurements, photos and weight, honest coaching and habits that hold.",
};

const how = [
  ["01", "Baseline", "Measurements, weight, photos and goals recorded at the start — the only fair comparison point."],
  ["02", "Consistency", "Sessions logged week to week. Progress comes from the sessions you actually complete."],
  ["03", "Review", "Numbers and photos reviewed together, then the programme and nutrition adjust to what's happening."],
  ["04", "Hold it", "The aim isn't a short cut — it's habits and strength that stay once the goal is hit."],
];

export default function TransformationsPage() {
  return (
    <MarketingShell>
      <PageHead eyebrow="Results" title={<>Real progress.<br /><span className="text-teal-bright">No shortcuts.</span></>} aside={<p>Client transformations are shared with permission. This page shows how progress is tracked — nothing invented, nothing exaggerated.</p>} image={assets.results} imageAlt="Client training with focus during a session" />
        <section className="px-5 py-14 sm:py-20 md:px-8 md:py-28">
          <h2 className="display text-5xl md:text-7xl">How results happen.</h2>
          <ul className="mt-12 grid gap-x-12 md:grid-cols-2">
            {how.map(([n, title, copy], index) => (
              <Reveal as="li" key={n} delay={index * 70} className="border-t border-border py-8 pr-6">
                <div className="flex items-baseline gap-4"><span className="display text-2xl text-teal-bright">{n}</span><h3 className="display text-3xl md:text-4xl">{title}</h3></div>
                <p className="mt-3 text-sm leading-relaxed text-bone-dim">{copy}</p>
              </Reveal>
            ))}
          </ul>
        </section>
        <section className="border-y border-border bg-charcoal px-5 py-14 sm:py-20 md:px-8 md:py-28">
          <p className="label-xs text-teal-bright">Client stories</p>
          <h2 className="display mt-5 text-5xl md:text-7xl">Coming from clients.</h2>
          <p className="mt-6 max-w-xl text-sm leading-relaxed text-bone-dim">Before-and-after photos and testimonials are added here as clients approve them. We don&apos;t publish stock results or invented reviews.</p>
          <div className="mt-12 grid gap-3 md:grid-cols-3 md:gap-4">
            {["Story slot 01", "Story slot 02", "Story slot 03"].map((slot) => <div key={slot} className="flex h-52 items-center justify-center border border-dashed border-border text-bone-dim"><span className="label-xs">{slot}</span></div>)}
          </div>
        </section>
        <section className="px-5 py-14 sm:py-20 md:px-8 md:py-28">
          <h2 className="display text-5xl leading-[0.86] md:text-6xl">Your turn<br />on the wall.</h2>
          <div className="mt-10 flex flex-wrap gap-3">
            <SiteButtonLink href="/contact" size="lg">Start training</SiteButtonLink>
            <SiteButtonLink href="/programs" variant="outline" size="lg">View programs</SiteButtonLink>
          </div>
        </section>
    </MarketingShell>
  );
}
