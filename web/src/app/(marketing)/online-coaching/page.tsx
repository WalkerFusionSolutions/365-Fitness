import Link from "next/link";
import { PhpIcon, PhpReferenceShell, phpAsset } from "@/components/marketing/PhpReferenceSite";

const features = [
  ["Training Plan", "Your week is mapped with clear exercises and progression."],
  ["Nutrition Support", "Meal guidance stays aligned with your training goal."],
  ["Messaging", "Use the real 365 Fitness system for coach/client communication."],
  ["Progress Tracking", "Measurements, goals, and photos stay connected to the backend."],
];

export default function OnlineCoachingPage() {
  return (
    <PhpReferenceShell>
      <div className="php-container">
        <div className="php-content-section">
          <h1 className="php-section-title">ONLINE <span>COACHING</span></h1>
          <p className="php-subtitle">Train anywhere. Stay connected.</p>

          <div className="php-grid php-grid-2 php-align-center php-mb">
            <div>
              <h2 className="php-heading-teal">365 Fitness Beyond the Gym</h2>
              <p>Online coaching brings the plan, communication, and progress tracking into the real 365 Fitness app experience. The PHP visual style is preserved, but the backend remains Supabase.</p>
              <div className="php-button-row" style={{ justifyContent: "flex-start" }}>
                <Link href="/contact" className="php-btn php-btn-primary">Ask About Online Coaching</Link>
                <Link href="/login" className="php-btn php-btn-outline">Client Login</Link>
              </div>
            </div>
            <div className="php-card"><img src={phpAsset("personal.jpg")} alt="Online coaching support" className="php-card-img php-card-img-tall" /></div>
          </div>

          <div className="php-grid php-grid-4">
            {features.map(([title, body]) => (
              <div className="php-card php-center" key={title}>
                <div className="php-card-body">
                  <PhpIcon>APP</PhpIcon>
                  <h5>{title}</h5>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PhpReferenceShell>
  );
}
