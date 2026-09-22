import { InquiryForm } from "@/components/marketing/InquiryForm";
import { MarketingPageHero, MarketingShell } from "@/components/marketing/MarketingShell";
import { assets } from "@/components/marketing/LovableAssets";
import { PhpContactPage } from "@/components/marketing/php/PhpMarketingPages";
import { getMarketingVariant } from "@/lib/marketingVariant";

export default function ContactPage(){if(getMarketingVariant()==="php")return <PhpContactPage/>;return <MarketingShell><MarketingPageHero image={assets.detail} title="Tell us what you are working toward." intro="Start with your goal, your current routine, and the kind of support you need." /><section className="marketing-frame marketing-contact"><div><p className="marketing-kicker">Contact 365 Fitness</p><h2>A direct conversation is the first step.</h2><dl><div><dt>Phone</dt><dd><a href="tel:+14734157089">+1 473 415 7089</a></dd></div><div><dt>Email</dt><dd><a href="mailto:365fitnessgnd@gmail.com">365fitnessgnd@gmail.com</a></dd></div><div><dt>Instagram</dt><dd><a href="https://www.instagram.com/365fitnessgnd/" target="_blank" rel="noreferrer">@365fitnessgnd</a></dd></div></dl></div><div className="marketing-form"><h2>Start your consultation</h2><p>Share enough context for 365 Fitness to understand what you need.</p><InquiryForm /></div></section></MarketingShell>}
