import { Link } from "@tanstack/react-router";
import mark from "@/assets/mark.png";

const COLS = [
  {
    heading: "Train",
    links: [
      { to: "/services", label: "Services" },
      { to: "/programs", label: "Programs" },
      { to: "/online-coaching", label: "Online Coaching" },
    ],
  },
  {
    heading: "Brand",
    links: [
      { to: "/about", label: "About" },
      { to: "/transformations", label: "Results" },
      { to: "/gallery", label: "Gallery" },
    ],
  },
  {
    heading: "Fuel",
    links: [
      { to: "/nutrition", label: "Nutrition" },
      { to: "/contact", label: "Contact" },
      { to: "/login", label: "Client Login" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-border bg-ink">
      <div className="grid grid-cols-1 gap-12 px-5 py-12 sm:py-16 md:grid-cols-[1.4fr_1fr] md:px-8 md:py-20">
        <div>
          <div className="flex items-center gap-3">
            <img src={mark} alt="" width={28} height={28} loading="lazy" className="h-7 w-7" />
            <span className="display text-xl">365 Fitness</span>
          </div>
          <p className="display mt-8 text-5xl text-bone sm:text-6xl md:text-7xl">
            No excuses.
            <br />
            <span className="text-teal-bright">Just results.</span>
          </p>
          <p className="mt-6 max-w-sm text-sm leading-relaxed text-bone-dim">
            Personal training, nutrition and coaching in Grenada — in person, at home, hybrid or
            fully online.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:justify-items-end">
          {COLS.map((col) => (
            <div key={col.heading}>
              <p className="label-xs text-teal-bright">{col.heading}</p>
              <ul className="mt-5 space-y-3">
                {col.links.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      className="link-underline text-sm text-bone-dim transition-colors hover:text-bone"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 border-t border-border px-5 py-8 md:grid-cols-3 md:items-center md:px-8">
        <a
          href="tel:+14734157089"
          className="display text-2xl text-bone transition-colors hover:text-teal-bright"
        >
          +1 473 415 7089
        </a>
        <a
          href="mailto:365fitnessgnd@gmail.com"
          className="text-sm text-bone-dim transition-colors hover:text-bone md:text-center"
        >
          365fitnessgnd@gmail.com
        </a>
        <a
          href="https://www.instagram.com/365fitnessgnd/"
          target="_blank"
          rel="noreferrer"
          className="label-xs text-bone-dim transition-colors hover:text-bone md:text-right"
        >
          @365fitnessgnd
        </a>
      </div>

      <div className="border-t border-border px-5 py-6 md:px-8">
        <p className="label-xs text-bone-dim/70">
          365 Fitness — Grenada. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
