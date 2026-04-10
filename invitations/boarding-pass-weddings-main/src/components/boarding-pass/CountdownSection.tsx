import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { weddingData } from "@/data/weddingData";

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const FlapDigit = ({ value, label }: { value: string; label: string }) => {
  const [prevValue, setPrevValue] = useState(value);
  const [flipping, setFlipping] = useState(false);

  useEffect(() => {
    if (value !== prevValue) {
      setFlipping(true);
      const timer = setTimeout(() => {
        setPrevValue(value);
        setFlipping(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [value, prevValue]);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="flex gap-1">
        {value.split("").map((digit, i) => (
          <div key={i} className="flap-digit w-10 h-14 md:w-14 md:h-20 flex items-center justify-center text-2xl md:text-4xl font-bold perspective-500">
            <motion.span
              key={`${digit}-${i}-${flipping}`}
              initial={flipping ? { rotateX: -90, opacity: 0 } : { rotateX: 0, opacity: 1 }}
              animate={{ rotateX: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="block"
            >
              {digit}
            </motion.span>
          </div>
        ))}
      </div>
      <span className="data-label text-[10px] md:text-xs">{label}</span>
    </div>
  );
};

const CountdownSection = () => {
  const { t } = useLanguage();
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const target = new Date(weddingData.date).getTime();

    const calc = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };

    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, "0");

  return (
    <section className="py-20 md:py-32 bg-secondary">
      <div className="container max-w-4xl">
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="data-label text-gold text-lg mb-10">{t("boardingIn")}</h2>

          <div className="flex items-center justify-center gap-4 md:gap-8">
            <FlapDigit value={pad(timeLeft.days)} label={t("days")} />
            <span className="text-secondary-foreground text-3xl font-bold mt-[-24px]">:</span>
            <FlapDigit value={pad(timeLeft.hours)} label={t("hours")} />
            <span className="text-secondary-foreground text-3xl font-bold mt-[-24px]">:</span>
            <FlapDigit value={pad(timeLeft.minutes)} label={t("minutes")} />
            <span className="text-secondary-foreground text-3xl font-bold mt-[-24px]">:</span>
            <FlapDigit value={pad(timeLeft.seconds)} label={t("seconds")} />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CountdownSection;
