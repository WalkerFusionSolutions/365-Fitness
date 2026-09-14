import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { SiteShell } from "@/components/site/SiteShell";
import { Btn, BtnLink } from "@/components/site/Btn";
import coach from "@/assets/coach.jpg";

const TITLE = "Client Login — 365 Fitness";
const DESC =
  "Client login for 365 Fitness. Access your programme, nutrition plan, progress tracking and coach messages.";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESC },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setError("Sign-in isn't connected to your client account yet.");
  };

  const field =
    "mt-2 w-full border border-border bg-charcoal px-4 py-3 text-sm text-bone outline-none focus:border-teal-bright";

  return (
    <SiteShell>
      <section className="grid min-h-screen md:grid-cols-2">
        <div className="flex items-center px-5 pt-28 pb-16 md:px-12 md:pt-36">
          <div className="w-full max-w-sm">
            <p className="label-xs text-teal-bright">Client Area</p>
            <h1 className="display mt-5 text-6xl leading-[0.86] md:text-7xl">
              Welcome
              <br />
              back.
            </h1>
            <p className="mt-6 text-sm leading-relaxed text-bone-dim">
              Sign in for your programme, nutrition plan, progress and coach messages.
            </p>

            <form onSubmit={submit} className="mt-10 space-y-6" noValidate>
              <div>
                <label className="label-xs text-bone-dim" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={field}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="label-xs text-bone-dim" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className={field}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && <p className="text-xs text-teal-bright">{error}</p>}
              <Btn type="submit" size="lg" className="w-full">
                Sign in
              </Btn>
            </form>

            <p className="mt-8 text-sm text-bone-dim">
              Not a client yet?{" "}
              <span className="inline-block align-middle">
                <BtnLink to="/contact" variant="ghost">
                  Apply
                </BtnLink>
              </span>
            </p>
          </div>
        </div>

        <div className="img-zoom relative hidden md:block">
          <img src={coach} alt="" className="h-full w-full object-cover" loading="lazy" />
          <div className="grain-fade pointer-events-none absolute inset-0" />
        </div>
      </section>
    </SiteShell>
  );
}
