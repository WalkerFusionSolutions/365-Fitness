import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHead } from "@/components/site/PageHead";
import { Reveal } from "@/components/site/Reveal";
import { BtnLink } from "@/components/site/Btn";
import coach from "@/assets/coach.jpg";
import detail from "@/assets/detail-kettlebell.jpg";
import community from "@/assets/community.jpg";

const TITLE = "About 365 Fitness — Coaching Philosophy in Grenada";
const DESC =
  "The approach behind 365 Fitness: personalized, practical, structured and consistent coaching for clients in Grenada and online.";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: About,
});

const PILLARS = [
  {
    n: "01",
    title: "Personalized",
    copy: "Every programme starts from your goal, your movement and your schedule. Nothing is copied from another client.",
  },
  {
    n: "02",
    title: "Practical",
    copy: "Training and nutrition that fit real life in Grenada — the gym you use, the food you buy, the time you actually have.",
  },
  {
    n: "03",
    title: "Structured",
    copy: "Sessions are planned, loaded and logged so progress is visible instead of guessed at.",
  },
  {
    n: "04",
    title: "Consistent",
    copy: "Results come from repeated weeks, not single sessions. Coaching keeps you accountable between them.",
  },
];

function About() {
  return (
    <SiteShell>
      <PageHead
        eyebrow="About — 365 Fitness"
        title={
          <>
            Your goals.
            <br />
            <span className="text-teal-bright">My mission.</span>
          </>
        }
        aside={
          <p>
            365 Fitness is a personal training and coaching practice in Grenada. Training in person,
            at home, hybrid or fully online — with nutrition and progress tracked alongside it.
          </p>
        }
      />

      <section className="grid items-stretch border-b border-border md:grid-cols-[1fr_1.1fr]">
        <div className="img-zoom min-h-[60vh]">
          <img
            src={coach}
            alt="Coach standing at the entrance of a dark training hall"
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
        <Reveal className="flex flex-col justify-center gap-8 px-5 py-12 sm:py-16 md:px-12 md:py-24">
          <p className="label-xs text-teal-bright">The approach</p>
          <p className="display text-4xl leading-[0.9] md:text-5xl xl:text-6xl">
            Coaching is a plan,
            <br />
            not a workout.
          </p>
          <div className="space-y-6 text-base leading-relaxed text-bone-dim md:text-lg">
            <p>
              Most people do not need harder sessions. They need the right sessions, in the right
              order, with someone watching the details and adjusting as the body responds.
            </p>
            <p>
              That is what 365 Fitness is built on: clear structure, honest coaching and a plan you
              can hold on to for longer than a few weeks.
            </p>
          </div>
        </Reveal>
      </section>

      {/* Pillars — offset editorial rows, not icon cards */}
      <section className="px-5 py-14 sm:py-20 md:px-8 md:py-28">
        <ul className="space-y-px">
          {PILLARS.map((p, i) => (
            <Reveal
              as="li"
              key={p.n}
              delay={i * 80}
              className="grid gap-4 border-t border-border py-10 md:grid-cols-[6rem_1fr_1.1fr] md:gap-10"
            >
              <span className="display text-3xl text-teal-bright md:text-5xl">{p.n}</span>
              <h2 className="display text-4xl md:text-6xl">{p.title}</h2>
              <p className="max-w-lg self-end text-base leading-relaxed text-bone-dim">{p.copy}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="grid gap-px border-y border-border bg-border md:grid-cols-3">
        <div className="img-zoom aspect-[4/5] bg-ink md:aspect-auto md:min-h-80">
          <img src={detail} alt="" loading="lazy" className="h-full w-full object-cover" />
        </div>
        <div className="flex flex-col justify-center gap-6 bg-ink px-6 py-14 md:px-8">
          <p className="label-xs text-teal-bright">Who I work with</p>
          <p className="text-base leading-relaxed text-bone-dim">
            Beginners starting from zero. Athletes chasing performance. Clients returning to
            training after time away. People who travel and need coaching that follows them.
          </p>
          <p className="text-base leading-relaxed text-bone-dim">
            If you want structure and someone in your corner, this works.
          </p>
        </div>
        <div className="img-zoom aspect-[4/5] bg-ink md:aspect-auto md:min-h-80">
          <img src={community} alt="" loading="lazy" className="h-full w-full object-cover" />
        </div>
      </section>

      <section className="px-5 py-24 text-center md:px-8 md:py-32">
        <Reveal>
          <p className="display text-[13vw] leading-[0.82] sm:text-6xl xl:text-8xl">
            Train smart.
            <br />
            Eat right.
            <br />
            <span className="text-teal-bright">Live strong.</span>
          </p>
          <div className="mt-12 flex flex-wrap justify-center gap-3">
            <BtnLink to="/contact" size="lg">
              Start your journey
            </BtnLink>
            <BtnLink to="/services" variant="outline" size="lg">
              Explore training
            </BtnLink>
          </div>
        </Reveal>
      </section>
    </SiteShell>
  );
}
