import React, { useEffect, useState } from "react";
import { Box, useTheme } from "@mui/material";

/**
 * Thin scroll progress indicator (document). Lightweight rAF-throttled.
 */
export default function ScrollProgressBar() {
  const theme = useTheme();
  const [p, setP] = useState(0);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = document.documentElement;
        const scrollTop = el.scrollTop || document.body.scrollTop;
        const height = el.scrollHeight - el.clientHeight;
        const next = height > 0 ? Math.min(1, Math.max(0, scrollTop / height)) : 0;
        setP(next);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  const atTop =
    typeof document !== "undefined" &&
    document.documentElement.scrollTop < 2 &&
    p < 0.005;
  if (atTop) return null;

  return (
    <Box
      aria-hidden
      sx={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: (theme) => theme.zIndex.appBar + 2,
        pointerEvents: "none",
        bgcolor: "transparent",
      }}
    >
      <Box
        sx={{
          height: "100%",
          width: `${p * 100}%`,
          bgcolor: "primary.main",
          opacity: 0.85,
          transition: "width 0.08s linear",
          boxShadow: `0 0 8px ${theme.palette.primary.main}55`,
        }}
      />
    </Box>
  );
}
