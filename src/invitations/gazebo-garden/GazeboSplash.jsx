import { useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.* and AnimatePresence are used through JSX member expressions
import { motion, AnimatePresence } from 'framer-motion';

const SPLASH_FRAME_COUNT = 45;
const SPLASH_ANIMATION_DURATION = 1500;
const SPLASH_FRAMES = Array.from(
  { length: SPLASH_FRAME_COUNT },
  (_, index) => `/assets/gazebo-splash-frames/frame-${String(index).padStart(2, '0')}.jpg`,
);

export default function GazeboSplash({ onDismiss }) {
  const fallbackTimerRef = useRef(null);
  const frameAnimationRef = useRef(null);
  const hasOpenedRef = useRef(false);
  const [opening, setOpening] = useState(false);
  const [frameIndex, setFrameIndex] = useState(0);

  useEffect(() => {
    SPLASH_FRAMES.forEach((src) => {
      const image = new Image();
      image.src = src;
    });

    return () => {
      if (fallbackTimerRef.current) {
        window.clearTimeout(fallbackTimerRef.current);
      }
      if (frameAnimationRef.current) {
        window.cancelAnimationFrame(frameAnimationRef.current);
      }
    };
  }, []);

  const finishOpening = () => {
    if (hasOpenedRef.current) return;
    hasOpenedRef.current = true;
    if (fallbackTimerRef.current) {
      window.clearTimeout(fallbackTimerRef.current);
    }
    onDismiss();
  };

  const handleOpen = () => {
    if (opening) return;
    setOpening(true);

    const startTime = performance.now();
    const animateFrames = (now) => {
      const progress = Math.min((now - startTime) / SPLASH_ANIMATION_DURATION, 1);
      const nextFrame = Math.min(
        SPLASH_FRAME_COUNT - 1,
        Math.floor(progress * SPLASH_FRAME_COUNT),
      );
      setFrameIndex(nextFrame);

      if (progress < 1) {
        frameAnimationRef.current = window.requestAnimationFrame(animateFrames);
      }
    };

    frameAnimationRef.current = window.requestAnimationFrame(animateFrames);

    fallbackTimerRef.current = window.setTimeout(
      finishOpening,
      SPLASH_ANIMATION_DURATION + 180,
    );
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
        exit={{ opacity: 0, transition: { duration: 0.45 } }}
      >
        <div className="gazebo-splash-glow" aria-hidden />
        <div className="gazebo-splash-frame-scene" aria-hidden>
          <img
            className="gazebo-splash-frame"
            src={SPLASH_FRAMES[frameIndex]}
            alt=""
            draggable="false"
          />
        </div>
        <div className="gazebo-splash-overlay" aria-hidden />

        <motion.div
          className="gazebo-splash-copy"
          initial={{ opacity: 0, y: 18 }}
          animate={opening ? { opacity: 0, y: -18 } : { opacity: 1, y: 0 }}
          transition={{ duration: opening ? 0.35 : 0.9, delay: opening ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <strong>{opening ? 'Opening' : 'Tap to open'}</strong>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
