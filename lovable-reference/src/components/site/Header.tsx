import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import mark from "@/assets/mark.png";

const NAV = [
  { to: "/about", label: "About" },
  { to: "/services", label: "Services" },
  { to: "/programs", label: "Programs" },
  { to: "/nutrition", label: "Nutrition" },
  { to: "/online-coaching", label: "Online" },
  { to: "/transformations", label: "Results" },
  { to: "/gallery", label: "Gallery" },
] as const;

export function Header() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-500",
        scrolled || open ? "bg-ink/95 backdrop-blur-sm" : "bg-transparent",
      )}
    >
      <div
        className={cn(
          "flex h-16 items-center justify-between gap-6 px-5 transition-[border-color] duration-500 md:h-20 md:px-8",
          scrolled ? "border-b border-border" : "border-b border-transparent",
        )}
      >
        <Link to="/" className="flex items-center gap-3" aria-label="365 Fitness home">
          <img src={mark} alt="" width={32} height={32} className="h-7 w-7 md:h-8 md:w-8" />
          <span className="display text-lg leading-none tracking-normal md:text-xl">
            365 Fitness
          </span>
        </Link>

        <nav className="hidden items-center gap-7 lg:flex">
          {NAV.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="link-underline label-xs text-bone-dim transition-colors hover:text-bone"
              data-active={pathname.startsWith(item.to)}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-5 lg:flex">
          <Link to="/login" className="label-xs text-bone-dim transition-colors hover:text-bone">
            Login
          </Link>
          <Link
            to="/contact"
            className="label-xs flex h-10 items-center rounded-sm bg-teal px-5 text-bone transition-colors duration-300 hover:bg-teal-bright"
          >
            Start
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex h-10 w-10 flex-col items-center justify-center gap-[6px] lg:hidden"
        >
          <span
            className={cn(
              "h-[1.5px] w-6 bg-bone transition-transform duration-300",
              open && "translate-y-[3.75px] rotate-45",
            )}
          />
          <span
            className={cn(
              "h-[1.5px] w-6 bg-bone transition-transform duration-300",
              open && "-translate-y-[3.75px] -rotate-45",
            )}
          />
        </button>
      </div>

      <div
        className={cn(
          "overflow-y-auto overscroll-contain border-b border-border bg-ink transition-[max-height,opacity] duration-500 lg:hidden",
          open
            ? "max-h-[calc(100dvh-4rem)] opacity-100"
            : "max-h-0 overflow-hidden opacity-0",
        )}
      >
        <nav className="flex flex-col px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-2">
          {[...NAV, { to: "/contact", label: "Contact" }, { to: "/login", label: "Login" }].map(
            (item) => (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "display flex items-baseline justify-between border-b border-border py-4 text-3xl transition-colors",
                  pathname === item.to ? "text-teal-bright" : "text-bone",
                )}
              >
                {item.label}
              </Link>
            ),
          )}
          <a
            href="tel:+14734157089"
            className="label-xs mt-6 text-bone-dim transition-colors hover:text-bone"
          >
            +1 473 415 7089
          </a>
        </nav>
      </div>
    </header>
  );
}
