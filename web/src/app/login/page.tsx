import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { LoginForm } from "@/components/dashboard/LoginForm";
import { assets } from "@/components/marketing/LovableAssets";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { SiteButtonLink } from "@/components/marketing/SiteButton";
import { getSessionProfile } from "@/lib/data";

export const metadata: Metadata = {
  title: "Client Login — 365 Fitness",
  description: "Client login for 365 Fitness. Access your programme, nutrition plan, progress tracking and coach messages.",
  robots: {
    index: false,
  },
};

export default async function LoginPage() {
  const { user, profile, missingEnv } = await getSessionProfile();

  if (user && profile?.role === "coach") {
    redirect("/dashboard");
  }

  return (
    <MarketingShell>
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

            {missingEnv ? (
              <p className="mt-8 border-l-2 border-teal p-4 text-sm font-semibold text-bone-dim">
                Web Supabase variables are not configured yet.
              </p>
            ) : null}

            <LoginForm />

            <p className="mt-8 text-sm text-bone-dim">
              Not a client yet?{" "}
              <span className="inline-block align-middle">
                <SiteButtonLink href="/contact" variant="ghost">
                  Apply
                </SiteButtonLink>
              </span>
            </p>
          </div>
        </div>

        <div className="img-zoom relative hidden md:block">
          <img src={assets.coach} alt="" className="h-full w-full object-cover" loading="lazy" />
          <div className="grain-fade pointer-events-none absolute inset-0" />
        </div>
      </section>
    </MarketingShell>
  );
}
