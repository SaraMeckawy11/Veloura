import { useCallback, useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.* is used through JSX member expressions
import { motion, AnimatePresence } from 'framer-motion';
import splashCurtainUrl from '../../assets/theater/splashCurtain.webp';
import './theater-splash.css';

const AUTO_OPEN_MIN_MS = 300;
const AUTO_OPEN_FALLBACK_MS = 1500;

export default function TheaterSplash({ onReady, onDismiss }) {
  const [fading, setFading] = useState(false);
  const [ready, setReady] = useState(false);
  const dismissRef = useRef(onDismiss);
  const onReadyRef = useRef(onReady);
  const assetReadyRef = useRef(false);
  const openingRef = useRef(false);
  const fadeTimerRef = useRef(0);
  const exitTimerRef = useRef(0);

  useEffect(() => {
    onReadyRef.current = onReady;
    dismissRef.current = onDismiss;
  }, [onReady, onDismiss]);

  const markReady = useCallback(() => {
    if (assetReadyRef.current) return;
    assetReadyRef.current = true;
    onReadyRef.current?.();
  }, []);

  const startOpening = useCallback(() => {
    if (!assetReadyRef.current || openingRef.current) return;
    openingRef.current = true;
    setReady(true);
    window.clearTimeout(fadeTimerRef.current);
    window.clearTimeout(exitTimerRef.current);
    fadeTimerRef.current = window.setTimeout(() => setFading(true), 900);
    exitTimerRef.current = window.setTimeout(() => dismissRef.current?.(), 1250);
  }, []);

  useEffect(() => () => {
    window.clearTimeout(fadeTimerRef.current);
    window.clearTimeout(exitTimerRef.current);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let openTimer = 0;
    let fallbackTimer = 0;
    let openScheduled = false;
    const startedAt = performance.now();
    const img = new Image();

    const scheduleOpen = () => {
      if (cancelled || openScheduled) return;
      markReady();
      openScheduled = true;
      const elapsed = performance.now() - startedAt;
      const delay = Math.max(AUTO_OPEN_MIN_MS - elapsed, 0);
      openTimer = window.setTimeout(() => {
        if (!cancelled) startOpening();
      }, delay);
    };

    img.onload = scheduleOpen;
    img.onerror = scheduleOpen;
    img.src = splashCurtainUrl;
    fallbackTimer = window.setTimeout(scheduleOpen, AUTO_OPEN_FALLBACK_MS);
    if (img.complete) scheduleOpen();

    return () => {
      cancelled = true;
      window.clearTimeout(openTimer);
      window.clearTimeout(fallbackTimer);
      img.onload = null;
      img.onerror = null;
    };
  }, [markReady, startOpening]);

  return (
    <AnimatePresence>
      <motion.div
        key="theater-splash"
        className={`theater-splash${ready ? ' is-ready' : ''}`}
        role="button"
        tabIndex={0}
        aria-label="Open invitation"
        onClick={startOpening}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            startOpening();
          }
        }}
        animate={fading ? { opacity: 0 } : { opacity: 1 }}
        transition={fading ? { duration: 0.65, ease: 'easeInOut' } : { duration: 0.2 }}
        exit={{ opacity: 0, transition: { duration: 0.55, ease: 'easeOut' } }}
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
