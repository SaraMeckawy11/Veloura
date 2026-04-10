import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Plane } from "lucide-react";

interface RSVPData {
  name: string;
  guestCount: number;
  attending: boolean;
  mealPreference: string;
  message: string;
}

const RSVPSection = () => {
  const { t } = useLanguage();
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState<RSVPData>({
    name: "",
    guestCount: 1,
    attending: true,
    mealPreference: "standard",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Save to localStorage
    const existing = JSON.parse(localStorage.getItem("wedding-rsvp") || "[]");
    existing.push({ ...form, timestamp: Date.now() });
    localStorage.setItem("wedding-rsvp", JSON.stringify(existing));
    setSubmitted(true);
  };

  return (
    <section className="py-20 md:py-32">
      <div className="container max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="data-label text-gold text-lg text-center mb-4">{t("boardingPass")}</h2>
          <h3 className="font-display text-3xl md:text-4xl text-center font-bold text-foreground mb-12">
            {t("confirmSeat")}
          </h3>

          <AnimatePresence mode="wait">
            {!submitted ? (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                className="boarding-pass boarding-pass-border p-8 md:p-10 space-y-6"
                exit={{ opacity: 0, y: -20 }}
              >
                <div>
                  <label className="data-label block mb-2">{t("guestName")}</label>
                  <input
                    type="text"
                    required
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="kiosk-input w-full text-foreground"
                    placeholder="..."
                  />
                </div>

                <div>
                  <label className="data-label block mb-2">{t("guestCount")}</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={form.guestCount}
                    onChange={(e) => setForm({ ...form, guestCount: parseInt(e.target.value) || 1 })}
                    className="kiosk-input w-24 text-foreground"
                  />
                </div>

                <div>
                  <label className="data-label block mb-2">{t("attending")}</label>
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, attending: true })}
                      className={`font-mono-data text-sm px-6 py-2 border-2 transition-colors ${
                        form.attending
                          ? "bg-secondary text-secondary-foreground border-secondary"
                          : "border-muted text-muted-foreground"
                      }`}
                    >
                      {t("yes")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, attending: false })}
                      className={`font-mono-data text-sm px-6 py-2 border-2 transition-colors ${
                        !form.attending
                          ? "bg-secondary text-secondary-foreground border-secondary"
                          : "border-muted text-muted-foreground"
                      }`}
                    >
                      {t("no")}
                    </button>
                  </div>
                </div>

                {form.attending && (
                  <div>
                    <label className="data-label block mb-2">{t("mealPref")}</label>
                    <select
                      value={form.mealPreference}
                      onChange={(e) => setForm({ ...form, mealPreference: e.target.value })}
                      className="kiosk-input w-full text-foreground bg-transparent"
                    >
                      <option value="standard">{t("standard")}</option>
                      <option value="vegetarian">{t("vegetarian")}</option>
                      <option value="vegan">{t("vegan")}</option>
                      <option value="halal">{t("halal")}</option>
                    </select>
                  </div>
                )}

                <div>
                  <label className="data-label block mb-2">{t("message")}</label>
                  <textarea
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="kiosk-input w-full text-foreground resize-none"
                    rows={3}
                    placeholder="..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-secondary text-secondary-foreground font-mono-data uppercase tracking-widest text-sm px-8 py-4 hover:bg-gold hover:text-foreground transition-colors duration-200"
                >
                  {t("checkIn")}
                </button>
              </motion.form>
            ) : (
              <motion.div
                key="success"
                className="boarding-pass boarding-pass-border p-8 md:p-10 text-center"
                initial={{ y: 60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, type: "spring", stiffness: 200, damping: 20 }}
              >
                <motion.div
                  className="stamp text-xl font-mono-data font-bold mx-auto mb-6 inline-block"
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.5, type: "spring", stiffness: 300, damping: 15 }}
                >
                  {t("confirmed")}
                </motion.div>

                <div className="space-y-3 mt-6">
                  <p className="data-label">{t("passenger")}</p>
                  <p className="font-display text-2xl font-bold text-foreground">{form.name}</p>
                  <div className="flex items-center justify-center gap-2 text-gold mt-4">
                    <Plane className="w-5 h-5" />
                  </div>
                  <p className="font-display italic text-muted-foreground text-lg mt-4">
                    {t("checkInComplete")}
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
};

export default RSVPSection;
