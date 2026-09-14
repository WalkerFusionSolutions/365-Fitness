import Image from "next/image";
import type { Metadata } from "next";
import { assets } from "@/components/marketing/LovableAssets";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { Reveal } from "@/components/marketing/Reveal";
import { SiteButtonLink } from "@/components/marketing/SiteButton";

export const metadata: Metadata = {
  title: "Nutrition — Fuel Your Body Right | 365 Fitness",
  description: "Personalized, practical and sustainable nutrition coaching: balanced eating, macros, hydration, grocery planning and meal guides built around your preferences.",
};

const topics = [
  ["01", "Balanced eating", "Protein, carbohydrates and healthy fats in every day — built from food you already eat."],
  ["02", "Custom macros", "Calories and macros set to your body, your training load and your goal."],
  ["03", "Preferences", "Your plan is written around what you like and what is available locally."],
  ["04", "Hydration", "Daily water targets tracked in the 365 app alongside your training."],
  ["05", "Grocery planning", "Lists that make the week simple — buy once, eat well all week."],
  ["06", "Consistency", "Plans you can repeat. Sustainable beats perfect every single time."],
];

export default function NutritionPage() {
  return (
    <MarketingShell>
      <section className="bg-bone pt-28 text-ink md:pt-36">
          <div className="grid gap-10 px-5 pb-16 md:grid-cols-[1.3fr_1fr] md:items-end md:px-8 md:pb-24">
            <div>
              <p className="label-xs text-teal-deep">Nutrition — 365 Fitness</p>
              <Reveal><h1 className="display mt-5 text-[17vw] leading-[0.78] sm:text-8xl xl:text-[10rem]">Fuel<br />your body<br /><span className="text-teal-deep">right.</span></h1></Reveal>
            </div>
            <Reveal delay={120} className="border-l border-ink/15 pl-6">
              <p className="text-base leading-relaxed text-ink/70 md:text-lg">Nutrition at 365 Fitness is coaching, not a diet handout. The plan is written for your body, your training and the food you actually enjoy — then adjusted as you go.</p>
              <p className="display mt-8 text-2xl text-teal-deep md:text-3xl">Personalized. Practical. Sustainable.</p>
            </Reveal>
          </div>
          <div className="img-zoom relative h-[50vh] w-full md:h-[75vh]"><Image src={assets.nutrition} alt="Bowl of grilled chicken, brown rice, avocado and tropical fruit" fill sizes="100vw" className="object-cover" /></div>
        </section>
        <section className="px-5 py-14 sm:py-20 md:px-8 md:py-28">
          <h2 className="display text-5xl md:text-7xl">What the plan covers.</h2>
          <ul className="mt-12 grid gap-x-12 md:grid-cols-2 xl:grid-cols-3">
            {topics.map(([n, title, copy], index) => (
              <Reveal as="li" key={n} delay={index * 70} className="border-t border-border py-8 pr-4">
                <span className="display text-2xl text-teal-bright">{n}</span>
                <h3 className="display mt-3 text-3xl md:text-4xl">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-bone-dim">{copy}</p>
              </Reveal>
            ))}
          </ul>
        </section>
        <section className="grid border-y border-border md:grid-cols-[1fr_1fr]">
          <div className="img-zoom relative min-h-72"><Image src={assets.community} alt="" fill sizes="(min-width:768px) 50vw, 100vw" className="object-cover" /></div>
          <Reveal className="flex flex-col justify-center gap-8 px-5 py-12 sm:py-16 md:px-12 md:py-24">
            <p className="label-xs text-teal-bright">Delivered in the app</p>
            <p className="display text-4xl leading-[0.9] md:text-5xl">Meal plans, lists<br />and water tracking<br />in one place.</p>
            <ul className="grid gap-2 sm:grid-cols-2">{["Personalized meal plans", "Grocery lists", "Water tracking", "Supplements", "Easy recipes", "Coach messaging"].map((item) => <li key={item} className="flex gap-3 text-sm text-bone-dim"><span className="text-teal-bright">/</span>{item}</li>)}</ul>
            <SiteButtonLink href="/contact" className="self-start">Ask about nutrition</SiteButtonLink>
          </Reveal>
        </section>
        <section className="px-5 py-24 md:px-8 md:py-32">
          <div className="grid gap-8 md:grid-cols-[1.2fr_1fr] md:items-end">
            <p className="display text-[13vw] leading-[0.82] sm:text-6xl xl:text-8xl">Train smart.<br /><span className="text-teal-bright">Eat right.</span></p>
            <SiteButtonLink href="/programs" variant="outline" size="lg" className="self-start md:justify-self-end">See programs</SiteButtonLink>
          </div>
        </section>
    </MarketingShell>
  );
}
