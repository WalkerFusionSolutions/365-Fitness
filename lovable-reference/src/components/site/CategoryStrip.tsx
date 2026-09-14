import { Link } from "@tanstack/react-router";

const CATEGORIES = [
  { label: "Personal Training", to: "/services" },
  { label: "Strength", to: "/services" },
  { label: "Athletic", to: "/services" },
  { label: "Nutrition", to: "/nutrition" },
  { label: "Hybrid", to: "/programs" },
  { label: "Online", to: "/online-coaching" },
] as const;

export function CategoryStrip() {
  return (
    <div className="border-y border-border bg-charcoal">
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {CATEGORIES.map((c, i) => (
          <li key={c.label} className="border-b border-r border-border last:border-r-0">
            <Link
              to={c.to}
              className="group flex h-24 flex-col justify-between p-4 transition-colors duration-300 hover:bg-teal-deep md:h-28 md:p-5"
            >
              <span className="label-xs text-bone-dim transition-colors group-hover:text-bone">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="display text-xl leading-none md:text-2xl">{c.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
