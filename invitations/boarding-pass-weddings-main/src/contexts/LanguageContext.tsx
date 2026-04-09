import { createContext, useContext, useState, ReactNode } from "react";

type Lang = "en" | "ar";

interface Translations {
  [key: string]: { en: string; ar: string };
}

const translations: Translations = {
  passenger: { en: "PASSENGER", ar: "المسافر" },
  flight: { en: "FLIGHT", ar: "الرحلة" },
  destination: { en: "DESTINATION", ar: "الوجهة" },
  gate: { en: "GATE", ar: "البوابة" },
  seat: { en: "SEAT", ar: "المقعد" },
  forever: { en: "FOREVER", ar: "للأبد" },
  confirmed: { en: "CONFIRMED", ar: "مؤكد" },
  boardingIn: { en: "BOARDING IN", ar: "الصعود خلال" },
  days: { en: "DAYS", ar: "أيام" },
  hours: { en: "HOURS", ar: "ساعات" },
  minutes: { en: "MINUTES", ar: "دقائق" },
  seconds: { en: "SECONDS", ar: "ثوانٍ" },
  ourStory: { en: "OUR STORY", ar: "قصتنا" },
  flightRoute: { en: "FLIGHT ROUTE", ar: "مسار الرحلة" },
  eventDetails: { en: "EVENT DETAILS", ar: "تفاصيل الحدث" },
  ceremony: { en: "CEREMONY", ar: "حفل الزواج" },
  reception: { en: "RECEPTION", ar: "حفل الاستقبال" },
  terminal: { en: "TERMINAL", ar: "المحطة" },
  boarding: { en: "BOARDING", ar: "الصعود" },
  flightNo: { en: "FLIGHT NO", ar: "رقم الرحلة" },
  confirmSeat: { en: "CONFIRM YOUR SEAT", ar: "أكد مقعدك" },
  checkIn: { en: "CHECK IN", ar: "تسجيل الوصول" },
  guestName: { en: "PASSENGER NAME", ar: "اسم المسافر" },
  guestCount: { en: "NUMBER OF PASSENGERS", ar: "عدد المسافرين" },
  attending: { en: "WILL YOU BE BOARDING?", ar: "هل ستصعد على متن الطائرة؟" },
  yes: { en: "YES", ar: "نعم" },
  no: { en: "NO", ar: "لا" },
  mealPref: { en: "MEAL PREFERENCE", ar: "تفضيل الوجبة" },
  message: { en: "MESSAGE TO CREW", ar: "رسالة للطاقم" },
  standard: { en: "Standard", ar: "عادي" },
  vegetarian: { en: "Vegetarian", ar: "نباتي" },
  vegan: { en: "Vegan", ar: "نباتي صرف" },
  halal: { en: "Halal", ar: "حلال" },
  gallery: { en: "WINDOW VIEWS", ar: "إطلالات النافذة" },
  thankYou: { en: "Thank you for flying with us", ar: "شكراً لسفركم معنا" },
  tagline: { en: "Two Souls, One Destination.", ar: "روحان، وجهة واحدة." },
  checkInComplete: { en: "Check-in Complete. See you at the gate.", ar: "تم تسجيل الوصول. نراكم عند البوابة." },
  boardingPass: { en: "BOARDING PASS", ar: "بطاقة الصعود" },
  locationMap: { en: "LOCATION MAP", ar: "خريطة الموقع" },
};

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLang] = useState<Lang>("en");
  const isRTL = lang === "ar";

  const t = (key: string) => {
    return translations[key]?.[lang] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL }}>
      <div dir={isRTL ? "rtl" : "ltr"} className={isRTL ? "font-arabic" : ""}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};
