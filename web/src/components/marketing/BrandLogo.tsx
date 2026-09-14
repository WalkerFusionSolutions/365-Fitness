import Image from "next/image";

export function BrandLogo({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-3 ${light ? "text-bone" : "text-ink"}`}>
      <Image src="/lovable/mark.png" alt="" width={compact ? 32 : 36} height={compact ? 32 : 36} className={compact ? "h-7 w-7" : "h-8 w-8"} priority={compact} />
      <span className={`display leading-none tracking-normal ${compact ? "text-lg md:text-xl" : "text-xl"}`}>
        365 Fitness
      </span>
    </span>
  );
}
