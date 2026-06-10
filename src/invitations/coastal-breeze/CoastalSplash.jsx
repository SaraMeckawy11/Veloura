import { useCallback, useEffect, useRef, useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.div uses `motion` via JSX members
import { motion, AnimatePresence } from 'framer-motion';
import framesUrl from '../../assets/coastal/envelope-frames.bin?url';
import frameManifest from '../../assets/coastal/envelope-frames.json';
import './coastal-splash.css';

// Native canvas player for the "envelope" splash.
//
// The source animation ships as 116 sequential JPEG frames (540×822, 30fps)
// that open a navy envelope and bloom to white. Rather than parse a 2.4MB
// inline-base64 HTML document in an <iframe>, the frames are packed into a
// single bundled binary blob (envelope-frames.bin) with a JSON manifest of
// per-frame byte lengths. We fetch the blob once, slice it into per-frame
// images, and play them on a <canvas> in the host document. The final frame
// is pure white, so fading the whole splash out crossfades seamlessly into
// the coastal hero's cream wash.
const { frameCount: FRAME_COUNT, fps: FPS, width: FRAME_WIDTH, height: FRAME_HEIGHT, lengths: FRAME_LENGTHS } = frameManifest;

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
    let frames = [];
    let rafId = null;
    let startTime = null;
    let lastFrame = -1;
    let disposed = false;
    let holdTimer = null;
    const controller = new AbortController();

    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(window.innerWidth * pixelRatio);
      canvas.height = Math.ceil(window.innerHeight * pixelRatio);
      if (lastFrame >= 0) drawFrame(lastFrame);
    };

    const drawFrame = (frameIndex) => {
      const image = frames[frameIndex];
      if (!image) return;
      // "cover" the viewport, centered — matches the source player.
      const scale = Math.max(canvas.width / FRAME_WIDTH, canvas.height / FRAME_HEIGHT);
      const destWidth = FRAME_WIDTH * scale;
      const destHeight = FRAME_HEIGHT * scale;
      const destX = (canvas.width - destWidth) / 2;
      const destY = (canvas.height - destHeight) / 2;
      context.drawImage(image, destX, destY, destWidth, destHeight);
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
      if (frames.length === FRAME_COUNT) drawFrame(FRAME_COUNT - 1);
      beginDismiss();
    };

    const decodeFrames = async () => {
      const response = await fetch(framesUrl, { signal: controller.signal });
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);

      const supportsBitmap = typeof window.createImageBitmap === 'function';
      const decoded = new Array(FRAME_COUNT);
      const objectUrls = [];
      let offset = 0;

      for (let i = 0; i < FRAME_COUNT; i += 1) {
        const length = FRAME_LENGTHS[i];
        const blob = new Blob([bytes.subarray(offset, offset + length)], { type: 'image/jpeg' });
        offset += length;

        if (supportsBitmap) {
          // eslint-disable-next-line no-await-in-loop -- sequential keeps frame order + memory bounded
          decoded[i] = await createImageBitmap(blob);
        } else {
          const url = URL.createObjectURL(blob);
          objectUrls.push(url);
          // eslint-disable-next-line no-await-in-loop
          decoded[i] = await new Promise((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = reject;
            image.src = url;
          });
        }

        // Paint the first frame the instant it is ready so there is no flash.
        if (i === 0 && !disposed) {
          resizeCanvas();
          frames = decoded;
          drawFrame(0);
        }
      }

      frames = decoded;
      frames.__objectUrls = objectUrls;
      return frames;
    };

    decodeFrames()
      .then(() => {
        if (disposed) return;
        markReady();
        rafId = window.requestAnimationFrame(tick);
      })
      .catch(() => {
        if (disposed) return;
        // If decoding fails, don't trap the guest on the splash — reveal the hero.
        markReady();
        beginDismiss();
      });

    window.addEventListener('resize', resizeCanvas);

    return () => {
      disposed = true;
      skipRef.current = null;
      if (rafId) window.cancelAnimationFrame(rafId);
      window.clearTimeout(holdTimer);
      controller.abort();
      window.removeEventListener('resize', resizeCanvas);
      frames.forEach?.((image) => image?.close?.());
      frames.__objectUrls?.forEach((url) => URL.revokeObjectURL(url));
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
          width={FRAME_WIDTH}
          height={FRAME_HEIGHT}
          aria-hidden="true"
        />
      </motion.div>
    </AnimatePresence>
  );
}
