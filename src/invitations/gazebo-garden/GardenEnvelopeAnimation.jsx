import { useEffect, useRef } from 'react';

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
const LAST_PLAYABLE_FRAME = 134;
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
const FPS = 30;

export default function GardenEnvelopeAnimation({ className, onReady, onComplete }) {
  const canvasRef = useRef(null);
  const onReadyRef = useRef(onReady);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onReadyRef.current = onReady;
    onCompleteRef.current = onComplete;
  }, [onReady, onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    const ownerWindow = canvas.ownerDocument?.defaultView || window;
    const context = canvas.getContext('2d', { alpha: false });
    const images = new Array(FRAME_COUNT);

    let rafId = null;
    let startTime = null;
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
      if (startTime === null) startTime = now;
      const elapsed = (now - startTime) / 1000;
      const frameIndex = Math.min(Math.floor(elapsed * FPS), FRAME_COUNT - 1);

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
        if (loaded === FRAME_COUNT) play();
      };
      image.onerror = () => {
        if (disposed) return;
        loaded += 1;
        if (loaded === FRAME_COUNT) play();
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
