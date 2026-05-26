import React from 'react';
import { useLocation } from 'react-router-dom';
import { Box } from '@mui/material';

/**
 * Wraps route content for smooth page transitions: fade + slight translateY.
 * 180–220ms, no hard jumps. Respects prefers-reduced-motion via CSS.
 */
const PageTransition = ({ children }) => {
  const location = useLocation();

  return (
    <Box
      key={location.pathname}
      className="motion-page-enter"
      sx={{
        width: '100%',
        minHeight: 0,
      }}
    >
      {children}
    </Box>
  );
};

export default PageTransition;
