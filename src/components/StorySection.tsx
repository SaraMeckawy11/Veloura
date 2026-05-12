import type { Language, ThemeDefinition, WeddingConfig } from "../types";
import { cn } from "../utils/cn";
import { ScrollReveal } from "./ScrollReveal";
import { SectionHeader } from "./SectionHeader";

type StorySectionProps = {
  config: WeddingConfig;
  theme: ThemeDefinition;
  language: Language;
  labels: {
    eyebrow: string;
    title: string;
  };
};

export function StorySection({
  config,
  theme,
  language,
  labels
}: StorySectionProps) {
  const isMinimal = theme.id === "minimal-modern";

  return (
    <section id="story" className={theme.classes.section}>
      <ScrollReveal theme={theme}>
        <SectionHeader
          eyebrow={labels.eyebrow}
          title={labels.title}
          theme={theme}
          align={isMinimal ? "left" : "center"}
        />
      </ScrollReveal>

      <div
        className={cn(
          "relative z-10 mx-auto max-w-6xl",
          isMinimal ? "space-y-6" : "grid gap-6 lg:grid-cols-3"
        )}
      >
        {config.story.map((item, index) => (
          <ScrollReveal key={item.id} theme={theme} delay={index * 0.08}>
            <article
              className={cn(
                theme.classes.card,
                "relative h-full overflow-hidden",
                isMinimal ? "grid gap-6 md:grid-cols-[0.45fr_1fr]" : ""
              )}
            >
              <div
                className={cn(
                  "relative min-h-[14rem] overflow-hidden",
                  theme.id === "luxury-black-gold"
                    ? "border border-[#d6b15f]/25"
                    : theme.id === "minimal-modern"
                      ? "rounded-md"
                      : "rounded-lg"
                )}
                style={{ background: item.tone }}
              >
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.75),transparent_34%)]" />
                <p className="absolute bottom-4 left-4 right-4 text-xs font-semibold uppercase tracking-[0.22em] text-black/45">
                  {item.imageLabel[language]}
                </p>
              </div>

              <div className="pt-2">
                <p className={theme.classes.sectionEyebrow}>{item.date[language]}</p>
                <h3 className="mt-3 font-serif text-3xl font-semibold leading-tight">
                  {item.title[language]}
                </h3>
                <p className="mt-4 leading-8 opacity-75">{item.body[language]}</p>
              </div>
            </article>
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
