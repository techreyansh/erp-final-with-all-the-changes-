import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Box, Typography, Paper } from '@mui/material';
import { Lock } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import ceoDashboardAccessLog from '../../services/ceoDashboardAccessLog';

/**
 * Route guard: Renders children ONLY for CEO role.
 * Non-CEO users get "Access Denied – Insufficient Privileges" (no redirect, no leak of route purpose).
 * All access attempts are logged. Backend must validate CEO role server-side when APIs exist.
 */
const CEOOnlyRoute = ({ children }) => {
  const { user, role, loading: authLoading } = useAuth();
  const location = useLocation();
  const logged = useRef(false);

  useEffect(() => {
    if (authLoading || !user) return;
    const granted = role === 'CEO';
    if (!logged.current) {
      ceoDashboardAccessLog.logAccessAttempt({
        granted,
        userId: user.email ?? user.id,
        userRole: role ?? null,
      });
      logged.current = true;
    }
  }, [authLoading, user]);

  if (authLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
        <Typography variant="body2" color="text.secondary">Checking access...</Typography>
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role !== 'CEO') {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          px: 2,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 4,
            maxWidth: 440,
            textAlign: 'center',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Lock sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
            Access Denied – Insufficient Privileges
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You do not have permission to view this resource. Contact your administrator if you believe this is an error.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return children;
};

export default CEOOnlyRoute;
