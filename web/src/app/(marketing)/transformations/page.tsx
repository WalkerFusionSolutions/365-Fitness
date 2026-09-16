import Link from "next/link";
import { PhpIcon, PhpReferenceShell } from "@/components/marketing/PhpReferenceSite";

export default function TransformationsPage() {
  return (
    <PhpReferenceShell>
      <div className="php-container">
        <div className="php-content-section">
          <h1 className="php-section-title">REAL <span>PROGRESS</span></h1>
          <p className="php-subtitle">No fake transformations, no invented numbers, no stock claims.</p>

          <div className="php-grid php-grid-3 php-mb">
            {["Measurements", "Goals", "Progress Photos"].map((item) => (
              <div className="php-card php-center" key={item}>
                <div className="php-card-body">
                  <PhpIcon>365</PhpIcon>
                  <h5>{item}</h5>
                  <p>Tracked through the real 365 Fitness system for authenticated clients and coaches.</p>
                </div>
              </div>
            ))}
          </div>

          <div className="php-content-section php-cta-card php-center">
            <h3 className="php-heading-teal">Your Results Start With the Plan</h3>
            <p>Client transformations are shared only with permission. Start with a consultation and build the work.</p>
            <Link href="/contact" className="php-btn php-btn-primary">Start Your Transformation</Link>
          </div>
        </div>
      </div>
    </PhpReferenceShell>
  );
}
