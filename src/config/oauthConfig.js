import { getGoogleWebClientId } from '../lib/googleWebClientId';

// Google OAuth configuration
const oauthConfig = {
  clientId: getGoogleWebClientId(), // Same Web Client ID configured in Supabase Auth -> Google
  scopes: [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
  ],
  // Configuration for Google Identity Services
  gsiConfig: {
    auto_select: false,
    cancel_on_tap_outside: true,
    context: 'signin'
  },
  // Get the current origin for OAuth redirect
  getRedirectUri: () => {
    // Check if we're on Vercel
    if (window.location.hostname.includes('vercel.app')) {
      return 'https://reyanshfactoryai.vercel.app';
    }
    
    // Check if we're on localhost
    if (window.location.hostname === 'localhost') {
      return 'https://reyanshfactoryai.vercel.app';
    }
    
    // Fallback to current origin
    return window.location.origin;
  },
  // Get allowed origins for CORS
  getAllowedOrigins: () => {
    return [
      'http://localhost:3000',
      'https://factoryai-olive.vercel.app'
    ];
  }
};

export default oauthConfig; 