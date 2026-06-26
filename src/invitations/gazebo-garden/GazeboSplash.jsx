import { useCallback, useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.* and AnimatePresence are used through JSX member expressions
import { motion, AnimatePresence } from 'framer-motion';
import GardenEnvelopeAnimation from './GardenEnvelopeAnimation';

// Settle the opened envelope briefly before dissolving the splash.
const END_PADDING_MS = 220;
// The frame sequence runs ~2.5s once playing; keep a safety net just past that in
// case the final onComplete is ever dropped.
const POST_START_SAFETY_MS = 4000;
// Until the frames begin decoding nothing is playing yet — guard against a
// frames-never-load case (offline / decode failure) so the splash can't trap the
// viewer on a blank screen.
const LOAD_FALLBACK_MS = 6000;

export default function GazeboSplash({ onReady, onDismiss }) {
  const dismissTimerRef = useRef(null);
  const hasOpenedRef = useRef(false);
  const readyRef = useRef(false);
  const animationRef = useRef(null);
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

  // The frames have decoded and playback has begun — reveal the hero underneath
  // so it is ready by the time the envelope finishes opening, and swap the
  // load-fallback for a shorter post-start safety net.
  const handleReady = useCallback(() => {
    markReady();
    scheduleDismiss(POST_START_SAFETY_MS);
  }, [markReady, scheduleDismiss]);

  // Last frame drawn — let the open envelope settle, then dissolve the splash.
  const handleComplete = useCallback(() => {
    scheduleDismiss(END_PADDING_MS);
  }, [scheduleDismiss]);

  // Let an impatient guest tap (or press Enter/Space) to hurry the opening — this
  // accelerates the envelope animation rather than skipping straight to the hero.
  const handleSkip = useCallback(() => {
    animationRef.current?.boost();
  }, []);

  useEffect(() => {
    scheduleDismiss(LOAD_FALLBACK_MS);

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
        role="button"
        tabIndex={0}
        aria-label="Open invitation"
        onClick={handleSkip}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleSkip();
          }
        }}
        animate={fading ? { opacity: 0 } : { opacity: 1 }}
        transition={fading ? { duration: 0.6, ease: 'easeInOut' } : { duration: 0.2 }}
        exit={{ opacity: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } }}
      >
        <GardenEnvelopeAnimation
          ref={animationRef}
          className="gazebo-splash-envelope-animation"
          onReady={handleReady}
          onComplete={handleComplete}
        />
      </motion.div>
    </AnimatePresence>
  );
}
