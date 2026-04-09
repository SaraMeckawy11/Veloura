import { useLanguage } from "@/contexts/LanguageContext";
import { Globe } from "lucide-react";

const LanguageToggle = () => {
  const { lang, setLang } = useLanguage();

  return (
    <button
      onClick={() => setLang(lang === "en" ? "ar" : "en")}
      className="fixed top-4 right-4 z-50 bg-secondary text-secondary-foreground px-3 py-2 rounded-sm flex items-center gap-2 font-mono-data text-xs uppercase tracking-widest hover:bg-gold hover:text-foreground transition-colors shadow-lg"
      aria-label="Toggle language"
    >
      <Globe className="w-3.5 h-3.5" />
      {lang === "en" ? "عربي" : "EN"}
    </button>
  );
};

export default LanguageToggle;
