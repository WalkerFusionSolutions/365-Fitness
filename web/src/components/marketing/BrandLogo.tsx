export function BrandLogo({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className="inline-flex size-9 items-center justify-center rounded-sm bg-teal text-sm font-black text-ink">365</span>
      {!compact ? (
        <span className={`font-display text-2xl font-black uppercase tracking-normal ${light ? "text-bone" : "text-foreground"}`}>
          Fitness
        </span>
      ) : null}
    </span>
  );
}
