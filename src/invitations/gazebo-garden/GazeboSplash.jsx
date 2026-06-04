import { useCallback, useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.* and AnimatePresence are used through JSX member expressions
import { motion, AnimatePresence } from 'framer-motion';
import envelopeAnimationUrl from '../../assets/envelope_animation.html?url';

const FRAME_COUNT = 73;
const FRAMES_PER_SECOND = 20;
const END_PADDING_MS = 320;
const FALLBACK_DISMISS_MS = 4600;
const ANIMATION_DISMISS_MS = Math.ceil((FRAME_COUNT / FRAMES_PER_SECOND) * 1000) + END_PADDING_MS;

export default function GazeboSplash({ onReady, onDismiss }) {
  const dismissTimerRef = useRef(null);
  const hasOpenedRef = useRef(false);
  const iframeRef = useRef(null);
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

  const handleAnimationReady = useCallback(() => {
    markReady();
    scheduleDismiss(ANIMATION_DISMISS_MS);
  }, [markReady, scheduleDismiss]);

  useEffect(() => {
    scheduleDismiss(FALLBACK_DISMISS_MS);

    return () => {
      if (dismissTimerRef.current) {
        window.clearTimeout(dismissTimerRef.current);
      }
    };
  }, [scheduleDismiss]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.source !== iframeRef.current?.contentWindow) return;
      if (event.data?.type === 'gazebo-envelope-ready') handleAnimationReady();
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handleAnimationReady]);

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
        <iframe
          ref={iframeRef}
          className="gazebo-splash-envelope-animation"
          src={envelopeAnimationUrl}
          title="Envelope opening animation"
          aria-hidden="true"
          tabIndex={-1}
        />
      </motion.div>
    </AnimatePresence>
  );
}
