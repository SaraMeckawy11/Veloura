import { useCallback, useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.* is used through JSX member expressions
import { motion, AnimatePresence } from 'framer-motion';
import closedDoor from '../../assets/coastal/coastal-closed-door.webp';
import './coastal-splash.css';

const BIRDS = [
  { id: 0, top: 16, delay: 0, duration: 18, scale: 0.9 },
  { id: 1, top: 26, delay: 5, duration: 21, scale: 0.7 },
  { id: 2, top: 40, delay: 10, duration: 19, scale: 0.8 },
];

const AUTO_OPEN_MIN_MS = 1400;
const AUTO_OPEN_FALLBACK_MS = 2800;

export default function CoastalSplash({ onDismiss }) {
  const [opening, setOpening] = useState(false);
  const [fading, setFading] = useState(false);
  const openingRef = useRef(false);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  const handleOpen = useCallback(() => {
    if (openingRef.current) return;
    openingRef.current = true;
    setOpening(true);
    // Let the opened door settle, then dissolve promptly over the invitation below.
    setTimeout(() => setFading(true), 4450);
    setTimeout(() => onDismissRef.current(), 5150);
  }, []);

  useEffect(() => {
    let cancelled = false;
    let openTimer = null;
    let fallbackTimer = null;
    let openScheduled = false;
    const startedAt = performance.now();

    const scheduleOpen = () => {
      if (cancelled || openScheduled) return;
      openScheduled = true;
      const elapsed = performance.now() - startedAt;
      const delay = Math.max(AUTO_OPEN_MIN_MS - elapsed, 0);
      openTimer = window.setTimeout(() => {
        if (!cancelled) handleOpen();
      }, delay);
    };

    const image = new Image();
    image.src = closedDoor;
    fallbackTimer = window.setTimeout(scheduleOpen, AUTO_OPEN_FALLBACK_MS);

    if (image.decode) {
      image.decode()
        .catch(() => undefined)
        .then(() => {
          window.clearTimeout(fallbackTimer);
          scheduleOpen();
        });
    } else {
      image.onload = () => {
        window.clearTimeout(fallbackTimer);
        scheduleOpen();
      };
      image.onerror = scheduleOpen;
    }

    return () => {
      cancelled = true;
      window.clearTimeout(openTimer);
      window.clearTimeout(fallbackTimer);
      image.onload = null;
      image.onerror = null;
    };
  }, [handleOpen]);

  const swingDuration = 4.25;
  const swingEase = [0.45, 0, 0.2, 1];

  return (
    <AnimatePresence>
      <motion.div
        key="coastal-splash"
        className={`coastal-splash${opening ? ' coastal-splash-opening' : ''}`}
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
        animate={fading ? { opacity: 0 } : { opacity: 1 }}
        transition={fading ? { duration: 0.55, ease: 'easeInOut' } : { duration: 0.2 }}
        exit={{ opacity: 0, transition: { duration: 0.7, ease: 'easeOut' } }}
      >
        <div className="coastal-splash-stage" aria-hidden>
          <div className="coastal-door-frame">
            <div className="coastal-closed-door" aria-hidden>
              <motion.div
                className="coastal-door-panel coastal-door-panel-left"
                style={{ backgroundImage: `url(${closedDoor})` }}
                initial={{ rotateY: 0, x: 0, filter: 'brightness(1)' }}
                animate={
                  opening
                    ? {
                      rotateY: -105,
                      x: '-1.4%',
                      filter: 'brightness(0.72) saturate(0.9)',
                    }
                    : { rotateY: 0, x: 0, filter: 'brightness(1)' }
                }
                transition={{ duration: swingDuration, ease: swingEase }}
              />
              <motion.div
                className="coastal-door-panel coastal-door-panel-right"
                style={{ backgroundImage: `url(${closedDoor})` }}
                initial={{ rotateY: 0, x: 0, filter: 'brightness(1)' }}
                animate={
                  opening
                    ? {
                      rotateY: 105,
                      x: '1.4%',
                      filter: 'brightness(0.72) saturate(0.9)',
                    }
                    : { rotateY: 0, x: 0, filter: 'brightness(1)' }
                }
                transition={{ duration: swingDuration, ease: swingEase }}
              />
              <motion.div
                className="coastal-door-seam"
                animate={opening ? { opacity: 0, scaleY: 0 } : { opacity: 1, scaleY: 1 }}
                transition={{ duration: 0.65, ease: 'easeOut' }}
              />
              <motion.div
                className="coastal-door-glow"
                initial={{ opacity: 0, scaleX: 0.72 }}
                animate={opening ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0.72 }}
                transition={{ duration: swingDuration * 0.56, delay: swingDuration * 0.12, ease: 'easeOut' }}
              />
            </div>
          </div>

          <motion.div
            className="coastal-splash-vignette"
            aria-hidden
            animate={opening ? { opacity: 0 } : { opacity: 1 }}
            transition={{ duration: swingDuration * 0.6, ease: 'easeOut' }}
          />

          <div className="coastal-bird-layer" aria-hidden>
            {BIRDS.map((bird) => (
              <span
                key={bird.id}
                className="coastal-bird"
                style={{
                  top: `${bird.top}%`,
                  animationDelay: `${bird.delay}s`,
                  animationDuration: `${bird.duration}s`,
                  transform: `scale(${bird.scale})`,
                }}
              />
            ))}
          </div>
        </div>

        <motion.div
          className="coastal-splash-copy"
          animate={opening ? { opacity: 0, y: -16 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <span className="coastal-splash-eyebrow">You are invited to</span>
          <p className="coastal-splash-script">the wedding</p>
          <span className="coastal-splash-hint">Opening the doors</span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
