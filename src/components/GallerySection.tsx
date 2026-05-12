import { AnimatePresence, motion } from "framer-motion";
import { ImageIcon, X } from "lucide-react";
import { useState } from "react";
import type { GalleryItem, Language, ThemeDefinition, WeddingConfig } from "../types";
import { cn } from "../utils/cn";
import { ScrollReveal } from "./ScrollReveal";
import { SectionHeader } from "./SectionHeader";

type GallerySectionProps = {
  config: WeddingConfig;
  theme: ThemeDefinition;
  language: Language;
  labels: {
    eyebrow: string;
    title: string;
    close: string;
  };
};

export function GallerySection({
  config,
  theme,
  language,
  labels
}: GallerySectionProps) {
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);

  return (
    <section id="gallery" className={theme.classes.section}>
      <ScrollReveal theme={theme}>
        <SectionHeader eyebrow={labels.eyebrow} title={labels.title} theme={theme} />
      </ScrollReveal>

      <div className="relative z-10 mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {config.gallery.map((item, index) => (
          <ScrollReveal key={item.id} theme={theme} delay={index * 0.04}>
            <button
              type="button"
              className={cn(theme.classes.galleryItem, "w-full text-start")}
              onClick={() => setActiveItem(item)}
            >
              <div className="absolute inset-0 transition duration-700 group-hover:scale-105" style={{ background: item.tone }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/62 via-black/10 to-white/20" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/18 backdrop-blur">
                  <ImageIcon className="h-5 w-5" aria-hidden="true" />
                </div>
                <h3 className="font-serif text-3xl font-semibold">
                  {item.title[language]}
                </h3>
                <p className="mt-2 text-sm opacity-80">{item.caption[language]}</p>
              </div>
            </button>
          </ScrollReveal>
        ))}
      </div>

      <AnimatePresence>
        {activeItem ? (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-black/72 px-4 py-8 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setActiveItem(null)}
          >
            <motion.div
              className={cn(
                "relative w-full max-w-4xl overflow-hidden",
                theme.id === "luxury-black-gold"
                  ? "border border-[#d6b15f]/50 bg-black"
                  : theme.id === "minimal-modern"
                    ? "rounded-md bg-white"
                    : "rounded-lg bg-white"
              )}
              initial={{ opacity: 0, y: 24, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              transition={{ duration: 0.28 }}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="h-[62vh] min-h-[22rem]" style={{ background: activeItem.tone }} />
              <div
                className={cn(
                  "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white"
                )}
              >
                <h3 className="font-serif text-4xl font-semibold">
                  {activeItem.title[language]}
                </h3>
                <p className="mt-2 opacity-85">{activeItem.caption[language]}</p>
              </div>
              <button
                type="button"
                className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-black shadow-lg transition hover:scale-105"
                onClick={() => setActiveItem(null)}
                aria-label={labels.close}
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
