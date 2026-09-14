import type { Metadata } from "next";
import { InquiryForm } from "@/components/marketing/InquiryForm";
import { assets } from "@/components/marketing/LovableAssets";
import { MarketingShell } from "@/components/marketing/MarketingShell";
import { PageHead } from "@/components/marketing/PageHead";
import { brand } from "@/lib/brand";

export const metadata: Metadata = {
  title: "Contact — Start Training | 365 Fitness Grenada",
  description: "Get in touch with 365 Fitness in Grenada. Call +1 473 415 7089, email 365fitnessgnd@gmail.com or send your training goals.",
};

export default function ContactPage() {
  return (
    <MarketingShell>
      <PageHead eyebrow="Contact" title={<>Let&apos;s start.<br /><span className="text-teal-bright">Today.</span></>} aside={<p>Training in Grenada, at home, hybrid or fully online. Send your goal and we&apos;ll come back with the right starting point.</p>} image={assets.coach} imageAlt="Coach guiding a training session" />
        <section className="grid gap-12 px-5 py-14 sm:py-20 md:grid-cols-2 md:gap-16 md:px-8 md:py-28">
          <div>
            <h2 className="display text-5xl md:text-6xl">Direct lines.</h2>
            <ul className="mt-10 space-y-8">
              <li className="border-t border-border pt-6">
                <p className="label-xs text-teal-bright">Phone</p>
                <a href={brand.phoneHref} className="display mt-3 block text-3xl hover:text-teal-bright">{brand.phone}</a>
              </li>
              <li className="border-t border-border pt-6">
                <p className="label-xs text-teal-bright">Email</p>
                <a href={brand.emailHref} className="mt-3 block break-words text-lg text-bone hover:text-teal-bright">{brand.email}</a>
              </li>
              <li className="border-t border-border pt-6">
                <p className="label-xs text-teal-bright">Instagram</p>
                <a href={brand.instagramUrl} target="_blank" rel="noopener noreferrer" className="mt-3 block text-lg text-bone hover:text-teal-bright">{brand.instagramHandle}</a>
              </li>
            </ul>
          </div>
          <div className="border border-border bg-charcoal p-6 md:p-10">
            <h2 className="display text-4xl">Send your goal.</h2>
            <div className="mt-8">
              <InquiryForm />
            </div>
          </div>
        </section>
    </MarketingShell>
  );
}
