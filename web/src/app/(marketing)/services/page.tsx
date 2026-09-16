import Link from "next/link";
import { PhpIcon, PhpReferenceShell, phpAsset, serviceCards, verifiedServices } from "@/components/marketing/PhpReferenceSite";

export default function ServicesPage() {
  return (
    <PhpReferenceShell>
      <div className="php-container">
        <div className="php-content-section">
          <h1 className="php-section-title">OUR <span>SERVICES</span></h1>
          <p className="php-subtitle">Your goals. My mission. Personalized training and total transformation.</p>

          {serviceCards.map((service, index) => (
            <div className="php-grid php-grid-2 php-align-center php-mb" key={service.title}>
              <div className={`php-card ${index % 2 ? "md:order-2" : ""}`}>
                <img src={phpAsset(service.image)} alt={service.title} className="php-card-img" />
              </div>
              <div>
                <h2 className="php-heading-teal">{service.title}</h2>
                <p>{service.body}</p>
                <ul className="php-muted-list">
                  {service.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
                </ul>
                <div className="php-button-row" style={{ justifyContent: "flex-start" }}>
                  <Link href={service.href} className="php-btn php-btn-primary">Learn More</Link>
                  <Link href="/contact" className="php-btn php-btn-outline">Book Session</Link>
                </div>
              </div>
            </div>
          ))}

          <h2 className="php-heading-teal php-center">Choose Your Fitness Journey</h2>
          <div className="php-grid php-grid-3">
            {verifiedServices.map((service) => (
              <div className="php-card php-center" key={service}>
                <div className="php-card-body">
                  <PhpIcon>FIT</PhpIcon>
                  <h5>{service}</h5>
                  <p>Available through 365 Fitness coaching, consultation, and programming.</p>
                </div>
              </div>
            ))}
          </div>

          <div className="php-content-section php-cta-card php-center">
            <h3 className="php-heading-teal">Ready to Transform?</h3>
            <p>TRAIN SMART. EAT RIGHT. LIVE STRONG.</p>
            <Link href="/contact" className="php-btn php-btn-primary">Start Today</Link>
          </div>
        </div>
      </div>
    </PhpReferenceShell>
  );
}
