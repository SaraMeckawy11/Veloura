import { CalendarDays, ExternalLink, MapPin, Navigation } from "lucide-react";
import type { Language, ThemeDefinition, WeddingConfig } from "../types";
import { cn } from "../utils/cn";
import { ScrollReveal } from "./ScrollReveal";
import { SectionHeader } from "./SectionHeader";

type EventDetailsSectionProps = {
  config: WeddingConfig;
  theme: ThemeDefinition;
  language: Language;
  labels: {
    eyebrow: string;
    title: string;
    dateTime: string;
    venue: string;
    address: string;
    viewLocation: string;
  };
};

export function EventDetailsSection({
  config,
  theme,
  language,
  labels
}: EventDetailsSectionProps) {
  const detailItems = [
    {
      icon: CalendarDays,
      label: labels.dateTime,
      value: config.event.dateTime[language]
    },
    {
      icon: MapPin,
      label: labels.venue,
      value: config.event.venueName[language]
    },
    {
      icon: Navigation,
      label: labels.address,
      value: config.event.address[language]
    }
  ];

  return (
    <section id="details" className={theme.classes.section}>
      <ScrollReveal theme={theme}>
        <SectionHeader
          eyebrow={labels.eyebrow}
          title={labels.title}
          lead={config.event.ceremonyTitle[language]}
          theme={theme}
          align={theme.id === "minimal-modern" ? "left" : "center"}
        />
      </ScrollReveal>

      <div className="relative z-10 mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <ScrollReveal theme={theme}>
          <div className={cn(theme.classes.card, "h-full")}>
            <div className="space-y-5">
              {detailItems.map((item) => {
                const Icon = item.icon;

                return (
                  <div
                    className={cn(
                      "flex gap-4 border-b pb-5 last:border-b-0 last:pb-0",
                      theme.id === "luxury-black-gold"
                        ? "border-[#d6b15f]/20"
                        : theme.id === "minimal-modern"
                          ? "border-[#e2ddd4]"
                          : "border-black/10"
                    )}
                    key={item.label}
                  >
                    <span
                      className={cn(
                        "mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                        theme.id === "luxury-black-gold"
                          ? "bg-[#d6b15f]/10 text-[#d6b15f]"
                          : theme.id === "arabic-royal"
                            ? "bg-[#0c3b2e] text-[#fff8ea]"
                            : theme.id === "minimal-modern"
                              ? "bg-[#1f1f1d] text-white"
                              : "bg-[#d98b75] text-white"
                      )}
                    >
                      <Icon className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] opacity-60">
                        {item.label}
                      </p>
                      <p className="mt-2 text-lg leading-7">{item.value}</p>
                    </span>
                  </div>
                );
              })}
            </div>

            <a
              className={cn(theme.classes.primaryButton, "mt-8 w-full sm:w-auto")}
              href={config.event.mapUrl}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              <span>{labels.viewLocation}</span>
            </a>
          </div>
        </ScrollReveal>

        <ScrollReveal theme={theme} delay={0.1}>
          <div
            className={cn(
              "h-[26rem] overflow-hidden",
              theme.id === "luxury-black-gold"
                ? "border border-[#d6b15f]/30"
                : theme.id === "minimal-modern"
                  ? "rounded-md border border-[#e2ddd4]"
                  : "rounded-lg border border-white/70"
            )}
          >
            <iframe
              title={config.event.venueName[language]}
              className="h-full w-full"
              src={config.event.mapEmbedUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
