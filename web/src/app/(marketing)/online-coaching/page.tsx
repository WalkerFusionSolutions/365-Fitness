import type { Metadata } from "next";
import { AppShowcase, ScreenSlot } from "@/components/marketing/AppShowcase";
import { assets } from "@/components/marketing/LovableAssets";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { PageHead } from "@/components/marketing/PageHead";
import { Reveal } from "@/components/marketing/Reveal";
import { SiteButtonLink } from "@/components/marketing/SiteButton";

export const metadata: Metadata = {
  title: "Online Coaching — Train Anywhere | 365 Fitness",
  description: "Online coaching with 365 Fitness: custom workouts, exercise demonstrations, logging, meal plans, progress tracking, messaging and video feedback.",
};

const loop = [
  ["01", "Coach", "Your programme is written and reviewed by me, not generated."],
  ["02", "Training", "Sessions delivered with demonstrations, sets, reps and rest."],
  ["03", "App", "Everything logged in one place, session by session."],
  ["04", "Nutrition", "Meal plans, water and supplements alongside the training."],
  ["05", "Progress", "Measurements, photos, weight and goals tracked over time."],
  ["06", "Communication", "Messaging and video feedback keep the plan honest."],
];

export default function OnlineCoachingPage() {
  return (
    <MarketingShell>
      <PageHead eyebrow="Online Coaching" title={<>Train anywhere.<br /><span className="text-teal-bright">Stay connected.</span></>} aside={<p>Coaching that travels with you. The programme, the nutrition and the conversation live in the 365 app — wherever you train that week.</p>} image={assets.online} imageAlt="Runner training on a coastal path at sunrise" />
        <section className="px-5 py-14 sm:py-20 md:px-8 md:py-28">
          <h2 className="display text-5xl md:text-7xl">How it connects.</h2>
          <ul className="mt-12 grid gap-x-12 md:grid-cols-2 xl:grid-cols-3">
            {loop.map(([n, label, copy], index) => (
              <Reveal as="li" key={n} delay={index * 70} className="border-t border-border py-8 pr-6">
                <div className="flex items-baseline gap-4"><span className="display text-2xl text-teal-bright">{n}</span><h3 className="display text-3xl md:text-4xl">{label}</h3></div>
                <p className="mt-3 text-sm leading-relaxed text-bone-dim">{copy}</p>
              </Reveal>
            ))}
          </ul>
        </section>
        <section className="border-y border-border bg-charcoal px-5 py-14 sm:py-20 md:px-8 md:py-28">
          <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
            <div><p className="label-xs text-teal-bright">Inside the app</p><h2 className="display mt-5 text-5xl md:text-7xl">Built for real training.</h2></div>
            <p className="max-w-sm text-sm leading-relaxed text-bone-dim">Screens below are reserved for real captures from the 365 Fitness app — no invented data.</p>
          </div>
          <div className="mt-12"><AppShowcase /></div>
        </section>
        <section className="grid gap-10 px-5 py-14 sm:py-20 md:grid-cols-[1fr_auto] md:items-center md:gap-16 md:px-8 md:py-28">
          <div>
            <h2 className="display text-5xl leading-[0.86] md:text-6xl">Coach contact,<br />not a chatbot.</h2>
            <p className="mt-6 max-w-lg text-base leading-relaxed text-bone-dim md:text-lg">Send a set, a question or a video of your lift. You get an answer from your coach, adjustments where needed and a plan that keeps moving.</p>
            <div className="mt-10 flex flex-wrap gap-3">
              <SiteButtonLink href="/contact" size="lg">Apply for online coaching</SiteButtonLink>
              <SiteButtonLink href="/login" variant="outline" size="lg">Client login</SiteButtonLink>
            </div>
          </div>
          <ScreenSlot slot="app-screen-messaging" label="Messaging" />
        </section>
    </MarketingShell>
  );
}
