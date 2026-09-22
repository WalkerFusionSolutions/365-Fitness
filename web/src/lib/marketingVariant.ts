export type MarketingVariant = "lovable" | "php";

export function getMarketingVariant(): MarketingVariant {
  return process.env.NEXT_PUBLIC_MARKETING_VARIANT === "php" ? "php" : "lovable";
}
