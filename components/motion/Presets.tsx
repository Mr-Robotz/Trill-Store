import type { Variants } from "framer-motion";

export const modalBackdrop: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export const genieOpen: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.86,
    y: 14,
    filter: "blur(6px)",
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: "blur(0px)",
  },
  exit: {
    opacity: 0,
    scale: 0.92,
    y: 10,
    filter: "blur(6px)",
  },
};

export const sheetRight: Variants = {
  hidden: { x: "110%" },
  visible: { x: 0 },
  exit: { x: "110%" },
};

export const sheetLeft: Variants = {
  hidden: { x: "-110%" },
  visible: { x: 0 },
  exit: { x: "-110%" },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
};

export const fadeDown: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export const staggerChildren: Variants = {
  hidden: { opacity: 1 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};