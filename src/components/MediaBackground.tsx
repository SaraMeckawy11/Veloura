import { useEffect, useState } from "react";
import type { WeddingConfig } from "../types";

type MediaBackgroundProps = {
  assets: WeddingConfig["assets"];
};

export function MediaBackground({ assets }: MediaBackgroundProps) {
  const [videoFailed, setVideoFailed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updatePreference = () => setReducedMotion(query.matches);

    updatePreference();
    query.addEventListener("change", updatePreference);

    return () => query.removeEventListener("change", updatePreference);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#eaf6f3]" aria-hidden="true">
      <img
        className="absolute left-1/2 top-1/2 h-full w-auto min-w-full -translate-x-1/2 -translate-y-1/2 object-cover object-center opacity-100 saturate-[0.96] sm:w-full sm:min-w-0 sm:object-[center_30%]"
        src={assets.poster}
        alt=""
      />
      {!reducedMotion && !videoFailed ? (
        <video
          className="absolute left-1/2 top-1/2 h-full w-auto min-w-full -translate-x-1/2 -translate-y-1/2 object-cover object-center opacity-100 shadow-[0_0_70px_rgba(107,126,67,0.2)] sm:w-full sm:min-w-0 sm:object-[center_30%]"
          autoPlay
          muted
          loop
          playsInline
          poster={assets.poster}
          onError={() => setVideoFailed(true)}
        >
          <source src={assets.heroVideo} type="video/mp4" />
        </video>
      ) : null}
      {!reducedMotion && videoFailed ? (
        <img
          className="absolute left-1/2 top-1/2 h-full w-auto min-w-full -translate-x-1/2 -translate-y-1/2 object-cover object-center opacity-95 sm:w-full sm:min-w-0 sm:object-[center_30%]"
          src={assets.heroGif}
          alt=""
        />
      ) : null}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_22%,rgba(255,255,246,0.16),transparent_46%)]" />
      <div className="watercolor-grain absolute inset-0" />
    </div>
  );
}
