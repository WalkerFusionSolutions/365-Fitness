import Image from "next/image";
import Link from "next/link";
import { FinalCallout, MarketingPageHero, MarketingShell } from "@/components/marketing/MarketingShell";
import { assets } from "@/components/marketing/LovableAssets";
import { PhpProgramsPage } from "@/components/marketing/php/PhpMarketingPages";
import { getMarketingVariant } from "@/lib/marketingVariant";

const programs = [["At-home training","A structured plan for the space and equipment you have.",assets.atHome],["Hybrid coaching","In-person direction paired with app-based sessions and check-ins.",assets.community],["Online coaching","Programming, progress tracking, messaging, and video feedback wherever you train.",assets.online]] as const;
export default function ProgramsPage() { if (getMarketingVariant() === "php") return <PhpProgramsPage />; return <MarketingShell><MarketingPageHero image={assets.athletic} title="A program should fit real life." intro="Choose a coaching format that gives your week structure without pretending every week looks the same." /><section className="marketing-frame marketing-programs">{programs.map(([title,body,image],index)=><article key={title} data-reverse={index % 2 === 1}><div className="marketing-program-image"><Image src={image} alt="" fill sizes="(max-width: 768px) 100vw, 50vw" /></div><div><span>0{index+1}</span><h2>{title}</h2><p>{body}</p><ul><li>Clear weekly direction</li><li>Coach review and accountability</li><li>Progress grounded in real records</li></ul><Link className="marketing-text-link dark" href="/contact">Discuss your program</Link></div></article>)}</section><FinalCallout title="Your goals. My plan. Your results." body="Start with the format you can follow consistently." /></MarketingShell>; }
