import { useState } from "react";
import { cn } from "@/lib/utils";

type Feature = {
  key: string;
  label: string;
  lines: string[];
  /** Slot label for the real app capture that will replace the placeholder. */
  slot: string;
};

const FEATURES: Feature[] = [
  {
    key: "workouts",
    label: "Workouts",
    lines: [
      "Custom sessions built for your goal",
      "Exercise video demonstrations",
      "Sets, reps and weight logging",
      "Rest timer and workout history",
    ],
    slot: "app-screen-workouts",
  },
  {
    key: "nutrition",
    label: "Nutrition",
    lines: [
      "Personalized meal plans",
      "Grocery lists",
      "Water tracking",
      "Supplements",
    ],
    slot: "app-screen-nutrition",
  },
  {
    key: "progress",
    label: "Progress",
    lines: ["Measurements", "Progress photos", "Goals", "Weight tracking"],
    slot: "app-screen-progress",
  },
  {
    key: "messaging",
    label: "Messaging",
    lines: ["Direct coach messaging", "Video feedback on your form"],
    slot: "app-screen-messaging",
  },
  {
    key: "appointments",
    label: "Appointments",
    lines: ["Session booking", "Reminders", "Notifications"],
    slot: "app-screen-appointments",
  },
];

function ScreenSlot({ slot, label }: { slot: string; label: string }) {
  return (
    <div className="relative mx-auto w-full max-w-[210px] sm:max-w-[280px]">
      <div className="hairline aspect-[9/19] w-full rounded-lg bg-charcoal p-2">
        <div className="flex h-full w-full flex-col justify-between rounded-md border border-dashed border-border bg-ink p-4">
          <div>
            <p className="label-xs text-teal-bright">{label}</p>
            <p className="mt-2 text-xs leading-relaxed text-bone-dim">
              Reserved for the real 365 Fitness app capture.
            </p>
          </div>
          <div className="space-y-2" aria-hidden>
            <div className="h-1.5 w-full bg-graphite" />
            <div className="h-1.5 w-4/5 bg-graphite" />
            <div className="h-1.5 w-2/3 bg-graphite" />
          </div>
          <p className="label-xs text-bone-dim/60">{slot}</p>
        </div>
      </div>
    </div>
  );
}

export function AppShowcase() {
  const [active, setActive] = useState(FEATURES[0]!.key);
  const feature = FEATURES.find((f) => f.key === active)!;

  return (
    <div className="grid gap-10 md:grid-cols-[1fr_auto] md:gap-16">
      <div>
        <ul className="border-t border-border">
          {FEATURES.map((f) => {
            const isActive = f.key === active;
            return (
              <li key={f.key} className="border-b border-border">
                <button
                  type="button"
                  onClick={() => setActive(f.key)}
                  onMouseEnter={() => setActive(f.key)}
                  aria-pressed={isActive}
                  className={cn(
                    "flex w-full items-center justify-between gap-6 py-5 text-left transition-colors duration-300",
                    isActive ? "text-bone" : "text-bone-dim hover:text-bone",
                  )}
                >
                  <span className="display text-3xl md:text-4xl">{f.label}</span>
                  <span
                    aria-hidden
                    className={cn(
                      "h-px flex-1 origin-right bg-teal-bright transition-transform duration-500",
                      isActive ? "scale-x-100" : "scale-x-0",
                    )}
                  />
                </button>
              </li>
            );
          })}
        </ul>

        <ul className="mt-8 grid gap-3 sm:grid-cols-2">
          {feature.lines.map((line) => (
            <li key={line} className="flex gap-3 text-sm text-bone-dim">
              <span className="text-teal-bright">/</span>
              {line}
            </li>
          ))}
        </ul>
      </div>

      <ScreenSlot slot={feature.slot} label={feature.label} />
    </div>
  );
}

export { ScreenSlot };
