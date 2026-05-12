import type { ThemeDefinition } from "../types";

export function ThemeOrnaments({ theme }: { theme: ThemeDefinition }) {
  if (theme.id === "watercolor-garden") {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <span className="floating-petal left-[10%] top-[18%]" />
        <span className="floating-petal right-[13%] top-[26%] animation-delay-1" />
        <span className="floating-petal bottom-[22%] left-[18%] animation-delay-2" />
      </div>
    );
  }

  if (theme.id === "luxury-black-gold") {
    return (
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute inset-6 border border-[#d6b15f]/25" />
        <div className="absolute inset-10 border border-[#d6b15f]/10" />
      </div>
    );
  }

  if (theme.id === "minimal-modern") {
    return (
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute right-5 top-24 h-px w-1/3 bg-[#d8d1c6]" />
        <div className="absolute bottom-16 left-5 h-px w-1/4 bg-[#d8d1c6]" />
      </div>
    );
  }

  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div className="royal-corner left-6 top-6" />
      <div className="royal-corner right-6 top-6 rotate-90" />
      <div className="royal-corner bottom-6 right-6 rotate-180" />
      <div className="royal-corner bottom-6 left-6 -rotate-90" />
    </div>
  );
}
