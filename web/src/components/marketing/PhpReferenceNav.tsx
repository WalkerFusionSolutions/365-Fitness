"use client";

import Link from "next/link";
import { useState } from "react";

const navItems = [
  { label: "Home", href: "/", icon: "H" },
  { label: "About", href: "/about", icon: "i" },
  { label: "Services", href: "/services", icon: "S" },
  { label: "Contact", href: "/contact", icon: "C" },
  { label: "Instagram", href: "https://www.instagram.com/365fitnessgnd/", icon: "IG", external: true },
  { label: "Login", href: "/login", icon: "IN" },
];

export function PhpReferenceNav() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="php-navbar">
      <div className="php-container php-navbar-inner">
        <Link className="php-logo-link" href="/" onClick={() => setOpen(false)}>
          <img src="/php-reference/logo.png" alt="365 Fitness Logo" className="php-nav-logo" />
          <span className="php-brand">365 FITNESS</span>
        </Link>
        <button className="php-nav-toggle" type="button" aria-label="Toggle navigation" aria-expanded={open} onClick={() => setOpen((value) => !value)}>
          <span />
          <span />
          <span />
        </button>
        <div className="php-nav-links" data-open={open}>
          {navItems.map((item) =>
            item.external ? (
              <a key={item.href} className="php-nav-link" href={item.href} target="_blank" rel="noreferrer">
                <span aria-hidden="true">{item.icon}</span> {item.label}
              </a>
            ) : (
              <Link key={item.href} className="php-nav-link" href={item.href} onClick={() => setOpen(false)}>
                <span aria-hidden="true">{item.icon}</span> {item.label}
              </Link>
            ),
          )}
        </div>
      </div>
    </nav>
  );
}
