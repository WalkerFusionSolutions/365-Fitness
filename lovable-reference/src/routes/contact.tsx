import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { PageHead } from "@/components/site/PageHead";
import { Btn } from "@/components/site/Btn";
import coach from "@/assets/coach.jpg";

const TITLE = "Contact — Start Training | 365 Fitness Grenada";
const DESC =
  "Get in touch with 365 Fitness in Grenada. Call +1 473 415 7089, email 365fitnessgnd@gmail.com or send your training goals and we'll map the next step.";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
    ],
  }),
  component: ContactPage,
});

type Errors = Partial<Record<"name" | "email" | "goal", string>>;

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", goal: "" });
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (form.name.trim().length < 2) next.name = "Tell us your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) next.email = "Enter a valid email.";
    if (form.goal.trim().length < 10) next.goal = "A sentence or two about your goal helps.";
    setErrors(next);
    if (Object.keys(next).length === 0) setSent(true);
  };

  const field = "mt-2 w-full border border-border bg-charcoal px-4 py-3 text-sm text-bone outline-none focus:border-teal-bright";

  return (
    <SiteShell>
      <PageHead
        eyebrow="Contact"
        title={
          <>
            Let&apos;s start.
            <br />
            <span className="text-teal-bright">Today.</span>
          </>
        }
        aside={
          <p>
            Training in Grenada, at home, hybrid or fully online. Send your goal and we&apos;ll come
            back with the right starting point.
          </p>
        }
        image={coach}
        imageAlt="Coach guiding a training session"
      />

      <section className="grid gap-12 px-5 py-14 sm:py-20 md:grid-cols-2 md:gap-16 md:px-8 md:py-28">
        <div>
          <h2 className="display text-5xl md:text-6xl">Direct lines.</h2>
          <ul className="mt-10 space-y-8">
            <li className="border-t border-border pt-6">
              <p className="label-xs text-teal-bright">Phone</p>
              <a
                href="tel:+14734157089"
                className="display mt-3 block text-3xl hover:text-teal-bright"
              >
                +1 473 415 7089
              </a>
            </li>
            <li className="border-t border-border pt-6">
              <p className="label-xs text-teal-bright">Email</p>
              <a
                href="mailto:365fitnessgnd@gmail.com"
                className="mt-3 block text-lg text-bone hover:text-teal-bright"
              >
                365fitnessgnd@gmail.com
              </a>
            </li>
            <li className="border-t border-border pt-6">
              <p className="label-xs text-teal-bright">Instagram</p>
              <a
                href="https://www.instagram.com/365fitnessgnd/"
                target="_blank"
                rel="noreferrer"
                className="mt-3 block text-lg text-bone hover:text-teal-bright"
              >
                @365fitnessgnd
              </a>
            </li>
          </ul>
        </div>

        <div className="border border-border bg-charcoal p-6 md:p-10">
          <h2 className="display text-4xl">Send your goal.</h2>
          {sent ? (
            <p className="mt-8 text-sm leading-relaxed text-bone-dim">
              Thanks {form.name.trim()} — your details are ready to send. Reach out directly by
              phone, email or Instagram and we&apos;ll get you started right away.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-8 space-y-6" noValidate>
              <div>
                <label className="label-xs text-bone-dim" htmlFor="name">
                  Name
                </label>
                <input id="name" className={field} value={form.name} onChange={set("name")} />
                {errors.name && <p className="mt-2 text-xs text-teal-bright">{errors.name}</p>}
              </div>
              <div>
                <label className="label-xs text-bone-dim" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className={field}
                  value={form.email}
                  onChange={set("email")}
                />
                {errors.email && <p className="mt-2 text-xs text-teal-bright">{errors.email}</p>}
              </div>
              <div>
                <label className="label-xs text-bone-dim" htmlFor="phone">
                  Phone (optional)
                </label>
                <input id="phone" className={field} value={form.phone} onChange={set("phone")} />
              </div>
              <div>
                <label className="label-xs text-bone-dim" htmlFor="goal">
                  Your goal
                </label>
                <textarea
                  id="goal"
                  rows={4}
                  className={field}
                  value={form.goal}
                  onChange={set("goal")}
                />
                {errors.goal && <p className="mt-2 text-xs text-teal-bright">{errors.goal}</p>}
              </div>
              <Btn type="submit" size="lg">
                Send
              </Btn>
            </form>
          )}
        </div>
      </section>
    </SiteShell>
  );
}
