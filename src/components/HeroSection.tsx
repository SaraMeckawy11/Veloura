import { motion } from "framer-motion";
import { CalendarDays, Heart, MapPin, Send } from "lucide-react";
import type { Language, ThemeDefinition, WeddingConfig } from "../types";
import { cn } from "../utils/cn";
import { MediaBackground } from "./MediaBackground";
import { ThemeOrnaments } from "./ThemeOrnaments";

type HeroSectionProps = {
  config: WeddingConfig;
  theme: ThemeDefinition;
  language: Language;
  labels: {
    details: string;
    rsvp: string;
  };
};

export function HeroSection({
  config,
  theme,
  language,
  labels
}: HeroSectionProps) {
  const isWatercolor = theme.id === "watercolor-garden";
  const isMinimal = theme.id === "minimal-modern";

  return (
    <section id="hero" className={theme.classes.hero}>
      {isWatercolor ? <MediaBackground assets={config.assets} /> : null}
      {!isWatercolor ? <ThemeOrnaments theme={theme} /> : null}

      {isWatercolor ? (
        <WatercolorHeroContent
          config={config}
          language={language}
          theme={theme}
        />
      ) : isMinimal ? (
        <div className="relative z-10 grid w-full max-w-7xl gap-12 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
          <motion.div
            className={theme.classes.heroFrame}
            initial={theme.motion.heroInitial}
            animate={theme.motion.heroAnimate}
            transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className={theme.classes.heroDate}>{config.displayDate[language]}</p>
            <h1 className={theme.classes.heroNames}>{config.couple.displayName[language]}</h1>
            <p className={theme.classes.heroTagline}>{config.tagline[language]}</p>
            <HeroActions theme={theme} labels={labels} />
          </motion.div>

          <motion.div
            className="relative hidden min-h-[30rem] items-end justify-end border-l border-[#d8d1c6] ps-10 lg:flex"
            initial={{ opacity: 0, y: 36 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.18 }}
          >
            <div className="text-end">
              <p className="text-[12rem] font-semibold leading-none text-[#e3ded5]">
                {config.couple.monogram[language]}
              </p>
              <p className="mt-4 max-w-xs text-sm uppercase tracking-[0.28em] text-[#938776]">
                {config.event.venueName[language]}
              </p>
            </div>
          </motion.div>
        </div>
      ) : (
        <motion.div
          className={cn(theme.classes.heroFrame, "text-center")}
          initial={theme.motion.heroInitial}
          animate={theme.motion.heroAnimate}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className={cn(
              "mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full",
              theme.id === "luxury-black-gold"
                ? "border border-[#d6b15f] text-[#d6b15f]"
                : theme.id === "arabic-royal"
                  ? "bg-[#0c3b2e] text-[#fff8ea]"
                  : "bg-white/70 text-[#86ad61]"
            )}
          >
            <Heart className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className={theme.classes.heroDate}>{config.displayDate[language]}</p>
          <h1 className={theme.classes.heroNames}>{config.couple.displayName[language]}</h1>
          <p className={theme.classes.heroTagline}>{config.tagline[language]}</p>
          <HeroActions theme={theme} labels={labels} />
        </motion.div>
      )}

      {!isWatercolor ? (
        <div className="absolute bottom-8 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-2 text-xs uppercase tracking-[0.28em] opacity-70 sm:flex">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          <span>{config.event.dateTime[language]}</span>
        </div>
      ) : null}
    </section>
  );
}

function WatercolorHeroContent({
  config,
  theme,
  language
}: {
  config: WeddingConfig;
  theme: ThemeDefinition;
  language: Language;
}) {
  return (
    <div className="relative z-10 flex min-h-screen w-full max-w-7xl items-start justify-center px-4 pt-[clamp(2rem,7vh,5rem)] text-center">
      <motion.div
        className="relative mx-auto w-full max-w-[min(92vw,58rem)] px-4 drop-shadow-[0_3px_18px_rgba(255,255,245,0.92)]"
        initial={theme.motion.heroInitial}
        animate={theme.motion.heroAnimate}
        transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
      >
        <p className={theme.classes.heroDate}>{config.displayDate[language]}</p>
        <h1 className="mt-3 font-serif text-[clamp(2.7rem,4vw,5rem)] font-semibold leading-none text-[#314234]">
          {config.couple.displayName[language]}
        </h1>
        <p className="mx-auto mt-4 max-w-[min(86vw,42rem)] font-serif text-[clamp(1.05rem,1.5vw,1.55rem)] leading-snug text-[#5d7046]">
          {config.tagline[language]}
        </p>
      </motion.div>
    </div>
  );
}

function HeroActions({
  theme,
  labels
}: {
  theme: ThemeDefinition;
  labels: { details: string; rsvp: string };
}) {
  return (
    <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
      <a className={theme.classes.primaryButton} href="#rsvp">
        <Send className="h-4 w-4" aria-hidden="true" />
        <span>{labels.rsvp}</span>
      </a>
      <a className={theme.classes.secondaryButton} href="#details">
        <MapPin className="h-4 w-4" aria-hidden="true" />
        <span>{labels.details}</span>
      </a>
    </div>
  );
}
