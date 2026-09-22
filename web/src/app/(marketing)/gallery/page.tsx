import Image from "next/image";
import { MarketingPageHero, MarketingShell } from "@/components/marketing/MarketingShell";
import { assets } from "@/components/marketing/LovableAssets";
import { PhpGalleryPage } from "@/components/marketing/php/PhpMarketingPages";
import { getMarketingVariant } from "@/lib/marketingVariant";

const images=[[assets.coach,"Personal coaching"],[assets.strength,"Strength training"],[assets.athletic,"Athletic training"],[assets.nutrition,"Nutrition guidance"],[assets.recovery,"Recovery work"],[assets.atHome,"At-home training"],[assets.online,"Online coaching"]] as const;
export default function GalleryPage(){if(getMarketingVariant()==="php")return <PhpGalleryPage/>;return <MarketingShell><MarketingPageHero image={assets.community} title="The work, up close." intro="Training, coaching, nutrition, and recovery across the 365 Fitness experience." /><section className="marketing-frame marketing-gallery">{images.map(([src,alt],index)=><figure key={src} className={index===0||index===5?"wide":""}><Image src={src} alt={alt} fill sizes="(max-width: 700px) 100vw, 50vw" /><figcaption>{alt}</figcaption></figure>)}</section></MarketingShell>}
