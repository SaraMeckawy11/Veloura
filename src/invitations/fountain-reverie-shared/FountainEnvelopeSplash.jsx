import { useCallback, useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.div uses `motion` via JSX members
import { motion, AnimatePresence } from 'framer-motion';
import splashUrl from '../../assets/Fountain Reverie/sage-envelope-splash-no-diamond.html?url';
import './fountain-envelope-splash.css';

const FADE_DURATION = 0.7;
const AUTO_DISMISS_FALLBACK_MS = 8000;
// The supplied splash uses the same message contract as the Coastal envelope.
const DONE_MESSAGE_TYPE = 'coastal-splash:done';
const BOOST_MESSAGE_TYPE = 'coastal-splash:boost';

export default function FountainEnvelopeSplash({ onReady, onDismiss }) {
  const [dismissing, setDismissing] = useState(false);
  const rootRef = useRef(null);
  const iframeRef = useRef(null);
  const fallbackTimerRef = useRef(null);
  const dismissingRef = useRef(false);
  const readyRef = useRef(false);
  const onReadyRef = useRef(onReady);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onReadyRef.current = onReady;
    onDismissRef.current = onDismiss;
  }, [onReady, onDismiss]);

  const beginDismiss = useCallback(() => {
    if (dismissingRef.current) return;
    dismissingRef.current = true;
    if (fallbackTimerRef.current) window.clearTimeout(fallbackTimerRef.current);
    setDismissing(true);
  }, []);

  const markReady = useCallback(() => {
    if (readyRef.current) return;
    readyRef.current = true;
    onReadyRef.current?.();
    fallbackTimerRef.current = window.setTimeout(beginDismiss, AUTO_DISMISS_FALLBACK_MS);
  }, [beginDismiss]);

  useEffect(() => {
    // The embedded video starts at DOMContentLoaded, which happens before the
    // iframe's load event. Reveal this sage layer immediately so the generic
    // invitation boot screen cannot cover the beginning of the envelope reveal.
    markReady();
    return () => {
      if (fallbackTimerRef.current) window.clearTimeout(fallbackTimerRef.current);
    };
  }, [markReady]);

  const handleBoost = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: BOOST_MESSAGE_TYPE }, '*');
  }, []);

  useEffect(() => {
    // Invitations can render inside the order-flow preview iframe, so listen on
    // the window that owns this splash instead of assuming the top-level window.
    const targetWindow = rootRef.current?.ownerDocument?.defaultView || window;
    const handleMessage = (event) => {
      if (event.source === iframeRef.current?.contentWindow && event.data?.type === DONE_MESSAGE_TYPE) {
        beginDismiss();
      }
    };

    targetWindow.addEventListener('message', handleMessage);
    return () => targetWindow.removeEventListener('message', handleMessage);
  }, [beginDismiss]);

  return (
    <AnimatePresence>
      <motion.div
        ref={rootRef}
        key="fountain-envelope-splash"
        className="fountain-envelope-splash fountain-envelope-splash--html"
        role="button"
        tabIndex={0}
        aria-label="Open invitation"
        onClick={handleBoost}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            handleBoost();
          }
        }}
        initial={{ opacity: 1 }}
        animate={{ opacity: dismissing ? 0 : 1 }}
        transition={{ duration: dismissing ? FADE_DURATION : 0, ease: 'easeInOut' }}
        onAnimationComplete={() => {
          if (dismissingRef.current) onDismissRef.current?.();
        }}
      >
        <iframe
          ref={iframeRef}
          className="fountain-envelope-splash-frame"
          title="Sage envelope splash animation"
          src={splashUrl}
          sandbox="allow-scripts allow-same-origin"
          allow="autoplay"
          onLoad={markReady}
          aria-hidden="true"
        />
      </motion.div>
    </AnimatePresence>
  );
}
