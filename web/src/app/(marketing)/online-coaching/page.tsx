import Image from "next/image";
import Link from "next/link";
import { FinalCallout, MarketingPageHero, MarketingShell } from "@/components/marketing/MarketingShell";
import { assets } from "@/components/marketing/LovableAssets";
import { PhpOnlineCoachingPage } from "@/components/marketing/php/PhpMarketingPages";
import { getMarketingVariant } from "@/lib/marketingVariant";

const steps = ["Coach assigns your workout","Train and log performance","Follow assigned nutrition","Track measurements and photos","Message and share private video feedback","Keep appointments and check-ins together"];
export default function OnlineCoachingPage(){if(getMarketingVariant()==="php")return <PhpOnlineCoachingPage/>;return <MarketingShell><MarketingPageHero image={assets.online} title="Coaching that travels with you." intro="Your program, progress, feedback, and appointments remain connected outside the gym." /><section className="marketing-frame marketing-app-detail"><div><p className="marketing-kicker">The real workflow</p><h2>One coaching relationship. One source of truth.</h2><p>No fake dashboards or decorative metrics. The 365 Fitness app supports the work clients and coaches actually do.</p><Link className="marketing-button dark" href="/contact">Ask about online coaching</Link></div><div className="marketing-workflow">{steps.map((step,index)=><div key={step}><span>{String(index+1).padStart(2,"0")}</span><p>{step}</p></div>)}</div></section><section className="marketing-frame marketing-wide-image"><Image src={assets.results} alt="365 Fitness progress coaching" fill sizes="100vw" /></section><FinalCallout title="Stay connected. Keep moving." body="Build a plan you can follow wherever you train." /></MarketingShell>}
