import Image from "next/image";
import Link from "next/link";
import { LoginForm } from "@/components/dashboard/LoginForm";
import { InquiryForm } from "@/components/marketing/InquiryForm";
import {
  PhpCallout,
  PhpIcon,
  PhpPageTitle,
  PhpReferenceShell,
  phpAsset,
  programCards,
  serviceCards,
  verifiedServices,
} from "@/components/marketing/PhpReferenceSite";

export function PhpHomePage() {
  return (
    <PhpReferenceShell>
      <section className="php-hero-section">
        <div className="php-container php-hero-content">
          <p className="php-gym-name">365 FITNESS</p>
          <p className="php-hero-badge">Elite performance</p>
          <h1 className="php-hero-title">Your Goals.<span> My Mission.</span></h1>
          <div className="php-text-panel">
            <p className="php-lead">
              <strong className="php-highlight">365 Fitness</strong> brings personalized training,
              practical nutrition support, and connected coaching into one focused plan.
            </p>
          </div>
          <div className="php-button-row">
            <Link className="php-btn php-btn-primary" href="/contact">Start your journey</Link>
            <Link className="php-btn php-btn-outline" href="/about">Discover 365 Fitness</Link>
          </div>
          <div className="php-mini-banner">
            <h2>TRAIN SMART. EAT RIGHT. LIVE STRONG.</h2>
            <p>In-person, hybrid, at-home, and online coaching from 365 Fitness.</p>
          </div>
        </div>
      </section>

      <section className="php-container php-content-section">
        <h2 className="php-section-title">OUR <span>SERVICES</span></h2>
        <div className="php-grid php-grid-3">
          {serviceCards.map((service) => (
            <article className="php-card" key={service.title}>
              <Image className="php-card-img" src={phpAsset(service.image)} alt={service.title} width={720} height={520} />
              <div className="php-card-body php-center">
                <h3>{service.title}</h3>
                <p>{service.body}</p>
                <Link className="php-inline-link" href={service.href}>Learn more</Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="php-container php-content-section php-center">
        <PhpIcon>365</PhpIcon>
        <h2 className="php-heading-teal">Personalized Training. Total Transformation.</h2>
        <p className="php-callout-copy">Your training, nutrition, progress, messages, and appointments stay connected to the same coaching relationship.</p>
        <Link className="php-btn php-btn-outline" href="/online-coaching">Explore connected coaching</Link>
      </section>
    </PhpReferenceShell>
  );
}

export function PhpAboutPage() {
  return (
    <PhpReferenceShell>
      <PhpPageTitle title="ABOUT" accent="365 FITNESS" subtitle="Your goals. My plan. Your results." />
      <section className="php-container php-content-section">
        <div className="php-grid php-grid-2 php-align-center">
          <div className="php-card"><Image className="php-card-img php-card-img-tall" src={phpAsset("placeholder-2.jpg")} alt="365 Fitness training" width={720} height={900} /></div>
          <div className="php-prose">
            <h2 className="php-heading-teal">A complete coaching approach</h2>
            <p>365 Fitness connects purposeful training, realistic nutrition guidance, and direct accountability around the person doing the work.</p>
            <p>Every plan begins with your goals, current ability, training environment, and schedule. The format can move between in-person, at-home, hybrid, and online coaching without losing direction.</p>
          </div>
        </div>
      </section>
      <section className="php-container php-content-section">
        <h2 className="php-section-title">THE 365 <span>APPROACH</span></h2>
        <div className="php-grid php-grid-3">
          <PhpTextCard icon="01" title="Assess honestly" body="Start with your current routine, experience, and the goal that matters to you." />
          <PhpTextCard icon="02" title="Build deliberately" body="Align training, nutrition guidance, and accountability around one plan." />
          <PhpTextCard icon="03" title="Review the work" body="Use real sessions, coach-recorded measurements, and progress to adjust." />
        </div>
      </section>
      <PhpCallout title="YOUR GOALS. MY MISSION." body="Start with a direct conversation about the coaching structure that fits your life." />
    </PhpReferenceShell>
  );
}

export function PhpServicesPage() {
  return (
    <PhpReferenceShell>
      <PhpPageTitle title="OUR" accent="SERVICES" subtitle="Training, recovery support, and practical nutrition guidance under one plan." />
      <section className="php-container php-content-section php-service-stack">
        {serviceCards.map((service, index) => (
          <article className="php-service-row" data-reverse={index % 2 === 1} key={service.title}>
            <div className="php-card"><Image className="php-card-img" src={phpAsset(service.image)} alt={service.title} width={720} height={520} /></div>
            <div className="php-prose">
              <h2 className="php-heading-teal">{service.title}</h2>
              <p>{service.body}</p>
              <ul className="php-muted-list">{service.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}</ul>
              <Link className="php-btn php-btn-primary" href="/contact">Ask about this service</Link>
            </div>
          </article>
        ))}
      </section>
      <section className="php-container php-content-section">
        <h2 className="php-section-title">MORE WAYS TO <span>TRAIN</span></h2>
        <div className="php-service-list">{verifiedServices.map((service) => <span key={service}>{service}</span>)}</div>
      </section>
      <PhpCallout title="NO EXCUSES. JUST RESULTS." body="Choose the service mix that supports your goal and the way you can train consistently." />
    </PhpReferenceShell>
  );
}

export function PhpProgramsPage() {
  return (
    <PhpReferenceShell>
      <PhpPageTitle title="TRAINING" accent="PROGRAMS" subtitle="Flexible formats with clear direction and real coach accountability." />
      <section className="php-container php-content-section">
        <div className="php-grid php-grid-3">
          {programCards.map((program, index) => (
            <article className="php-card" key={program.title}>
              <Image className="php-card-img" src={phpAsset(["personal.jpg", "group-training.jpg", "placeholder-1.jpg"][index])} alt={program.title} width={720} height={520} />
              <div className="php-card-body"><PhpIcon>0{index + 1}</PhpIcon><h2>{program.title}</h2><p>{program.body}</p></div>
            </article>
          ))}
        </div>
      </section>
      <section className="php-container php-content-section php-center">
        <h2 className="php-heading-teal">A program should fit real life.</h2>
        <p className="php-callout-copy">Personal, athletic, and strength training can be delivered through the format that keeps your week workable.</p>
        <Link className="php-btn php-btn-outline" href="/contact">Discuss your program</Link>
      </section>
    </PhpReferenceShell>
  );
}

export function PhpNutritionPage() {
  return (
    <PhpReferenceShell>
      <PhpPageTitle title="NUTRITION" accent="SUPPORT" subtitle="Healthy meal guides and practical direction connected to your training goals." />
      <section className="php-container php-content-section">
        <div className="php-grid php-grid-2 php-align-center">
          <div className="php-card"><Image className="php-card-img php-card-img-tall" src={phpAsset("meal-plan2.png")} alt="Healthy meal preparation" width={720} height={900} /></div>
          <div className="php-prose">
            <h2 className="php-heading-teal">Fuel the work you are doing</h2>
            <p>Nutrition guidance should be practical enough to follow and specific enough to support the goal behind your training.</p>
            <ul className="php-muted-list"><li>Healthy meal guides</li><li>Personalized detox plans</li><li>Goal-based nutrition direction</li><li>Sustainable daily habits</li></ul>
            <Link className="php-btn php-btn-primary" href="/contact">Ask about nutrition</Link>
          </div>
        </div>
      </section>
      <section className="php-container php-content-section">
        <div className="php-grid php-grid-4">
          <PhpTextCard icon="01" title="Understand" body="Begin with your goal, routine, preferences, and training demand." />
          <PhpTextCard icon="02" title="Plan" body="Build clear food guidance that works inside your actual week." />
          <PhpTextCard icon="03" title="Follow" body="Use the assigned meal guidance consistently alongside training." />
          <PhpTextCard icon="04" title="Adjust" body="Review progress and refine the direction with your coach." />
        </div>
      </section>
      <PhpCallout title="TRAIN SMART. EAT RIGHT. LIVE STRONG." body="Make food choices part of the same plan as your training." />
    </PhpReferenceShell>
  );
}

export function PhpOnlineCoachingPage() {
  const steps = ["Assigned workouts", "Nutrition guidance", "Progress records", "Private messaging", "Video feedback", "Appointments and check-ins"];
  return (
    <PhpReferenceShell>
      <PhpPageTitle title="ONLINE" accent="COACHING" subtitle="A connected coaching relationship wherever you train." />
      <section className="php-container php-content-section">
        <div className="php-grid php-grid-2 php-align-center">
          <div className="php-prose"><h2 className="php-heading-teal">Your plan stays with you</h2><p>Online coaching keeps your assigned work, feedback, progress, and schedule in one real workflow instead of a collection of disconnected messages.</p><Link className="php-btn php-btn-primary" href="/contact">Ask about online coaching</Link></div>
          <div className="php-card"><Image className="php-card-img" src={phpAsset("personal.jpg")} alt="365 Fitness coaching" width={720} height={520} /></div>
        </div>
      </section>
      <section className="php-container php-content-section"><h2 className="php-section-title">CONNECTED <span>COACHING</span></h2><div className="php-grid php-grid-3">{steps.map((step, index) => <PhpTextCard key={step} icon={String(index + 1).padStart(2, "0")} title={step} body="Part of the existing private 365 Fitness coaching workflow." />)}</div></section>
      <PhpCallout title="YOUR GOALS. MY PLAN. YOUR RESULTS." body="Stay accountable to one plan wherever your training happens." />
    </PhpReferenceShell>
  );
}

export function PhpTransformationsPage() {
  return (
    <PhpReferenceShell>
      <PhpPageTitle title="REAL" accent="PROGRESS" subtitle="Honest records, consistent work, and results that belong to the client." />
      <section className="php-container php-content-section">
        <div className="php-grid php-grid-3">
          <PhpTextCard icon="01" title="Coach-recorded measurements" body="Chronological measurements show change without turning one number into the whole story." />
          <PhpTextCard icon="02" title="Goal progress" body="A clear target keeps training and nutrition moving in the same direction." />
          <PhpTextCard icon="03" title="Private progress photos" body="Progress photos remain inside the authorized coaching workflow." />
        </div>
      </section>
      <section className="php-container php-content-section php-quote-panel"><p>NO EXCUSES. JUST RESULTS.</p><span>Consistent work, honestly tracked.</span></section>
      <PhpCallout title="START WITH THE PLAN." body="No invented testimonials or transformation claims. Your progress is personal and yours to share." />
    </PhpReferenceShell>
  );
}

export function PhpGalleryPage() {
  const images = [
    ["personal-train.png", "Personal training"], ["group-train.png", "Athletic training"],
    ["meal-plan2.png", "Healthy meal preparation"], ["personal.jpg", "Strength training"],
    ["placeholder-1.jpg", "365 Fitness training"], ["placeholder-2.jpg", "Coaching environment"],
  ] as const;
  return (
    <PhpReferenceShell>
      <PhpPageTitle title="365 FITNESS" accent="GALLERY" subtitle="Training, coaching, and nutrition through the visual language of the original site." />
      <section className="php-container php-content-section"><div className="php-gallery">{images.map(([src, alt], index) => <figure className={index === 0 || index === 3 ? "php-gallery-wide" : undefined} key={src}><Image src={phpAsset(src)} alt={alt} fill sizes="(max-width: 820px) 100vw, 50vw" /><figcaption>{alt}</figcaption></figure>)}</div></section>
    </PhpReferenceShell>
  );
}

export function PhpContactPage() {
  return (
    <PhpReferenceShell>
      <PhpPageTitle title="CONTACT" accent="365 FITNESS" subtitle="Tell us what you want to achieve and the kind of support you need." />
      <section className="php-container php-content-section php-contact-grid">
        <div className="php-prose"><h2 className="php-heading-teal">Start a direct conversation</h2><p>No invented address, hours, or pricing. Reach 365 Fitness through the verified contact channels below.</p><dl className="php-contact-list"><div><dt>Phone</dt><dd><a href="tel:+14734157089">+1 473 415 7089</a></dd></div><div><dt>Email</dt><dd><a href="mailto:365fitnessgnd@gmail.com">365fitnessgnd@gmail.com</a></dd></div><div><dt>Instagram</dt><dd><a href="https://www.instagram.com/365fitnessgnd/" target="_blank" rel="noreferrer">@365fitnessgnd</a></dd></div></dl></div>
        <div className="php-card php-card-body php-form-shell"><h2>Start your consultation</h2><p>Share enough context for 365 Fitness to understand what you need.</p><InquiryForm /></div>
      </section>
    </PhpReferenceShell>
  );
}

export function PhpLoginPage() {
  return (
    <PhpReferenceShell>
      <section className="php-container php-login-page">
        <div className="php-content-section php-login-grid">
          <div className="php-prose"><p className="php-hero-badge">Member access</p><h1 className="php-login-title">YOUR PLAN IS READY.</h1><p>Sign in to continue to the real 365 Fitness coaching workspace.</p></div>
          <div className="php-card php-card-body php-login-shell"><h2>Welcome back</h2><p>Use your existing 365 Fitness account.</p><LoginForm /></div>
        </div>
      </section>
    </PhpReferenceShell>
  );
}

function PhpTextCard({ body, icon, title }: { body: string; icon: string; title: string }) {
  return <article className="php-card php-card-body php-center"><PhpIcon>{icon}</PhpIcon><h3>{title}</h3><p>{body}</p></article>;
}
