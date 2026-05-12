import { Heart } from "lucide-react";
import type { Language, ThemeDefinition, WeddingConfig } from "../types";
import { cn } from "../utils/cn";

type SiteNavProps = {
  config: WeddingConfig;
  theme: ThemeDefinition;
  language: Language;
  labels: {
    story: string;
    details: string;
    rsvp: string;
    gallery: string;
  };
};

export function SiteNav({
  config,
  theme,
  language,
  labels
}: SiteNavProps) {
  const navItems = [
    { href: "#story", label: labels.story },
    { href: "#details", label: labels.details },
    { href: "#rsvp", label: labels.rsvp },
    { href: "#gallery", label: labels.gallery }
  ];

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-50 px-4 py-4 sm:px-6">
      <div
        className={cn(
          "pointer-events-auto mx-auto flex max-w-7xl items-center justify-between gap-3 rounded-full px-4 py-3",
          theme.classes.nav
        )}
      >
        <a href="#hero" className="flex items-center gap-2">
          <span
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-full",
              "bg-[#86ad61] text-white"
            )}
          >
            <Heart className="h-4 w-4" aria-hidden="true" />
          </span>
          <span className="hidden text-sm font-semibold sm:inline">
            {config.couple.monogram[language]}
          </span>
        </a>

        <nav className="hidden items-center gap-5 text-xs font-semibold uppercase tracking-[0.15em] lg:flex">
          {navItems.map((item) => (
            <a key={item.href} className="transition hover:opacity-70" href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <span className="hidden text-xs font-semibold uppercase tracking-[0.16em] opacity-70 sm:inline">
          Invitation
        </span>
      </div>
    </header>
  );
}
