import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "solid" | "outline" | "ghost";
type Size = "md" | "lg";

const variants: Record<Variant, string> = {
  solid: "bg-teal text-bone hover:bg-teal-bright",
  outline: "border border-bone/35 text-bone hover:border-teal-bright hover:bg-teal-bright/10",
  ghost: "text-bone-dim hover:text-bone",
};

const sizes: Record<Size, string> = {
  md: "h-11 px-6",
  lg: "h-14 px-8 text-xs",
};

export function siteButtonClass(variant: Variant = "solid", size: Size = "md", className = "") {
  return `group inline-flex shrink-0 whitespace-nowrap items-center justify-center gap-3 rounded-sm label-xs transition-[background-color,color,border-color,transform] duration-300 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${sizes[size]} ${className}`;
}

export function SiteButton({
  variant = "solid",
  size = "md",
  className,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size; children: ReactNode }) {
  return (
    <button className={siteButtonClass(variant, size, className)} {...rest}>
      {children}
    </button>
  );
}

export function SiteButtonLink({
  href,
  variant = "solid",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={siteButtonClass(variant, size, className)}>
      {children}
      <span aria-hidden className="inline-block transition-transform duration-300 group-hover:translate-x-1">
        →
      </span>
    </Link>
  );
}
