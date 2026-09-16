import Link from "next/link";
import { PhpIcon, PhpReferenceShell, serviceCards } from "@/components/marketing/PhpReferenceSite";

export default function HomePage() {
  return (
    <PhpReferenceShell>
      <section className="php-hero-section">
        <div className="php-container">
          <div className="php-hero-content">
            <div className="php-gym-name">365 FITNESS</div>
            <div className="php-hero-badge">ELITE PERFORMANCE</div>
            <h1 className="php-hero-title">
              TRANSFORM YOUR <span className="block">BODY &amp; MIND</span>
            </h1>
            <div className="php-text-panel">
              <p className="php-lead">
                At <strong className="php-highlight">365 FITNESS</strong>, we deliver premium personal training, group sessions, and nutrition planning designed for real results.
                Your goals, my mission: personalized training and total transformation.
              </p>
            </div>
            <div className="php-button-row">
              <Link href="/contact" className="php-btn php-btn-primary">START YOUR JOURNEY</Link>
              <Link href="/about" className="php-btn php-btn-outline">MEET VICTOR</Link>
            </div>
            <div className="php-mini-banner">
              <h4 className="php-heading-teal">GRENADA&apos;S PREMIER FITNESS DESTINATION</h4>
              <p>Call +1 473 415 7089 or follow @365fitnessgnd</p>
            </div>
          </div>
        </div>
      </section>

      <section className="php-container">
        <div className="php-content-section">
          <h2 className="php-section-title">ELITE <span>SERVICES</span> AT 365 FITNESS</h2>
          <p className="php-subtitle">Discover the complete fitness experience: train smart, eat right, live strong.</p>
          <div className="php-grid php-grid-3">
            {serviceCards.map((service, index) => (
              <div className="php-card php-center" key={service.title}>
                <div className="php-card-body">
                  <PhpIcon>{["PT", "GR", "N"][index]}</PhpIcon>
                  <h5>{service.title.toUpperCase()}</h5>
                  <p>{service.body}</p>
                  <Link href={service.href} className="php-btn php-btn-primary">GET STARTED</Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="php-container">
        <div className="php-content-section php-center">
          <h3 className="php-heading-teal">WHY CHOOSE 365 FITNESS?</h3>
          <div className="php-grid php-grid-3">
            <div>
              <PhpIcon>365</PhpIcon>
              <h5>PERSONALIZED TRAINING</h5>
              <p>Plans built around your goals, not generic templates.</p>
            </div>
            <div>
              <PhpIcon>FIT</PhpIcon>
              <h5>COACHING AND NUTRITION</h5>
              <p>Training and food habits work together for total transformation.</p>
            </div>
            <div>
              <PhpIcon>GO</PhpIcon>
              <h5>REAL ACCOUNTABILITY</h5>
              <p>Progress, communication, and consistency stay connected through the real 365 system.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="php-container">
        <div className="php-content-section php-cta-card php-center">
          <h3 className="php-heading-teal">READY TO JOIN 365 FITNESS?</h3>
          <p>NO EXCUSES. JUST RESULTS.</p>
          <Link href="/contact" className="php-btn php-btn-primary">GET STARTED AT 365 FITNESS</Link>
        </div>
      </section>
    </PhpReferenceShell>
  );
}
