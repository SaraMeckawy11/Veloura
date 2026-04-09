import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { weddingData } from "@/data/weddingData";
import { Plane } from "lucide-react";
import story1 from "@/assets/story-1.jpg";
import story2 from "@/assets/story-2.jpg";
import story3 from "@/assets/story-3.jpg";
import story4 from "@/assets/story-4.jpg";

const storyImages = [story1, story2, story3, story4];

const OurStorySection = () => {
  const { t, lang } = useLanguage();

  return (
    <section className="py-20 md:py-32">
      <div className="container max-w-3xl">
        <motion.h2
          className="data-label text-gold text-lg text-center mb-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {t("flightRoute")}
        </motion.h2>
        <motion.h3
          className="font-display text-3xl md:text-4xl text-center font-bold text-foreground mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {t("ourStory")}
        </motion.h3>

        {/* Timeline */}
        <div className="relative">
          {/* Flight path line */}
          <div className="flight-path" />

          {weddingData.story.map((milestone, i) => (
            <motion.div
              key={i}
              className={`relative flex items-start gap-6 md:gap-10 mb-16 last:mb-0 ${
                i % 2 === 0 ? "flex-row" : "flex-row-reverse"
              }`}
              initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              {/* Content side */}
              <div className={`w-[calc(50%-2rem)] ${i % 2 === 0 ? "text-right" : "text-left"}`}>
                <span className="font-mono-data text-gold text-sm tracking-widest">{milestone.date}</span>
                <h4 className="font-display text-xl font-semibold text-foreground mt-1">
                  {lang === "ar" ? milestone.title.ar : milestone.title.en}
                </h4>
                <p className="text-muted-foreground text-sm mt-2 leading-relaxed">
                  {lang === "ar" ? milestone.description.ar : milestone.description.en}
                </p>
              </div>

              {/* Center dot with plane */}
              <div className="absolute left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-secondary flex items-center justify-center z-10 border-2 border-gold">
                <Plane className="w-3.5 h-3.5 text-gold" />
              </div>

              {/* Image side */}
              <div className="w-[calc(50%-2rem)]">
                <div className="aspect-square overflow-hidden rounded-sm border border-border">
                  <img
                    src={storyImages[i]}
                    alt={lang === "ar" ? milestone.title.ar : milestone.title.en}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OurStorySection;
