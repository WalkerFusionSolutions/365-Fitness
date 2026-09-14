import fs from "node:fs";
import path from "node:path";

export const brand = {
  name: "365 Fitness",
  instagramHandle: "@365fitnessgnd",
  instagramUrl: "https://www.instagram.com/365fitnessgnd/",
  reelUrl: "https://www.instagram.com/reel/DT0oxgMkZcv/",
  phone: "+1 473 415 7089",
  phoneHref: "tel:+14734157089",
  email: "365fitnessgnd@gmail.com",
  emailHref: "mailto:365fitnessgnd@gmail.com",
  slogans: {
    primary: "YOUR GOALS. MY MISSION.",
    transformation: "Personalized Training. Total Transformation.",
    results: "NO EXCUSES. JUST RESULTS.",
    lifestyle: "TRAIN SMART. EAT RIGHT. LIVE STRONG.",
    plan: "YOUR GOALS. MY PLAN. YOUR RESULTS.",
    nutrition: "FUEL YOUR BODY RIGHT",
  },
};

const expectedAssetNames = [
  "365-logo.png",
  "services-poster.png",
  "services-instagram.png",
  "nutrition-poster.png",
  "meal-plan-home-training.png",
] as const;

export type BrandAssetName = (typeof expectedAssetNames)[number];

export function getBrandAssets() {
  const brandDir = path.join(process.cwd(), "public", "brand");

  return expectedAssetNames.reduce<Record<BrandAssetName, string | null>>((assets, name) => {
    const filePath = path.join(brandDir, name);
    assets[name] = fs.existsSync(filePath) ? `/brand/${name}` : null;
    return assets;
  }, {} as Record<BrandAssetName, string | null>);
}
