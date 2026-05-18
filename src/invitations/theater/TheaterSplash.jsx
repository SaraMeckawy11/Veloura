import { useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.* is used through JSX member expressions
import { motion, AnimatePresence } from 'framer-motion';
import './theater-splash.css';

export default function TheaterSplash({ onDismiss }) {
  const [fading, setFading] = useState(false);
  const videoRef = useRef(null);
  const dismissRef = useRef(onDismiss);

  // Keep the latest dismiss handler available without re-running the timer effect.
  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.muted = true;
      video.playsInline = true;
      const playPromise = video.play();
      if (playPromise?.catch) playPromise.catch(() => undefined);
    }

    // Auto-dismiss after the curtain has finished parting.
    const fadeTimer = window.setTimeout(() => setFading(true), 3200);
    const exitTimer = window.setTimeout(() => dismissRef.current?.(), 4000);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(exitTimer);
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        key="theater-splash"
        className="theater-splash"
        aria-hidden
        animate={fading ? { opacity: 0 } : { opacity: 1 }}
        transition={fading ? { duration: 0.8, ease: 'easeInOut' } : { duration: 0.2 }}
        exit={{ opacity: 0, transition: { duration: 0.7, ease: 'easeOut' } }}
      >
        <video
          ref={videoRef}
          className="theater-splash-video"
          src="/assets/curtain.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        <div className="theater-splash-vignette" aria-hidden />
      </motion.div>
    </AnimatePresence>
  );
}
