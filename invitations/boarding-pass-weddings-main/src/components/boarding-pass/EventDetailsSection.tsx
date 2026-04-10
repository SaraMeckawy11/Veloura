import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { weddingData } from "@/data/weddingData";

interface EventCardProps {
  type: "ceremony" | "reception";
}

const EventCard = ({ type }: EventCardProps) => {
  const { t, lang } = useLanguage();
  const data = type === "ceremony" ? weddingData.ceremony : weddingData.reception;
  const label = type === "ceremony" ? t("ceremony") : t("reception");

  return (
    <div className="boarding-pass boarding-pass-border p-6 md:p-8 flex-1">
      <div className="mb-4">
        <span className="data-label text-gold">{t("flightNo")}: {data.flightNo}</span>
      </div>
      <h3 className="font-display text-2xl font-bold text-foreground mb-6">{label}</h3>

      <div className="space-y-4">
        <div>
          <p className="data-label">{t("terminal")}</p>
          <p className="font-mono-data text-foreground text-sm">
            {lang === "ar" ? data.venue.ar : data.venue.en}
          </p>
        </div>
        <div>
          <p className="data-label">{t("boarding")}</p>
          <p className="font-mono-data text-foreground text-sm">{data.time}</p>
        </div>
        <div>
          <p className="data-label">{t("gate")}</p>
          <p className="font-mono-data text-foreground text-sm">
            {lang === "ar" ? data.address.ar : data.address.en}
          </p>
        </div>
      </div>

      {/* Map in airplane window */}
      <div className="mt-6">
        <p className="data-label mb-3">{t("locationMap")}</p>
        <div className="airplane-window aspect-[4/3]">
          <iframe
            src={data.mapEmbed}
            className="w-full h-full border-0"
            allowFullScreen
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title={`${label} location`}
          />
        </div>
      </div>
    </div>
  );
};

const EventDetailsSection = () => {
  const { t } = useLanguage();
  const transition = { duration: 0.6, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };

  return (
    <section className="py-20 md:py-32 bg-secondary">
      <div className="container max-w-5xl">
        <motion.h2
          className="data-label text-gold text-lg text-center mb-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          {t("eventDetails")}
        </motion.h2>

        <div className="flex justify-center mt-12">
          <motion.div
            className="w-full max-w-lg"
            initial={{ y: 40, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={transition}
          >
            <EventCard type="ceremony" />
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default EventDetailsSection;
