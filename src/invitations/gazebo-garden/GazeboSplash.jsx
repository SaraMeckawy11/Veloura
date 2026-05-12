import { useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.* and AnimatePresence are used through JSX member expressions
import { motion, AnimatePresence } from 'framer-motion';

const SPLASH_VIDEO = '/assets/eal.mp4';
const SPLASH_PLAYBACK_RATE = 0.6;
const SPLASH_END_PADDING_MS = 500;
const FALLBACK_DISMISS_MS = 9500;

export default function GazeboSplash({ onDismiss }) {
  const ambientVideoRef = useRef(null);
  const foregroundVideoRef = useRef(null);
  const posterRef = useRef(null);
  const fallbackTimerRef = useRef(null);
  const hasOpenedRef = useRef(false);
  const [opening, setOpening] = useState(false);
  const [posterUrl, setPosterUrl] = useState(null);

  useEffect(() => {
    const videos = [ambientVideoRef.current, foregroundVideoRef.current].filter(Boolean);
    videos.forEach((video) => {
      try {
        video.pause();
        video.currentTime = 0;
        video.load();
      } catch {
        // Ignore — fresh streams can throw before metadata loads.
      }
    });

    // Decode the actual first frame of the video and use it as the
    // splash background. This avoids mobile browsers leaving the video
    // surface blank until the user interacts with the screen.
    let cancelled = false;
    let createdUrl = null;
    const loader = document.createElement('video');
    loader.src = SPLASH_VIDEO;
    loader.muted = true;
    loader.playsInline = true;
    loader.preload = 'auto';
    loader.crossOrigin = 'anonymous';

    const onSeeked = () => {
      if (cancelled) return;
      const w = loader.videoWidth;
      const h = loader.videoHeight;
      if (!w || !h) return;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      try {
        canvas.getContext('2d').drawImage(loader, 0, 0, w, h);
        canvas.toBlob((blob) => {
          if (cancelled || !blob) return;
          createdUrl = URL.createObjectURL(blob);
          setPosterUrl(createdUrl);
        }, 'image/jpeg', 0.9);
      } catch {
        // Most likely a cross-origin taint — fall back to the static poster.
      }
    };

    const onLoaded = () => {
      try {
        loader.currentTime = 0;
      } catch {
        // ignored
      }
    };

    loader.addEventListener('loadeddata', onLoaded);
    loader.addEventListener('seeked', onSeeked);

    return () => {
      cancelled = true;
      loader.removeEventListener('loadeddata', onLoaded);
      loader.removeEventListener('seeked', onSeeked);
      if (createdUrl) URL.revokeObjectURL(createdUrl);
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
      fallbackTimerRef.current = null;
    }
    onDismiss();
  };

  const handleOpen = () => {
    if (opening || hasOpenedRef.current) return;
    setOpening(true);
    if (posterRef.current) posterRef.current.style.opacity = '0';

    const videos = [ambientVideoRef.current, foregroundVideoRef.current].filter(Boolean);
    videos.forEach((video) => {
      try {
        video.currentTime = 0;
        video.playbackRate = SPLASH_PLAYBACK_RATE;
      } catch {
        // Ignore — fresh streams can throw on seek; play() below still works.
      }
    });

    const primaryVideo = foregroundVideoRef.current;
    const fallbackDelay =
      primaryVideo && Number.isFinite(primaryVideo.duration) && primaryVideo.duration > 0
        ? (primaryVideo.duration / SPLASH_PLAYBACK_RATE) * 1000 + SPLASH_END_PADDING_MS
        : FALLBACK_DISMISS_MS;

    fallbackTimerRef.current = window.setTimeout(finishOpening, fallbackDelay);

    Promise.allSettled(videos.map((video) => video.play())).then((results) => {
      if (results.every((result) => result.status === 'rejected')) {
        finishOpening();
      }
    });
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
        exit={{ opacity: 0, transition: { duration: 0.9, ease: [0.22, 1, 0.36, 1] } }}
      >
        {posterUrl && (
          <img
            ref={posterRef}
            className="gazebo-splash-poster"
            src={posterUrl}
            alt=""
            aria-hidden="true"
            decoding="async"
            fetchPriority="high"
          />
        )}
        <video
          ref={ambientVideoRef}
          className="gazebo-splash-video gazebo-splash-video--ambient"
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        >
          <source src={SPLASH_VIDEO} type="video/mp4" />
        </video>
        <video
          ref={foregroundVideoRef}
          className="gazebo-splash-video gazebo-splash-video--foreground"
          muted
          playsInline
          preload="auto"
          onEnded={finishOpening}
          aria-hidden="true"
        >
          <source src={SPLASH_VIDEO} type="video/mp4" />
        </video>
        <div className="gazebo-splash-beige-texture" aria-hidden />
        <div className="gazebo-splash-overlay" aria-hidden />

        <motion.div
          className="gazebo-splash-copy"
          initial={{ opacity: 0, y: 18 }}
          animate={opening ? { opacity: 0, y: -18 } : { opacity: 1, y: 0 }}
          transition={{ duration: opening ? 0.6 : 0.9, delay: opening ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <div>
            <strong>{opening ? 'Opening' : 'Tap to open'}</strong>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
