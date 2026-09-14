import Link from "next/link";

const categories = [
  { label: "Personal Training", href: "/services" },
  { label: "Strength", href: "/services" },
  { label: "Athletic", href: "/services" },
  { label: "Nutrition", href: "/nutrition" },
  { label: "Hybrid", href: "/programs" },
  { label: "Online", href: "/online-coaching" },
] as const;

export function CategoryStrip() {
  return (
    <div className="border-y border-border bg-charcoal">
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {categories.map((category, index) => (
          <li key={category.label} className="border-b border-r border-border last:border-r-0">
            <Link
              href={category.href}
              className="group flex h-24 flex-col justify-between p-4 transition-colors duration-300 hover:bg-teal-deep md:h-28 md:p-5"
            >
              <span className="label-xs text-bone-dim transition-colors group-hover:text-bone">
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="display text-xl leading-none md:text-2xl">{category.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
