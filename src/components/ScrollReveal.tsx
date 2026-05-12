import { motion } from "framer-motion";
import type { ReactNode } from "react";
import type { ThemeDefinition } from "../types";
import { cn } from "../utils/cn";

type ScrollRevealProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  theme: ThemeDefinition;
};

export function ScrollReveal({
  children,
  className,
  delay = 0,
  theme
}: ScrollRevealProps) {
  return (
    <motion.div
      className={cn(className)}
      initial={{ opacity: 0, y: theme.motion.sectionOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.22 }}
      transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay }}
    >
      {children}
    </motion.div>
  );
}
