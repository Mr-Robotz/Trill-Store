"use client";

import { MotionConfig } from "framer-motion";
import * as React from "react";

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig
      reducedMotion="user"
      transition={{
        type: "spring",
        stiffness: 520,
        damping: 38,
        mass: 0.7,
      }}
    >
      {children}
    </MotionConfig>
  );
}