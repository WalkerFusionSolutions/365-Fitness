import { useState } from "react";
import { cn } from "@/lib/utils";

export type ServiceItem = {
  n: string;
  name: string;
  copy: string;
  detail: string[];
  image?: string;
};

export type ServiceGroup = {
  heading: string;
  items: ServiceItem[];
};

export function ServiceDirectory({ groups }: { groups: ServiceGroup[] }) {
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div>
      {groups.map((group) => (
        <section key={group.heading} className="border-t border-border">
          <div className="px-5 pt-10 md:px-8">
            <h2 className="label-xs text-teal-bright">{group.heading}</h2>
          </div>

          <ul>
            {group.items.map((item) => {
              const isOpen = open === item.n;
              return (
                <li key={item.n} className="border-b border-border first:border-t first:mt-6">
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : item.n)}
                    aria-expanded={isOpen}
                    className="group flex w-full items-center gap-5 px-5 py-6 text-left transition-colors duration-300 hover:bg-charcoal md:gap-10 md:px-8 md:py-8"
                  >
                    <span className="label-xs w-8 shrink-0 text-bone-dim transition-colors group-hover:text-teal-bright">
                      {item.n}
                    </span>
                    <span className="display flex-1 text-3xl md:text-5xl xl:text-6xl">
                      {item.name}
                    </span>
                    <span className="hidden max-w-xs flex-1 text-sm leading-relaxed text-bone-dim lg:block">
                      {item.copy}
                    </span>
                    {item.image ? (
                      <span className="hidden h-16 w-28 shrink-0 overflow-hidden opacity-0 transition-opacity duration-500 group-hover:opacity-100 xl:block">
                        <img
                          src={item.image}
                          alt=""
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </span>
                    ) : null}
                    <span
                      aria-hidden
                      className={cn(
                        "label-xs shrink-0 text-bone-dim transition-transform duration-300",
                        isOpen && "rotate-45",
                      )}
                    >
                      +
                    </span>
                  </button>

                  <div
                    className={cn(
                      "grid overflow-hidden transition-[max-height,opacity] duration-500",
                      isOpen ? "max-h-[36rem] opacity-100" : "max-h-0 opacity-0",
                    )}
                  >
                    <div className="grid gap-6 px-5 pb-8 md:grid-cols-[1fr_1fr] md:gap-10 md:px-8 md:pl-[4.5rem]">
                      <div>
                        <p className="text-sm leading-relaxed text-bone-dim lg:hidden">
                          {item.copy}
                        </p>
                        <ul className="mt-4 space-y-2 lg:mt-0">
                          {item.detail.map((d) => (
                            <li key={d} className="flex gap-3 text-sm text-bone">
                              <span className="text-teal-bright">/</span>
                              {d}
                            </li>
                          ))}
                        </ul>
                      </div>
                      {item.image ? (
                        <div className="h-48 w-full overflow-hidden md:h-56">
                          <img
                            src={item.image}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
