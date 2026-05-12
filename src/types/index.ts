import type { Target, TargetAndTransition } from "framer-motion";

export type Language = "en" | "ar";

export type ThemeId =
  | "watercolor-garden"
  | "luxury-black-gold"
  | "minimal-modern"
  | "arabic-royal";

export type LocalizedText = Record<Language, string>;

export type StoryItem = {
  id: string;
  date: LocalizedText;
  title: LocalizedText;
  body: LocalizedText;
  imageLabel: LocalizedText;
  tone: string;
};

export type GalleryItem = {
  id: string;
  title: LocalizedText;
  caption: LocalizedText;
  tone: string;
};

export type RSVPOption = {
  value: string;
  label: LocalizedText;
};

export type WeddingConfig = {
  sampleUuid: string;
  couple: {
    displayName: LocalizedText;
    firstNames: LocalizedText;
    monogram: LocalizedText;
  };
  weddingDate: string;
  displayDate: LocalizedText;
  tagline: LocalizedText;
  story: StoryItem[];
  event: {
    ceremonyTitle: LocalizedText;
    dateTime: LocalizedText;
    venueName: LocalizedText;
    address: LocalizedText;
    mapEmbedUrl: string;
    mapUrl: string;
  };
  gallery: GalleryItem[];
  rsvp: {
    guestCounts: number[];
    mealOptions: RSVPOption[];
  };
  assets: {
    splashVideo: string;
    heroVideo: string;
    heroGif: string;
    poster: string;
  };
};

export type ThemeDefinition = {
  id: ThemeId;
  name: LocalizedText;
  shortName: LocalizedText;
  description: LocalizedText;
  accent: string;
  previewClass: string;
  previewPattern: string;
  directionBias?: "rtl" | "ltr";
  classes: {
    page: string;
    nav: string;
    section: string;
    sectionEyebrow: string;
    sectionTitle: string;
    sectionLead: string;
    hero: string;
    heroFrame: string;
    heroNames: string;
    heroDate: string;
    heroTagline: string;
    primaryButton: string;
    secondaryButton: string;
    card: string;
    timerCard: string;
    input: string;
    footer: string;
    divider: string;
    galleryItem: string;
  };
  motion: {
    heroInitial: Target;
    heroAnimate: TargetAndTransition;
    sectionOffset: number;
  };
};

export type RSVPFormData = {
  guestName: string;
  guestCount: string;
  attending: "yes" | "no" | "";
  mealPreference: string;
  message: string;
};

export type StoredRSVP = RSVPFormData & {
  uuid: string;
  savedAt: string;
};
