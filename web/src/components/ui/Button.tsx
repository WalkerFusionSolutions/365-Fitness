import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  href?: string;
  children: ReactNode;
};

const variants = {
  primary: "bg-teal text-bone hover:bg-teal-bright",
  secondary: "border border-bone/35 text-bone hover:border-teal-bright hover:bg-teal-bright/10",
  ghost: "text-bone-dim hover:text-bone",
  danger: "bg-danger text-white hover:opacity-90",
};

export function Button({ variant = "primary", href, className = "", children, ...props }: ButtonProps) {
  const base = `label-xs inline-flex min-h-11 items-center justify-center rounded-sm px-6 py-2 transition-[background-color,color,border-color,transform] duration-300 active:translate-y-px disabled:pointer-events-none disabled:opacity-50 ${variants[variant]} ${className}`;

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
