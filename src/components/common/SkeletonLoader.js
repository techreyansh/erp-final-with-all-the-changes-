import React from 'react';
import { Box } from '@mui/material';

/**
 * Skeleton loaders for tables, cards, and forms. Subtle shimmer, no spinners.
 * Use variant="table" | "card" | "form" | "text".
 */
const SkeletonLoader = ({ variant = 'text', rows = 3, ...rest }) => {
  const { sx, ...boxProps } = rest;
  const baseSx = {
    borderRadius: 1,
    backgroundColor: 'transparent',
  };

  if (variant === 'table') {
    return (
      <Box sx={{ width: '100%', ...sx }} {...boxProps}>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          {[40, 25, 25, 15].map((w, i) => (
            <Box
              key={i}
              sx={{
                ...baseSx,
                height: 40,
                width: `${w}%`,
              }}
              className="motion-skeleton-shimmer"
            />
          ))}
        </Box>
        {Array.from({ length: rows }).map((_, i) => (
          <Box
            key={i}
            sx={{
              display: 'flex',
              gap: 1,
              mb: 1.5,
            }}
          >
            {[30, 20, 25, 15, 10].map((w, j) => (
              <Box
                key={j}
                sx={{
                  ...baseSx,
                  height: 44,
                  width: `${w}%`,
                }}
                className="motion-skeleton-shimmer"
              />
            ))}
          </Box>
        ))}
      </Box>
    );
  }

  if (variant === 'card') {
    return (
      <Box
        sx={{
          p: 2.5,
          borderRadius: 2,
          border: '1px solid',
          borderColor: 'divider',
          ...sx,
        }}
        {...boxProps}
      >
        <Box
          sx={{ ...baseSx, height: 24, width: '60%', mb: 2 }}
          className="motion-skeleton-shimmer"
        />
        <Box
          sx={{ ...baseSx, height: 16, width: '100%', mb: 1 }}
          className="motion-skeleton-shimmer"
        />
        <Box
          sx={{ ...baseSx, height: 16, width: '85%', mb: 1 }}
          className="motion-skeleton-shimmer"
        />
        <Box
          sx={{ ...baseSx, height: 16, width: '70%' }}
          className="motion-skeleton-shimmer"
        />
      </Box>
    );
  }

  if (variant === 'form') {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, ...sx }} {...boxProps}>
        {[1, 2, 3, 4].map((i) => (
          <Box key={i}>
            <Box
              sx={{ ...baseSx, height: 14, width: 100, mb: 1 }}
              className="motion-skeleton-shimmer"
            />
            <Box
              sx={{ ...baseSx, height: 44, width: '100%' }}
              className="motion-skeleton-shimmer"
            />
          </Box>
        ))}
        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
          <Box sx={{ ...baseSx, height: 40, width: 100 }} className="motion-skeleton-shimmer" />
          <Box sx={{ ...baseSx, height: 40, width: 100 }} className="motion-skeleton-shimmer" />
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        ...baseSx,
        height: 20,
        width: '100%',
        maxWidth: 280,
        ...sx,
      }}
      className="motion-skeleton-shimmer"
      {...boxProps}
    />
  );
};

export default SkeletonLoader;
