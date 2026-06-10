import { useCallback, useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.div uses `motion` via JSX members
import { motion, AnimatePresence } from 'framer-motion';
import spriteUrl from '../../assets/coastal/envelope-frames-light.png';
import './coastal-splash.css';

// Native canvas player for the "envelope" splash.
//
// The source animation ships as a single sprite sheet (envelope-frames-light.png):
// 40 sequential frames laid out in an 8×5 grid that open a soft-blue envelope and
// bloom to white. We load the one bundled PNG (hashed/cached by Vite), slice each
// frame out of the grid with drawImage source rectangles, and play them on a
// <canvas> in the host document. The final frame is nearly white, so fading the
// whole splash out crossfades seamlessly into the coastal hero's cream wash.
//
// This is a direct port of the reference player (boardingPass/envelope-splash.html):
// each frame is drawn discretely at FPS — no blending between frames. (We tried
// crossfading consecutive frames to fake extra smoothness, but the frames aren't
// pixel-aligned, so blending two of them ghosts the envelope and reads as a
// left/right jitter. Discrete playback, exactly like the HTML, is clean.)
const SHEET_WIDTH = 1293;
const SHEET_HEIGHT = 1216;
const COLUMNS = 8;
const ROWS = 5;
const FRAME_COUNT = COLUMNS * ROWS; // 40
const FRAME_WIDTH = SHEET_WIDTH / COLUMNS;
const FRAME_HEIGHT = SHEET_HEIGHT / ROWS;
// The contact sheet bakes a ~2px dark gridline around every cell, so we sample
// the clean interior of each frame rather than the exact cell bounds. Combined
// with the "cover" fit (which crops the corners), this also keeps the small
// frame-number tag in each cell's top-left from ever reaching the screen.
const CELL_INSET = 3;
const CONTENT_WIDTH = FRAME_WIDTH - CELL_INSET * 2;
const CONTENT_HEIGHT = FRAME_HEIGHT - CELL_INSET * 2;
// Same playback constant as envelope-splash.html.
const FPS = 30;

const FADE_DURATION = 0.7;
const HOLD_ON_WHITE_MS = 160;

export default function CoastalSplash({ onReady, onDismiss }) {
  const canvasRef = useRef(null);
  const [dismissing, setDismissing] = useState(false);
  const dismissingRef = useRef(false);
  const readyRef = useRef(false);
  const onReadyRef = useRef(onReady);
  const onDismissRef = useRef(onDismiss);
  // Imperative handle wired up by the player effect so click/keyboard can skip.
  const skipRef = useRef(null);

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
    skipRef.current?.();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const context = canvas.getContext('2d', { alpha: false });
    const sprite = new Image();
    sprite.decoding = 'async';

    let rafId = null;
    let startTime = null;
    let lastFrame = -1;
    let loaded = false;
    let disposed = false;
    let holdTimer = null;

    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(window.innerWidth * pixelRatio);
      canvas.height = Math.ceil(window.innerHeight * pixelRatio);
      if (lastFrame >= 0) drawFrame(lastFrame);
    };

    const drawFrame = (frameIndex) => {
      if (!loaded) return;
      const sourceX = (frameIndex % COLUMNS) * FRAME_WIDTH + CELL_INSET;
      const sourceY = Math.floor(frameIndex / COLUMNS) * FRAME_HEIGHT + CELL_INSET;
      // "cover" the viewport, centered — matches the reference player.
      const scale = Math.max(canvas.width / CONTENT_WIDTH, canvas.height / CONTENT_HEIGHT);
      const destWidth = CONTENT_WIDTH * scale;
      const destHeight = CONTENT_HEIGHT * scale;
      const destX = (canvas.width - destWidth) / 2;
      const destY = (canvas.height - destHeight) / 2;
      context.drawImage(
        sprite,
        sourceX,
        sourceY,
        CONTENT_WIDTH,
        CONTENT_HEIGHT,
        destX,
        destY,
        destWidth,
        destHeight,
      );
      lastFrame = frameIndex;
    };

    const finish = () => {
      // Settle on the final white frame, then fade the splash into the hero.
      holdTimer = window.setTimeout(() => {
        if (!disposed) beginDismiss();
      }, HOLD_ON_WHITE_MS);
    };

    const tick = (now) => {
      if (disposed) return;
      if (startTime === null) startTime = now;
      const elapsed = (now - startTime) / 1000;
      const frameIndex = Math.min(Math.floor(elapsed * FPS), FRAME_COUNT - 1);

      if (frameIndex !== lastFrame) drawFrame(frameIndex);

      if (frameIndex < FRAME_COUNT - 1) {
        rafId = window.requestAnimationFrame(tick);
      } else {
        finish();
      }
    };

    // Jump straight to the white frame and dismiss (tap / key to skip).
    skipRef.current = () => {
      if (disposed || dismissingRef.current) return;
      if (rafId) window.cancelAnimationFrame(rafId);
      window.clearTimeout(holdTimer);
      drawFrame(FRAME_COUNT - 1);
      beginDismiss();
    };

    const handleLoad = () => {
      if (disposed) return;
      loaded = true;
      // Paint the first frame the instant the sprite decodes so there is no flash.
      resizeCanvas();
      drawFrame(0);
      markReady();
      rafId = window.requestAnimationFrame(tick);
    };

    const handleError = () => {
      if (disposed) return;
      // If the sprite fails to load, don't trap the guest on the splash.
      markReady();
      beginDismiss();
    };

    sprite.addEventListener('load', handleLoad);
    sprite.addEventListener('error', handleError);
    window.addEventListener('resize', resizeCanvas);
    sprite.src = spriteUrl;

    return () => {
      disposed = true;
      skipRef.current = null;
      if (rafId) window.cancelAnimationFrame(rafId);
      window.clearTimeout(holdTimer);
      sprite.removeEventListener('load', handleLoad);
      sprite.removeEventListener('error', handleError);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [markReady, beginDismiss]);

  return (
    <AnimatePresence>
      <motion.div
        key="coastal-splash"
        className="coastal-splash coastal-splash--frames"
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
        <canvas
          ref={canvasRef}
          className="coastal-splash-frames-canvas"
          width={Math.round(FRAME_WIDTH)}
          height={Math.round(FRAME_HEIGHT)}
          aria-hidden="true"
        />
      </motion.div>
    </AnimatePresence>
  );
}
