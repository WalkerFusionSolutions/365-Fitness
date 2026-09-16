import Link from "next/link";
import { PhpIcon, PhpReferenceShell, phpAsset, programCards } from "@/components/marketing/PhpReferenceSite";

export default function ProgramsPage() {
  return (
    <PhpReferenceShell>
      <div className="php-container">
        <div className="php-content-section">
          <h1 className="php-section-title">TRAINING <span>PROGRAMS</span></h1>
          <p className="php-subtitle">Choose the structure that fits your life, then follow the plan.</p>

          <div className="php-grid php-grid-2 php-align-center php-mb">
            <div className="php-card"><img src={phpAsset("group-train.png")} alt="Group training at 365 Fitness" className="php-card-img php-card-img-tall" /></div>
            <div>
              <h2 className="php-heading-teal">Experience the Power of Structured Coaching</h2>
              <p>Programs can support gym training, at-home work, hybrid weeks, and online coaching. The goal stays the same: your goals, my plan, your results.</p>
              <h4>Why Choose a Program?</h4>
              <ul className="php-muted-list">
                <li>Clear weekly structure.</li>
                <li>Training that adapts to your environment.</li>
                <li>Accountability without guesswork.</li>
              </ul>
            </div>
          </div>

          <div className="php-grid php-grid-3 php-mb">
            {programCards.map((program) => (
              <div className="php-card php-center" key={program.title}>
                <div className="php-card-body">
                  <PhpIcon>365</PhpIcon>
                  <h4 className="php-heading-teal">{program.title}</h4>
                  <p>{program.body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="php-content-section php-cta-card php-center">
            <h3 className="php-heading-teal">Ready to Start a Program?</h3>
            <p>No fake schedules or prices were imported from the PHP reference. Contact 365 Fitness to choose the right structure.</p>
            <Link href="/contact" className="php-btn php-btn-primary">Contact for Program Info</Link>
          </div>
        </div>
      </div>
    </PhpReferenceShell>
  );
}
