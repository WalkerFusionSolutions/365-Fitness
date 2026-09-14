import Image from "next/image";
import type { Metadata } from "next";
import { assets } from "@/components/marketing/LovableAssets";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { PageHead } from "@/components/marketing/PageHead";
import { Reveal } from "@/components/marketing/Reveal";
import { SiteButtonLink } from "@/components/marketing/SiteButton";

export const metadata: Metadata = {
  title: "Gallery — Training in Grenada | 365 Fitness",
  description: "Inside 365 Fitness: strength work, athletic conditioning, at-home sessions, recovery and mobility, and coaching across Grenada.",
};

const shots = [
  { src: assets.strength, alt: "Strength training with barbell work", label: "Strength", span: "md:col-span-2 md:row-span-2" },
  { src: assets.athletic, alt: "Athletic conditioning drill", label: "Conditioning", span: "" },
  { src: assets.detail, alt: "Kettlebell detail", label: "Detail", span: "" },
  { src: assets.atHome, alt: "At-home training session", label: "At home", span: "" },
  { src: assets.recovery, alt: "Mobility and recovery work", label: "Recovery", span: "" },
  { src: assets.online, alt: "Outdoor training session at sunrise", label: "Outdoors", span: "md:col-span-2" },
];

export default function GalleryPage() {
  return (
    <MarketingShell>
      <PageHead eyebrow="Gallery" title={<>The work,<br /><span className="text-teal-bright">up close.</span></>} aside={<p>Sessions across Grenada — the gym floor, living rooms, the seafront and everything between.</p>} image={assets.community} imageAlt="Training group after a session" />
        <section className="px-5 py-14 sm:py-20 md:px-8 md:py-28">
          <div className="grid auto-rows-[30vh] gap-3 md:grid-cols-4 md:gap-4">
            {shots.map((shot, index) => (
              <Reveal key={`${shot.label}-${index}`} delay={index * 60} className={shot.span}>
                <figure className="img-zoom relative h-full w-full overflow-hidden border border-border">
                  <Image src={shot.src} alt={shot.alt} fill sizes="(min-width:768px) 25vw, 100vw" className="object-cover" />
                  <figcaption className="label-xs absolute bottom-3 left-4 text-bone">{shot.label}</figcaption>
                </figure>
              </Reveal>
            ))}
          </div>
        </section>
        <section className="border-t border-border px-5 py-14 sm:py-20 md:px-8 md:py-28">
          <h2 className="display text-5xl md:text-7xl">Want in?</h2>
          <div className="mt-10 flex flex-wrap gap-3">
            <SiteButtonLink href="/contact" size="lg">Start training</SiteButtonLink>
            <SiteButtonLink href="/services" variant="outline" size="lg">See services</SiteButtonLink>
          </div>
        </section>
    </MarketingShell>
  );
}
