import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { CategoryStrip } from "@/components/site/CategoryStrip";
import { AppShowcase } from "@/components/site/AppShowcase";
import { Reveal } from "@/components/site/Reveal";
import { BtnLink } from "@/components/site/Btn";
import hero from "@/assets/hero-training.jpg";
import strength from "@/assets/strength.jpg";
import athletic from "@/assets/athletic.jpg";
import nutritionImg from "@/assets/nutrition.jpg";
import atHome from "@/assets/at-home.jpg";
import online from "@/assets/online.jpg";
import community from "@/assets/community.jpg";
import resultsImg from "@/assets/results.jpg";
import detail from "@/assets/detail-kettlebell.jpg";

const TITLE = "365 Fitness Grenada — Personal Training & Coaching";
const DESC =
  "Your goals. My mission. Personalized training, nutrition and coaching in Grenada — in person, at home, hybrid or fully online.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: Home,
});

const SERVICES = [
  {
    n: "01",
    name: "Personal Training",
    copy: "One-to-one sessions built around your goal, your schedule and your starting point.",
  },
  {
    n: "02",
    name: "Strength Training",
    copy: "Progressive loading and technique work to build real, usable strength.",
  },
  {
    n: "03",
    name: "Athletic Training",
    copy: "Speed, power and conditioning for sport-specific performance.",
  },
  {
    n: "04",
    name: "Online Coaching",
    copy: "Full programming, nutrition and coach contact through the 365 app.",
  },
];

const PROGRAMS = [
  { name: "Personal", image: strength, note: "In-person, one-to-one", to: "/programs" },
  { name: "At Home", image: atHome, note: "Minimal equipment", to: "/programs" },
  { name: "Hybrid", image: athletic, note: "In-person + app", to: "/programs" },
  { name: "Online", image: online, note: "Train anywhere", to: "/online-coaching" },
] as const;

