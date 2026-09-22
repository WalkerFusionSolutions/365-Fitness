import Image from "next/image";
import Link from "next/link";
import { MarketingShell, FinalCallout } from "@/components/marketing/MarketingShell";
import { assets } from "@/components/marketing/LovableAssets";
import { PhpHomePage } from "@/components/marketing/php/PhpMarketingPages";
import { getMarketingVariant } from "@/lib/marketingVariant";

const services = [
  ["Personal training", "One-to-one coaching shaped around your ability, schedule, and goals.", assets.coach, "/services"],
  ["Strength and athletic training", "Structured sessions that develop useful strength, movement quality, and performance.", assets.strength, "/programs"],
  ["Nutrition support", "Healthy meal guides and practical nutrition direction that work with your training.", assets.nutrition, "/nutrition"],
] as const;

const workflow = [
  "Your coach assigns the workout and nutrition plan.",
  "You train and log the work as it happens.",
  "Measurements and progress photos show the real trend.",
  "Messages, video feedback, and appointments keep coaching connected.",
];

export default function HomePage() {
  if (getMarketingVariant() === "php") return <PhpHomePage />;

  return (
    <MarketingShell>
      <section className="marketing-home-hero">
        <Image src={assets.hero} alt="365 Fitness personal training session" fill sizes="100vw" priority />
        <div className="marketing-hero-shade" />
        <div className="marketing-frame marketing-hero-copy">
          <p className="marketing-kicker">Grenada · In person and online</p>
          <h1>365 Fitness</h1>
          <p className="marketing-hero-line">Your goals. My mission.</p>
          <p className="marketing-hero-intro">Personalized training, practical nutrition, and direct coaching built around the work you can sustain.</p>
          <div className="marketing-actions">
            <Link className="marketing-button" href="/contact">Start your plan</Link>
            <Link className="marketing-text-link" href="/services">Explore coaching</Link>
          </div>
        </div>
        <div className="marketing-service-rail" aria-label="Services"><span>Personal</span><span>Athletic</span><span>Strength</span><span>Recovery</span><span>Online</span></div>
      </section>

      <section className="marketing-editorial marketing-frame">
        <div className="marketing-editorial-title"><p className="marketing-kicker">The 365 approach</p><h2>Train with a plan that belongs to you.</h2></div>
        <div className="marketing-editorial-copy"><p>Training should make the next step clear. Your sessions, food guidance, check-ins, and progress all work together instead of living in separate places.</p><Link className="marketing-text-link dark" href="/about">How coaching works</Link></div>
      </section>

      <section className="marketing-service-list">
        {services.map(([title, body, image, href], index) => (
          <article className="marketing-service-row marketing-frame" key={title}>
            <div className="marketing-service-number">0{index + 1}</div>
            <div className="marketing-service-media"><Image src={image} alt="" fill sizes="(max-width: 768px) 100vw, 42vw" /></div>
            <div className="marketing-service-copy"><h3>{title}</h3><p>{body}</p><Link className="marketing-text-link dark" href={href}>Learn more</Link></div>
          </article>
        ))}
      </section>

      <section className="marketing-app-band">
        <div className="marketing-frame marketing-app-grid">
          <div className="marketing-app-image"><Image src={assets.results} alt="Athlete reviewing progress with 365 Fitness" fill sizes="(max-width: 900px) 100vw, 48vw" /></div>
          <div className="marketing-app-copy"><p className="marketing-kicker">Connected coaching</p><h2>Your plan stays with you between sessions.</h2><ol>{workflow.map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}</ol><Link className="marketing-button" href="/online-coaching">See online coaching</Link></div>
        </div>
      </section>

      <FinalCallout title="No excuses. Just results." body="Start with a conversation about your goals, schedule, and the coaching format that fits your life." />
    </MarketingShell>
  );
}
