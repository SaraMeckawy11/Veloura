import { useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.* is used through JSX member expressions
import { motion, AnimatePresence } from 'framer-motion';
import splashCurtainUrl from '../../assets/theater/splashCurtain.webp';
import './theater-splash.css';

export default function TheaterSplash({ onDismiss }) {
  const [fading, setFading] = useState(false);
  const [ready, setReady] = useState(false);
  const dismissRef = useRef(onDismiss);

  // Keep the latest dismiss handler available without re-running the timer effect.
  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  // Preload the curtain image. The CSS holds the curtains and stage paused
  // (and keeps the splash backdrop opaque) until `ready` flips, so the hero
  // text under the splash can't peek through before the curtain is visible.
  useEffect(() => {
    const img = new Image();
    const markReady = () => setReady(true);
    img.onload = markReady;
    img.onerror = markReady; // fail open — never block the splash forever
    img.src = splashCurtainUrl;
    if (img.complete) markReady();
  }, []);

  // Only schedule the fade/dismiss after the curtain has actually appeared.
  useEffect(() => {
    if (!ready) return undefined;
    const fadeTimer = window.setTimeout(() => setFading(true), 3700);
    const exitTimer = window.setTimeout(() => dismissRef.current?.(), 4350);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(exitTimer);
    };
  }, [ready]);

  return (
    <AnimatePresence>
      <motion.div
        key="theater-splash"
        className={`theater-splash${ready ? ' is-ready' : ''}`}
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
