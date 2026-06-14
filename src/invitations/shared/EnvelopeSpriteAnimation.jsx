import { useEffect, useRef } from 'react';
import spriteUrl from '../../assets/envelope_animation_sprite.webp';

// Lightweight, native canvas player for the shared envelope-opening animation.
//
// Previously both the Garden Pavilion and Fountain Reverie splash screens
// embedded a 1.3MB self-contained HTML file (73 base64-inlined frames) inside
// an <iframe>. Parsing that much inline markup, spinning up a separate browsing
// context, and decoding the inlined image all happened before the first frame
// could paint, which is what made the envelope feel heavy / slow to appear.
//
// This component renders the same frames directly on a <canvas> in the host
// document. The sprite sheet is bundled by Vite, so it is hashed, cached, and
// fetched in parallel like any other asset. No iframe, no base64 parsing; the
// animation starts the instant the sprite decodes.
const FRAME_WIDTH = 337;
const FRAME_HEIGHT = 540;
const LEGACY_FRAME_COUNT = 73;
const TARGET_FRAME_COUNT = 134;
const COLUMNS = 12;
const FPS = 20;

export default function EnvelopeSpriteAnimation({ className, onReady, onComplete }) {
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
    const context = canvas.getContext('2d', { alpha: true });
    const sprite = new Image();
    sprite.decoding = 'async';

    let rafId = null;
    let startTime = null;
    let lastFrame = -1;
    let completed = false;
    let disposed = false;
    let spriteColumns = COLUMNS;
    let playableFrameCount = LEGACY_FRAME_COUNT;

    const resizeCanvas = () => {
      const pixelRatio = Math.max(ownerWindow.devicePixelRatio || 1, 1);
      canvas.width = Math.ceil(ownerWindow.innerWidth * pixelRatio);
      canvas.height = Math.ceil(ownerWindow.innerHeight * pixelRatio);
      if (lastFrame >= 0) drawFrame(lastFrame);
    };

    const drawFrame = (frameIndex) => {
      const sourceX = (frameIndex % spriteColumns) * FRAME_WIDTH;
      const sourceY = Math.floor(frameIndex / spriteColumns) * FRAME_HEIGHT;
      // "cover" the viewport, centered — matches the previous iframe renderer.
      const scale = Math.max(canvas.width / FRAME_WIDTH, canvas.height / FRAME_HEIGHT);
      const destWidth = FRAME_WIDTH * scale;
      const destHeight = FRAME_HEIGHT * scale;
      const destX = (canvas.width - destWidth) / 2;
      const destY = (canvas.height - destHeight) / 2;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(
        sprite,
        sourceX,
        sourceY,
        FRAME_WIDTH,
        FRAME_HEIGHT,
        destX,
        destY,
        destWidth,
        destHeight,
      );
    };

    const tick = (now) => {
      if (disposed) return;
      if (startTime === null) startTime = now;
      const elapsed = (now - startTime) / 1000;
      const frameIndex = Math.min(Math.floor(elapsed * FPS), playableFrameCount - 1);

      if (frameIndex !== lastFrame) {
        drawFrame(frameIndex);
        lastFrame = frameIndex;
      }

      if (frameIndex < playableFrameCount - 1) {
        rafId = ownerWindow.requestAnimationFrame(tick);
      } else if (!completed) {
        completed = true;
        onCompleteRef.current?.();
      }
    };

    const handleLoad = () => {
      if (disposed) return;
      const naturalColumns = Math.floor(sprite.naturalWidth / FRAME_WIDTH);
      const naturalRows = Math.floor(sprite.naturalHeight / FRAME_HEIGHT);
      const spriteSlotCount = naturalColumns * naturalRows;
      const isLegacySprite = spriteSlotCount <= COLUMNS * 7;

      spriteColumns = naturalColumns || COLUMNS;
      playableFrameCount = Math.max(
        1,
        Math.min(isLegacySprite ? LEGACY_FRAME_COUNT : TARGET_FRAME_COUNT, spriteSlotCount || LEGACY_FRAME_COUNT),
      );
      resizeCanvas();
      drawFrame(0);
      onReadyRef.current?.();
      rafId = ownerWindow.requestAnimationFrame(tick);
    };

    sprite.addEventListener('load', handleLoad);
    ownerWindow.addEventListener('resize', resizeCanvas);
    sprite.src = spriteUrl;

    return () => {
      disposed = true;
      if (rafId) ownerWindow.cancelAnimationFrame(rafId);
      sprite.removeEventListener('load', handleLoad);
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
