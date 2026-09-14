import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHead } from "@/components/site/PageHead";
import { AppShowcase, ScreenSlot } from "@/components/site/AppShowcase";
import { Reveal } from "@/components/site/Reveal";
import { BtnLink } from "@/components/site/Btn";
import online from "@/assets/online.jpg";

const TITLE = "Online Coaching — Train Anywhere | 365 Fitness";
const DESC =
  "Online coaching with 365 Fitness: custom workouts, exercise demonstrations, logging, meal plans, progress tracking, messaging and video feedback.";

export const Route = createFileRoute("/online-coaching")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: OnlineCoaching,
});

const LOOP = [
  { n: "01", label: "Coach", copy: "Your programme is written and reviewed by me, not generated." },
  { n: "02", label: "Training", copy: "Sessions delivered with demonstrations, sets, reps and rest." },
  { n: "03", label: "App", copy: "Everything logged in one place, session by session." },
  { n: "04", label: "Nutrition", copy: "Meal plans, water and supplements alongside the training." },
  { n: "05", label: "Progress", copy: "Measurements, photos, weight and goals tracked over time." },
  { n: "06", label: "Communication", copy: "Messaging and video feedback keep the plan honest." },
];

function OnlineCoaching() {
  return (
    <SiteShell>
      <PageHead
        eyebrow="Online Coaching"
        title={
          <>
            Train anywhere.
            <br />
            <span className="text-teal-bright">Stay connected.</span>
          </>
        }
        aside={
          <p>
            Coaching that travels with you. The programme, the nutrition and the conversation live
            in the 365 app — wherever you train that week.
          </p>
        }
        image={online}
        imageAlt="Runner training on a coastal path at sunrise"
      />

      {/* The loop — numbered rows with a connecting rule */}
      <section className="px-5 py-14 sm:py-20 md:px-8 md:py-28">
        <h2 className="display text-5xl md:text-7xl">How it connects.</h2>
        <ul className="mt-12 grid gap-x-12 md:grid-cols-2 xl:grid-cols-3">
          {LOOP.map((l, i) => (
            <Reveal as="li" key={l.n} delay={i * 70} className="border-t border-border py-8 pr-6">
              <div className="flex items-baseline gap-4">
                <span className="display text-2xl text-teal-bright">{l.n}</span>
                <h3 className="display text-3xl md:text-4xl">{l.label}</h3>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-bone-dim">{l.copy}</p>
            </Reveal>
          ))}
        </ul>
      </section>

      <section className="border-y border-border bg-charcoal px-5 py-14 sm:py-20 md:px-8 md:py-28">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="label-xs text-teal-bright">Inside the app</p>
            <h2 className="display mt-5 text-5xl md:text-7xl">Built for real training.</h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-bone-dim">
            Screens below are reserved for real captures from the 365 Fitness app — no invented
            data.
          </p>
        </div>
        <div className="mt-12">
          <AppShowcase />
        </div>
      </section>

      <section className="grid gap-10 px-5 py-14 sm:py-20 md:grid-cols-[1fr_auto] md:items-center md:gap-16 md:px-8 md:py-28">
        <div>
          <h2 className="display text-5xl leading-[0.86] md:text-6xl">
            Coach contact,
            <br />
            not a chatbot.
          </h2>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-bone-dim md:text-lg">
            Send a set, a question or a video of your lift. You get an answer from your coach,
            adjustments where needed and a plan that keeps moving. Appointments, reminders and
            notifications keep the week on track.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <BtnLink to="/contact" size="lg">
              Apply for online coaching
            </BtnLink>
            <BtnLink to="/login" variant="outline" size="lg">
              Client login
            </BtnLink>
          </div>
        </div>
        <ScreenSlot slot="app-screen-messaging" label="Messaging" />
      </section>
    </SiteShell>
  );
}
