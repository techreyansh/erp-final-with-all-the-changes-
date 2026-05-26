import React, { useState } from 'react';
import { Box, Typography } from '@mui/material';

/**
 * Full-screen loading state using brand logo. Premium, minimal.
 * Used during auth check. Respects prefers-reduced-motion.
 */
const LOGO_SRC = process.env.PUBLIC_URL + '/reyansh-logo.png';
const BRAND_COLOR = '#26ACEC';
const TEXT_COLOR = '#202834';

const FullScreenLogoLoader = () => {
  const [imgError, setImgError] = useState(false);

  return (
    <Box
      sx={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFFFFF',
        zIndex: 9999,
      }}
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
        className="motion-logo-pulse"
      >
        {!imgError ? (
          <img
            src={LOGO_SRC}
            alt="Reyansh International"
            onError={() => setImgError(true)}
            style={{
              maxWidth: 200,
              maxHeight: 64,
              objectFit: 'contain',
              height: 'auto',
            }}
          />
        ) : (
          <Box sx={{ textAlign: 'center' }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 700,
                color: TEXT_COLOR,
                letterSpacing: '-0.02em',
              }}
            >
              REYANSH
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                color: '#64748B',
                fontWeight: 500,
                letterSpacing: '0.04em',
                mt: 0.5,
              }}
            >
              INTERNATIONAL PVT. LTD.
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default FullScreenLogoLoader;
