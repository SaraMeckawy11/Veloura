import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import gallery1 from "@/assets/gallery-1.jpg";
import gallery2 from "@/assets/gallery-2.jpg";
import gallery3 from "@/assets/gallery-3.jpg";
import gallery4 from "@/assets/gallery-4.jpg";
import gallery5 from "@/assets/gallery-5.jpg";
import gallery6 from "@/assets/gallery-6.jpg";

const photos = [gallery1, gallery2, gallery3, gallery4, gallery5, gallery6];

const GallerySection = () => {
  const { t } = useLanguage();

  return (
    <section className="py-20 md:py-32 bg-secondary">
      <div className="container max-w-5xl">
        <motion.h2
          className="data-label text-gold text-lg text-center mb-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {t("gallery")}
        </motion.h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 mt-12">
          {photos.map((photo, i) => (
            <motion.div
              key={i}
              className="airplane-window aspect-square window-blind-container"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <img
                src={photo}
                alt={`Gallery photo ${i + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="window-blind flex items-center justify-center">
                <span className="data-label text-charcoal text-xs">✈ {t("gallery")}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GallerySection;
