import { useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.* and AnimatePresence are used through JSX member expressions
import { motion, AnimatePresence } from 'framer-motion';

export default function GazeboSplash({ displayDate, coupleInitials, onDismiss }) {
  const fallbackTimerRef = useRef(null);
  const hasOpenedRef = useRef(false);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
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
    }
    onDismiss();
  };

  const handleOpen = () => {
    if (opening) return;
    setOpening(true);

    fallbackTimerRef.current = window.setTimeout(finishOpening, 1750);
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
        <div className="gazebo-bird-flight" aria-hidden>
          <span />
          <span />
          <span />
        </div>
        <div className="gazebo-envelope-scene" aria-hidden>
          <div className="gazebo-envelope-shadow" />
          <div className="gazebo-envelope">
            <div className="gazebo-envelope-back" />
            <div className="gazebo-envelope-card">
              <span>{displayDate}</span>
            </div>
            <div className="gazebo-envelope-panel gazebo-envelope-panel--left" />
            <div className="gazebo-envelope-panel gazebo-envelope-panel--right" />
            <div className="gazebo-envelope-panel gazebo-envelope-panel--bottom" />
            <div className="gazebo-envelope-flap" />
            <div className="gazebo-envelope-seal">
              <span>{coupleInitials}</span>
            </div>
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
