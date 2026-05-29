import { useCallback, useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.* and AnimatePresence are used through JSX member expressions
import { motion, AnimatePresence } from 'framer-motion';

const SPLASH_VIDEO = '/assets/eal.mp4';
const SPLASH_POSTER = '/assets/gazebo-splash-video-first-frame.png';
const SPLASH_PLAYBACK_RATE = 1.25;
const SPLASH_END_PADDING_MS = 260;
const FALLBACK_DISMISS_MS = 4200;
const AUTO_OPEN_MIN_MS = 800;
const AUTO_OPEN_FALLBACK_MS = 1500;

export default function GazeboSplash({ onDismiss }) {
  const ambientVideoRef = useRef(null);
  const foregroundVideoRef = useRef(null);
  const posterRef = useRef(null);
  const fallbackTimerRef = useRef(null);
  const hasOpenedRef = useRef(false);
  const openingRef = useRef(false);
  const onDismissRef = useRef(onDismiss);
  const [opening, setOpening] = useState(false);
  const [posterUrl, setPosterUrl] = useState(SPLASH_POSTER);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

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

    // Start with a real extracted frame, then upgrade to a decoded video
    // frame when available so the splash never sits on a blank beige layer.
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

  const finishOpening = useCallback(() => {
    if (hasOpenedRef.current) return;
    hasOpenedRef.current = true;
    if (fallbackTimerRef.current) {
      window.clearTimeout(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
    onDismissRef.current();
  }, []);

  const handleOpen = useCallback(() => {
    if (openingRef.current || hasOpenedRef.current) return;
    openingRef.current = true;
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
  }, [finishOpening]);

  useEffect(() => {
    let cancelled = false;
    let openTimer = null;
    let fallbackTimer = null;
    let openScheduled = false;
    const startedAt = performance.now();
    const videos = [ambientVideoRef.current, foregroundVideoRef.current].filter(Boolean);

    const scheduleOpen = () => {
      if (cancelled || openScheduled) return;
      openScheduled = true;
      const elapsed = performance.now() - startedAt;
      const delay = Math.max(AUTO_OPEN_MIN_MS - elapsed, 0);
      openTimer = window.setTimeout(() => {
        if (!cancelled) handleOpen();
      }, delay);
    };

    const checkReady = () => {
      const primaryVideo = foregroundVideoRef.current;
      const videoReady = !primaryVideo || primaryVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA;
      if (posterUrl && videoReady) scheduleOpen();
    };

    fallbackTimer = window.setTimeout(scheduleOpen, AUTO_OPEN_FALLBACK_MS);
    checkReady();

    videos.forEach((video) => {
      video.addEventListener('loadeddata', checkReady);
      video.addEventListener('canplay', checkReady);
      video.addEventListener('error', scheduleOpen);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(openTimer);
      window.clearTimeout(fallbackTimer);
      videos.forEach((video) => {
        video.removeEventListener('loadeddata', checkReady);
        video.removeEventListener('canplay', checkReady);
        video.removeEventListener('error', scheduleOpen);
      });
    };
  }, [handleOpen, posterUrl]);

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
          poster={SPLASH_POSTER}
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
          poster={SPLASH_POSTER}
          onEnded={finishOpening}
          aria-hidden="true"
        >
          <source src={SPLASH_VIDEO} type="video/mp4" />
        </video>
        <div className="gazebo-splash-beige-texture" aria-hidden />
        <div className="gazebo-splash-overlay" aria-hidden />

      </motion.div>
    </AnimatePresence>
  );
}
