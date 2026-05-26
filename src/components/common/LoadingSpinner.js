import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import SkeletonLoader from './SkeletonLoader';

/**
 * Loading state: inline spinner or skeleton (table/card/form).
 * Buttons use internal spinner + reduced text opacity; use loading prop on MuiButton.
 */
const LoadingSpinner = ({ message = 'Loading...', variant, skeletonRows = 5, ...rest }) => {
  if (variant === 'skeleton-table') {
    return <SkeletonLoader variant="table" rows={skeletonRows} {...rest} />;
  }
  if (variant === 'skeleton-card') {
    return <SkeletonLoader variant="card" {...rest} />;
  }
  if (variant === 'skeleton-form') {
    return <SkeletonLoader variant="form" {...rest} />;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        minHeight: '200px',
        padding: 3,
      }}
      role="status"
      aria-live="polite"
    >
      <CircularProgress
        size={44}
        thickness={3.2}
        sx={{
          mb: 2,
          color: 'primary.main',
          transition: 'opacity 0.2s ease',
        }}
      />
      {message && (
        <Typography variant="body2" color="text.secondary" sx={{ transition: 'opacity 0.2s ease' }}>
          {message}
        </Typography>
      )}
    </Box>
  );
};

export default LoadingSpinner;
