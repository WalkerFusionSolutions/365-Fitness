import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

export function PageHead({
  eyebrow,
  title,
  aside,
  image,
  imageAlt,
}: {
  eyebrow: string;
  title: ReactNode;
  aside?: ReactNode;
  image?: string;
  imageAlt?: string;
}) {
  return (
    <section className="relative border-b border-border pt-28 md:pt-36">
      <div className="grid gap-10 px-5 pb-14 md:grid-cols-[auto_1.4fr_1fr] md:gap-12 md:px-8 md:pb-20">
        <div className="hidden md:block">
          <span className="vertical-label text-teal-bright">{eyebrow}</span>
        </div>
        <div>
          <p className="label-xs text-teal-bright md:hidden">{eyebrow}</p>
          <Reveal>
            <h1 className="display mt-4 text-[15vw] leading-[0.82] sm:text-7xl md:mt-0 md:text-8xl xl:text-9xl">
              {title}
            </h1>
          </Reveal>
        </div>
        {aside ? (
          <Reveal delay={120} className="self-end">
            <div className="max-w-sm border-l border-border pl-6 text-sm leading-relaxed text-bone-dim">
              {aside}
            </div>
          </Reveal>
        ) : null}
      </div>
      {image ? (
        <div className="img-zoom relative h-[46vh] min-h-64 w-full md:h-[62vh]">
          <img
            src={image}
            alt={imageAlt ?? ""}
            className="h-full w-full object-cover"
            loading="lazy"
          />
          <div className="grain-fade pointer-events-none absolute inset-0" />
        </div>
      ) : null}
    </section>
  );
}
