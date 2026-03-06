"use client";

import { AnimatePresence, motion } from "framer-motion";

export interface QuickChipsProps {
  onSelect: (prompt: string) => void;
  visible: boolean;
}

const CHIPS: { label: string; prompt: string }[] = [
  { label: "My recommendations", prompt: "What should I read today based on my interests?" },
  { label: "What's trending?", prompt: "What's trending in tech and startups right now?" },
  { label: "Surprise me", prompt: "Surprise me with something I wouldn't normally find." },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.06,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.04,
      staggerDirection: -1,
    },
  },
};

const chipVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 4 },
};

export function QuickChips({ onSelect, visible }: QuickChipsProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="quick-chips"
          className="flex flex-wrap gap-2"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          {CHIPS.map(({ label, prompt }) => (
            <motion.button
              key={prompt}
              type="button"
              variants={chipVariants}
              className="border border-border font-sans text-sm font-medium text-muted-foreground px-4 py-2 rounded-full hover:border-primary hover:text-primary transition-all"
              onClick={() => onSelect(prompt)}
            >
              {label}
            </motion.button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
