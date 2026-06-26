import { useCallback, useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.div uses `motion` via JSX members
import { motion, AnimatePresence } from 'framer-motion';
import splashUrl from '../../assets/coastal/light-envelope-splash-no-diamond.html?url';
import './coastal-splash.css';

const FADE_DURATION = 0.7;
const AUTO_DISMISS_FALLBACK_MS = 5200;
// If the splash iframe never loads (offline / stalled network), force the
// ready signal so the gated invitation content can still mount and the
// auto-dismiss chain can run — the splash must never trap the guest.
const READY_FALLBACK_MS = 7000;
const DONE_MESSAGE_TYPE = 'coastal-splash:done';
const BOOST_MESSAGE_TYPE = 'coastal-splash:boost';

export default function CoastalSplash({ onReady, onDismiss }) {
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
    const readyFallback = window.setTimeout(markReady, READY_FALLBACK_MS);
    return () => {
      window.clearTimeout(readyFallback);
      if (fallbackTimerRef.current) window.clearTimeout(fallbackTimerRef.current);
    };
  }, [markReady]);

  // Tapping (or pressing Enter/Space) hurries the opening by fast-forwarding the
  // splash video rather than skipping straight to the invitation underneath.
  const handleSkip = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: BOOST_MESSAGE_TYPE }, '*');
  }, []);

  useEffect(() => {
    const targetWindow = rootRef.current?.ownerDocument?.defaultView || window;
    const handleMessage = (event) => {
      if (event.data?.type === DONE_MESSAGE_TYPE) beginDismiss();
    };

    targetWindow.addEventListener('message', handleMessage);
    return () => {
      targetWindow.removeEventListener('message', handleMessage);
    };
  }, [beginDismiss]);

  return (
    <AnimatePresence>
      <motion.div
        ref={rootRef}
        key="coastal-splash"
        className="coastal-splash coastal-splash--html"
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
        initial={{ opacity: 1 }}
        animate={{ opacity: dismissing ? 0 : 1 }}
        transition={{ duration: dismissing ? FADE_DURATION : 0, ease: 'easeInOut' }}
        onAnimationComplete={() => {
          if (dismissingRef.current) onDismissRef.current?.();
        }}
      >
        <iframe
          ref={iframeRef}
          className="coastal-splash-html-frame"
          title="Light envelope splash animation"
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
