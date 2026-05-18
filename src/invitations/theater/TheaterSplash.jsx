import { useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.* is used through JSX member expressions
import { motion, AnimatePresence } from 'framer-motion';
import './theater-splash.css';

export default function TheaterSplash({ onDismiss }) {
  const [fading, setFading] = useState(false);
  const dismissRef = useRef(onDismiss);

  // Keep the latest dismiss handler available without re-running the timer effect.
  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setFading(true), 3000);
    const exitTimer = window.setTimeout(() => dismissRef.current?.(), 3650);
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
        <div className="theater-splash-stage" aria-hidden>
          <span className="theater-splash-footlights" />
        </div>
        <span className="theater-splash-valance" aria-hidden />
        <span className="theater-splash-curtain theater-splash-curtain-left" aria-hidden />
        <span className="theater-splash-curtain theater-splash-curtain-right" aria-hidden />
        <div className="theater-splash-vignette" aria-hidden />
      </motion.div>
    </AnimatePresence>
  );
}
