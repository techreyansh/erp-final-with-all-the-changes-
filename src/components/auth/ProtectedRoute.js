import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../context/AuthContext';

/**
 * Waits for auth + optional Supabase sync (fixes race: getSession has user before React state updates).
 */
const ProtectedRoute = ({ children }) => {
  const { user, authLoading, syncUserFromSupabase } = useAuth();
  const location = useLocation();
  const [sessionResolved, setSessionResolved] = useState(false);

  useEffect(() => {
    if (authLoading) {
      setSessionResolved(false);
      return undefined;
    }
    if (user) {
      setSessionResolved(true);
      return undefined;
    }
    let cancelled = false;
    (async () => {
      await syncUserFromSupabase();
      if (!cancelled) setSessionResolved(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, user, syncUserFromSupabase]);

  if (authLoading || !sessionResolved) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2,
          minHeight: '40vh',
        }}
      >
        <CircularProgress size={32} />
        <Typography variant="body2" color="text.secondary">
          Loading…
        </Typography>
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default ProtectedRoute;
