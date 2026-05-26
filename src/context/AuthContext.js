import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { supabase } from '../lib/supabaseClient';
import {
  parseOAuthErrorFromWindow,
  clearOAuthCallbackFromBrowserUrl,
  googleOAuthExchangeFailureHint,
} from '../lib/oauthCallbackParams';

const AuthContext = createContext();

function mapSessionToUser(sessionUser) {
  if (!sessionUser) return null;
  return {
    id: sessionUser.id,
    email: sessionUser.email ?? sessionUser.user_metadata?.email ?? '',
    role: null,
    roleCode: null,
  };
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [error, setError] = useState(null);
  /** True when URL had ?error= from Supabase OAuth redirect — skip spinner on / and go straight to login. */
  const [oauthCallbackHadError, setOauthCallbackHadError] = useState(false);

  const enrichRole = useCallback(async (userId) => {
    if (!userId) return;
    try {
      const { data: superAdmin, error: rpcErr } = await supabase.rpc('is_super_admin');
      if (!rpcErr && superAdmin === true) {
        setUser((prev) =>
          prev && prev.id === userId
            ? { ...prev, role: 'CEO', roleCode: 'CEO' }
            : prev
        );
        setError(null);
        return;
      }
    } catch (e) {
      console.warn('is_super_admin RPC unavailable or migration not applied:', e);
    }

    try {
      const { data, error: dbError } = await supabase
        .from('users')
        .select(
          `
          id,
          email,
          roles (
            id,
            name,
            code
          )
        `
        )
        .eq('id', userId)
        .single();

      if (dbError) {
        console.error('Role fetch error:', dbError);
        setError('Could not load your profile. You are still signed in.');
        return;
      }

      if (!data?.roles) {
        setError('Your account has no role assigned yet. Contact an administrator.');
        return;
      }

      setUser((prev) =>
        prev && prev.id === userId
          ? {
              ...prev,
              role: data.roles?.name ?? null,
              roleCode: data.roles?.code ?? null,
            }
          : prev
      );
      setError(null);
    } catch (e) {
      console.error('Unexpected error loading user/role:', e);
      setError('Could not load your profile. You are still signed in.');
    }
  }, []);

  /** Ensures React `user` matches Supabase. Returns true if a session exists. */
  const syncUserFromSupabase = useCallback(async () => {
    let session = null;
    for (let i = 0; i < 8; i++) {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) console.error('getSession (sync):', sessionError);
      session = data.session ?? null;
      if (session?.user) break;
      await new Promise((r) => setTimeout(r, 80));
    }
    console.log('SESSION (sync):', session);
    if (session?.user) {
      setUser(mapSessionToUser(session.user));
      void enrichRole(session.user.id);
      return true;
    }
    setUser(null);
    return false;
  }, [enrichRole]);

  useEffect(() => {
    let mounted = true;

    const applySession = (session) => {
      console.log('SESSION:', session);
      const u = session?.user ? mapSessionToUser(session.user) : null;
      setUser(u);
      if (u?.id) {
        setOauthCallbackHadError(false);
        setError(null);
        void enrichRole(session.user.id);
      }
      // Do not setError(null) when u is null — that was wiping ?error= messages from the OAuth redirect.
    };

    (async () => {
      try {
        if (typeof window !== 'undefined') {
          const parsed = parseOAuthErrorFromWindow();
          if (parsed) {
            const { error: oauthErr, message: msg } = parsed;
            console.error('[auth] OAuth redirect error:', oauthErr, msg);
            const isExchangeFail =
              /exchange|external code|server_error|unexpected_failure/i.test(
                `${msg} ${oauthErr} ${parsed.error_code || ''}`
              );
            const fullMsg =
              (msg || 'Sign-in failed.') +
              (isExchangeFail ? googleOAuthExchangeFailureHint() : '');
            if (mounted) {
              setError(fullMsg);
              setOauthCallbackHadError(true);
            }
            clearOAuthCallbackFromBrowserUrl();
          }
        }

        /**
         * Do NOT call exchangeCodeForSession() here. getSession() awaits the client's initializePromise,
         * which already runs PKCE exchange from ?code= and saves the session. A second exchange removes
         * the verifier and fails with AuthPKCECodeVerifierMissingError — leaving you stuck with no session.
         */
        let session = null;
        for (let i = 0; i < 15; i++) {
          const { data, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) console.error('getSession:', sessionError);
          session = data.session ?? null;
          if (session?.user) break;
          await new Promise((r) => setTimeout(r, 100));
        }
        console.log('SESSION:', session);
        if (!mounted) return;
        if (session) {
          applySession(session);
        }
      } finally {
        if (mounted) setAuthLoading(false);
      }
    })();

    const { data: listenerData } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('AUTH EVENT:', event, session);
      console.log('SESSION:', session);
      if (!mounted) return;
      if (event === 'TOKEN_REFRESHED') return;
      if (event === 'INITIAL_SESSION') {
        if (session?.user) applySession(session);
        return;
      }
      applySession(session ?? null);
    });

    return () => {
      mounted = false;
      listenerData?.subscription?.unsubscribe();
    };
  }, [enrichRole]);

  const clearAuthSurfaceErrors = useCallback(() => {
    setError(null);
    setOauthCallbackHadError(false);
  }, []);

  const signOut = async () => {
    try {
      setAuthLoading(true);
      await supabase.auth.signOut();
      setUser(null);
      setError(null);
      setOauthCallbackHadError(false);
      window.location.assign('/login');
    } catch (err) {
      console.error('Error signing out:', err);
      setUser(null);
      setError(null);
      setOauthCallbackHadError(false);
      window.location.assign('/login');
    } finally {
      setAuthLoading(false);
    }
  };

  const role = user?.role ?? null;

  const value = {
    user,
    role,
    loading: authLoading,
    authLoading,
    error,
    oauthCallbackHadError,
    clearAuthSurfaceErrors,
    syncUserFromSupabase,
    signOut,
    isAuthenticated: !!user,
    hasRole: (requiredRole) =>
      !!role &&
      !!requiredRole &&
      (String(role).trim() === String(requiredRole).trim() ||
        String(user?.roleCode ?? '').trim() === String(requiredRole).trim()),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
