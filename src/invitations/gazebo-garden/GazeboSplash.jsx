import { useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.* and AnimatePresence are used through JSX member expressions
import { motion, AnimatePresence } from 'framer-motion';

const SPLASH_VIDEO = '/assets/eal.mp4';
const SPLASH_PLAYBACK_RATE = 0.45;
const SPLASH_END_PADDING_MS = 700;
const FALLBACK_DISMISS_MS = 11000;

export default function GazeboSplash({ onDismiss }) {
  const ambientVideoRef = useRef(null);
  const foregroundVideoRef = useRef(null);
  const fallbackTimerRef = useRef(null);
  const hasOpenedRef = useRef(false);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    const videos = [ambientVideoRef.current, foregroundVideoRef.current].filter(Boolean);
    videos.forEach((video) => {
      try {
        video.pause();
        video.currentTime = 0;
      } catch {
        // Ignore — pause/seek may throw before metadata is ready.
      }
    });

    return () => {
      if (fallbackTimerRef.current) {
        window.clearTimeout(fallbackTimerRef.current);
      }
    };
  }, []);

  const finishOpening = () => {
    if (hasOpenedRef.current) return;
    hasOpenedRef.current = true;
    if (fallbackTimerRef.current) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    onDismiss();
  };

  const handleOpen = () => {
    if (opening || hasOpenedRef.current) return;
    setOpening(true);

    const videos = [ambientVideoRef.current, foregroundVideoRef.current].filter(Boolean);
    videos.forEach((video) => {
      try {
        video.currentTime = 0;
        video.playbackRate = SPLASH_PLAYBACK_RATE;
      } catch {
        // Ignore — fresh streams can throw on seek; play() below still works.
      }
    });

    const primaryVideo = foregroundVideoRef.current;
    const fallbackDelay =
      primaryVideo && Number.isFinite(primaryVideo.duration) && primaryVideo.duration > 0
        ? (primaryVideo.duration / SPLASH_PLAYBACK_RATE) * 1000 + SPLASH_END_PADDING_MS
        : FALLBACK_DISMISS_MS;

    fallbackTimerRef.current = window.setTimeout(finishOpening, fallbackDelay);

    Promise.allSettled(videos.map((video) => video.play())).then((results) => {
      if (results.every((result) => result.status === 'rejected')) {
        finishOpening();
      }
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        key="gazebo-splash"
        className={`gazebo-splash${opening ? ' gazebo-splash--opening' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Open invitation"
        onClick={handleOpen}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleOpen();
          }
        }}
        exit={{ opacity: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } }}
      >
        <video
          ref={ambientVideoRef}
          className="gazebo-splash-video gazebo-splash-video--ambient"
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        >
          <source src={SPLASH_VIDEO} type="video/mp4" />
        </video>
        <video
          ref={foregroundVideoRef}
          className="gazebo-splash-video gazebo-splash-video--foreground"
          muted
          playsInline
          preload="auto"
          onEnded={finishOpening}
          aria-hidden="true"
        >
          <source src={SPLASH_VIDEO} type="video/mp4" />
        </video>
        <div className="gazebo-splash-beige-texture" aria-hidden />
        <div className="gazebo-splash-overlay" aria-hidden />

        <motion.div
          className="gazebo-splash-copy"
          initial={{ opacity: 0, y: 18 }}
          animate={opening ? { opacity: 0, y: -18 } : { opacity: 1, y: 0 }}
          transition={{ duration: opening ? 0.6 : 0.9, delay: opening ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <strong>{opening ? 'Opening' : 'Tap to open'}</strong>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
