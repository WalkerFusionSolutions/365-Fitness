import type { Metadata } from "next";
import { assets } from "@/components/marketing/LovableAssets";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { PageHead } from "@/components/marketing/PageHead";
import { ServiceDirectory, type ServiceGroup } from "@/components/marketing/ServiceDirectory";
import { SiteButtonLink } from "@/components/marketing/SiteButton";

export const metadata: Metadata = {
  title: "Services — Training, Recovery & Nutrition | 365 Fitness",
  description: "Personal, athletic, strength and rehabilitation training, assisted stretching, cupping therapy, detox plans, meal guides, at-home, hybrid and online coaching.",
};

const groups: ServiceGroup[] = [
  {
    heading: "Training",
    items: [
      { n: "01", name: "Personal Training", copy: "One-to-one coaching built around your goal, your schedule and your starting point.", detail: ["Full assessment before programming", "Coached technique every session", "Sessions logged in the 365 app", "Plan adjusted as you progress"], image: assets.hero },
      { n: "02", name: "Athletic Training", copy: "Speed, power, agility and conditioning work for sport performance.", detail: ["Sport-specific movement patterns", "Speed and power development", "Conditioning blocks", "In-season and off-season structure"], image: assets.athletic },
      { n: "03", name: "Strength Training", copy: "Progressive loading and technique work to build usable strength.", detail: ["Compound lift coaching", "Progressive overload planning", "Weight and rep logging", "Accessory work for weak points"], image: assets.strength },
      { n: "04", name: "Rehabilitation Training", copy: "Controlled, gradual training to rebuild capacity and confidence in movement.", detail: ["Gradual, controlled progressions", "Movement quality first", "Load managed session to session", "Works alongside your medical guidance"], image: assets.recovery },
    ],
  },
  {
    heading: "Recovery + Mobility",
    items: [
      { n: "05", name: "Assisted Stretching", copy: "Guided, hands-on stretching sessions to support range of motion.", detail: ["Coach-assisted positions", "Focus on your restricted areas", "Standalone or post-session"], image: assets.recovery },
      { n: "06", name: "Cupping Therapy", copy: "Cupping sessions offered as part of the recovery side of coaching.", detail: ["Session by appointment", "Paired with stretching where suitable", "Discussed before booking"], image: assets.recovery },
    ],
  },
  {
    heading: "Nutrition",
    items: [
      { n: "07", name: "Personalized Detox Plans", copy: "Structured short-term eating plans built to your preferences.", detail: ["Built around your food preferences", "Hydration and consistency focused", "Grocery list included"], image: assets.nutrition },
      { n: "08", name: "Healthy Meal Guides", copy: "Practical meal guides with calories, macros and easy recipes.", detail: ["Custom calories and macros", "Simple recipes you will repeat", "Grocery lists", "Delivered in the 365 app"], image: assets.nutrition },
    ],
  },
  {
    heading: "Flexible Coaching",
    items: [
      { n: "09", name: "At-Home Training", copy: "Coached sessions in your own space with minimal equipment.", detail: ["Equipment-light programming", "Coach comes to you", "Same logging and tracking"], image: assets.atHome },
      { n: "10", name: "Hybrid Programs", copy: "In-person sessions combined with app-based training for the rest of the week.", detail: ["Key sessions coached in person", "Remaining sessions in the app", "Weekly check-ins"], image: assets.athletic },
      { n: "11", name: "Online Coaching", copy: "Full programming, nutrition and coach contact wherever you are.", detail: ["Custom workouts with video demos", "Meal plans and water tracking", "Progress photos and measurements", "Messaging and video feedback"], image: assets.online },
    ],
  },
];

export default function ServicesPage() {
  return (
    <MarketingShell>
      <PageHead eyebrow="Services — Eleven Ways To Train" title={<>Selected<br />services.</>} aside={<p>Training, recovery, nutrition and flexible coaching. Tap any row for what a session includes.</p>} />
      <ServiceDirectory groups={groups} />
      <section className="grid gap-8 border-t border-border px-5 py-14 sm:py-20 md:grid-cols-[1.2fr_1fr] md:items-end md:px-8 md:py-28">
          <h2 className="display text-5xl leading-[0.86] md:text-7xl">Not sure which<br />one you need?</h2>
          <div className="space-y-6">
            <p className="text-base leading-relaxed text-bone-dim">Send your goal and your current routine. I will recommend the right combination of training, recovery and nutrition.</p>
            <SiteButtonLink href="/contact" size="lg">Get in touch</SiteButtonLink>
          </div>
      </section>
    </MarketingShell>
  );
}
