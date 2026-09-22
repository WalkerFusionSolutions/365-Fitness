import Image from "next/image";
import { FinalCallout, MarketingPageHero, MarketingShell } from "@/components/marketing/MarketingShell";
import { assets } from "@/components/marketing/LovableAssets";
import { PhpAboutPage } from "@/components/marketing/php/PhpMarketingPages";
import { getMarketingVariant } from "@/lib/marketingVariant";

export default function AboutPage() {
  if (getMarketingVariant() === "php") return <PhpAboutPage />;

  return <MarketingShell>
    <MarketingPageHero image={assets.coach} title="Coaching built around the person." intro="365 Fitness connects clear training, practical nutrition, and direct accountability in one personal plan." />
    <section className="marketing-frame marketing-story-grid"><div><p className="marketing-kicker">Your goals. My plan. Your results.</p><h2>Consistency becomes easier when the work is clear.</h2></div><div className="marketing-prose"><p>There is no generic template for a real person. Training begins with your current ability, available time, preferred environment, and the outcome you are working toward.</p><p>The plan can move between personal training, at-home work, hybrid weeks, and online support without losing the thread.</p></div></section>
    <section className="marketing-frame marketing-principles">{[["01","Assess honestly","Start from the body, schedule, and experience you have now."],["02","Build deliberately","Make every session and food choice serve the same goal."],["03","Review the evidence","Use logged training, measurements, photos, and conversation to adjust."],["04","Stay consistent","Progress comes from repeatable work, not a dramatic short-term fix."]].map(([n,title,body]) => <article key={n}><span>{n}</span><h3>{title}</h3><p>{body}</p></article>)}</section>
    <section className="marketing-frame marketing-wide-image"><Image src={assets.community} alt="365 Fitness coaching environment" fill sizes="100vw" /></section>
    <FinalCallout title="Personalized training. Total transformation." body="Choose the structure that gives you clarity, accountability, and room to progress." />
  </MarketingShell>;
}
