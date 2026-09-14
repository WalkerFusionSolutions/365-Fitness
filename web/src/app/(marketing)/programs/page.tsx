import Image from "next/image";
import type { Metadata } from "next";
import { assets } from "@/components/marketing/LovableAssets";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { PageHead } from "@/components/marketing/PageHead";
import { Reveal } from "@/components/marketing/Reveal";
import { SiteButtonLink } from "@/components/marketing/SiteButton";

export const metadata: Metadata = {
  title: "Programs — Personal, At Home, Hybrid & Online | 365 Fitness",
  description: "Four ways to train with 365 Fitness in Grenada: fully personal, at home, hybrid in-person plus app, or entirely online coaching.",
};

const programs = [
  { n: "01", name: "Personal", image: assets.strength, lead: "One-to-one coaching, in person, every session.", suits: "Clients who want hands-on coaching, technique corrected in the moment and accountability face to face.", includes: ["Full movement and goal assessment", "Coached one-to-one sessions", "Programme written and progressed for you", "Sessions logged in the 365 app", "Nutrition guidance alongside training"] },
  { n: "02", name: "At Home", image: assets.atHome, lead: "Coached training in your own space, minimal equipment.", suits: "Clients with limited time, no gym access, or a preference for training privately at home.", includes: ["Equipment-light programming", "Coach comes to your space", "Same tracking and progression", "Home-friendly warm-ups and mobility"] },
  { n: "03", name: "Hybrid", image: assets.athletic, lead: "In-person sessions plus app training for the rest of the week.", suits: "Clients who want regular coaching contact but train independently on some days.", includes: ["Key sessions coached in person", "Remaining sessions delivered in the app", "Weekly check-in and adjustments", "Nutrition plan and grocery list"] },
  { n: "04", name: "Online", image: assets.online, lead: "Full coaching wherever you are, delivered through the 365 app.", suits: "Clients who travel, live off-island, or prefer to train on their own schedule.", includes: ["Custom workouts with exercise video", "Logging, rest timer and history", "Meal plans, water and supplements", "Messaging and video form feedback"] },
];

export default function ProgramsPage() {
  return (
    <MarketingShell>
      <PageHead eyebrow="Programs — Four Structures" title={<>Choose<br />your<br />structure.</>} aside={<p>Same coaching standard in every programme. What changes is where you train and how much of the week is coached in person.</p>} />
        {programs.map((program, index) => (
          <section key={program.n} className="border-b border-border">
            <div className={`grid md:grid-cols-2 ${index % 2 === 1 ? "md:[&>*:first-child]:order-2" : ""}`}>
              <div className="img-zoom relative min-h-[52vh] md:min-h-[80vh]">
                <Image src={program.image} alt="" fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover brightness-90" />
                <span className="display absolute left-5 top-5 text-6xl text-bone/80 md:text-8xl">{program.n}</span>
              </div>
              <Reveal className="flex flex-col justify-center gap-8 px-5 py-14 md:px-12 md:py-20">
                <div>
                  <h2 className="display text-6xl leading-[0.85] md:text-7xl xl:text-8xl">{program.name}</h2>
                  <p className="mt-5 max-w-md text-base leading-relaxed text-bone md:text-lg">{program.lead}</p>
                </div>
                <div className="border-t border-border pt-6">
                  <p className="label-xs text-teal-bright">Who it suits</p>
                  <p className="mt-3 max-w-md text-sm leading-relaxed text-bone-dim">{program.suits}</p>
                </div>
                <div className="border-t border-border pt-6">
                  <p className="label-xs text-teal-bright">Core inclusions</p>
                  <ul className="mt-4 space-y-2">
                    {program.includes.map((item) => <li key={item} className="flex gap-3 text-sm text-bone"><span className="text-teal-bright">/</span>{item}</li>)}
                  </ul>
                </div>
                <SiteButtonLink href="/contact" className="self-start">Enquire about {program.name}</SiteButtonLink>
              </Reveal>
            </div>
          </section>
        ))}
        <section className="bg-teal-deep px-5 py-14 sm:py-20 md:px-8 md:py-28">
          <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-end">
            <h2 className="display text-[14vw] leading-[0.82] sm:text-6xl xl:text-8xl">Your goals.<br />My plan.</h2>
            <div className="space-y-6">
              <p className="text-base leading-relaxed text-bone/85">Tell me how your week looks and I will tell you which structure fits.</p>
              <SiteButtonLink href="/contact" size="lg" className="bg-ink hover:bg-charcoal">Start your journey</SiteButtonLink>
            </div>
          </div>
        </section>
    </MarketingShell>
  );
}
