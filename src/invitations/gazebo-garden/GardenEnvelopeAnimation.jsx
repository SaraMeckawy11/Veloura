import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';

// Canvas frame-sequence player for the Garden Pavilion splash (the wax-seal
// "bird" envelope opening).
//
// The animation ships as 151 individual JPEG frames (512x910, 30fps) rather than
// a single sprite sheet: a 151-frame sprite would be far larger than the texture
// limits of older mobile GPUs, so we instead load the frames as ordinary assets
// (hashed + cached by Vite) and paint them on a host-document <canvas> — the same
// technique the original standalone HTML used, minus the 16MB inlined iframe.
const frameModules = import.meta.glob(
  '../../assets/gardenPavilion/bird-envelope-frames/*.jpg',
  { eager: true, import: 'default', query: '?url' },
);
const LAST_PLAYABLE_FRAME = 100;
const FRAME_URLS = Object.keys(frameModules)
  .sort()
  .filter((key) => {
    const match = key.match(/frame-(\d+)\.jpg$/);
    return !match || Number(match[1]) <= LAST_PLAYABLE_FRAME;
  })
  .map((key) => frameModules[key]);

const FRAME_WIDTH = 512;
const FRAME_HEIGHT = 910;
const FRAME_COUNT = FRAME_URLS.length;
// Play a touch faster than the source 30fps so the open feels brisk rather than
// languid — UX guidance is to keep an intro animation short (~2-2.5s here).
const FPS = 40;
// Begin playback once a small head-start buffer has decoded instead of blocking
// on all 100 frames; the remaining frames stream in well before their turn. This
// lets the opening start promptly rather than after the whole sequence loads.
const START_BUFFER = Math.min(FRAME_COUNT, 24);
// How much faster the open plays once the guest taps to hurry it along — it
// accelerates the same envelope animation rather than cutting straight to the end.
const BOOST_SPEED = 4;

function GardenEnvelopeAnimation({ className, onReady, onComplete }, ref) {
  const canvasRef = useRef(null);
  const onReadyRef = useRef(onReady);
  const onCompleteRef = useRef(onComplete);
  const speedRef = useRef(1);

  useEffect(() => {
    onReadyRef.current = onReady;
    onCompleteRef.current = onComplete;
  }, [onReady, onComplete]);

  // Let the parent splash speed the playback up on demand (tap to hurry).
  useImperativeHandle(ref, () => ({
    boost: () => { speedRef.current = BOOST_SPEED; },
  }), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ownerWindow = canvas.ownerDocument?.defaultView || window;
    const context = canvas.getContext('2d', { alpha: false });
    const images = new Array(FRAME_COUNT);

    let rafId = null;
    let lastTimestamp = null;
    let frameProgress = 0;
    let lastFrame = -1;
    let loaded = 0;
    let started = false;
    let completed = false;
    let disposed = false;

    const resizeCanvas = () => {
      const pixelRatio = Math.min(ownerWindow.devicePixelRatio || 1, 2);
      canvas.width = Math.ceil(ownerWindow.innerWidth * pixelRatio);
      canvas.height = Math.ceil(ownerWindow.innerHeight * pixelRatio);
      if (lastFrame >= 0) drawFrame(lastFrame);
    };

    const drawFrame = (frameIndex) => {
      const image = images[frameIndex];
      if (!image) return;
      lastFrame = frameIndex;
      // "cover" the viewport, centered.
      const scale = Math.max(canvas.width / FRAME_WIDTH, canvas.height / FRAME_HEIGHT);
      const destWidth = FRAME_WIDTH * scale;
      const destHeight = FRAME_HEIGHT * scale;
      const destX = (canvas.width - destWidth) / 2;
      const destY = (canvas.height - destHeight) / 2;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, destX, destY, destWidth, destHeight);
    };

    const tick = (now) => {
      if (disposed) return;
      if (lastTimestamp === null) lastTimestamp = now;
      // Advance by real elapsed time scaled by the current speed, so a tap can
      // accelerate playback mid-flight without the frame index ever jumping.
      const delta = (now - lastTimestamp) / 1000;
      lastTimestamp = now;
      frameProgress += delta * FPS * speedRef.current;
      const frameIndex = Math.min(Math.floor(frameProgress), FRAME_COUNT - 1);

      if (frameIndex !== lastFrame) drawFrame(frameIndex);

      if (frameIndex < FRAME_COUNT - 1) {
        rafId = ownerWindow.requestAnimationFrame(tick);
      } else if (!completed) {
        completed = true;
        onCompleteRef.current?.();
      }
    };

    const play = () => {
      if (started) return;
      started = true;
      onReadyRef.current?.();
      rafId = ownerWindow.requestAnimationFrame(tick);
    };

    if (FRAME_COUNT === 0) {
      // No frames bundled — don't trap the viewer on a blank canvas.
      onReadyRef.current?.();
      onCompleteRef.current?.();
      return undefined;
    }

    // Start as soon as the first frame is drawable and a small buffer has
    // decoded — or, as a fallback, once every frame has resolved.
    const maybeStart = () => {
      if (started) return;
      if (images[0] && loaded >= START_BUFFER) play();
      else if (loaded === FRAME_COUNT) play();
    };

    FRAME_URLS.forEach((src, index) => {
      const image = new Image();
      image.decoding = 'async';
      image.onload = () => {
        if (disposed) return;
        images[index] = image;
        loaded += 1;
        if (index === 0 && !started) {
          resizeCanvas();
          drawFrame(0);
        }
        maybeStart();
      };
      image.onerror = () => {
        if (disposed) return;
        loaded += 1;
        maybeStart();
      };
      image.src = src;
    });

    ownerWindow.addEventListener('resize', resizeCanvas);

    return () => {
      disposed = true;
      if (rafId) ownerWindow.cancelAnimationFrame(rafId);
      ownerWindow.removeEventListener('resize', resizeCanvas);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      width={FRAME_WIDTH}
      height={FRAME_HEIGHT}
      aria-hidden="true"
    />
  );
}

export default forwardRef(GardenEnvelopeAnimation);
