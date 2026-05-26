import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Box } from "@mui/material";

const MotionBox = motion(Box);

/**
 * Subtle scroll-triggered reveal. Respects prefers-reduced-motion.
 * Keeps duration ≤ 400ms for ERP usability.
 */
export default function ScrollReveal({
  children,
  delay = 0,
  y = 16,
  duration = 0.35,
  once = true,
  sx,
  ...props
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <Box sx={sx} {...props}>
        {children}
      </Box>
    );
  }

  return (
    <MotionBox
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.1, margin: "0px 0px -72px 0px" }}
      transition={{ duration, delay, ease: [0.22, 1, 0.36, 1] }}
      sx={sx}
      {...props}
    >
      {children}
    </MotionBox>
  );
}
