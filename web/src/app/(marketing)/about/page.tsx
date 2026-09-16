import Link from "next/link";
import { PhpIcon, PhpReferenceShell, phpAsset } from "@/components/marketing/PhpReferenceSite";

const approach = [
  ["Personalized Workout Plans", "Customized training programs based on your fitness level, body, schedule, and goals."],
  ["Expert Nutritional Guidance", "Healthy meal guides and practical nutrition support built to match the training plan."],
  ["Supportive Environment", "Clear coaching, accountability, and encouragement throughout the process."],
  ["Long-Term Results", "Sustainable progress over quick fixes."],
];

export default function AboutPage() {
  return (
    <PhpReferenceShell>
      <div className="php-container">
        <div className="php-content-section">
          <h1 className="php-section-title">ABOUT <span>365 FITNESS</span></h1>
          <p className="php-subtitle">Your journey to better health, 365 days a year.</p>

          <div className="php-grid php-grid-2 php-align-center php-mb">
            <div>
              <h2 className="php-heading-teal">Our Mission</h2>
              <p>At 365 Fitness, our mission is simple: to help you achieve your fitness and weight-loss goals through personalized training and balanced nutrition. Real results come from consistency, knowledge, and support.</p>
            </div>
            <div className="php-card"><img src={phpAsset("placeholder-1.jpg")} alt="365 Fitness training space" className="php-card-img" /></div>
          </div>

          <div className="php-grid php-grid-2 php-align-center php-mb">
            <div className="php-card"><img src={phpAsset("placeholder-2.jpg")} alt="365 Fitness coach" className="php-card-img" /></div>
            <div>
              <h2 className="php-heading-teal">Meet Victor Williams</h2>
              <p><strong>Victor Williams</strong> is the driving force behind 365 Fitness. The public site keeps the colleague design while using verified 365 Fitness messaging: your goals, my plan, your results.</p>
              <p>Training, nutrition, accountability, and progress all work together so clients can train smart, eat right, and live strong.</p>
            </div>
          </div>

          <h2 className="php-heading-teal php-center">The 365 Fitness Approach</h2>
          <div className="php-grid php-grid-4 php-mb">
            {approach.map(([title, body]) => (
              <div className="php-card php-center" key={title}>
                <div className="php-card-body">
                  <PhpIcon>365</PhpIcon>
                  <h5>{title}</h5>
                  <p>{body}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="php-content-section php-cta-card php-center">
            <h2 className="php-heading-teal">Looking Forward</h2>
            <p>Your goals become our goals. Start with a consultation and build the plan that fits your life.</p>
            <Link href="/contact" className="php-btn php-btn-primary">Schedule Consultation</Link>
          </div>
        </div>
      </div>
    </PhpReferenceShell>
  );
}