function Home() {
  return (
    <SiteShell>
      {/* HERO — asymmetric editorial composition, full-bleed media */}
      <section className="relative min-h-[92svh] w-full overflow-hidden">
        <img
          src={hero}
          alt="Athlete training with heavy ropes in a dark gym"
          width={1920}
          height={1088}
          className="absolute inset-0 h-full w-full object-cover object-[60%_center]"
        />
        <div className="absolute inset-0 bg-ink/55" />
        <div className="grain-fade absolute inset-0" />

        <div className="relative flex min-h-[92svh] flex-col justify-end px-5 pb-12 pt-28 md:px-8 md:pb-16">
          <div className="grid gap-8 md:grid-cols-[auto_1fr_auto] md:items-end md:gap-12">
            <span className="vertical-label hidden text-teal-bright md:block">
              Grenada — Est. 365 Days A Year
            </span>

            <h1 className="display text-[16vw] leading-[0.8] sm:text-8xl xl:text-[9.5rem]">
              Your goals.
              <br />
              <span className="text-teal-bright">My mission.</span>
            </h1>

            <div className="max-w-xs border-l border-bone/25 pl-6">
              <p className="display text-2xl md:text-3xl">
                Personalized training.
                <br />
                Total transformation.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <BtnLink to="/contact" size="lg">
                  Start your journey
                </BtnLink>
                <BtnLink to="/services" variant="outline" size="lg">
                  Explore training
                </BtnLink>
              </div>
            </div>
          </div>
        </div>
      </section>

      <CategoryStrip />

      {/* BUILT AROUND YOU */}
      <section className="grid gap-10 px-5 py-14 sm:py-20 md:grid-cols-[1.1fr_1fr] md:gap-16 md:px-8 md:py-28">
        <Reveal>
          <p className="label-xs text-teal-bright">Built around you.</p>
          <h2 className="display mt-6 text-6xl leading-[0.85] sm:text-7xl xl:text-8xl">
            Your goals.
            <br />
            My plan.
            <br />
            <span className="text-teal-bright">Your results.</span>
          </h2>
        </Reveal>

        <Reveal delay={120} className="flex flex-col justify-between gap-10">
          <div className="space-y-6 text-base leading-relaxed text-bone-dim md:text-lg">
            <p>
              No template programs. Training starts with what you want, what your body can handle
              today and what your week actually looks like. From there the plan is written, coached
              and adjusted as you progress.
            </p>
            <p>
              Sessions can run in person, at your home, or through the 365 app when you are away.
              Nutrition sits alongside the training — practical food, planned around your
              preferences, not a rulebook you cannot keep.
            </p>
          </div>

          <dl className="grid gap-y-6 sm:grid-cols-2">
            {[
              ["Assessed", "Goals, movement and starting point mapped before anything is written."],
              ["Programmed", "Structured progression with logging so effort is measurable."],
              ["Coached", "Direct contact, form feedback and adjustments as you go."],
              ["Fuelled", "Personalized nutrition guidance that fits your life."],
            ].map(([term, def]) => (
              <div key={term} className="border-t border-border pt-4 pr-6">
                <dt className="label-xs text-bone">{term}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-bone-dim">{def}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </section>

      {/* SELECTED SERVICES — big numbered rows */}
      <section className="bg-charcoal">
        <div className="flex flex-wrap items-end justify-between gap-6 px-5 pb-8 pt-16 md:px-8 md:pt-24">
          <h2 className="display text-5xl md:text-7xl">Selected services.</h2>
          <Link
            to="/services"
            className="link-underline label-xs text-bone-dim hover:text-bone"
          >
            All eleven services
          </Link>
        </div>

        <ul className="border-t border-border">
          {SERVICES.map((s) => (
            <li key={s.n} className="border-b border-border">
              <Link
                to="/services"
                className="group flex items-center gap-6 px-5 py-7 transition-colors duration-300 hover:bg-teal-deep/25 md:gap-12 md:px-8 md:py-10"
              >
                <span className="display text-2xl text-teal-bright md:text-4xl">{s.n}</span>
                <span className="display flex-1 text-3xl md:text-6xl xl:text-7xl">{s.name}</span>
                <span className="hidden max-w-sm text-sm leading-relaxed text-bone-dim lg:block">
                  {s.copy}
                </span>
                <span
                  aria-hidden
                  className="text-xl text-bone-dim transition-transform duration-300 group-hover:translate-x-1 group-hover:text-bone"
                >
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* PROGRAMS — image led */}
      <section className="px-5 py-14 sm:py-20 md:px-8 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="display text-5xl md:text-7xl">Programs.</h2>
          <p className="max-w-sm text-sm leading-relaxed text-bone-dim">
            Four ways to train with 365 Fitness. Same coaching standard, different structure.
          </p>
        </div>

        <ul className="mt-10 grid gap-px bg-border sm:grid-cols-2 xl:grid-cols-4">
          {PROGRAMS.map((p, i) => (
            <Reveal as="li" key={p.name} delay={i * 90} className="bg-ink">
              <Link
                to={p.to}
                className="img-zoom group relative block aspect-[4/5] sm:aspect-auto sm:h-[62vh] sm:min-h-80"
              >

                <img
                  src={p.image}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover brightness-[0.72] transition-[filter] duration-700 group-hover:brightness-100"
                />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5">
                  <div>
                    <p className="label-xs text-teal-bright">{p.note}</p>
                    <p className="display mt-2 text-4xl md:text-5xl">{p.name}</p>
                  </div>
                  <span
                    aria-hidden
                    className="pb-1 text-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  >
                    →
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </ul>
      </section>

      {/* NUTRITION */}
      <section className="grid items-stretch border-y border-border md:grid-cols-2">
        <div className="img-zoom order-2 min-h-72 md:order-1">
          <img
            src={nutritionImg}
            alt="Balanced meal of grilled chicken, rice, avocado and tropical fruit"
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
        <Reveal className="order-1 flex flex-col justify-center gap-8 px-5 py-12 sm:py-16 md:order-2 md:px-12 md:py-24">
          <h2 className="display text-6xl leading-[0.85] md:text-7xl xl:text-8xl">
            Fuel your
            <br />
            body right.
          </h2>
          <p className="max-w-md text-base leading-relaxed text-bone-dim md:text-lg">
            Balanced eating built on protein, carbohydrates, healthy fats and hydration — planned
            around the food you actually like and the way you actually live.
          </p>
          <p className="display text-2xl text-teal-bright md:text-3xl">
            Personalized. Practical. Sustainable.
          </p>
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            {["Custom calories & macros", "Grocery lists", "Easy recipes", "Consistency"].map(
              (t) => (
                <span key={t} className="label-xs text-bone-dim">
                  {t}
                </span>
              ),
            )}
          </div>
          <BtnLink to="/nutrition" variant="outline" className="self-start">
            Nutrition
          </BtnLink>
        </Reveal>
      </section>

      {/* DIGITAL COACHING */}
      <section className="px-5 py-14 sm:py-20 md:px-8 md:py-28">
        <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="label-xs text-teal-bright">Part of the coaching experience</p>
            <h2 className="display mt-5 text-5xl md:text-7xl">365 digital coaching.</h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-bone-dim">
            Every client trains with the 365 app alongside their coaching — the programme, the
            nutrition and the conversation in one place.
          </p>
        </div>

        <div className="mt-12">
          <AppShowcase />
        </div>
      </section>

      {/* RESULTS */}
      <section className="grid border-y border-border md:grid-cols-[1fr_1fr]">
        <Reveal className="flex flex-col justify-between gap-10 px-5 py-12 sm:py-16 md:px-12 md:py-24">
          <div>
            <h2 className="display text-6xl md:text-7xl xl:text-8xl">Results.</h2>
            <p className="mt-6 max-w-md text-base leading-relaxed text-bone-dim md:text-lg">
              Real client results are documented in the app — measurements, progress photos, weight
              and training history. Published stories go here as clients approve them.
            </p>
          </div>
          <BtnLink to="/transformations" variant="outline" className="self-start">
            Transformations
          </BtnLink>
        </Reveal>
        <div className="img-zoom min-h-72">
          <img
            src={resultsImg}
            alt="Athlete resting after a training session"
            loading="lazy"
            className="h-full w-full object-cover"
          />
        </div>
      </section>

      {/* SOCIAL */}
      <section className="px-5 py-14 sm:py-20 md:px-8 md:py-28">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="display text-5xl md:text-7xl">
            From <span className="text-teal-bright">@365fitnessgnd</span>
          </h2>
          <a
            href="https://www.instagram.com/365fitnessgnd/"
            target="_blank"
            rel="noreferrer"
            className="link-underline label-xs text-bone-dim hover:text-bone"
          >
            Follow on Instagram
          </a>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-px bg-border md:grid-cols-4">
          {[community, detail, athletic, nutritionImg].map((src, i) => (
            <a
              key={i}
              href="https://www.instagram.com/365fitnessgnd/"
              target="_blank"
              rel="noreferrer"
              className={`img-zoom relative block bg-ink ${
                i % 3 === 0 ? "aspect-[4/5]" : "aspect-square"
              }`}
            >
              <img
                src={src}
                alt=""
                loading="lazy"
                className="h-full w-full object-cover brightness-90 transition-[filter] duration-700 hover:brightness-110"
              />
            </a>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden border-t border-border bg-teal-deep">
        <div className="grid gap-10 px-5 py-14 sm:py-20 md:grid-cols-[1.3fr_1fr] md:items-end md:px-8 md:py-28">
          <h2 className="display text-[15vw] leading-[0.8] sm:text-7xl xl:text-9xl">
            No excuses.
            <br />
            Just results.
          </h2>
          <div className="space-y-6">
            <p className="text-base leading-relaxed text-bone/85">
              Tell me your goal and where you are starting from. I will tell you exactly how we get
              there.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <BtnLink to="/contact" size="lg" className="bg-ink hover:bg-charcoal">
                Start your journey
              </BtnLink>
              <a
                href="tel:+14734157089"
                className="label-xs flex h-14 items-center justify-center gap-3 rounded-sm border border-bone/40 px-8 transition-colors duration-300 hover:bg-bone/10"
              >
                +1 473 415 7089
              </a>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
