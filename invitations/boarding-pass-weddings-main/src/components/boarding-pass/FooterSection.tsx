import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { weddingData } from "@/data/weddingData";

const FooterSection = () => {
  const { t, lang } = useLanguage();
  const couple = weddingData.couple;
  const initials = `${(lang === "ar" ? couple.name1.ar : couple.name1.en)[0]}${(lang === "ar" ? couple.name2.ar : couple.name2.en)[0]}`;

  return (
    <section className="relative py-16 md:py-20">
      {/* Perforation top */}
      <div className="perforation-horizontal w-full absolute top-0 left-0" />

      <div className="container max-w-2xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* Monogram as airline logo */}
          <div className="w-24 h-24 mx-auto rounded-full bg-background flex flex-col items-center justify-center mb-6 border-2 border-gold shadow-[0_0_18px_2px_rgba(201,169,110,0.25)]">
            <span className="font-display text-xs tracking-[0.2em] uppercase" style={{ color: "hsl(45 50% 60%)" }}>✦</span>
            <span className="font-display text-xl font-bold leading-tight" style={{ color: "hsl(45 60% 65%)" }}>{initials}</span>
            <span className="font-display text-xs tracking-[0.2em] uppercase" style={{ color: "hsl(45 50% 60%)" }}>✦</span>
          </div>

          <p className="font-display italic text-xl text-foreground mb-2">
            {t("thankYou")}
          </p>
          <p className="data-label text-gold mt-4">
            {lang === "ar" ? couple.name1.ar : couple.name1.en} & {lang === "ar" ? couple.name2.ar : couple.name2.en}
          </p>
          <p className="data-label text-muted-foreground mt-2">
            {weddingData.ceremony.flightNo}
          </p>
        </motion.div>
      </div>

      {/* Perforation bottom */}
      <div className="perforation-horizontal w-full absolute bottom-0 left-0" />
    </section>
  );
};

export default FooterSection;
