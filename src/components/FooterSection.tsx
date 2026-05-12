import type { Language, ThemeDefinition, WeddingConfig } from "../types";
import { ScrollReveal } from "./ScrollReveal";
import { ThemeOrnaments } from "./ThemeOrnaments";

type FooterSectionProps = {
  config: WeddingConfig;
  theme: ThemeDefinition;
  language: Language;
  labels: {
    thankYou: string;
    madeWith: string;
  };
};

export function FooterSection({
  config,
  theme,
  language,
  labels
}: FooterSectionProps) {
  return (
    <footer className={theme.classes.footer}>
      <ThemeOrnaments theme={theme} />
      <ScrollReveal theme={theme}>
        <p className="text-sm font-semibold uppercase tracking-[0.28em] opacity-70">
          {labels.madeWith}
        </p>
        <p className="mx-auto mt-5 max-w-2xl font-serif text-4xl leading-tight sm:text-5xl">
          {labels.thankYou}
        </p>
        <div className={theme.classes.divider} aria-hidden="true" />
        <p className="mt-8 font-serif text-5xl font-semibold">
          {config.couple.monogram[language]}
        </p>
        <p className="mt-4 text-sm uppercase tracking-[0.24em] opacity-70">
          {config.displayDate[language]}
        </p>
      </ScrollReveal>
    </footer>
  );
}
