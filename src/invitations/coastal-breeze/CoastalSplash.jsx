import { useEffect, useMemo, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.* is used through JSX member expressions
import { motion, AnimatePresence } from 'framer-motion';

import closedDoorFallback from '../../assets/coastal/coastal-closed-door.webp';
import openedDoorFallback from '../../assets/coastal/coastal-door-open-empty.webp';

import './coastal-splash.css';

const doorFrameModules = import.meta.glob(
  '../../assets/coastal/coastal-door-sequence/coastal-door-frame-*.webp',
  { eager: true, import: 'default' },
);

const DOOR_FRAME_URLS = Object.entries(doorFrameModules)
  .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
  .map(([, src]) => src);

const DOOR_OPEN_DURATION = 5200;
const OPEN_HOLD_DURATION = 3200;
const FADE_OUT_DURATION = 850;

const BIRDS = [
  { id: 0, top: 14, delay: 0.15, duration: 9.5, scale: 0.95 },
  { id: 1, top: 22, delay: 0.7, duration: 11, scale: 0.72 },
  { id: 2, top: 31, delay: 1.25, duration: 10.2, scale: 0.82 },
  { id: 3, top: 18, delay: 1.85, duration: 12, scale: 0.62 },
  { id: 4, top: 27, delay: 2.35, duration: 13, scale: 0.56 },
];

function easeInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

export default function CoastalSplash({ onDismiss }) {
  const [opening, setOpening] = useState(false);
  const [fading, setFading] = useState(false);
  const [framesReady, setFramesReady] = useState(false);

  const baseImageRef = useRef(null);
  const overlayImageRef = useRef(null);
  const rafRef = useRef(null);
  const timersRef = useRef([]);
  const baseIndexRef = useRef(-1);
  const overlayIndexRef = useRef(-1);

  const doorFrames = useMemo(() => {
    if (DOOR_FRAME_URLS.length >= 2) return DOOR_FRAME_URLS;
    return [closedDoorFallback, openedDoorFallback];
  }, []);

  const clearSplashTimers = () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const setLayerSrc = (imageRef, indexRef, src, index) => {
    const image = imageRef.current;
    if (!image) return;

    if (indexRef.current !== index) {
      image.src = src;
      indexRef.current = index;
    }
  };

  const resetDoor = () => {
    const baseImage = baseImageRef.current;
    const overlayImage = overlayImageRef.current;

    if (!baseImage || !overlayImage) return;

    baseImage.src = doorFrames[0];
    overlayImage.src = doorFrames[1] || doorFrames[0];

    baseImage.style.opacity = '1';
    overlayImage.style.opacity = '0';

    baseIndexRef.current = 0;
    overlayIndexRef.current = 1;
  };

  const animateDoorSequence = () => {
    const startedAt = performance.now();
    const lastFrameIndex = doorFrames.length - 1;

    const tick = (now) => {
      const elapsed = now - startedAt;
      const rawProgress = Math.min(elapsed / DOOR_OPEN_DURATION, 1);
      const easedProgress = easeInOutSine(rawProgress);

      const exactFrame = easedProgress * lastFrameIndex;
      const currentFrame = Math.floor(exactFrame);
      const nextFrame = Math.min(currentFrame + 1, lastFrameIndex);
      const blend = exactFrame - currentFrame;

      setLayerSrc(baseImageRef, baseIndexRef, doorFrames[currentFrame], currentFrame);
      setLayerSrc(overlayImageRef, overlayIndexRef, doorFrames[nextFrame], nextFrame);

      if (baseImageRef.current) {
        baseImageRef.current.style.opacity = '1';
      }

      if (overlayImageRef.current) {
        overlayImageRef.current.style.opacity =
          currentFrame === nextFrame ? '0' : String(blend);
      }

      if (rawProgress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setLayerSrc(baseImageRef, baseIndexRef, doorFrames[lastFrameIndex], lastFrameIndex);

        if (baseImageRef.current) {
          baseImageRef.current.style.opacity = '1';
        }

        if (overlayImageRef.current) {
          overlayImageRef.current.style.opacity = '0';
        }
      }
    };

    rafRef.current = requestAnimationFrame(tick);
  };

  const handleOpen = () => {
    if (opening || !framesReady) return;

    clearSplashTimers();
    setOpening(true);
    resetDoor();
    animateDoorSequence();

    timersRef.current.push(
      window.setTimeout(() => {
        setFading(true);
      }, DOOR_OPEN_DURATION + OPEN_HOLD_DURATION),

      window.setTimeout(() => {
        clearSplashTimers();
        onDismiss?.();
      }, DOOR_OPEN_DURATION + OPEN_HOLD_DURATION + FADE_OUT_DURATION),
    );
  };

  useEffect(() => {
    let cancelled = false;

    const preloadFrames = async () => {
      try {
        await Promise.all(
          doorFrames.map(
            (src) =>
              new Promise((resolve) => {
                const image = new Image();
                image.onload = resolve;
                image.onerror = resolve;
                image.src = src;
              }),
          ),
        );

        if (!cancelled) {
          setFramesReady(true);
          window.requestAnimationFrame(resetDoor);
        }
      } catch {
        if (!cancelled) {
          setFramesReady(true);
          window.requestAnimationFrame(resetDoor);
        }
      }
    };

    preloadFrames();

    return () => {
      cancelled = true;
      clearSplashTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        key="coastal-splash"
        className={[
          'coastal-splash',
          opening ? 'coastal-splash-opening' : '',
          framesReady ? 'coastal-splash-ready' : 'coastal-splash-loading',
        ].join(' ')}
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
        animate={fading ? { opacity: 0 } : { opacity: 1 }}
        transition={fading ? { duration: 0.85, ease: 'easeInOut' } : { duration: 0.2 }}
        exit={{ opacity: 0, transition: { duration: 0.7, ease: 'easeOut' } }}
      >
        <div className="coastal-splash-stage" aria-hidden>
          <div className="coastal-door-artboard">
            <div className="coastal-door-sequence">
              <img
                ref={baseImageRef}
                className="coastal-door-image-layer coastal-door-image-base"
                src={doorFrames[0]}
                alt=""
                draggable={false}
              />

              <img
                ref={overlayImageRef}
                className="coastal-door-image-layer coastal-door-image-overlay"
                src={doorFrames[1] || doorFrames[0]}
                alt=""
                draggable={false}
              />
            </div>

            <motion.div
              className="coastal-door-light"
              initial={{ opacity: 0 }}
              animate={opening ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 3.2, delay: 0.5, ease: 'easeOut' }}
            />

            <motion.div
              className="coastal-door-open-shine"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={opening ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
              transition={{ duration: 2.8, delay: 1.4, ease: 'easeOut' }}
            />
          </div>

          <div className="coastal-splash-vignette" />

          <div className="coastal-bird-layer">
            {BIRDS.map((bird) => (
              <span
                key={bird.id}
                className="coastal-bird"
                style={{
                  top: `${bird.top}%`,
                  animationDelay: `${bird.delay}s`,
                  animationDuration: `${bird.duration}s`,
                  '--bird-scale': bird.scale,
                }}
              />
            ))}
          </div>
        </div>

        <motion.div
          className="coastal-splash-copy"
          animate={opening ? { opacity: 0, y: -18 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <span className="coastal-splash-eyebrow">
            {framesReady ? 'You are invited to' : 'Loading invitation'}
          </span>

          <p className="coastal-splash-script">the wedding</p>

          <span className="coastal-splash-hint">
            {framesReady ? 'Tap to open the doors' : 'Preparing the doors'}
          </span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}