import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import FullScreenLogoLoader from '../common/FullScreenLogoLoader';

/**
 * OAuth may return to `/` with ?code= or ?error=. All navigation runs in useEffect (hooks order stays stable).
 */
const RootRedirect = () => {
  const { authLoading, oauthCallbackHadError, syncUserFromSupabase } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (authLoading) return undefined;

    if (oauthCallbackHadError) {
      navigate('/login', { replace: true });
      return undefined;
    }

    let cancelled = false;
    (async () => {
      const hasSession = await syncUserFromSupabase();
      if (cancelled) return;
      navigate(hasSession ? '/home' : '/login', { replace: true });
    })();

    return () => {
      cancelled = true;
    };
  }, [authLoading, oauthCallbackHadError, navigate, syncUserFromSupabase]);

  return <FullScreenLogoLoader />;
};

export default RootRedirect;
