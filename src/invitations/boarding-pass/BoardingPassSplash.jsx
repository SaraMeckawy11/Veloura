import { useState } from 'react';
// eslint-disable-next-line no-unused-vars -- motion.div / motion.img use `motion` via JSX members
import { motion, AnimatePresence } from 'framer-motion';
import airplaneSplash from '../../assets/plane-splash.jpeg';

const PETALS = [
  { id: 0, left: 8, delay: 0, dur: 8.2, size: 8 },
  { id: 1, left: 19, delay: 2.1, dur: 7.1, size: 6 },
  { id: 2, left: 31, delay: 4.5, dur: 9.0, size: 9 },
  { id: 3, left: 44, delay: 1.2, dur: 6.8, size: 7 },
  { id: 4, left: 57, delay: 3.8, dur: 8.5, size: 8 },
  { id: 5, left: 68, delay: 0.7, dur: 7.6, size: 10 },
  { id: 6, left: 79, delay: 5.2, dur: 6.4, size: 6 },
  { id: 7, left: 88, delay: 2.9, dur: 9.3, size: 8 },
  { id: 8, left: 25, delay: 6.1, dur: 7.9, size: 9 },
  { id: 9, left: 53, delay: 1.6, dur: 8.1, size: 7 },
  { id: 10, left: 72, delay: 4.0, dur: 7.3, size: 8 },
  { id: 11, left: 14, delay: 7.3, dur: 8.8, size: 6 },
  { id: 12, left: 40, delay: 0.4, dur: 7.0, size: 7 },
  { id: 13, left: 62, delay: 3.2, dur: 8.7, size: 9 },
  { id: 14, left: 85, delay: 5.8, dur: 6.9, size: 6 },
];

const STARS = [
  { id: 0, left: 12, top: 10, delay: 0, dur: 2.1 },
  { id: 1, left: 28, top: 25, delay: 1.3, dur: 3.0 },
  { id: 2, left: 45, top: 8, delay: 0.5, dur: 2.5 },
  { id: 3, left: 63, top: 30, delay: 2.1, dur: 1.8 },
  { id: 4, left: 78, top: 15, delay: 0.9, dur: 2.8 },
  { id: 5, left: 91, top: 42, delay: 1.7, dur: 2.2 },
  { id: 6, left: 35, top: 55, delay: 3.1, dur: 3.2 },
  { id: 7, left: 55, top: 70, delay: 0.3, dur: 2.0 },
  { id: 8, left: 82, top: 62, delay: 2.5, dur: 2.7 },
  { id: 9, left: 6, top: 75, delay: 1.1, dur: 1.9 },
];

export default function BoardingPassSplash({ onDismiss }) {
  const [dismissed, setDismissed] = useState(false);

  const handleClick = () => {
    if (dismissed) return;
    setDismissed(true);
    setTimeout(onDismiss, 1800);
  };

  return (
    <AnimatePresence>
      <motion.div
        key="splash"
        className="inv-splash"
        role="button"
        tabIndex={0}
        aria-label="Open invitation"
        onClick={handleClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        exit={{ opacity: 0, transition: { duration: 0.6, delay: 1.0 } }}
      >
        <div className="inv-splash-petals" aria-hidden>
          {PETALS.map((p) => (
            <motion.div
              key={p.id}
              className="inv-splash-petal"
              style={{
                left: `${p.left}%`,
                bottom: '-20px',
                width: p.size,
                height: p.size * 1.5,
                borderRadius: '50% 0 50% 0',
                background: p.id % 3 === 0
                  ? 'rgba(200,160,140,0.18)'
                  : p.id % 3 === 1
                  ? 'rgba(220,170,170,0.15)'
                  : 'rgba(190,155,130,0.2)',
              }}
              animate={{
                y: [0, -1200],
                rotate: [0, 540],
                opacity: [0, 0.9, 0.8, 0],
              }}
              transition={{
                duration: p.dur,
                delay: p.delay,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          ))}
        </div>

        <div className="inv-splash-stars" aria-hidden>
          {STARS.map((s) => (
            <motion.span
              key={s.id}
              className="inv-splash-star"
              style={{ left: `${s.left}%`, top: `${s.top}%` }}
              animate={{ opacity: [0.03, 0.6, 0.03], scale: [0.7, 1.4, 0.7] }}
              transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: 'easeInOut' }}
            >
              ✦
            </motion.span>
          ))}
        </div>

        <motion.img
          src={airplaneSplash}
          alt=""
          className="inv-splash-plane-img"
          style={{ mixBlendMode: 'screen' }}
          draggable={false}
          animate={
            dismissed
              ? {
                  y: ['0vh', '-6vh', '-52vh', '-135vh'],
                  scale: [1, 0.98, 0.93, 0.83],
                  filter: ['blur(0px)', 'blur(0px)', 'blur(1.5px)', 'blur(5px)'],
                }
              : { y: '0vh', scale: 1, filter: 'blur(0px)' }
          }
          transition={
            dismissed
              ? { duration: 1.6, ease: [0.3, 0, 0.9, 1], times: [0, 0.2, 0.6, 1] }
              : undefined
          }
        />

        <div className="inv-splash-vignette" aria-hidden />

        {/* "You are invited" — above the plane */}
        {!dismissed && (
          <motion.div
            className="inv-splash-invite-text"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 0.5 }}
          >
            <p>You are invited</p>
          </motion.div>
        )}

        {/* Tap hint — bottom center */}
        {!dismissed && (
          <motion.p
            className="inv-splash-tap-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          >
            tap to open your invitation
          </motion.p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
