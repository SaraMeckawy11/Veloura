import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import airplaneSplash from "../../assets/plane-splash.jpeg";

const PETALS = [
  { id: 0, left: 8, delay: 0, dur: 8.2, size: 6 },
  { id: 1, left: 19, delay: 2.1, dur: 7.1, size: 5 },
  { id: 2, left: 31, delay: 4.5, dur: 9.0, size: 7 },
  { id: 3, left: 44, delay: 1.2, dur: 6.8, size: 5 },
  { id: 4, left: 57, delay: 3.8, dur: 8.5, size: 6 },
  { id: 5, left: 68, delay: 0.7, dur: 7.6, size: 8 },
  { id: 6, left: 79, delay: 5.2, dur: 6.4, size: 5 },
  { id: 7, left: 88, delay: 2.9, dur: 9.3, size: 6 },
  { id: 8, left: 25, delay: 6.1, dur: 7.9, size: 7 },
  { id: 9, left: 53, delay: 1.6, dur: 8.1, size: 5 },
  { id: 10, left: 72, delay: 4.0, dur: 7.3, size: 6 },
  { id: 11, left: 14, delay: 7.3, dur: 8.8, size: 5 },
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

interface SplashScreenProps {
  onDismiss: () => void;
}

const SplashScreen = ({ onDismiss }: SplashScreenProps) => {
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
        className="fixed inset-0 z-[9999] cursor-pointer overflow-hidden"
        onClick={handleClick}
        style={{ background: "linear-gradient(180deg, #04060d 0%, #080c18 100%)" }}
        exit={{ opacity: 0, transition: { duration: 0.6, delay: 1.0 } }}
      >
        {/* Rose petals */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden>
          {PETALS.map((p) => (
            <motion.div
              key={p.id}
              className="absolute"
              style={{
                left: `${p.left}%`,
                bottom: "-20px",
                width: p.size,
                height: p.size * 1.4,
                borderRadius: "50% 0 50% 0",
                background: "rgba(220,150,160,0.22)",
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
                ease: "linear",
              }}
            />
          ))}
        </div>

        {/* Gold stars */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden>
          {STARS.map((s) => (
            <motion.span
              key={s.id}
              className="absolute"
              style={{ left: `${s.left}%`, top: `${s.top}%`, color: "#c9a96e", fontSize: "10px" }}
              animate={{ opacity: [0.05, 0.7, 0.05], scale: [0.8, 1.3, 0.8] }}
              transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, ease: "easeInOut" }}
            >
              ✦
            </motion.span>
          ))}
        </div>

        {/* Plane image — blend mode makes black bg transparent so stars show through */}
        <motion.img
          src={airplaneSplash}
          alt=""
          className="absolute top-0 left-0 w-full h-full object-cover object-center select-none pointer-events-none"
          style={{ mixBlendMode: "screen" }}
          draggable={false}
          animate={
            dismissed
              ? {
                  y: ["0vh", "-6vh", "-52vh", "-135vh"],
                  scale: [1, 0.98, 0.93, 0.83],
                  filter: ["blur(0px)", "blur(0px)", "blur(1.5px)", "blur(5px)"],
                }
              : { y: "0vh", scale: 1, filter: "blur(0px)" }
          }
          transition={
            dismissed
              ? { duration: 1.6, ease: [0.3, 0, 0.9, 1], times: [0, 0.2, 0.6, 1] }
              : undefined
          }
        />

        {/* Vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "radial-gradient(ellipse at center, transparent 28%, rgba(0,0,0,0.6) 100%)",
          }}
          aria-hidden
        />

        {/* "You are invited" — top center */}
        {!dismissed && (
          <motion.div
            className="absolute top-12 left-0 right-0 text-center pointer-events-none z-10"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.5, delay: 0.5 }}
          >
            <p
              className="font-mono-data text-sm uppercase tracking-[0.4em]"
              style={{ color: "rgba(201,169,110,0.85)" }}
            >
              You are invited
            </p>
          </motion.div>
        )}

        {/* Tap hint — bottom center */}
        {!dismissed && (
          <motion.p
            className="absolute bottom-10 left-0 right-0 text-center font-mono-data text-xs uppercase tracking-[0.35em] z-10"
            style={{ color: "rgba(255,255,255,0.5)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
          >
            ✈ &nbsp; Tap to open &nbsp; ✈
          </motion.p>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default SplashScreen;
