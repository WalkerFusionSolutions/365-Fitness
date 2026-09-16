import Link from "next/link";
import { PhpIcon, PhpReferenceShell, phpAsset } from "@/components/marketing/PhpReferenceSite";

const journey = [
  ["Initial Assessment", "Understand your goals, habits, schedule, and training demands."],
  ["Custom Plan Creation", "Build practical food guidance around your transformation target."],
  ["Weekly Updates", "Adjust the plan as your body, schedule, and results change."],
  ["Progress Tracking", "Use measurements, goals, and check-ins to keep nutrition connected to results."],
];

const options = [
  ["Weight Loss", "Balanced nutrition that supports fat loss without crash dieting."],
  ["Muscle Building", "Fuel strength training and recovery with consistent habits."],
  ["Health & Wellness", "Simple, sustainable food choices for energy and long-term health."],
];

export default function NutritionPage() {
  return (
    <PhpReferenceShell>
      <div className="php-container">
        <div className="php-content-section">
          <h1 className="php-section-title">NUTRITION &amp; <span>MEAL PLANS</span></h1>
          <p className="php-subtitle">Fuel your body. Transform your results.</p>

          <div className="php-grid php-grid-2 php-align-center php-mb">
            <div className="php-card"><img src={phpAsset("meal-plan2.png")} alt="Personalized meal planning" className="php-card-img php-card-img-tall" /></div>
            <div>
              <h2 className="php-heading-teal">Personalized Nutrition for Your Goals</h2>
              <p>365 Fitness pairs training with healthy meal guides, practical coaching, and goal-based nutrition support.</p>
              <h4>What Makes Our Meal Plans Different?</h4>
              <ul className="php-muted-list">
                <li>Built around your training and goals.</li>
                <li>Designed for consistency and real life.</li>
                <li>Connected to progress tracking and coaching support.</li>
              </ul>
              <div className="php-button-row" style={{ justifyContent: "flex-start" }}>
                <Link href="/contact" className="php-btn php-btn-primary">Get Your Meal Plan</Link>
                <a href="tel:+14734157089" className="php-btn php-btn-outline">Consult 365 Fitness</a>
              </div>
            </div>
          </div>

          <h2 className="php-heading-teal php-center">Your Nutrition Journey</h2>
          <div className="php-grid php-grid-4 php-mb">
            {journey.map(([title, body]) => (
              <div className="php-card php-center" key={title}>
                <div className="php-card-body">
                  <PhpIcon>N</PhpIcon>
                  <h5>{title}</h5>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="php-card php-mb">
            <div className="php-card-body php-grid php-grid-2 php-align-center">
              <div>
                <h3 className="php-heading-teal">Expert Guidance from 365 Fitness</h3>
                <p>Nutrition is not separate from training. It supports recovery, energy, strength, weight loss, and the consistency needed for transformation.</p>
              </div>
              <div className="php-center">
                <PhpIcon>ISSA</PhpIcon>
                <h5>TRAIN SMART. EAT RIGHT. LIVE STRONG.</h5>
              </div>
            </div>
          </div>

          <h2 className="php-heading-teal php-center">Meal Plan Options</h2>
          <div className="php-grid php-grid-3 php-mb">
            {options.map(([title, body]) => (
              <div className="php-card php-center" key={title}>
                <div className="php-card-body">
                  <PhpIcon>GO</PhpIcon>
                  <h4 className="php-heading-teal">{title}</h4>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="php-content-section php-cta-card php-center">
            <h3 className="php-heading-teal">Ready to Transform Your Nutrition?</h3>
            <p>Package pricing from the PHP demo was not ported. Contact 365 Fitness for the right plan.</p>
            <Link href="/contact" className="php-btn php-btn-primary">Get Your Meal Plan</Link>
          </div>
        </div>
      </div>
    </PhpReferenceShell>
  );
}
