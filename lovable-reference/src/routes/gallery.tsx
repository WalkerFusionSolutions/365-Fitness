import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHead } from "@/components/site/PageHead";
import { Reveal } from "@/components/site/Reveal";
import { BtnLink } from "@/components/site/Btn";
import community from "@/assets/community.jpg";
import strength from "@/assets/strength.jpg";
import athletic from "@/assets/athletic.jpg";
import atHome from "@/assets/at-home.jpg";
import recovery from "@/assets/recovery.jpg";
import online from "@/assets/online.jpg";
import kettlebell from "@/assets/detail-kettlebell.jpg";

const TITLE = "Gallery — Training in Grenada | 365 Fitness";
const DESC =
  "Inside 365 Fitness: strength work, athletic conditioning, at-home sessions, recovery and mobility, and coaching across Grenada.";

export const Route = createFileRoute("/gallery")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: GalleryPage,
});

const SHOTS = [
  { src: strength, alt: "Strength training with barbell work", label: "Strength", span: "md:col-span-2 md:row-span-2" },
  { src: athletic, alt: "Athletic conditioning drill", label: "Conditioning", span: "" },
  { src: kettlebell, alt: "Kettlebell detail", label: "Detail", span: "" },
  { src: atHome, alt: "At-home training session", label: "At home", span: "" },
  { src: recovery, alt: "Mobility and recovery work", label: "Recovery", span: "" },
  { src: online, alt: "Outdoor training session at sunrise", label: "Outdoors", span: "md:col-span-2" },
];

function GalleryPage() {
  return (
    <SiteShell>
      <PageHead
        eyebrow="Gallery"
        title={
          <>
            The work,
            <br />
            <span className="text-teal-bright">up close.</span>
          </>
        }
        aside={
          <p>
            Sessions across Grenada — the gym floor, living rooms, the seafront and everything
            between.
          </p>
        }
        image={community}
        imageAlt="Training group after a session"
      />

      <section className="px-5 py-14 sm:py-20 md:px-8 md:py-28">
        <div className="grid auto-rows-[30vh] gap-3 md:grid-cols-4 md:gap-4">
          {SHOTS.map((s, i) => (
            <Reveal key={s.label + i} delay={i * 60} className={s.span}>
              <figure className="img-zoom relative h-full w-full overflow-hidden border border-border">
                <img src={s.src} alt={s.alt} loading="lazy" className="h-full w-full object-cover" />
                <figcaption className="label-xs absolute bottom-3 left-4 text-bone">
                  {s.label}
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="border-t border-border px-5 py-14 sm:py-20 md:px-8 md:py-28">
        <h2 className="display text-5xl md:text-7xl">Want in?</h2>
        <div className="mt-10 flex flex-wrap gap-3">
          <BtnLink to="/contact" size="lg">
            Start training
          </BtnLink>
          <BtnLink to="/services" variant="outline" size="lg">
            See services
          </BtnLink>
        </div>
      </section>
    </SiteShell>
  );
}
