/**
 * Supabase may return OAuth errors in the query string, the hash, or both (e.g. ...#error=...&sb=).
 */

/**
 * After Google sign-in, Supabase sends the user here (app root). Must be in Supabase Redirect URLs.
 * PKCE verifier is per-origin — always use the same host/port as the address bar (localhost vs 127.0.0.1).
 */
export function getOAuthRedirectUrl() {
  if (typeof window === 'undefined') {
    return process.env.REACT_APP_OAUTH_REDIRECT_URL?.trim() || 'http://localhost:3000';
  }
  const forced = process.env.REACT_APP_OAUTH_REDIRECT_URL?.trim();
  if (forced) return forced;
  return window.location.origin;
}

/** e.g. https://xxxx.supabase.co — for Google "Authorized JavaScript origins" */
export function getSupabaseProjectOrigin() {
  const raw = process.env.REACT_APP_SUPABASE_URL?.trim();
  if (!raw) return null;
  try {
    return new URL(raw.startsWith('http') ? raw : `https://${raw}`).origin;
  } catch {
    return null;
  }
}

/** Options for supabase.auth.signInWithOAuth({ provider: 'google', options }) — single place, no redundant scopes. */
export function getGoogleSignInWithOAuthOptions() {
  return {
    redirectTo: getOAuthRedirectUrl(),
    queryParams: {
      prompt: 'consent select_account',
    },
  };
}

export function getSupabaseGoogleRedirectCallbackUrl() {
  const raw = process.env.REACT_APP_SUPABASE_URL?.trim();
  if (!raw) return 'https://<your-project-ref>.supabase.co/auth/v1/callback';
  try {
    const u = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    return `${u.origin}/auth/v1/callback`;
  } catch {
    return 'https://<your-project-ref>.supabase.co/auth/v1/callback';
  }
}

/**
 * @returns {{ error: string, error_code: string | null, message: string } | null}
 */
export function parseOAuthErrorFromWindow() {
  if (typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  let err = url.searchParams.get('error');
  let desc = url.searchParams.get('error_description');
  let code = url.searchParams.get('error_code');

  if (url.hash && url.hash.length > 1) {
    const hashQuery = url.hash.startsWith('#') ? url.hash.slice(1) : url.hash;
    const hp = new URLSearchParams(hashQuery);
    if (!err) err = hp.get('error');
    if (!desc) desc = hp.get('error_description');
    if (!code) code = hp.get('error_code');
  }

  if (!err) return null;

  let message = (desc || err).replace(/\+/g, ' ');
  for (let i = 0; i < 4; i += 1) {
    try {
      const next = decodeURIComponent(message);
      if (next === message) break;
      message = next;
    } catch {
      break;
    }
  }

  return { error: err, error_code: code, message };
}

export function clearOAuthCallbackFromBrowserUrl() {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  url.search = '';
  url.hash = '';
  window.history.replaceState({}, document.title, url.pathname || '/');
}

export function googleOAuthExchangeFailureHint() {
  const supabaseCallback = getSupabaseGoogleRedirectCallbackUrl();
  const supabaseOrigin = getSupabaseProjectOrigin();
  const appOrigin =
    typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const jsOrigins = [appOrigin, supabaseOrigin].filter(Boolean);
  return [
    '',
    'This app uses Google sign-in via ID token (login page button), not full-page redirect.',
    'Set REACT_APP_GOOGLE_OAUTH_CLIENT_ID to the same Web Client ID as Supabase → Auth → Google,',
    `add under Google Cloud → Web client → Authorized JavaScript origins: ${jsOrigins.join(', ')}`,
    '',
    '— If you still need redirect OAuth fixed (other clients / bookmarks): —',
    '',
    'A) Supabase Dashboard → Auth → Google → copy Callback URL exactly into Google → Authorized redirect URIs:',
    `   ${supabaseCallback}`,
    '',
    'B) Same Web client: Authorized JavaScript origins:',
    ...jsOrigins.map((o) => `   • ${o}`),
    '',
    'C) Supabase Google provider: same Client ID + Secret as that Web client (no spaces).',
    '',
    'D) OAuth consent: Testing → add your Gmail as Test user; scopes openid, email, profile.',
    '',
    `E) Supabase Redirect URLs must include: ${appOrigin}`,
    '',
    'F) Still broken: new Web OAuth client, re-paste ID+secret in Supabase, wait 1–2 min.',
    '   Supabase → Logs → Auth for the raw error.',
  ].join('\n');
}
