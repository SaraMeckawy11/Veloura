import { useCallback, useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.* and AnimatePresence are used through JSX member expressions
import { motion, AnimatePresence } from 'framer-motion';
import envelopeAnimationUrl from '../../assets/envelope_animation.html?url';

const FRAME_COUNT = 73;
const FRAMES_PER_SECOND = 30;
const END_PADDING_MS = 260;
const FALLBACK_DISMISS_MS = 4200;
const ANIMATION_DISMISS_MS = Math.ceil((FRAME_COUNT / FRAMES_PER_SECOND) * 1000) + END_PADDING_MS;

export default function GazeboSplash({ onDismiss }) {
  const dismissTimerRef = useRef(null);
  const hasOpenedRef = useRef(false);
  const onDismissRef = useRef(onDismiss);
  const [revealing, setRevealing] = useState(false);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  const finishOpening = useCallback(() => {
    if (hasOpenedRef.current) return;
    hasOpenedRef.current = true;

    if (dismissTimerRef.current) {
      window.clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }

    // Fade the beige envelope backdrop away so the opened envelope reveals the
    // hero section underneath, then unmount the splash once the reveal settles.
    setRevealing(true);
    window.setTimeout(() => onDismissRef.current(), 820);
  }, []);

  const scheduleDismiss = useCallback((delay) => {
    if (dismissTimerRef.current) {
      window.clearTimeout(dismissTimerRef.current);
    }

    dismissTimerRef.current = window.setTimeout(finishOpening, delay);
  }, [finishOpening]);

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
        className={`gazebo-splash gazebo-splash--html-animation${revealing ? ' gazebo-splash--revealing' : ''}`}
        aria-hidden="true"
        exit={{ opacity: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }}
      >
        <div className="gazebo-splash-backdrop" aria-hidden />
        <iframe
          className="gazebo-splash-envelope-animation"
          src={envelopeAnimationUrl}
          title="Envelope opening animation"
          onLoad={() => scheduleDismiss(ANIMATION_DISMISS_MS)}
          aria-hidden="true"
          tabIndex={-1}
        />
        <div className="gazebo-splash-beige-texture" aria-hidden />
        <div className="gazebo-splash-overlay" aria-hidden />
      </motion.div>
    </AnimatePresence>
  );
}
