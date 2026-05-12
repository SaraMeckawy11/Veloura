import { useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.* and AnimatePresence are used through JSX member expressions
import { motion, AnimatePresence } from 'framer-motion';

const SPLASH_FRAME_COUNT = 16;
const SPLASH_FRAME_DURATION = 70;
const SPLASH_FRAMES = Array.from(
  { length: SPLASH_FRAME_COUNT },
  (_, index) => `/assets/gazebo-splash-frames/frame-${String(index).padStart(2, '0')}.jpg`,
);

export default function GazeboSplash({ displayDate, coupleInitials, onDismiss }) {
  const fallbackTimerRef = useRef(null);
  const frameTimerRef = useRef(null);
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
      if (frameTimerRef.current) {
        window.clearInterval(frameTimerRef.current);
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

    let nextFrame = 0;
    frameTimerRef.current = window.setInterval(() => {
      nextFrame += 1;
      setFrameIndex(Math.min(nextFrame, SPLASH_FRAME_COUNT - 1));
      if (nextFrame >= SPLASH_FRAME_COUNT - 1 && frameTimerRef.current) {
        window.clearInterval(frameTimerRef.current);
      }
    }, SPLASH_FRAME_DURATION);

    fallbackTimerRef.current = window.setTimeout(
      finishOpening,
      SPLASH_FRAME_COUNT * SPLASH_FRAME_DURATION + 260,
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
          <div className="gazebo-splash-paper-texture" />
          <div className="gazebo-splash-seal">
            <span>{coupleInitials}</span>
          </div>
        </div>
        <div className="gazebo-splash-overlay" aria-hidden />

        <motion.div
          className="gazebo-splash-copy"
          initial={{ opacity: 0, y: 18 }}
          animate={opening ? { opacity: 0, y: -18 } : { opacity: 1, y: 0 }}
          transition={{ duration: opening ? 0.35 : 0.9, delay: opening ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            {displayDate && <span>{displayDate}</span>}
            <strong>{opening ? 'Opening' : 'Tap to open'}</strong>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
