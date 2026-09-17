import Image from "next/image";
import Link from "next/link";
import { FinalCallout, MarketingPageHero, MarketingShell } from "@/components/marketing/MarketingShell";
import { assets } from "@/components/marketing/LovableAssets";

const rows = [
  ["Personal Training", "Focused one-to-one coaching with a plan built for your goals, experience, and schedule.", assets.coach],
  ["Athletic & Strength Training", "Purposeful strength, conditioning, and movement work for better performance.", assets.athletic],
  ["Rehabilitation Training", "Thoughtful exercise progression that respects your current capacity without making medical claims.", assets.recovery],
  ["Assisted Stretching & Cupping", "Hands-on recovery services that complement training and mobility work.", assets.detail],
  ["At-Home, Hybrid & Online", "Flexible coaching that keeps programming, feedback, and accountability connected wherever you train.", assets.atHome],
] as const;

export default function ServicesPage() {
  return <MarketingShell>
    <MarketingPageHero image={assets.strength} title="Coaching for the work in front of you." intro="Personal training, athletic development, recovery support, and flexible programming under one clear plan." />
    <section className="marketing-frame marketing-service-directory">{rows.map(([title, body, image], index) => <article key={title}><span>0{index + 1}</span><div><h2>{title}</h2><p>{body}</p><Link className="marketing-text-link dark" href="/contact">Ask about this service</Link></div><div className="marketing-directory-image"><Image src={image} alt="" fill sizes="(max-width: 768px) 100vw, 32vw" /></div></article>)}</section>
    <div className="marketing-frame marketing-inline-list"><strong>Also available</strong><span>Personalized detox plans</span><span>Healthy meal guides</span><span>Nutrition support</span></div>
    <FinalCallout title="Train smart. Eat right. Live strong." body="Tell us where you are now and what you want to change." />
  </MarketingShell>;
}
