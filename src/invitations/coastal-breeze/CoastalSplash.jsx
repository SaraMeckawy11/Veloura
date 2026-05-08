import { useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.* is used through JSX member expressions
import { motion, AnimatePresence } from 'framer-motion';
import closedDoor from '../../assets/coastal/coastal-closed-door.webp';
import openedDoor from '../../assets/coastal/coastal-door-open-empty.webp';

const BIRDS = [
  { id: 0, top: 16, delay: 0, duration: 18, scale: 0.9 },
  { id: 1, top: 26, delay: 5, duration: 21, scale: 0.7 },
  { id: 2, top: 40, delay: 10, duration: 19, scale: 0.8 },
];

export default function CoastalSplash({ onDismiss }) {
  const [opening, setOpening] = useState(false);

  const handleOpen = () => {
    if (opening) return;
    setOpening(true);
    // Total: 3.6s door swing + 0.9s scene settle + 0.6s fade out
    setTimeout(onDismiss, 4800);
  };

  const swingDuration = 3.6;
  const swingEase = [0.32, 0.08, 0.18, 1];

  return (
    <AnimatePresence>
      <motion.div
        key="coastal-splash"
        className={`coastal-splash${opening ? ' coastal-splash-opening' : ''}`}
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
        exit={{ opacity: 0, transition: { duration: 0.7, ease: 'easeOut' } }}
      >
        <div className="coastal-splash-stage" aria-hidden>
          <motion.div
            className="coastal-splash-scene"
            initial={{ scale: 1.18, filter: 'blur(6px) brightness(0.78)' }}
            animate={
              opening
                ? { scale: 1, filter: 'blur(0px) brightness(1)' }
                : { scale: 1.18, filter: 'blur(6px) brightness(0.78)' }
            }
            transition={{ duration: swingDuration + 0.4, ease: swingEase }}
          >
            <img className="coastal-splash-open-door" src={openedDoor} alt="" />
          </motion.div>

          <div className="coastal-splash-vignette" aria-hidden />

          <div className="coastal-bird-layer" aria-hidden>
            {BIRDS.map((bird) => (
              <span
                key={bird.id}
                className="coastal-bird"
                style={{
                  top: `${bird.top}%`,
                  animationDelay: `${bird.delay}s`,
                  animationDuration: `${bird.duration}s`,
                  transform: `scale(${bird.scale})`,
                }}
              />
            ))}
          </div>

          <div className="coastal-closed-door" aria-hidden>
            <motion.div
              className="coastal-door-panel coastal-door-panel-left"
              style={{ backgroundImage: `url(${closedDoor})` }}
              initial={{ rotateY: 0 }}
              animate={
                opening
                  ? { rotateY: -92, filter: 'brightness(0.78)' }
                  : { rotateY: 0, filter: 'brightness(1)' }
              }
              transition={{ duration: swingDuration, ease: swingEase }}
            />
            <motion.div
              className="coastal-door-panel coastal-door-panel-right"
              style={{ backgroundImage: `url(${closedDoor})` }}
              initial={{ rotateY: 0 }}
              animate={
                opening
                  ? { rotateY: 92, filter: 'brightness(0.78)' }
                  : { rotateY: 0, filter: 'brightness(1)' }
              }
              transition={{ duration: swingDuration, ease: swingEase }}
            />
            <motion.div
              className="coastal-door-seam"
              animate={opening ? { opacity: 0, scaleY: 0 } : { opacity: 1, scaleY: 1 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
            <motion.div
              className="coastal-door-glow"
              initial={{ opacity: 0 }}
              animate={opening ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: swingDuration * 0.55, delay: swingDuration * 0.2 }}
            />
          </div>
        </div>

        <motion.div
          className="coastal-splash-copy"
          animate={opening ? { opacity: 0, y: -16 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        >
          <span className="coastal-splash-eyebrow">You are cordially invited</span>
          <p className="coastal-splash-script">to the wedding</p>
          <span className="coastal-splash-hint">Tap to open the doors</span>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
