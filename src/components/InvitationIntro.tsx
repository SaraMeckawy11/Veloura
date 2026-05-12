import { motion } from "framer-motion";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Language, WeddingConfig } from "../types";

type InvitationIntroProps = {
  config: WeddingConfig;
  language: Language;
  openLabel: string;
  onOpen: () => void;
};

export function InvitationIntro({
  config,
  language,
  openLabel,
  onOpen
}: InvitationIntroProps) {
  const ambientVideoRef = useRef<HTMLVideoElement | null>(null);
  const foregroundVideoRef = useRef<HTMLVideoElement | null>(null);
  const fallbackTimerRef = useRef<number | null>(null);
  const hasOpenedRef = useRef(false);
  const [isOpening, setIsOpening] = useState(false);

  useEffect(() => {
    return () => {
      if (fallbackTimerRef.current) {
        window.clearTimeout(fallbackTimerRef.current);
      }
    };
  }, []);

  const openInvitation = () => {
    if (hasOpenedRef.current) {
      return;
    }

    hasOpenedRef.current = true;

    if (fallbackTimerRef.current) {
      window.clearTimeout(fallbackTimerRef.current);
    }

    onOpen();
  };

  const playIntro = () => {
    if (isOpening) {
      return;
    }

    setIsOpening(true);

    const videos = [ambientVideoRef.current, foregroundVideoRef.current].filter(
      (video): video is HTMLVideoElement => Boolean(video)
    );

    videos.forEach((video) => {
      video.currentTime = 0;
      video.playbackRate = 1;
    });

    const primaryVideo = foregroundVideoRef.current;
    const fallbackDelay =
      primaryVideo && Number.isFinite(primaryVideo.duration) && primaryVideo.duration > 0
        ? primaryVideo.duration * 1000 + 160
        : 1200;

    fallbackTimerRef.current = window.setTimeout(openInvitation, fallbackDelay);

    Promise.allSettled(videos.map((video) => video.play())).then((results) => {
      if (results.every((result) => result.status === "rejected")) {
        openInvitation();
      }
    });
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      playIntro();
    }
  };

  return (
    <section
      className="fixed inset-0 z-[100] cursor-pointer overflow-hidden bg-[#eff8dc] text-[#314234] outline-none"
      role="button"
      tabIndex={0}
      onClick={playIntro}
      onKeyDown={handleKeyDown}
      aria-label={openLabel}
    >
      <video
        ref={ambientVideoRef}
        className="absolute inset-0 h-full w-full scale-110 object-cover opacity-45 blur-xl saturate-[0.9]"
        muted
        playsInline
        preload="auto"
        aria-hidden="true"
      >
        <source src={config.assets.splashVideo} type="video/mp4" />
      </video>
      <video
        ref={foregroundVideoRef}
        className="absolute left-1/2 top-1/2 z-10 h-full w-auto min-w-full -translate-x-1/2 -translate-y-1/2 object-cover shadow-[0_0_70px_rgba(107,126,67,0.18)] sm:min-w-0"
        muted
        playsInline
        preload="auto"
        onEnded={openInvitation}
      >
        <source src={config.assets.splashVideo} type="video/mp4" />
      </video>
      <div className="absolute inset-0 z-20 bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,245,0),rgba(238,248,219,0.1)_42%,rgba(60,76,43,0.16)),linear-gradient(180deg,rgba(255,255,255,0.2),transparent_24%,transparent_72%,rgba(247,251,239,0.94))]" />

      <motion.div
        className="pointer-events-none absolute inset-x-0 bottom-8 z-30 flex justify-center px-5 text-center sm:bottom-10"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <div>
          <p className="font-sans text-[0.65rem] font-semibold uppercase tracking-[0.34em] text-[#6f7f47]">
            {config.displayDate[language]}
          </p>
          <p className="mt-3 rounded-full border border-[#c7a35b]/45 bg-[#fff9e8]/70 px-5 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#8b6a2e] shadow-[0_16px_42px_rgba(122,108,58,0.16)] backdrop-blur-md">
            {isOpening ? "Opening" : openLabel}
          </p>
        </div>
      </motion.div>
    </section>
  );
}
