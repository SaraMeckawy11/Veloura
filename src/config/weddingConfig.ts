import type { WeddingConfig } from "../types";

export const weddingConfig: WeddingConfig = {
  sampleUuid: "7f6b9d24-3f14-45c3-9d1e-lina-omar-2026",
  couple: {
    displayName: {
      en: "Lina & Omar",
      ar: "لينا وعمر"
    },
    firstNames: {
      en: "Lina and Omar",
      ar: "لينا و عمر"
    },
    monogram: {
      en: "L&O",
      ar: "ل ع"
    }
  },
  weddingDate: "2026-06-06T17:30:00+02:00",
  displayDate: {
    en: "06.06.2026",
    ar: "السبت، 12 ديسمبر 2026"
  },
  tagline: {
    en: "A garden promise sealed in soft light.",
    ar: "وعد حب في حديقة يلامسها الضوء."
  },
  story: [
    {
      id: "first-glance",
      date: {
        en: "Spring 2021",
        ar: "ربيع 2021"
      },
      title: {
        en: "The First Hello",
        ar: "أول لقاء"
      },
      body: {
        en: "A quiet afternoon, a table by the window, and a conversation that somehow felt familiar from the very first minute.",
        ar: "كان عصرًا هادئًا، وطاولة قرب النافذة، وحديثًا بدا مألوفًا منذ الدقيقة الأولى."
      },
      imageLabel: {
        en: "Cafe light",
        ar: "ضوء المقهى"
      },
      tone: "linear-gradient(135deg, #cdeefa, #fffaf0 48%, #f5c8c0)"
    },
    {
      id: "favorite-city",
      date: {
        en: "Summer 2023",
        ar: "صيف 2023"
      },
      title: {
        en: "A City Became Ours",
        ar: "مدينة صارت لنا"
      },
      body: {
        en: "Weekend walks turned into a map of favorite corners, late dinners, old streets, and tiny rituals only they understood.",
        ar: "تحولت نزهات نهاية الأسبوع إلى خريطة من الزوايا المفضلة، والعشاء المتأخر، والشوارع القديمة، وطقوس صغيرة لا يفهمها سواهما."
      },
      imageLabel: {
        en: "Old street",
        ar: "شارع قديم"
      },
      tone: "linear-gradient(135deg, #d9f2fb, #fffaf0 48%, #fff1b8)"
    },
    {
      id: "proposal",
      date: {
        en: "Winter 2025",
        ar: "شتاء 2025"
      },
      title: {
        en: "The Question",
        ar: "السؤال الأجمل"
      },
      body: {
        en: "Under soft lights and winter flowers, a yes arrived before the sentence was even finished.",
        ar: "تحت أضواء ناعمة وزهور شتوية، جاءت كلمة نعم قبل أن تكتمل الجملة."
      },
      imageLabel: {
        en: "Winter florals",
        ar: "زهور الشتاء"
      },
      tone: "linear-gradient(135deg, #cdeefa, #fff7df 52%, #f6d5cf)"
    }
  ],
  event: {
    ceremonyTitle: {
      en: "Garden Ceremony & Evening Reception",
      ar: "مراسم الحديقة وحفل المساء"
    },
    dateTime: {
      en: "06.06.2026 at 5:30 PM",
      ar: "12 ديسمبر 2026، الساعة 5:30 مساءً"
    },
    venueName: {
      en: "Villa Aurelia Gardens",
      ar: "حدائق فيلا أوريليا"
    },
    address: {
      en: "Largo di Porta San Pancrazio, 1, 00153 Rome, Italy",
      ar: "لارغو دي بورتا سان بانكرازيو 1، روما، إيطاليا"
    },
    mapEmbedUrl:
      "https://www.google.com/maps?q=Villa%20Aurelia%20Rome&output=embed",
    mapUrl: "https://www.google.com/maps/search/?api=1&query=Villa%20Aurelia%20Rome"
  },
  gallery: [
    {
      id: "garden",
      title: {
        en: "Garden Light",
        ar: "نور الحديقة"
      },
      caption: {
        en: "Soft greens and white petals",
        ar: "خضرة ناعمة وبتلات بيضاء"
      },
      tone: "linear-gradient(135deg, #cdeefa, #fffaf2 48%, #a8c98a)"
    },
    {
      id: "rings",
      title: {
        en: "The Promise",
        ar: "الوعد"
      },
      caption: {
        en: "A detail to remember",
        ar: "تفصيل يبقى في الذاكرة"
      },
      tone: "linear-gradient(135deg, #d9f2fb, #fffaf0 48%, #d7a95d)"
    },
    {
      id: "table",
      title: {
        en: "Dinner Glow",
        ar: "دفء العشاء"
      },
      caption: {
        en: "Candles, linen, and laughter",
        ar: "شموع وكتان وضحكات"
      },
      tone: "linear-gradient(135deg, #f5c8c0, #f5fbff 50%, #cdeefa)"
    },
    {
      id: "bouquet",
      title: {
        en: "White Bouquet",
        ar: "باقة بيضاء"
      },
      caption: {
        en: "Ivory florals gathered softly",
        ar: "زهور عاجية بلمسة ناعمة"
      },
      tone: "linear-gradient(135deg, #fffaf2, #cdeefa 48%, #f0d0c8)"
    },
    {
      id: "venue",
      title: {
        en: "The Venue",
        ar: "المكان"
      },
      caption: {
        en: "A villa framed by evening sky",
        ar: "فيلا يعانقها ضوء المساء"
      },
      tone: "linear-gradient(135deg, #cdeefa, #fff7df 52%, #d6b66a)"
    },
    {
      id: "finale",
      title: {
        en: "Last Dance",
        ar: "الرقصة الأخيرة"
      },
      caption: {
        en: "A midnight memory",
        ar: "ذكرى عند منتصف الليل"
      },
      tone: "linear-gradient(135deg, #d9f2fb, #fffaf2 54%, #95b874)"
    }
  ],
  rsvp: {
    guestCounts: [1, 2, 3, 4, 5, 6],
    mealOptions: [
      {
        value: "classic",
        label: {
          en: "Classic dinner",
          ar: "العشاء الكلاسيكي"
        }
      },
      {
        value: "vegetarian",
        label: {
          en: "Vegetarian",
          ar: "نباتي"
        }
      },
      {
        value: "seafood",
        label: {
          en: "Seafood",
          ar: "مأكولات بحرية"
        }
      },
      {
        value: "kids",
        label: {
          en: "Children's meal",
          ar: "وجبة أطفال"
        }
      }
    ]
  },
  assets: {
    splashVideo: "/assets/eal.mp4",
    heroVideo: "/assets/gazebo-watercolor2.mp4",
    heroGif: "/assets/gazebo-watercolor.gif",
    poster: "/assets/gazebo-watercolor-poster1.jpg"
  }
};
