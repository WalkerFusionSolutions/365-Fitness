import { InquiryForm } from "@/components/marketing/InquiryForm";
import { PhpIcon, PhpReferenceShell } from "@/components/marketing/PhpReferenceSite";

export default function ContactPage() {
  return (
    <PhpReferenceShell>
      <div className="php-container">
        <div className="php-content-section">
          <h1 className="php-section-title">CONTACT <span>365 FITNESS</span></h1>
          <p className="php-subtitle">Start your transformation journey today.</p>

          <div className="php-grid php-grid-3 php-mb">
            <div className="php-card php-center">
              <div className="php-card-body">
                <PhpIcon>365</PhpIcon>
                <h4 className="php-heading-teal">Training</h4>
                <p>Personal, athletic, strength, at-home, hybrid, and online coaching.</p>
              </div>
            </div>
            <div className="php-card php-center">
              <div className="php-card-body">
                <PhpIcon>CALL</PhpIcon>
                <h4 className="php-heading-teal">Call 365 Fitness</h4>
                <p><strong>+1 473 415 7089</strong></p>
                <a href="tel:+14734157089" className="php-btn php-btn-primary">Call Now</a>
              </div>
            </div>
            <div className="php-card php-center">
              <div className="php-card-body">
                <PhpIcon>IG</PhpIcon>
                <h4 className="php-heading-teal">Follow Us</h4>
                <p>@365fitnessgnd</p>
                <a href="https://www.instagram.com/365fitnessgnd/" target="_blank" rel="noreferrer" className="php-btn php-btn-outline">Follow</a>
              </div>
            </div>
          </div>

          <div className="php-card php-form-shell">
            <div className="php-card-body">
              <div className="php-center php-mb">
                <h3 className="php-heading-teal">Book Your Consultation</h3>
                <p>Tell 365 Fitness what you want help with. You can also call, email, or message on Instagram.</p>
              </div>
              <InquiryForm />
            </div>
          </div>
        </div>
      </div>
    </PhpReferenceShell>
  );
}
