import { useEffect, useMemo, useState, type FormEvent } from "react";
import { CheckCircle2, MessageCircle, Send, UserRound, Users, Utensils } from "lucide-react";
import type {
  Language,
  RSVPFormData,
  StoredRSVP,
  ThemeDefinition,
  WeddingConfig
} from "../types";
import { getRsvpStorageKey } from "../utils/storage";
import { cn } from "../utils/cn";
import { ScrollReveal } from "./ScrollReveal";
import { SectionHeader } from "./SectionHeader";

const initialFormData: RSVPFormData = {
  guestName: "",
  guestCount: "1",
  attending: "",
  mealPreference: "",
  message: ""
};

type RSVPSectionProps = {
  uuid: string;
  config: WeddingConfig;
  theme: ThemeDefinition;
  language: Language;
  labels: {
    eyebrow: string;
    title: string;
    guestName: string;
    guestNamePlaceholder: string;
    guestCount: string;
    attending: string;
    attendingYes: string;
    attendingNo: string;
    mealPreference: string;
    message: string;
    messagePlaceholder: string;
    submitRsvp: string;
    success: string;
    required: string;
  };
};

export function RSVPSection({
  uuid,
  config,
  theme,
  language,
  labels
}: RSVPSectionProps) {
  const storageKey = useMemo(() => getRsvpStorageKey(uuid), [uuid]);
  const [formData, setFormData] = useState<RSVPFormData>(initialFormData);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    try {
      const storedValue = window.localStorage.getItem(storageKey);

      if (storedValue) {
        const parsed = JSON.parse(storedValue) as StoredRSVP;
        setFormData({
          guestName: parsed.guestName ?? "",
          guestCount: parsed.guestCount ?? "1",
          attending: parsed.attending ?? "",
          mealPreference: parsed.mealPreference ?? "",
          message: parsed.message ?? ""
        });
      }
    } catch {
      setFormData(initialFormData);
    }
  }, [storageKey]);

  const updateField = <T extends keyof RSVPFormData>(
    field: T,
    value: RSVPFormData[T]
  ) => {
    setFormData((current) => ({ ...current, [field]: value }));
    setError("");
    setSuccess(false);
  };

  const submitForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      !formData.guestName.trim() ||
      !formData.guestCount ||
      !formData.attending ||
      !formData.mealPreference
    ) {
      setError(labels.required);
      setSuccess(false);
      return;
    }

    const storedValue: StoredRSVP = {
      ...formData,
      guestName: formData.guestName.trim(),
      uuid,
      savedAt: new Date().toISOString()
    };

    window.localStorage.setItem(storageKey, JSON.stringify(storedValue));
    setSuccess(true);
    setError("");
  };

  return (
    <section id="rsvp" className={theme.classes.section}>
      <ScrollReveal theme={theme}>
        <SectionHeader eyebrow={labels.eyebrow} title={labels.title} theme={theme} />
      </ScrollReveal>

      <ScrollReveal theme={theme} delay={0.08}>
        <form
          className={cn("relative z-10 mx-auto max-w-4xl", theme.classes.card)}
          onSubmit={submitForm}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <UserRound className="h-4 w-4" aria-hidden="true" />
                {labels.guestName}
              </span>
              <input
                className={theme.classes.input}
                value={formData.guestName}
                onChange={(event) => updateField("guestName", event.target.value)}
                placeholder={labels.guestNamePlaceholder}
                required
              />
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Users className="h-4 w-4" aria-hidden="true" />
                {labels.guestCount}
              </span>
              <select
                className={theme.classes.input}
                value={formData.guestCount}
                onChange={(event) => updateField("guestCount", event.target.value)}
                required
              >
                {config.rsvp.guestCounts.map((count) => (
                  <option key={count} value={count}>
                    {count}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <fieldset className="mt-6">
            <legend className="mb-3 text-sm font-semibold">{labels.attending}</legend>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { value: "yes", label: labels.attendingYes },
                { value: "no", label: labels.attendingNo }
              ].map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer items-center justify-between gap-3 border px-4 py-4 transition",
                    theme.id === "luxury-black-gold"
                      ? "border-[#d6b15f]/28"
                      : theme.id === "minimal-modern"
                        ? "rounded-md border-[#d7d0c4]"
                        : "rounded-lg border-black/10",
                    formData.attending === option.value
                      ? theme.id === "luxury-black-gold"
                        ? "bg-[#d6b15f] text-black"
                        : theme.id === "minimal-modern"
                          ? "bg-[#1f1f1d] text-white"
                          : theme.id === "arabic-royal"
                            ? "bg-[#0c3b2e] text-[#fff8ea]"
                            : "bg-[#d98b75] text-white"
                      : "bg-transparent"
                  )}
                >
                  <span>{option.label}</span>
                  <input
                    className="sr-only"
                    type="radio"
                    name="attending"
                    value={option.value}
                    checked={formData.attending === option.value}
                    onChange={(event) =>
                      updateField("attending", event.target.value as RSVPFormData["attending"])
                    }
                    required
                  />
                  {formData.attending === option.value ? (
                    <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                  ) : null}
                </label>
              ))}
            </div>
          </fieldset>

          <label className="mt-6 block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Utensils className="h-4 w-4" aria-hidden="true" />
              {labels.mealPreference}
            </span>
            <select
              className={theme.classes.input}
              value={formData.mealPreference}
              onChange={(event) => updateField("mealPreference", event.target.value)}
              required
            >
              <option value="" disabled>
                {labels.mealPreference}
              </option>
              {config.rsvp.mealOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label[language]}
                </option>
              ))}
            </select>
          </label>

          <label className="mt-6 block">
            <span className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {labels.message}
            </span>
            <textarea
              className={cn(theme.classes.input, "min-h-[9rem] resize-y")}
              value={formData.message}
              onChange={(event) => updateField("message", event.target.value)}
              placeholder={labels.messagePlaceholder}
            />
          </label>

          {error ? (
            <p className="mt-4 rounded-lg bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          ) : null}

          {success ? (
            <p className="mt-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-4 py-3 text-sm font-semibold text-emerald-700">
              <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
              {labels.success}
            </p>
          ) : null}

          <button className={cn(theme.classes.primaryButton, "mt-7 w-full sm:w-auto")} type="submit">
            <Send className="h-4 w-4" aria-hidden="true" />
            <span>{labels.submitRsvp}</span>
          </button>
        </form>
      </ScrollReveal>
    </section>
  );
}
