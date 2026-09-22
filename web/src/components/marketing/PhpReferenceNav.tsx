"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const navItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Programs", href: "/programs" },
  { label: "Nutrition", href: "/nutrition" },
  { label: "Online", href: "/online-coaching" },
  { label: "Results", href: "/transformations" },
  { label: "Gallery", href: "/gallery" },
  { label: "Contact", href: "/contact" },
  { label: "Login", href: "/login" },
] as const;

export function PhpReferenceNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="php-navbar">
      <div className="php-container php-navbar-inner">
        <Link className="php-logo-link" href="/" onClick={() => setOpen(false)}>
          <Image src="/php-reference/logo.png" alt="365 Fitness Logo" className="php-nav-logo" width={38} height={50} />
          <span className="php-brand">365 FITNESS</span>
        </Link>
        <button className="php-nav-toggle" type="button" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          <span />
          <span />
          <span />
        </button>
        <div className="php-nav-links" data-open={open}>
          {navItems.map((item) => (
            <Link
              aria-current={pathname === item.href ? "page" : undefined}
              className="php-nav-link"
              data-active={pathname === item.href}
              href={item.href}
              key={item.href}
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
