/**
 * Same OAuth 2.0 "Web application" Client ID you put in Supabase → Google provider (public, not the secret).
 * Enables sign-in via Google Identity Services + supabase.auth.signInWithIdToken (bypasses broken code exchange).
 *
 * .env.local:
 *   REACT_APP_GOOGLE_OAUTH_CLIENT_ID=622049380084-2g1cbc6dqi56sun399c64ssghm3uss4i.apps.googleusercontent.com
 */
export function getGoogleWebClientId() {
  return (process.env.REACT_APP_GOOGLE_OAUTH_CLIENT_ID || '').trim();
}
