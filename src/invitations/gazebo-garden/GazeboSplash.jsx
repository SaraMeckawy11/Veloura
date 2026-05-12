import { useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.* and AnimatePresence are used through JSX member expressions
import { motion, AnimatePresence } from 'framer-motion';

const SPLASH_VIDEO = '/assets/eal.mp4';
const EXIT_DURATION_MS = 450;

export default function GazeboSplash({ onDismiss }) {
  const ambientVideoRef = useRef(null);
  const foregroundVideoRef = useRef(null);
  const dismissTimerRef = useRef(null);
  const hasOpenedRef = useRef(false);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    const videos = [ambientVideoRef.current, foregroundVideoRef.current].filter(Boolean);

    const safePlay = (video) => {
      if (!video || !video.paused) return;
      const result = video.play();
      if (result && typeof result.catch === 'function') {
        result.catch(() => undefined);
      }
    };

    videos.forEach(safePlay);

    const cleanups = videos.map((video) => {
      const onCanPlay = () => safePlay(video);
      video.addEventListener('canplay', onCanPlay);
      video.addEventListener('loadeddata', onCanPlay);
      return () => {
        video.removeEventListener('canplay', onCanPlay);
        video.removeEventListener('loadeddata', onCanPlay);
      };
    });

    return () => {
      cleanups.forEach((fn) => fn());
      if (dismissTimerRef.current) {
        window.clearTimeout(dismissTimerRef.current);
      }
    };
  }, []);

  const handleOpen = (event) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (opening || hasOpenedRef.current) return;
    hasOpenedRef.current = true;
    setOpening(true);
    dismissTimerRef.current = window.setTimeout(onDismiss, EXIT_DURATION_MS);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="gazebo-splash"
        className={`gazebo-splash${opening ? ' gazebo-splash--opening' : ''}`}
        aria-hidden={opening ? 'true' : undefined}
        exit={{ opacity: 0, transition: { duration: 0.45 } }}
      >
        <video
          ref={ambientVideoRef}
          className="gazebo-splash-video gazebo-splash-video--ambient"
          muted
          autoPlay
          loop
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
          autoPlay
          loop
          playsInline
          preload="auto"
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
          transition={{ duration: opening ? 0.35 : 0.9, delay: opening ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <button
            type="button"
            className="gazebo-splash-button"
            onClick={handleOpen}
            disabled={opening}
            aria-label="Open invitation"
          >
            {opening ? 'Opening' : 'Tap to open'}
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
