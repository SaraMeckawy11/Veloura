import type { ThemeDefinition, ThemeId } from "../types";

export const invitationTheme: ThemeDefinition = {
  id: "watercolor-garden",
  name: {
    en: "Watercolor Garden Gazebo",
    ar: "حديقة مائية ناعمة"
  },
  shortName: {
    en: "Watercolor",
    ar: "مائي"
  },
  description: {
    en: "Soft leaf green, ivory paper, pressed botanicals, warm gold, and a dreamy animated gazebo entrance.",
    ar: "سماء زرقاء ناعمة، ورق عاجي، خضرة حكيمية، ورود بيضاء، ومدخل متحرك حالِم."
  },
  accent: "#d98b75",
  previewClass: "bg-[linear-gradient(135deg,#d8eef8,#fff7df_43%,#f3c9c2_72%,#9dbd78)]",
  previewPattern: "watercolor-preview",
  classes: {
    page:
      "theme-watercolor min-h-screen overflow-hidden bg-[#fff9f1] font-sans text-[#314234]",
    nav:
      "border border-[#b9dff1]/60 bg-[#f4fbff]/78 text-[#314234] shadow-glow backdrop-blur-xl",
    section: "relative overflow-hidden px-5 py-20 sm:px-8 lg:px-12",
    sectionEyebrow:
      "font-sans text-xs uppercase tracking-[0.32em] text-[#c87960]",
    sectionTitle:
      "mt-3 font-serif text-4xl font-semibold leading-tight text-[#314234] sm:text-5xl lg:text-6xl",
    sectionLead: "mt-5 max-w-2xl text-base leading-8 text-[#6d725f]",
    hero:
      "relative flex min-h-screen items-center justify-center overflow-hidden px-5 text-center",
    heroFrame:
      "relative z-10 max-w-4xl px-6 py-12 sm:px-12",
    heroNames:
      "font-serif text-6xl font-semibold leading-none text-[#314234] sm:text-7xl lg:text-8xl",
    heroDate:
      "font-sans text-sm uppercase tracking-[0.32em] text-[#8a7332]",
    heroTagline:
      "mx-auto mt-6 max-w-2xl font-serif text-2xl leading-10 text-[#5d7046] sm:text-3xl",
    primaryButton:
      "inline-flex items-center justify-center gap-2 rounded-full bg-[#d98b75] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-glow transition hover:-translate-y-0.5 hover:bg-[#bf725f]",
    secondaryButton:
      "inline-flex items-center justify-center gap-2 rounded-full border border-[#d7b66a]/45 bg-[#fff7df]/82 px-5 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#725827] transition hover:-translate-y-0.5 hover:bg-[#fff7df]",
    card:
      "rounded-lg border border-[#b9dff1]/58 bg-[#fbfdff]/88 p-6 shadow-glow backdrop-blur",
    timerCard:
      "rounded-lg border border-[#b9dff1]/58 bg-[#fbfdff]/90 p-5 text-center shadow-glow backdrop-blur",
    input:
      "w-full rounded-2xl border border-[#b9dff1] bg-[#fbfdff]/92 px-4 py-3 text-[#314234] outline-none transition placeholder:text-[#94a5ad] focus:border-[#79bddb] focus:ring-4 focus:ring-[#79bddb]/18",
    footer:
      "relative overflow-hidden bg-[#dff3fb] px-5 py-16 text-center text-[#314234]",
    divider:
      "mx-auto mt-8 h-px w-32 bg-gradient-to-r from-transparent via-[#d98b75] to-transparent",
    galleryItem:
      "group relative min-h-[18rem] overflow-hidden rounded-lg border border-[#b9dff1]/58 shadow-glow"
  },
  motion: {
    heroInitial: { opacity: 0, filter: "blur(18px)", y: 28, scale: 0.98 },
    heroAnimate: { opacity: 1, filter: "blur(0px)", y: 0, scale: 1 },
    sectionOffset: 36
  }
};

export const themes: ThemeDefinition[] = [invitationTheme];
export const defaultThemeId: ThemeId = "watercolor-garden";

export function getThemeById() {
  return invitationTheme;
}
