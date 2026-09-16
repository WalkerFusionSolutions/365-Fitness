import type { ReactNode } from "react";
import { PhpReferenceNav } from "./PhpReferenceNav";

export const phpAsset = (name: string) => `/php-reference/${name}`;

export function PhpReferenceShell({ children }: { children: ReactNode }) {
  return (
    <div className="php-site">
      <PhpReferenceNav />
      {children}
      <footer className="php-footer">
        <div className="php-container php-footer-grid">
          <div>
            <h5>365-FITNESS</h5>
            <p>Elite Training. Exceptional Results.</p>
            <a href="https://www.instagram.com/365fitnessgnd/" target="_blank" rel="noreferrer">
              Follow us on Instagram
            </a>
          </div>
          <div className="php-footer-right">
            <p>Contact: 365fitnessgnd@gmail.com | +1 473 415 7089</p>
            <p>Personalized Training. Total Transformation.</p>
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
    title: "Group Training",
    image: "group-train.png",
    href: "/programs",
    body: "High-energy training in a supportive small-group structure, adapted for the people in the room.",
    bullets: ["Interactive sessions", "Motivating environment", "Smart progressions"],
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
