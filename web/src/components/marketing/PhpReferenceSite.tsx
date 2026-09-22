import type { ReactNode } from "react";
import { PhpReferenceNav } from "./PhpReferenceNav";

export const phpAsset = (name: string) => `/php-reference/${name}`;

export function PhpReferenceShell({ children }: { children: ReactNode }) {
  return (
    <div className="php-site">
      <PhpReferenceNav />
      <main className="php-main">{children}</main>
      <footer className="php-footer">
        <div className="php-container php-footer-grid">
          <div>
            <h5>365-FITNESS</h5>
            <p>Personalized Training. Total Transformation.</p>
            <a href="https://www.instagram.com/365fitnessgnd/" target="_blank" rel="noreferrer">
              Follow us on Instagram
            </a>
          </div>
          <div className="php-footer-right">
            <p>Contact: 365fitnessgnd@gmail.com | +1 473 415 7089</p>
            <p>Your Goals. My Mission.</p>
            <p>(c) {new Date().getFullYear()} 365-Fitness. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function PhpPageTitle({ title, accent, subtitle }: { title: string; accent: string; subtitle: string }) {
  return (
    <div className="php-container">
      <div className="php-content-section">
        <h1 className="php-section-title">
          {title} <span>{accent}</span>
        </h1>
        <p className="php-subtitle">{subtitle}</p>
      </div>
    </div>
  );
}

export function PhpIcon({ children }: { children: ReactNode }) {
  return <div className="php-icon" aria-hidden="true">{children}</div>;
}

export function PhpCallout({
  body,
  title,
}: {
  body: string;
  title: string;
}) {
  return (
    <section className="php-container php-mb">
      <div className="php-content-section php-cta-card php-center">
        <h2 className="php-heading-teal">{title}</h2>
        <p className="php-callout-copy">{body}</p>
        <a className="php-btn php-btn-primary" href="/contact">Start your plan</a>
      </div>
    </section>
  );
}

export const verifiedServices = [
  "Personal Training",
  "Athletic Training",
  "Strength Training",
  "Rehabilitation Training",
  "Assisted Stretching",
  "Cupping Therapy",
  "Personalized Detox Plans",
  "Healthy Meal Guides",
  "At-Home Training",
  "Hybrid Programs",
  "Online Coaching",
];

export const serviceCards = [
  {
    title: "Personal Training",
    image: "personal-train.png",
    href: "/services",
    body: "One-on-one coaching built around your goals, fitness level, schedule, and transformation plan.",
    bullets: ["Personalized coaching", "Strength and conditioning", "Accountability and progress tracking"],
  },
  {
    title: "Athletic & Strength Training",
    image: "group-train.png",
    href: "/programs",
    body: "Purposeful strength, conditioning, and movement work designed around performance goals.",
    bullets: ["Athletic development", "Strength programming", "Smart progressions"],
  },
  {
    title: "Meal Plans & Nutrition",
    image: "meal-plan.png",
    href: "/nutrition",
    body: "Practical nutrition support, healthy meal guides, and personalized plans that pair with training.",
    bullets: ["Goal-based guidance", "Healthy meal guides", "Sustainable habits"],
  },
];

export const programCards = [
  {
    title: "At-Home Training",
    body: "Structured coaching for clients who want to train outside the gym while staying accountable.",
  },
  {
    title: "Hybrid Programs",
    body: "A flexible blend of in-person training, app-based direction, and check-ins.",
  },
  {
    title: "Online Coaching",
    body: "Remote coaching for clients who need expert programming and support wherever they train.",
  },
];
