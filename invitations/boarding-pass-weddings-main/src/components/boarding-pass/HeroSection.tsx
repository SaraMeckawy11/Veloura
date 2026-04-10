import { motion } from "framer-motion";
import { Plane } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { weddingData } from "@/data/weddingData";
import cloudsHero from "@/assets/clouds-hero.jpg";

const HeroSection = () => {
  const { t, lang } = useLanguage();
  const couple = weddingData.couple;
  const weddingDate = new Date(weddingData.date);
  const dateStr = weddingDate.toLocaleDateString(lang === "ar" ? "ar-SA" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Cloud background with parallax */}
      <div className="absolute inset-0 z-0">
        <div className="animate-clouds absolute h-full" style={{ width: "200%" }}>
          <img src={cloudsHero} alt="Clouds" className="h-full w-1/2 object-cover inline-block" />
          <img src={cloudsHero} alt="Clouds" className="h-full w-1/2 object-cover inline-block" />
        </div>
        <div className="absolute inset-0 bg-background/40" />
      </div>

      {/* Flying plane animation */}
      <motion.div
        className="absolute top-20 z-10"
        initial={{ x: "-100vw", y: 20, rotate: -5 }}
        animate={{ x: "110vw", y: -40, rotate: -5 }}
        transition={{ duration: 3, ease: "easeOut", delay: 0.5 }}
      >
        <Plane className="w-8 h-8 text-navy" />
      </motion.div>

      {/* Boarding Pass Card */}
      <motion.div
        className="relative z-20 mx-4 w-full max-w-3xl"
        initial={{ x: 100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
      >
        <div className="boarding-pass boarding-pass-border p-6 md:p-10">
          <div className="flex flex-col md:flex-row">
            {/* Main content - left 70% */}
            <div className="flex-1 md:pr-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <span className="data-label text-gold">{t("boardingPass")}</span>
                <span className="data-label">{weddingData.ceremony.flightNo}</span>
              </div>

              {/* Couple Names */}
              <h1 className="font-display text-3xl md:text-5xl font-bold text-foreground tracking-tight mb-2 text-balance">
                {lang === "ar" ? couple.name1.ar : couple.name1.en}
                <span className="text-gold mx-2 md:mx-3">&</span>
                {lang === "ar" ? couple.name2.ar : couple.name2.en}
              </h1>

              <p className="font-display italic text-muted-foreground text-lg mb-8">
                {lang === "ar" ? weddingData.tagline.ar : weddingData.tagline.en}
              </p>

              {/* Data fields */}
              <div className="grid grid-cols-2 gap-4 md:gap-6">
                <div>
                  <p className="data-label">{t("flight")}</p>
                  <p className="data-value font-mono-data">{dateStr}</p>
                </div>
                <div>
                  <p className="data-label">{t("destination")}</p>
                  <p className="data-value font-mono-data text-sm">
                    {lang === "ar" ? weddingData.ceremony.venue.ar : weddingData.ceremony.venue.en}
                  </p>
                </div>
                <div>
                  <p className="data-label">{t("gate")}</p>
                  <p className="data-value font-mono-data">{weddingData.ceremony.time}</p>
                </div>
                <div>
                  <p className="data-label">{t("seat")}</p>
                  <p className="data-value font-mono-data">{t("forever")}</p>
                </div>
              </div>
            </div>

            {/* Perforation line & stub */}
            <div className="hidden md:flex items-stretch relative mx-4">
              <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-8 h-8 bg-background rounded-full" />
              <div className="border-r-2 border-dashed border-muted w-0" />
              <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-8 h-8 bg-background rounded-full" />
            </div>

            {/* Stub - right 30% */}
            <div className="mt-6 md:mt-0 md:w-[30%] flex flex-col items-center justify-center pt-4 md:pt-0 border-t-2 md:border-t-0 border-dashed border-muted">
              {/* Stamp */}
              <motion.div
                className="stamp text-sm md:text-base font-mono-data font-bold"
                initial={{ scale: 1.5, opacity: 0, rotate: -15 }}
                animate={{ scale: 1, opacity: 1, rotate: -15 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 300, damping: 15, delay: 1.2 }}
              >
                {t("confirmed")}
              </motion.div>
              <div className="mt-4 data-label text-center text-xs">
                {weddingData.ceremony.flightNo}
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default HeroSection;
