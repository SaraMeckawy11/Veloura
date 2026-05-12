import { motion } from "framer-motion";
import type { Language, ThemeDefinition, WeddingConfig } from "../types";
import { useCountdown } from "../hooks/useCountdown";
import { ScrollReveal } from "./ScrollReveal";
import { SectionHeader } from "./SectionHeader";

type CountdownSectionProps = {
  config: WeddingConfig;
  theme: ThemeDefinition;
  labels: {
    eyebrow: string;
    title: string;
    days: string;
    hours: string;
    minutes: string;
    seconds: string;
  };
  language: Language;
};

export function CountdownSection({
  config,
  theme,
  labels,
  language
}: CountdownSectionProps) {
  const countdown = useCountdown(config.weddingDate);
  const units = [
    { label: labels.days, value: countdown.days },
    { label: labels.hours, value: countdown.hours },
    { label: labels.minutes, value: countdown.minutes },
    { label: labels.seconds, value: countdown.seconds }
  ];

  return (
    <section className={theme.classes.section}>
      <div className="absolute inset-0 section-soft-pattern" aria-hidden="true" />
      <ScrollReveal theme={theme}>
        <SectionHeader
          eyebrow={labels.eyebrow}
          title={labels.title}
          lead={config.displayDate[language]}
          theme={theme}
        />
      </ScrollReveal>

      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
        {units.map((unit, index) => (
          <ScrollReveal key={unit.label} theme={theme} delay={index * 0.07}>
            <motion.div
              className={theme.classes.timerCard}
              whileHover={{ y: -8, scale: 1.015 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
            >
              <motion.p
                className="font-serif text-5xl font-semibold leading-none sm:text-6xl"
                key={`${unit.label}-${unit.value}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28 }}
              >
                {String(unit.value).padStart(2, "0")}
              </motion.p>
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] opacity-70">
                {unit.label}
              </p>
            </motion.div>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
