import { useCallback, useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.div uses `motion` via JSX members
import { motion, AnimatePresence } from 'framer-motion';
import splashUrl from '../../assets/coastal/light-envelope-splash-no-diamond.html?url';
import './coastal-splash.css';

const FADE_DURATION = 0.7;
const DONE_MESSAGE_TYPE = 'coastal-splash:done';

export default function CoastalSplash({ onReady, onDismiss }) {
  const [dismissing, setDismissing] = useState(false);
  const dismissingRef = useRef(false);
  const readyRef = useRef(false);
  const onReadyRef = useRef(onReady);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onReadyRef.current = onReady;
    onDismissRef.current = onDismiss;
  }, [onReady, onDismiss]);

  const markReady = useCallback(() => {
    if (readyRef.current) return;
    readyRef.current = true;
    onReadyRef.current?.();
  }, []);

  const beginDismiss = useCallback(() => {
    if (dismissingRef.current) return;
    dismissingRef.current = true;
    setDismissing(true);
  }, []);

  const handleSkip = useCallback(() => {
    if (!readyRef.current) return;
    beginDismiss();
  }, [beginDismiss]);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data?.type === DONE_MESSAGE_TYPE) beginDismiss();
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [beginDismiss]);

  return (
    <AnimatePresence>
      <motion.div
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
