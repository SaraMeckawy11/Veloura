import { useCallback, useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.* and AnimatePresence are used through JSX member expressions
import { motion, AnimatePresence } from 'framer-motion';
import envelopeAnimationUrl from '../../assets/envelope_animation.html?url';

const FRAME_COUNT = 73;
const FRAMES_PER_SECOND = 30;
const END_PADDING_MS = 320;
const FALLBACK_DISMISS_MS = 4600;
const ANIMATION_DISMISS_MS = Math.ceil((FRAME_COUNT / FRAMES_PER_SECOND) * 1000) + END_PADDING_MS;

export default function GazeboSplash({ onDismiss }) {
  const dismissTimerRef = useRef(null);
  const hasOpenedRef = useRef(false);
  const onDismissRef = useRef(onDismiss);
  const [fading, setFading] = useState(false);

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
        {/* Opaque backdrop keeps the hero section hidden until the envelope
            animation has finished playing. */}
        <div className="gazebo-splash-backdrop" aria-hidden />
        <iframe
          className="gazebo-splash-envelope-animation"
          src={envelopeAnimationUrl}
          title="Envelope opening animation"
          onLoad={() => scheduleDismiss(ANIMATION_DISMISS_MS)}
          aria-hidden="true"
          tabIndex={-1}
        />
      </motion.div>
    </AnimatePresence>
  );
}
