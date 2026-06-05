import { useCallback, useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.* and AnimatePresence are used through JSX member expressions
import { motion, AnimatePresence } from 'framer-motion';
import EnvelopeSpriteAnimation from '../shared/EnvelopeSpriteAnimation';

// Settle the opened envelope briefly before dissolving, and keep a fallback in
// case the sprite never loads (offline / decode failure) so the splash can't
// trap the viewer on a blank screen.
const END_PADDING_MS = 320;
const FALLBACK_DISMISS_MS = 4600;

export default function GazeboSplash({ onReady, onDismiss }) {
  const dismissTimerRef = useRef(null);
  const hasOpenedRef = useRef(false);
  const readyRef = useRef(false);
  const onReadyRef = useRef(onReady);
  const onDismissRef = useRef(onDismiss);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    onReadyRef.current = onReady;
    onDismissRef.current = onDismiss;
  }, [onReady, onDismiss]);

  const markReady = useCallback(() => {
    if (readyRef.current) return;
    readyRef.current = true;
    onReadyRef.current?.();
  }, []);

  const finishOpening = useCallback(() => {
    if (hasOpenedRef.current) return;
    hasOpenedRef.current = true;

    if (dismissTimerRef.current) {
      window.clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }

    // Let the opened envelope settle, then dissolve the splash so the hero
    // section underneath is revealed (only after the animation has played).
    setFading(true);
    window.setTimeout(() => onDismissRef.current(), 700);
  }, []);

  const scheduleDismiss = useCallback((delay) => {
    if (dismissTimerRef.current) {
      window.clearTimeout(dismissTimerRef.current);
    }

    dismissTimerRef.current = window.setTimeout(finishOpening, delay);
  }, [finishOpening]);

  // The sprite has decoded and the first frame painted — reveal the hero
  // underneath so it is ready by the time the envelope finishes opening.
  const handleReady = useCallback(() => {
    markReady();
  }, [markReady]);

  // Last frame drawn — let the open envelope settle, then dissolve the splash.
  const handleComplete = useCallback(() => {
    scheduleDismiss(END_PADDING_MS);
  }, [scheduleDismiss]);

  useEffect(() => {
    scheduleDismiss(FALLBACK_DISMISS_MS);

    return () => {
      if (dismissTimerRef.current) {
        window.clearTimeout(dismissTimerRef.current);
      }
    };
  }, [scheduleDismiss]);

  return (
    <AnimatePresence>
      <motion.div
        key="gazebo-splash"
        className="gazebo-splash gazebo-splash--html-animation"
        aria-hidden="true"
        animate={fading ? { opacity: 0 } : { opacity: 1 }}
        transition={fading ? { duration: 0.6, ease: 'easeInOut' } : { duration: 0.2 }}
        exit={{ opacity: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }}
      >
        <EnvelopeSpriteAnimation
          className="gazebo-splash-envelope-animation"
          onReady={handleReady}
          onComplete={handleComplete}
        />
      </motion.div>
    </AnimatePresence>
  );
}
