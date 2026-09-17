import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  href?: string;
  children: ReactNode;
};

const variants = {
  primary: "bg-brand text-white hover:bg-brand-strong",
  secondary: "border border-line bg-card text-foreground hover:border-brand hover:bg-secondary",
  ghost: "text-muted hover:bg-secondary hover:text-foreground",
  danger: "bg-danger text-white hover:opacity-90",
};

export function Button({ variant = "primary", href, className = "", children, ...props }: ButtonProps) {
  const base = `inline-flex min-h-11 items-center justify-center rounded-sm px-5 py-2 text-sm font-bold transition-[background-color,color,border-color,transform] duration-200 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${className}`;

  if (href) {
    return (
      <Link href={href} className={base}>
        {children}
      </Link>
    );
  }

  return (
    <button className={base} {...props}>
      {children}
    </button>
  );
}
