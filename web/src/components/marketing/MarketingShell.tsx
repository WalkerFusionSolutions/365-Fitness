"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { assets } from "./LovableAssets";

const links = [
  ["About", "/about"],
  ["Services", "/services"],
  ["Programs", "/programs"],
  ["Nutrition", "/nutrition"],
  ["Online", "/online-coaching"],
  ["Results", "/transformations"],
  ["Gallery", "/gallery"],
  ["Contact", "/contact"],
] as const;

export function MarketingShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const variant = process.env.NEXT_PUBLIC_MARKETING_VARIANT === "php" ? "php" : "lovable";

  return (
    <div className={`marketing-site marketing-${variant}`}>
      <header className="marketing-nav">
        <div className="marketing-frame marketing-nav-inner">
          <Link className="marketing-brand" href="/" onClick={() => setOpen(false)} aria-label="365 Fitness home">
            <Image src={assets.mark} alt="" width={42} height={42} priority />
            <span><strong>365</strong> FITNESS</span>
          </Link>
          <button className="marketing-menu" type="button" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
            {open ? "Close" : "Menu"}
          </button>
          <nav className="marketing-links" data-open={open} aria-label="Primary navigation">
            {links.map(([label, href]) => (
              <Link key={href} href={href} data-active={pathname === href} onClick={() => setOpen(false)}>
                {label}
              </Link>
            ))}
            <Link className="marketing-login" href="/login" onClick={() => setOpen(false)}>Client login</Link>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="marketing-footer">
        <div className="marketing-frame marketing-footer-grid">
          <div>
            <p className="marketing-footer-mark">365 FITNESS</p>
            <p>Personalized Training. Total Transformation.</p>
          </div>
          <div className="marketing-footer-links">
            <a href="tel:+14734157089">+1 473 415 7089</a>
            <a href="mailto:365fitnessgnd@gmail.com">365fitnessgnd@gmail.com</a>
            <a href="https://www.instagram.com/365fitnessgnd/" target="_blank" rel="noreferrer">@365fitnessgnd</a>
          </div>
          <p className="marketing-copyright">© {new Date().getFullYear()} 365 Fitness</p>
        </div>
      </footer>
    </div>
  );
}

export function MarketingPageHero({
  image,
  title,
  intro,
}: {
  image: string;
  title: string;
  intro: string;
}) {
  return (
    <section className="marketing-page-hero">
      <Image src={image} alt="" fill sizes="100vw" priority />
      <div className="marketing-page-shade" />
      <div className="marketing-frame marketing-page-hero-copy">
        <h1>{title}</h1>
        <p>{intro}</p>
      </div>
    </section>
  );
}

export function FinalCallout({ title, body }: { title: string; body: string }) {
  return (
    <section className="marketing-final">
      <div className="marketing-frame marketing-final-inner">
        <div>
          <h2>{title}</h2>
          <p>{body}</p>
        </div>
        <Link className="marketing-button marketing-button-light" href="/contact">Start a conversation</Link>
      </div>
    </section>
  );
}
